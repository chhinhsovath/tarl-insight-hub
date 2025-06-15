import { NextResponse } from "next/server";
import { Pool } from "pg";
import { cookies } from "next/headers";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user
    const sessionResult = await pool.query(
      "SELECT id, role_id FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];
    
    // Get current user's role name
    const roleRes = await pool.query("SELECT name FROM tbl_tarl_roles WHERE id = $1", [currentUser.role_id]);
    const currentUserRole = roleRes.rows[0]?.name;
    
    if (!currentUserRole || currentUserRole.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const result = await pool.query(`
      SELECT 
        rp.id,
        rp.role,
        rp.page_id,
        rp.is_allowed as can_access,
        rp.created_at,
        rp.updated_at,
        rp.role as role_name,
        p.page_name as page_name,
        p.page_path as page_path
      FROM role_page_permissions rp
      JOIN page_permissions p ON rp.page_id = p.id
      ORDER BY rp.role, p.page_name
    `);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const client = await pool.connect();
  
  try {
    const { roleId, permissions } = await request.json();
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user
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

    if (!roleId || !Array.isArray(permissions)) {
      return NextResponse.json({ error: "roleId and permissions array are required" }, { status: 400 });
    }

    await client.query('BEGIN');

    for (const permission of permissions) {
      const { pageId, canAccess } = permission;
      
      // Get role name first
      const roleResult = await client.query("SELECT name FROM tbl_tarl_roles WHERE id = $1", [roleId]);
      const roleName = roleResult.rows[0]?.name;
      
      if (!roleName) {
        throw new Error(`Role with ID ${roleId} not found`);
      }
      
      // Get current permission value for audit trail
      const currentPermissionResult = await client.query(
        "SELECT is_allowed FROM role_page_permissions WHERE role = $1 AND page_id = $2",
        [roleName, pageId]
      );
      
      const previousValue = currentPermissionResult.rows[0]?.is_allowed;

      // Update or insert permission
      const result = await client.query(`
        INSERT INTO role_page_permissions (role, page_id, is_allowed, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (role, page_id)
        DO UPDATE SET is_allowed = $3, updated_at = NOW()
        RETURNING id
      `, [roleName, pageId, canAccess]);

      // Skip audit trail for now since the audit table structure needs to be defined
      // TODO: Implement audit trail with your existing schema
    }

    await client.query('COMMIT');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error updating permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    client.release();
  }
}