import { Pool, PoolConfig } from 'pg';

// Database configuration types
interface DatabaseConnection {
  pool: Pool;
  config: PoolConfig;
  name: string;
  type: 'primary' | 'secondary';
}

// Local Database Configuration (Primary)
const getLocalDatabaseConfig = (): PoolConfig => ({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'pratham_tarl',
  password: process.env.PGPASSWORD || '12345',
  port: parseInt(process.env.PGPORT || '5432', 10),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Digital Ocean Database Configuration (Secondary)
const getDigitalOceanDatabaseConfig = (): PoolConfig => ({
  user: 'postgres',
  host: '137.184.109.21',
  database: 'tarl_ptom',
  password: 'P@ssw0rd',
  port: 5432,
  max: 10, // Lower max connections for secondary
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Longer timeout for remote connection
  ssl: {
    rejectUnauthorized: false
  }
});

// Singleton pool instances
let localPool: Pool | null = null;
let digitalOceanPool: Pool | null = null;

// Get Local Database Pool (Primary)
export const getLocalPool = (): Pool => {
  if (!localPool) {
    localPool = new Pool(getLocalDatabaseConfig());
    
    // Handle pool errors
    localPool.on('error', (err) => {
      console.error('Local database pool error:', err);
    });
  }
  return localPool;
};

// Get Digital Ocean Database Pool (Secondary)
export const getDigitalOceanPool = (): Pool => {
  if (!digitalOceanPool) {
    digitalOceanPool = new Pool(getDigitalOceanDatabaseConfig());
    
    // Handle pool errors
    digitalOceanPool.on('error', (err) => {
      console.error('Digital Ocean database pool error:', err);
    });
  }
  return digitalOceanPool;
};

// Get Primary Database Pool (defaults to local)
export const getPrimaryPool = (): Pool => {
  return getLocalPool();
};

// Get Secondary Database Pool (Digital Ocean)
export const getSecondaryPool = (): Pool => {
  return getDigitalOceanPool();
};

// Legacy compatibility - returns primary pool
export const getPool = (): Pool => {
  return getPrimaryPool();
};

// Database operation wrapper with error handling
export class DatabaseManager {
  private static instance: DatabaseManager;
  
  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // Execute query on primary database
  async queryPrimary(query: string, params?: any[]): Promise<any> {
    const client = await getPrimaryPool().connect();
    try {
      console.log('Executing query on PRIMARY database:', query.substring(0, 100));
      const result = await client.query(query, params);
      return result;
    } catch (error) {
      console.error('Primary database query error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Execute query on secondary database
  async querySecondary(query: string, params?: any[]): Promise<any> {
    const client = await getSecondaryPool().connect();
    try {
      console.log('Executing query on SECONDARY database:', query.substring(0, 100));
      const result = await client.query(query, params);
      return result;
    } catch (error) {
      console.error('Secondary database query error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Execute query on both databases (for synchronization)
  async queryBoth(query: string, params?: any[]): Promise<{primary: any, secondary: any}> {
    const [primaryResult, secondaryResult] = await Promise.allSettled([
      this.queryPrimary(query, params),
      this.querySecondary(query, params)
    ]);

    return {
      primary: primaryResult.status === 'fulfilled' ? primaryResult.value : null,
      secondary: secondaryResult.status === 'fulfilled' ? secondaryResult.value : null
    };
  }

  // Test both database connections
  async testConnections(): Promise<{local: boolean, digitalOcean: boolean}> {
    const results = {
      local: false,
      digitalOcean: false
    };

    try {
      await this.queryPrimary('SELECT 1 as test');
      results.local = true;
      console.log('✅ Local database connection successful');
    } catch (error) {
      console.error('❌ Local database connection failed:', error);
    }

    try {
      await this.querySecondary('SELECT 1 as test');
      results.digitalOcean = true;
      console.log('✅ Digital Ocean database connection successful');
    } catch (error) {
      console.error('❌ Digital Ocean database connection failed:', error);
    }

    return results;
  }

  // Get database info
  async getDatabaseInfo(): Promise<{primary: any, secondary: any}> {
    const [primaryInfo, secondaryInfo] = await Promise.allSettled([
      this.queryPrimary(`
        SELECT 
          current_database() as database_name,
          current_user as user_name,
          inet_server_addr() as server_ip,
          version() as version
      `),
      this.querySecondary(`
        SELECT 
          current_database() as database_name,
          current_user as user_name,
          inet_server_addr() as server_ip,
          version() as version
      `)
    ]);

    return {
      primary: primaryInfo.status === 'fulfilled' ? primaryInfo.value.rows[0] : null,
      secondary: secondaryInfo.status === 'fulfilled' ? secondaryInfo.value.rows[0] : null
    };
  }
}

// Helper function to get database manager instance
export const getDbManager = (): DatabaseManager => {
  return DatabaseManager.getInstance();
};

// Cleanup function for graceful shutdown
export const closeAllConnections = async (): Promise<void> => {
  const promises = [];
  
  if (localPool) {
    promises.push(localPool.end());
  }
  
  if (digitalOceanPool) {
    promises.push(digitalOceanPool.end());
  }
  
  await Promise.all(promises);
  console.log('All database connections closed');
};

// CommonJS compatibility for Node.js scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getLocalPool,
    getDigitalOceanPool,
    getPrimaryPool,
    getSecondaryPool,
    getPool,
    DatabaseManager,
    getDbManager,
    closeAllConnections
  };
}