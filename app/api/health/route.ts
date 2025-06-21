import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

export async function GET() {
  const startTime = Date.now();
  
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    responseTime: '0ms',
    database: {
      status: 'unknown',
      responseTime: '0ms',
      host: process.env.PGHOST || 'localhost',
      database: process.env.PGDATABASE || 'pratham_tarl'
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        used: 0,
        total: 0,
        percentage: 0
      }
    },
    checks: {
      database: false,
      memory: false,
      criticalTables: false
    }
  };

  // Check database connection
  try {
    const dbStartTime = Date.now();
    const pool = getPool();
    const client = await pool.connect();
    
    // Basic connectivity test
    await client.query('SELECT 1 as health_check');
    
    // Check critical tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'tbl_tarl_schools', 
        'tbl_tarl_users', 
        'tbl_tarl_training_programs',
        'tbl_tarl_training_sessions',
        'page_permissions'
      )
    `);
    
    client.release();
    
    const dbResponseTime = Date.now() - dbStartTime;
    health.database.responseTime = `${dbResponseTime}ms`;
    health.database.status = 'healthy';
    health.checks.database = true;
    health.checks.criticalTables = tablesResult.rows.length >= 5;
    
  } catch (error) {
    health.status = 'error';
    health.database.status = 'unhealthy';
    health.checks.database = false;
    health.checks.criticalTables = false;
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  health.system.memory = {
    used: Math.round(memUsage.heapUsed / 1024 / 1024),
    total: Math.round(memUsage.heapTotal / 1024 / 1024),
    percentage: Math.round(memoryUsagePercent)
  };
  
  health.checks.memory = memoryUsagePercent < 90;
  
  if (!health.checks.memory && health.status === 'ok') {
    health.status = 'warning';
  }

  // Overall status determination
  if (!health.checks.database) {
    health.status = 'error';
  } else if (!health.checks.criticalTables) {
    health.status = 'warning';
  }

  // Return appropriate status code
  const statusCode = health.status === 'ok' ? 200 : 
                    health.status === 'warning' ? 200 : 503;

  const totalResponseTime = Date.now() - startTime;
  health.responseTime = `${totalResponseTime}ms`;

  return NextResponse.json(health, { status: statusCode });
}

// Support HEAD requests for simple uptime checks
export async function HEAD() {
  try {
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}