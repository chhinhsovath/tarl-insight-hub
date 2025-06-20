import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";

const pool = getPool();

export async function GET(request: Request) {
  const client = await pool.connect();
  
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const actionType = searchParams.get('actionType');
    const entityType = searchParams.get('entityType');
    
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session
    const sessionResult = await client.query(
      "SELECT u.id, r.name as role_name FROM tbl_tarl_users u JOIN tbl_tarl_roles r ON u.role_id = r.id WHERE u.session_token = $1 AND u.session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];
    
    if (!currentUser.role_name || currentUser.role_name.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    // Check if audit table exists
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'permission_audit_log'
    `);

    if (tableCheck.rows.length === 0) {
      return NextResponse.json({
        entries: [],
        total: 0,
        message: "Audit system not initialized. Click 'Setup Audit System' to enable tracking."
      });
    }

    // Build query with optional filters
    let whereClause = '';
    const queryParams = [];
    let paramCount = 0;

    if (actionType) {
      paramCount++;
      whereClause += ` WHERE action_type = $${paramCount}`;
      queryParams.push(actionType);
    }

    if (entityType) {
      paramCount++;
      if (whereClause) {
        whereClause += ` AND entity_type = $${paramCount}`;
      } else {
        whereClause += ` WHERE entity_type = $${paramCount}`;
      }
      queryParams.push(entityType);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM permission_audit_log${whereClause}`;
    const countResult = await client.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get audit entries
    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;
    
    const entriesQuery = `
      SELECT 
        id, action_type, entity_type, entity_id, role_name, page_name, page_path,
        previous_value, new_value, changed_by_user_id, changed_by_username, 
        changed_by_role, description, metadata, created_at
      FROM permission_audit_log
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;
    
    queryParams.push(limit, offset);
    const entriesResult = await client.query(entriesQuery, queryParams);

    return NextResponse.json({
      entries: entriesResult.rows.map(row => ({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
        created_at: new Date(row.created_at).toISOString()
      })),
      total,
      limit,
      offset
    });

  } catch (error) {
    console.error("Error fetching audit trail:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message 
    }, { status: 500 });
  } finally {
    client.release();
  }
}