import { getDbManager } from './dual-database-config';
import { getAuditLogger } from './audit-logger';
import { getPrimaryPool } from './dual-database-config';

// Synchronization configuration
interface SyncConfig {
  enabled: boolean;
  mode: 'real-time' | 'batch' | 'manual';
  batchInterval: number; // minutes
  retryAttempts: number;
  retryDelay: number; // milliseconds
}

const defaultSyncConfig: SyncConfig = {
  enabled: true,
  mode: 'real-time',
  batchInterval: 5,
  retryAttempts: 3,
  retryDelay: 1000
};

// Tables to synchronize (exclude sensitive tables)
const SYNC_TABLES = [
  'tbl_tarl_schools',
  'tbl_tarl_students',
  'tbl_tarl_classes',
  'tbl_tarl_transcripts',
  'tbl_tarl_observations',
  'tbl_tarl_training_programs',
  'tbl_tarl_training_sessions',
  'tbl_tarl_training_participants',
  'tbl_tarl_learning_progress',
  'tbl_tarl_materials',
  'tbl_tarl_surveys',
  'tbl_tarl_school_registrations',
  // Geographic tables
  'tbl_tarl_demographics',
  'tbl_tarl_provinces',
  'tbl_tarl_districts',
  'tbl_tarl_communes',
  'tbl_tarl_villages'
];

// Excluded sensitive tables
const EXCLUDED_TABLES = [
  'tbl_tarl_users', // Contains passwords
  'tbl_tarl_sessions', // Session data
  'page_permissions', // System configuration
  'role_page_permissions',
  'tbl_tarl_permission_audit' // Audit data stays local
];

export class DatabaseSynchronizer {
  private dbManager = getDbManager();
  private config: SyncConfig;
  private syncLog: any[] = [];
  private isRunning = false;

  constructor(config: SyncConfig = defaultSyncConfig) {
    this.config = config;
  }

  // Start synchronization service
  async startSync(): Promise<void> {
    if (this.isRunning) {
      console.log('Synchronization is already running');
      return;
    }

    this.isRunning = true;
    console.log('🔄 Starting database synchronization service...');

    if (this.config.mode === 'batch') {
      this.startBatchSync();
    }

    // Test connections first
    const connections = await this.dbManager.testConnections();
    if (!connections.local || !connections.digitalOcean) {
      console.error('❌ Cannot start sync - database connections failed');
      this.isRunning = false;
      return;
    }

    console.log('✅ Database synchronization service started');
  }

  // Stop synchronization service
  stopSync(): void {
    this.isRunning = false;
    console.log('🛑 Database synchronization service stopped');
  }

  // Batch synchronization (runs periodically)
  private startBatchSync(): void {
    const intervalMs = this.config.batchInterval * 60 * 1000;
    
    setInterval(async () => {
      if (this.isRunning) {
        console.log('⏰ Running scheduled batch synchronization...');
        await this.syncAllTables();
      }
    }, intervalMs);
  }

  // Manual full synchronization
  async syncAllTables(): Promise<{success: boolean, results: any}> {
    console.log('🔄 Starting full database synchronization...');
    const results = {
      successful: [] as string[],
      failed: [] as {table: string, error: string}[],
      totalRecords: 0
    };

    for (const tableName of SYNC_TABLES) {
      try {
        const syncResult = await this.syncTable(tableName);
        results.successful.push(tableName);
        results.totalRecords += syncResult.recordCount;
        console.log(`✅ Synced ${tableName}: ${syncResult.recordCount} records`);
      } catch (error: any) {
        results.failed.push({
          table: tableName,
          error: error.message
        });
        console.error(`❌ Failed to sync ${tableName}:`, error.message);
      }
    }

    const summary = {
      timestamp: new Date().toISOString(),
      successful: results.successful.length,
      failed: results.failed.length,
      totalRecords: results.totalRecords,
      details: results
    };

    this.syncLog.push(summary);
    console.log('📊 Synchronization complete:', summary);

    return {
      success: results.failed.length === 0,
      results: summary
    };
  }

