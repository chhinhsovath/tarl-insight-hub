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

    // Fetch all pages from the existing page_permissions table
    const result = await pool.query(`
      SELECT id, page_path, page_name, icon_name, created_at, updated_at 
      FROM page_permissions 
      ORDER BY page_name ASC
    `);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching page permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { page_path, page_name, icon_name } = await request.json();
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
    
    // Get current user's role name - only admin can add pages
    const roleRes = await pool.query("SELECT name FROM tbl_tarl_roles WHERE id = $1", [currentUser.role_id]);
    const currentUserRole = roleRes.rows[0]?.name;
    
    if (!currentUserRole || currentUserRole.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    if (!page_path || !page_name) {
      return NextResponse.json({ error: "page_path and page_name are required" }, { status: 400 });
    }

    const result = await pool.query(
      "INSERT INTO page_permissions (page_path, page_name, icon_name) VALUES ($1, $2, $3) RETURNING *",
      [page_path, page_name, icon_name || 'FileText']
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error creating page permission:", error);
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json({ error: "Page path already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}