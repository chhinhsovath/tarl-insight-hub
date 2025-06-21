#!/usr/bin/env node

/**
 * Database Synchronization Initialization Script
 * Syncs data from local (primary) to Digital Ocean (secondary) database
 */

const { Pool } = require('pg');

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}=== ${msg} ===${colors.reset}\n`)
};

// Database configurations
const localConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'pratham_tarl',
  password: '12345',
  port: 5432,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

const digitalOceanConfig = {
  user: 'postgres',
  host: '137.184.109.21',
  database: 'tarl_ptom',
  password: 'P@ssw0rd',
  port: 5432,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  ssl: {
    rejectUnauthorized: false
  }
};

// Tables to synchronize (non-sensitive data only)
const SYNC_TABLES = [
  'tbl_tarl_schools',
  'tbl_tarl_demographics', 
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
  'tbl_tarl_school_registrations'
];

// Sync a single table
async function syncTable(tableName, localClient, doClient) {
  log.info(`Syncing table: ${tableName}`);
  
  try {
    // Get data from local database
    const localData = await localClient.query(`SELECT * FROM ${tableName}`);
    
    if (!localData.rows || localData.rows.length === 0) {
      log.warning(`No data to sync for ${tableName}`);
      return { table: tableName, synced: 0, status: 'empty' };
    }
    
    // Check if table exists in DO
    const tableExists = await doClient.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = $1 AND table_schema = 'public'
      )
    `, [tableName]);
    
    if (!tableExists.rows[0].exists) {
      log.error(`Table ${tableName} does not exist in DO database`);
      return { table: tableName, synced: 0, status: 'missing_table' };
    }
    
    // Clear target table
    await doClient.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);
    log.info(`  Cleared ${tableName} in DO database`);
    
    // Get column information
    const columns = Object.keys(localData.rows[0]);
    const columnList = columns.map(col => `"${col}"`).join(', ');
    const valuePlaceholders = columns.map((_, index) => `$${index + 1}`).join(', ');
    
    const insertQuery = `INSERT INTO ${tableName} (${columnList}) VALUES (${valuePlaceholders})`;
    
    // Insert data in batches
    const batchSize = 100;
    let syncedCount = 0;
    
    for (let i = 0; i < localData.rows.length; i += batchSize) {
      const batch = localData.rows.slice(i, i + batchSize);
      
      for (const row of batch) {
        try {
          const values = columns.map(col => row[col]);
          await doClient.query(insertQuery, values);
          syncedCount++;
        } catch (insertError) {
          log.warning(`  Failed to insert row in ${tableName}: ${insertError.message}`);
        }
      }
      
      // Show progress for large tables
      if (localData.rows.length > 1000) {
        const progress = Math.round((i + batch.length) / localData.rows.length * 100);
        log.info(`  Progress: ${progress}% (${i + batch.length}/${localData.rows.length})`);
      }
    }
    
    log.success(`  Synced ${syncedCount}/${localData.rows.length} records for ${tableName}`);
    return { table: tableName, synced: syncedCount, total: localData.rows.length, status: 'success' };
    
  } catch (error) {
    log.error(`Failed to sync ${tableName}: ${error.message}`);
    return { table: tableName, synced: 0, status: 'error', error: error.message };
  }
}

