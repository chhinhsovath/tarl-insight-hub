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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const pagePath = searchParams.get('pagePath');
    
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If no userId provided, use current user from session
    let targetUserId = userId;
    if (!targetUserId) {
      const sessionResult = await pool.query(
        "SELECT id FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
        [sessionToken]
      );

      if (sessionResult.rows.length === 0) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
      }

      targetUserId = sessionResult.rows[0].id;
    }

    if (!pagePath) {
      return NextResponse.json({ error: "pagePath parameter is required" }, { status: 400 });
    }

    // Check user permission
    const result = await pool.query(`
      SELECT rp.can_access
      FROM tbl_tarl_users u
      JOIN tbl_tarl_roles r ON u.role_id = r.id
      JOIN tbl_tarl_role_permissions rp ON r.id = rp.role_id
      JOIN tbl_tarl_pages p ON rp.page_id = p.id
      WHERE u.id = $1 AND p.path = $2
    `, [targetUserId, pagePath]);

    const hasAccess = result.rows.length > 0 ? result.rows[0].can_access : false;
    
    return NextResponse.json({ hasAccess });
  } catch (error) {
    console.error("Error checking permission:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}