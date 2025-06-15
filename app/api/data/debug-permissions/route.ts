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

    const debug: any = {
      timestamp: new Date().toISOString(),
      hasSessionToken: !!sessionToken,
      sessionToken: sessionToken ? sessionToken.substring(0, 10) + '...' : null
    };

    if (!sessionToken) {
      debug.error = "No session token";
      return NextResponse.json(debug);
    }

    // Check session
    const sessionResult = await pool.query(
      "SELECT id, role_id FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    );

    debug.sessionValid = sessionResult.rows.length > 0;
    if (sessionResult.rows.length > 0) {
      debug.userId = sessionResult.rows[0].id;
      debug.roleId = sessionResult.rows[0].role_id;
    }

    // Check if tables exist
    const tablesCheck = await pool.query(`
      SELECT 
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'page_permissions') as page_permissions_exists,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'role_page_permissions') as role_page_permissions_exists
    `);
    
    debug.tables = tablesCheck.rows[0];

    // Count pages
    const pageCount = await pool.query('SELECT COUNT(*) as count FROM page_permissions');
    debug.totalPages = parseInt(pageCount.rows[0].count);

    // Check for Page Management
    const pageManagement = await pool.query(`
      SELECT * FROM page_permissions WHERE page_path = '/settings/page-permissions'
    `);
    debug.hasPageManagement = pageManagement.rows.length > 0;
    
    // List all pages
    const allPages = await pool.query('SELECT page_name, page_path FROM page_permissions ORDER BY page_name');
    debug.allPages = allPages.rows;

    // Check role permissions if table exists
    if (debug.tables.role_page_permissions_exists) {
      const rolePermCount = await pool.query(`
        SELECT COUNT(*) as count FROM role_page_permissions WHERE role = 'Admin'
      `);
      debug.adminPermissionsCount = parseInt(rolePermCount.rows[0].count);

      const adminPerms = await pool.query(`
        SELECT rpp.role, rpp.page_id, rpp.is_allowed, pp.page_path, pp.page_name
        FROM role_page_permissions rpp 
        JOIN page_permissions pp ON pp.id = rpp.page_id 
        WHERE rpp.role = 'Admin'
      `);
      debug.adminPermissions = adminPerms.rows;
    } else {
      debug.adminPermissionsCount = 0;
      debug.adminPermissions = [];
    }

    return NextResponse.json(debug);

  } catch (error) {
    return NextResponse.json({ 
      error: "Debug failed", 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}