// Sync all tables
async function syncAllTables() {
  log.header('Database Synchronization');
  
  const localPool = new Pool(localConfig);
  const doPool = new Pool(digitalOceanConfig);
  
  try {
    const [localClient, doClient] = await Promise.all([
      localPool.connect(),
      doPool.connect()
    ]);
    
    log.success('Connected to both databases');
    
    const results = [];
    let totalSynced = 0;
    
    try {
      // Start transaction on DO database
      await doClient.query('BEGIN');
      
      for (const tableName of SYNC_TABLES) {
        const result = await syncTable(tableName, localClient, doClient);
        results.push(result);
        totalSynced += result.synced || 0;
      }
      
      // Commit transaction
      await doClient.query('COMMIT');
      log.success('All changes committed to Digital Ocean database');
      
    } catch (error) {
      await doClient.query('ROLLBACK');
      log.error(`Synchronization failed, rolling back: ${error.message}`);
      throw error;
    } finally {
      localClient.release();
      doClient.release();
    }
    
    // Show summary
    log.header('Synchronization Summary');
    
    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'error');
    const empty = results.filter(r => r.status === 'empty');
    const missing = results.filter(r => r.status === 'missing_table');
    
    log.info(`Total tables processed: ${results.length}`);
    log.success(`Successful: ${successful.length}`);
    log.warning(`Empty tables: ${empty.length}`);
    log.error(`Failed: ${failed.length}`);
    log.error(`Missing tables: ${missing.length}`);
    log.info(`Total records synced: ${totalSynced}`);
    
    // Show details for failed tables
    if (failed.length > 0) {
      log.header('Failed Tables');
      failed.forEach(result => {
        log.error(`${result.table}: ${result.error}`);
      });
    }
    
    // Show details for missing tables
    if (missing.length > 0) {
      log.header('Missing Tables');
      missing.forEach(result => {
        log.error(`${result.table}: Table does not exist in DO database`);
      });
    }
    
    // Show successful tables
    if (successful.length > 0) {
      log.header('Successfully Synced Tables');
      successful.forEach(result => {
        log.success(`${result.table}: ${result.synced}/${result.total} records`);
      });
    }
    
    return {
      success: failed.length === 0 && missing.length === 0,
      totalSynced,
      results
    };
    
  } catch (error) {
    log.error(`Synchronization process failed: ${error.message}`);
    return { success: false, error: error.message };
  } finally {
    await Promise.all([localPool.end(), doPool.end()]);
  }
}

// Verify synchronization
async function verifySynchronization() {
  log.header('Verification');
  
  const localPool = new Pool(localConfig);
  const doPool = new Pool(digitalOceanConfig);
  
  try {
    const [localClient, doClient] = await Promise.all([
      localPool.connect(),
      doPool.connect()
    ]);
    
    try {
      const verificationResults = [];
      
      for (const tableName of SYNC_TABLES) {
        try {
          const [localCount, doCount] = await Promise.all([
            localClient.query(`SELECT COUNT(*) as count FROM ${tableName}`),
            doClient.query(`SELECT COUNT(*) as count FROM ${tableName}`)
          ]);
          
          const localRecords = parseInt(localCount.rows[0].count);
          const doRecords = parseInt(doCount.rows[0].count);
          const matches = localRecords === doRecords;
          
          verificationResults.push({
            table: tableName,
            local: localRecords,
            digitalOcean: doRecords,
            matches
          });
          
          if (matches) {
            log.success(`${tableName}: ${localRecords} records (✓ synced)`);
          } else {
            log.error(`${tableName}: Local=${localRecords}, DO=${doRecords} (✗ mismatch)`);
          }
          
        } catch (error) {
          log.error(`${tableName}: Verification failed - ${error.message}`);
        }
      }
      
      const allMatching = verificationResults.every(r => r.matches);
      
      if (allMatching) {
        log.success('All tables synchronized successfully!');
      } else {
        log.warning('Some tables have synchronization mismatches');
      }
      
      return { success: allMatching, results: verificationResults };
      
    } finally {
      localClient.release();
      doClient.release();
    }
    
  } catch (error) {
    log.error(`Verification failed: ${error.message}`);
    return { success: false, error: error.message };
  } finally {
    await Promise.all([localPool.end(), doPool.end()]);
  }
}

// Main execution
async function main() {
  console.log(`${colors.bold}${colors.blue}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║              Database Synchronization Tool               ║');
  console.log('║         Local (Primary) → Digital Ocean (Secondary)      ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  try {
    // Sync all tables
    const syncResult = await syncAllTables();
    
    if (syncResult.success) {
      log.success(`Synchronization completed successfully! ${syncResult.totalSynced} records synced.`);
      
      // Verify synchronization
      await verifySynchronization();
    } else {
      log.error('Synchronization completed with errors');
    }
    
  } catch (error) {
    log.error(`Synchronization failed: ${error.message}`);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { syncAllTables, verifySynchronization };