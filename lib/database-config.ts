import { Pool, PoolConfig } from 'pg';

// Centralized database configuration for Neon.tech
export const getDatabaseConfig = (): PoolConfig => ({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
  ssl: {
    rejectUnauthorized: false
  },
  // Connection pool settings for Neon
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

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