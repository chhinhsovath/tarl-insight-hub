import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";

const pool = getPool();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get current user
    const sessionResult = await pool.query(
      "SELECT id, role_id FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];
    
    // If no userId provided, use current user from session
    const targetUserId = userId || currentUser.id;

    // Get user's role first
    const userResult = await pool.query(`
      SELECT u.id, r.name as role_name
      FROM tbl_tarl_users u
      JOIN tbl_tarl_roles r ON u.role_id = r.id
      WHERE u.id = $1
    `, [targetUserId]);
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const user = userResult.rows[0];
    const userRole = user.role_name;
    
    // Check if role_page_permissions table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'role_page_permissions'
      ) as table_exists
    `);
    
    let result;
    if (tableCheck.rows[0]?.table_exists) {
      // Use role-based permissions from your existing structure
      result = await pool.query(`
        SELECT DISTINCT pp.id, pp.page_name as name, pp.page_path as path, pp.page_name as description
        FROM page_permissions pp
        JOIN role_page_permissions rpp ON pp.id = rpp.page_id
        WHERE rpp.role = $1 AND rpp.is_allowed = true
        ORDER BY pp.page_name
      `, [userRole]);
    } else {
      // Fallback: return all pages for admin, limited for others
      if (userRole.toLowerCase() === 'admin') {
        result = await pool.query(`
          SELECT id, page_name as name, page_path as path, page_name as description
          FROM page_permissions
          ORDER BY page_name
        `);
      } else {
        // Return basic pages for non-admin users
        result = await pool.query(`
          SELECT id, page_name as name, page_path as path, page_name as description
          FROM page_permissions
          WHERE page_path IN ('/dashboard', '/students', '/training')
          ORDER BY page_name
        `);
      }
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching user pages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}