  // Synchronize a specific table
  async syncTable(tableName: string): Promise<{recordCount: number}> {
    if (!SYNC_TABLES.includes(tableName)) {
      throw new Error(`Table ${tableName} is not configured for synchronization`);
    }

    console.log(`🔄 Synchronizing table: ${tableName}`);

    // Get data from primary database
    const primaryData = await this.dbManager.queryPrimary(`SELECT * FROM ${tableName}`);
    
    if (!primaryData.rows || primaryData.rows.length === 0) {
      console.log(`📋 No data to sync for ${tableName}`);
      return { recordCount: 0 };
    }

    // Clear secondary table (for full sync)
    await this.dbManager.querySecondary(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);

    // Get column names from the first row
    const columns = Object.keys(primaryData.rows[0]);
    const columnList = columns.map(col => `"${col}"`).join(', ');
    const valuePlaceholders = columns.map((_, index) => `$${index + 1}`).join(', ');
    
    const insertQuery = `INSERT INTO ${tableName} (${columnList}) VALUES (${valuePlaceholders})`;

    // Insert data in batches
    const batchSize = 100;
    let recordCount = 0;

    for (let i = 0; i < primaryData.rows.length; i += batchSize) {
      const batch = primaryData.rows.slice(i, i + batchSize);
      
      for (const row of batch) {
        const values = columns.map(col => row[col]);
        await this.dbManager.querySecondary(insertQuery, values);
        recordCount++;
      }
    }

    return { recordCount };
  }

  // Real-time synchronization for specific operation
  async syncOperation(
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    tableName: string,
    data: any,
    primaryKey?: string
  ): Promise<{success: boolean, error?: string}> {
    if (!this.config.enabled || !SYNC_TABLES.includes(tableName)) {
      return { success: true }; // Skip if not configured for sync
    }

    try {
      let query = '';
      let params: any[] = [];

      switch (operation) {
        case 'INSERT':
          const columns = Object.keys(data);
          const columnList = columns.map(col => `"${col}"`).join(', ');
          const valuePlaceholders = columns.map((_, index) => `$${index + 1}`).join(', ');
          query = `INSERT INTO ${tableName} (${columnList}) VALUES (${valuePlaceholders})`;
          params = columns.map(col => data[col]);
          break;

        case 'UPDATE':
          if (!primaryKey || !data[primaryKey]) {
            throw new Error('Primary key required for UPDATE operation');
          }
          const updateColumns = Object.keys(data).filter(col => col !== primaryKey);
          const setClause = updateColumns.map((col, index) => `"${col}" = $${index + 1}`).join(', ');
          query = `UPDATE ${tableName} SET ${setClause} WHERE "${primaryKey}" = $${updateColumns.length + 1}`;
          params = [...updateColumns.map(col => data[col]), data[primaryKey]];
          break;

        case 'DELETE':
          if (!primaryKey || !data[primaryKey]) {
            throw new Error('Primary key required for DELETE operation');
          }
          query = `DELETE FROM ${tableName} WHERE "${primaryKey}" = $1`;
          params = [data[primaryKey]];
          break;
      }

      await this.dbManager.querySecondary(query, params);
      console.log(`✅ Synced ${operation} operation on ${tableName}`);
      
      return { success: true };
    } catch (error: any) {
      console.error(`❌ Failed to sync ${operation} on ${tableName}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Get synchronization status
  getSyncStatus(): {
    isRunning: boolean;
    config: SyncConfig;
    lastSync: any;
    syncLog: any[];
  } {
    return {
      isRunning: this.isRunning,
      config: this.config,
      lastSync: this.syncLog[this.syncLog.length - 1] || null,
      syncLog: this.syncLog.slice(-10) // Last 10 sync operations
    };
  }

  // Test synchronization with a small table
  async testSync(): Promise<{success: boolean, message: string}> {
    try {
      // Test with a simple query
      const testTable = 'tbl_tarl_countries';
      const primaryResult = await this.dbManager.queryPrimary(`SELECT COUNT(*) as count FROM ${testTable}`);
      
      if (primaryResult.rows[0].count > 0) {
        await this.syncTable(testTable);
        const secondaryResult = await this.dbManager.querySecondary(`SELECT COUNT(*) as count FROM ${testTable}`);
        
        if (primaryResult.rows[0].count === secondaryResult.rows[0].count) {
          return {
            success: true,
            message: `Test sync successful: ${primaryResult.rows[0].count} records synced`
          };
        }
      }
      
      return {
        success: false,
        message: 'Test sync failed: Record counts do not match'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Test sync failed: ${error.message}`
      };
    }
  }

