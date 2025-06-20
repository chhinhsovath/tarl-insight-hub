import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";

const pool = getPool();

export async function POST() {
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
    
    // Get current user's role name - only admin can add this
    const roleRes = await pool.query("SELECT name FROM tbl_tarl_roles WHERE id = $1", [currentUser.role_id]);
    const currentUserRole = roleRes.rows[0]?.name;
    
    if (!currentUserRole || currentUserRole.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    // Check if Page Management already exists
    const existingPage = await pool.query(`
      SELECT * FROM page_permissions WHERE page_path = $1
    `, ['/settings/page-permissions']);
    
    if (existingPage.rows.length > 0) {
      return NextResponse.json({ 
        success: true,
        message: 'Page Management already exists',
        data: existingPage.rows[0]
      });
    }

    // Add Page Management
    const result = await pool.query(`
      INSERT INTO page_permissions (page_path, page_name, icon_name, created_at, updated_at) 
      VALUES ($1, $2, $3, NOW(), NOW()) 
      RETURNING *
    `, ['/settings/page-permissions', 'Page Management', 'Shield']);

    return NextResponse.json({
      success: true,
      message: 'Page Management added successfully!',
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error adding page management:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message 
    }, { status: 500 });
  }
}