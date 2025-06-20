import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: false,
      memory: false,
    }
  };

  // Check database connection
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    health.checks.database = true;
  } catch (error) {
    health.status = 'error';
    health.checks.database = false;
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  health.checks.memory = memoryUsagePercent < 90;
  
  if (!health.checks.memory) {
    health.status = 'warning';
  }

  // Return appropriate status code
  const statusCode = health.status === 'ok' ? 200 : 
                    health.status === 'warning' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}