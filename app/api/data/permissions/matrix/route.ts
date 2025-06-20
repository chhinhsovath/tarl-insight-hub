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

    // Get all roles
    const rolesResult = await pool.query("SELECT id, name FROM tbl_tarl_roles ORDER BY name");
    const roles = rolesResult.rows;

    // Get all pages from your existing table
    const pagesResult = await pool.query("SELECT id, page_name as name, page_path as path FROM page_permissions ORDER BY page_name");
    const pages = pagesResult.rows;

    // Get all permissions from your existing table
    const permissionsResult = await pool.query(`
      SELECT role, page_id, is_allowed 
      FROM role_page_permissions
    `);
    const permissions = permissionsResult.rows;

    // Build permission matrix
    const matrix = roles.map(role => {
      const rolePermissions = {};
      
      pages.forEach(page => {
        const permission = permissions.find(p => p.role === role.name && p.page_id === page.id);
        rolePermissions[page.id] = {
          pageId: page.id,
          pageName: page.name,
          pagePath: page.path,
          canAccess: permission ? permission.is_allowed : false
        };
      });

      return {
        roleId: role.id,
        roleName: role.name,
        permissions: rolePermissions
      };
    });
    
    return NextResponse.json(matrix);
  } catch (error) {
    console.error("Error fetching permission matrix:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}