  // Schema comparison between databases
  async compareSchemas(): Promise<{
    matching: string[];
    missingInSecondary: string[];
    differences: any[];
  }> {
    const result = {
      matching: [] as string[],
      missingInSecondary: [] as string[],
      differences: [] as any[]
    };

    try {
      // Get table schemas from both databases
      const schemaQuery = `
        SELECT table_name, column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name LIKE 'tbl_tarl_%'
        ORDER BY table_name, ordinal_position
      `;

      const [primarySchema, secondarySchema] = await Promise.all([
        this.dbManager.queryPrimary(schemaQuery),
        this.dbManager.querySecondary(schemaQuery)
      ]);

      // Group by table
      const groupByTable = (rows: any[]) => {
        return rows.reduce((acc, row) => {
          if (!acc[row.table_name]) {
            acc[row.table_name] = [];
          }
          acc[row.table_name].push(row);
          return acc;
        }, {});
      };

      const primaryTables = groupByTable(primarySchema.rows);
      const secondaryTables = groupByTable(secondarySchema.rows);

      // Compare tables
      for (const tableName of Object.keys(primaryTables)) {
        if (!secondaryTables[tableName]) {
          result.missingInSecondary.push(tableName);
        } else {
          // Compare columns
          const primaryCols = primaryTables[tableName];
          const secondaryCols = secondaryTables[tableName];
          
          if (JSON.stringify(primaryCols) === JSON.stringify(secondaryCols)) {
            result.matching.push(tableName);
          } else {
            result.differences.push({
              table: tableName,
              primary: primaryCols,
              secondary: secondaryCols
            });
          }
        }
      }

    } catch (error: any) {
      console.error('Schema comparison failed:', error);
    }

    return result;
  }
}

// Create singleton instance
let synchronizer: DatabaseSynchronizer | null = null;

export const getSynchronizer = (config?: SyncConfig): DatabaseSynchronizer => {
  if (!synchronizer) {
    synchronizer = new DatabaseSynchronizer(config);
  }
  return synchronizer;
};

// Enhanced database operation wrapper with auto-sync
export class SyncedDatabaseManager {
  private dbManager = getDbManager();
  private synchronizer = getSynchronizer();

  // Execute operation on primary and sync to secondary
  async execute(
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    tableName: string,
    query: string,
    params?: any[],
    data?: any,
    primaryKey?: string
  ): Promise<any> {
    // Execute on primary database
    const result = await this.dbManager.queryPrimary(query, params);
    
    // Sync to secondary if enabled
    if (data && SYNC_TABLES.includes(tableName)) {
      await this.synchronizer.syncOperation(operation, tableName, data, primaryKey);
    }
    
    return result;
  }

  // Read operation (from primary)
  async query(query: string, params?: any[]): Promise<any> {
    return await this.dbManager.queryPrimary(query, params);
  }
}

// Export synced database manager
export const getSyncedDbManager = (): SyncedDatabaseManager => {
  return new SyncedDatabaseManager();
};