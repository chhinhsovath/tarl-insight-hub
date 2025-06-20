import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

export async function POST() {
  const client = await pool.connect();
  
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and check if user is admin
    const sessionResult = await client.query(
      "SELECT id, role_id FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];
    
    // Get current user's role name
    const roleRes = await client.query("SELECT name FROM tbl_tarl_roles WHERE id = $1", [currentUser.role_id]);
    const currentUserRole = roleRes.rows[0]?.name;
    
    if (!currentUserRole || currentUserRole.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    await client.query('BEGIN');

    // Check if audit table already exists
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'permission_audit_log'
    `);

    if (tableCheck.rows.length === 0) {
      // Create audit table
      await client.query(`
        CREATE TABLE permission_audit_log (
          id SERIAL PRIMARY KEY,
          action_type VARCHAR(50) NOT NULL, -- 'permission_granted', 'permission_revoked', 'role_created', etc.
          entity_type VARCHAR(50) NOT NULL, -- 'permission', 'role', 'page'
          entity_id INTEGER, -- ID of the affected entity
          role_name VARCHAR(100),
          page_name VARCHAR(200),
          page_path VARCHAR(500),
          previous_value TEXT,
          new_value TEXT,
          changed_by_user_id INTEGER NOT NULL,
          changed_by_username VARCHAR(200),
          changed_by_role VARCHAR(100),
          description TEXT,
          metadata JSONB, -- Additional data as JSON
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX idx_permission_audit_created_at ON permission_audit_log(created_at DESC)
      `);
      
      await client.query(`
        CREATE INDEX idx_permission_audit_action_type ON permission_audit_log(action_type)
      `);
      
      await client.query(`
        CREATE INDEX idx_permission_audit_role ON permission_audit_log(role_name)
      `);

      // Insert initial audit entry
      await client.query(`
        INSERT INTO permission_audit_log (
          action_type, entity_type, description, 
          changed_by_user_id, changed_by_username, changed_by_role,
          metadata
        ) VALUES (
          'system_initialized', 'audit_system', 
          'Permission audit system has been initialized and is now tracking all changes',
          $1, $2, $3, $4
        )
      `, [
        currentUser.id,
        'System Admin',
        currentUserRole,
        JSON.stringify({ version: '1.0', features: ['permission_tracking', 'role_tracking', 'page_tracking'] })
      ]);
    }

    await client.query('COMMIT');
    
    // Get sample audit entries to return
    const sampleEntries = await client.query(`
      SELECT * FROM permission_audit_log 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    return NextResponse.json({
      success: true,
      message: "Permission audit system initialized successfully",
      auditTable: "permission_audit_log",
      sampleEntries: sampleEntries.rows
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error setting up audit system:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message 
    }, { status: 500 });
  } finally {
    client.release();
  }
}