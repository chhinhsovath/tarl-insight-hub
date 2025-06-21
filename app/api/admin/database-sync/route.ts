import { NextRequest, NextResponse } from "next/server";
import { getSynchronizer, DatabaseSynchronizer } from "@/lib/database-sync";
import { getDbManager } from "@/lib/dual-database-config";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";

// GET - Get synchronization status and configuration
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

    // Only admins can access sync management
    if (user.role !== 'Admin') {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const synchronizer = getSynchronizer();
    const dbManager = getDbManager();
    
    // Get sync status
    const syncStatus = synchronizer.getSyncStatus();
    
    // Test database connections
    const connections = await dbManager.testConnections();
    
    // Get database info
    const dbInfo = await dbManager.getDatabaseInfo();
    
    return NextResponse.json({
      success: true,
      data: {
        syncStatus,
        connections,
        databaseInfo: dbInfo,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error("Database sync status error:", error);
    return NextResponse.json(
      { error: "Failed to get sync status", details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// POST - Execute synchronization operations
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
    
    if (!user.is_active) {
      return NextResponse.json({ error: 'Account is inactive' }, { status: 401 });
    }

    // Only admins can manage synchronization
    if (user.role !== 'Admin') {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { action, tableName, config } = body;

    const synchronizer = getSynchronizer();

    switch (action) {
      case 'start':
        await synchronizer.startSync();
        return NextResponse.json({
          success: true,
          message: "Synchronization service started",
          timestamp: new Date().toISOString()
        });

      case 'stop':
        synchronizer.stopSync();
        return NextResponse.json({
          success: true,
          message: "Synchronization service stopped",
          timestamp: new Date().toISOString()
        });

      case 'sync-all':
        console.log(`👤 Admin ${user.username} initiated full database sync`);
        const fullSyncResult = await synchronizer.syncAllTables();
        return NextResponse.json({
          success: fullSyncResult.success,
          message: fullSyncResult.success ? "Full synchronization completed" : "Full synchronization completed with errors",
          data: fullSyncResult.results,
          timestamp: new Date().toISOString()
        });

      case 'sync-table':
        if (!tableName) {
          return NextResponse.json(
            { error: "Table name is required for table sync" },
            { status: 400 }
          );
        }
        
        console.log(`👤 Admin ${user.username} initiated sync for table: ${tableName}`);
        const tableSyncResult = await synchronizer.syncTable(tableName);
        return NextResponse.json({
          success: true,
          message: `Table ${tableName} synchronized successfully`,
          data: tableSyncResult,
          timestamp: new Date().toISOString()
        });

      case 'test-sync':
        const testResult = await synchronizer.testSync();
        return NextResponse.json({
          success: testResult.success,
          message: testResult.message,
          timestamp: new Date().toISOString()
        });

      case 'compare-schemas':
        const schemaComparison = await synchronizer.compareSchemas();
        return NextResponse.json({
          success: true,
          message: "Schema comparison completed",
          data: schemaComparison,
          timestamp: new Date().toISOString()
        });

      case 'update-config':
        if (!config) {
          return NextResponse.json(
            { error: "Configuration is required" },
            { status: 400 }
          );
        }
        
        // Create new synchronizer with updated config
        const newSynchronizer = new DatabaseSynchronizer(config);
        return NextResponse.json({
          success: true,
          message: "Synchronization configuration updated",
          data: { config },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error("Database sync operation error:", error);
    return NextResponse.json(
      { error: "Sync operation failed", details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// PUT - Update synchronization configuration
export async function PUT(request: NextRequest) {
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json(
        { error: "Configuration object is required" },
        { status: 400 }
      );
    }

    // Validate configuration
    const validModes = ['real-time', 'batch', 'manual'];
    if (config.mode && !validModes.includes(config.mode)) {
      return NextResponse.json(
        { error: `Invalid sync mode. Must be one of: ${validModes.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`👤 Admin ${user.username} updated sync configuration:`, config);

    return NextResponse.json({
      success: true,
      message: "Synchronization configuration updated successfully",
      data: { config },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Sync config update error:", error);
    return NextResponse.json(
      { error: "Failed to update configuration", details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}