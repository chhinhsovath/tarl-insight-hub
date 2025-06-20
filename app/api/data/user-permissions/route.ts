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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session
    const sessionResult = await pool.query(
      "SELECT id, role_id FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    if (!role) {
      return NextResponse.json({ error: "Role parameter is required" }, { status: 400 });
    }

    // Check if role_page_permissions table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'role_page_permissions'
      ) as table_exists
    `);

    if (!tableCheck.rows[0]?.table_exists) {
      // Table doesn't exist, return empty array to trigger fallback
      console.log('role_page_permissions table does not exist, returning empty array');
      return NextResponse.json([], { status: 404 });
    }

    // Get pages that this role has access to (using actual schema structure)
    const result = await pool.query(`
      SELECT pp.page_path, pp.page_name, pp.icon_name, rpp.is_allowed
      FROM page_permissions pp
      JOIN role_page_permissions rpp ON pp.id = rpp.page_id
      WHERE rpp.role = $1 AND rpp.is_allowed = true
      ORDER BY pp.page_name ASC
    `, [role]);
    
    console.log(`Found ${result.rows.length} permissions for role: ${role}`);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}