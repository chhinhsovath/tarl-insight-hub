import { NextRequest, NextResponse } from "next/server";
import { getDbManager } from "@/lib/dual-database-config";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    // Validate admin session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionResult = await client.query(
      `SELECT id, full_name, email, username, role, school_id, is_active
       FROM tbl_tarl_users
       WHERE session_token = $1 AND session_expires > NOW()`,
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const user = sessionResult.rows[0];
    
    if (!user.is_active) {
      return NextResponse.json({ error: 'Account is inactive' }, { status: 401 });
    }

    // Only admins can test database connections
    if (user.role !== 'Admin') {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const dbManager = getDbManager();
    
    console.log(`👤 Admin ${user.username} testing database connections...`);

    // Test both database connections
    const connections = await dbManager.testConnections();
    
    // Get detailed database information
    const dbInfo = await dbManager.getDatabaseInfo();
    
    // Test query performance
    const performanceTests = await Promise.allSettled([
      // Local database performance test
      (async () => {
        const start = Date.now();
        await dbManager.queryPrimary("SELECT COUNT(*) FROM tbl_tarl_schools");
        const duration = Date.now() - start;
        return { database: 'local', duration, status: 'success' };
      })(),
      
      // Digital Ocean database performance test
      (async () => {
        const start = Date.now();
        await dbManager.querySecondary("SELECT COUNT(*) FROM tbl_tarl_schools");
        const duration = Date.now() - start;
        return { database: 'digitalocean', duration, status: 'success' };
      })()
    ]);

    // Process performance test results
    const performance = {
      local: performanceTests[0].status === 'fulfilled' 
        ? performanceTests[0].value 
        : { database: 'local', duration: -1, status: 'failed', error: (performanceTests[0] as any).reason?.message },
      digitalOcean: performanceTests[1].status === 'fulfilled' 
        ? performanceTests[1].value 
        : { database: 'digitalocean', duration: -1, status: 'failed', error: (performanceTests[1] as any).reason?.message }
    };

    // Test table counts for data integrity
    const tableTests = await Promise.allSettled([
      dbManager.queryPrimary(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes
        FROM pg_stat_user_tables 
        WHERE tablename LIKE 'tbl_tarl_%'
        ORDER BY tablename
      `),
      dbManager.querySecondary(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes
        FROM pg_stat_user_tables 
        WHERE tablename LIKE 'tbl_tarl_%'
        ORDER BY tablename
      `)
    ]);

    const tableStats = {
      local: tableTests[0].status === 'fulfilled' ? tableTests[0].value.rows : [],
      digitalOcean: tableTests[1].status === 'fulfilled' ? tableTests[1].value.rows : []
    };

    return NextResponse.json({
      success: true,
      data: {
        connections,
        databaseInfo: dbInfo,
        performance,
        tableStats,
        testTimestamp: new Date().toISOString(),
        testedBy: user.username
      }
    });

  } catch (error: any) {
    console.error("Database test error:", error);
    return NextResponse.json(
      { 
        error: "Database test failed", 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function POST(request: NextRequest) {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    // Validate admin session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionResult = await client.query(
      `SELECT id, full_name, email, username, role, school_id, is_active
       FROM tbl_tarl_users
       WHERE session_token = $1 AND session_expires > NOW()`,
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const user = sessionResult.rows[0];
    
    if (!user.is_active || user.role !== 'Admin') {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { testType, query } = body;

    const dbManager = getDbManager();

    switch (testType) {
      case 'custom-query':
        if (!query) {
          return NextResponse.json(
            { error: "Query is required for custom query test" },
            { status: 400 }
          );
        }

        console.log(`👤 Admin ${user.username} executing custom query test`);

        const [primaryResult, secondaryResult] = await Promise.allSettled([
          dbManager.queryPrimary(query),
          dbManager.querySecondary(query)
        ]);

        return NextResponse.json({
          success: true,
          data: {
            query,
            results: {
              primary: primaryResult.status === 'fulfilled' 
                ? { success: true, rows: primaryResult.value.rows }
                : { success: false, error: (primaryResult as any).reason.message },
              secondary: secondaryResult.status === 'fulfilled'
                ? { success: true, rows: secondaryResult.value.rows }
                : { success: false, error: (secondaryResult as any).reason.message }
            },
            timestamp: new Date().toISOString()
          }
        });

      case 'table-count':
        const tableName = body.tableName;
        if (!tableName) {
          return NextResponse.json(
            { error: "Table name is required for table count test" },
            { status: 400 }
          );
        }

        const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
        const [primaryCount, secondaryCount] = await Promise.allSettled([
          dbManager.queryPrimary(countQuery),
          dbManager.querySecondary(countQuery)
        ]);

        return NextResponse.json({
          success: true,
          data: {
            tableName,
            counts: {
              primary: primaryCount.status === 'fulfilled' 
                ? primaryCount.value.rows[0].count 
                : 'Error',
              secondary: secondaryCount.status === 'fulfilled'
                ? secondaryCount.value.rows[0].count
                : 'Error'
            },
            synchronized: primaryCount.status === 'fulfilled' && 
                          secondaryCount.status === 'fulfilled' &&
                          primaryCount.value.rows[0].count === secondaryCount.value.rows[0].count,
            timestamp: new Date().toISOString()
          }
        });

      case 'schema-check':
        const schemaQuery = `
          SELECT table_name, column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name LIKE 'tbl_tarl_%'
          ORDER BY table_name, ordinal_position
        `;

        const [primarySchema, secondarySchema] = await Promise.allSettled([
          dbManager.queryPrimary(schemaQuery),
          dbManager.querySecondary(schemaQuery)
        ]);

        return NextResponse.json({
          success: true,
          data: {
            schemas: {
              primary: primarySchema.status === 'fulfilled' ? primarySchema.value.rows : [],
              secondary: secondarySchema.status === 'fulfilled' ? secondarySchema.value.rows : []
            },
            schemasMatch: primarySchema.status === 'fulfilled' && 
                         secondarySchema.status === 'fulfilled' &&
                         JSON.stringify(primarySchema.value.rows) === JSON.stringify(secondarySchema.value.rows),
            timestamp: new Date().toISOString()
          }
        });

      default:
        return NextResponse.json(
          { error: `Unknown test type: ${testType}` },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error("Database test POST error:", error);
    return NextResponse.json(
      { error: "Test execution failed", details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}