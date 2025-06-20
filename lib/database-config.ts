import { Pool, PoolConfig } from 'pg';

// Centralized database configuration for both local and Neon databases
export const getDatabaseConfig = (): PoolConfig => {
  const isLocalhost = process.env.PGHOST === 'localhost' || process.env.PGHOST === '127.0.0.1';
  const isProduction = process.env.NODE_ENV === 'production';
  
  const config: PoolConfig = {
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: parseInt(process.env.PGPORT || '5432', 10),
    // Connection pool settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };

  // Only use SSL for non-localhost connections or in production
  if (!isLocalhost || isProduction) {
    config.ssl = {
      rejectUnauthorized: false
    };
  }

  return config;
};

// Create a singleton pool instance
let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool(getDatabaseConfig());
  }
  return pool;
};

// Helper function to get a database client
export const getDbClient = async () => {
  const pool = getPool();
  return await pool.connect();
};