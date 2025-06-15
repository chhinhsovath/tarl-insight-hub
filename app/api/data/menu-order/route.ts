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

export async function PUT(request: Request) {
  const client = await pool.connect();
  
  try {
    const { pageOrders } = await request.json();
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

    if (!Array.isArray(pageOrders)) {
      return NextResponse.json({ error: "pageOrders must be an array" }, { status: 400 });
    }

    await client.query('BEGIN');

    // Check if sort_order column exists, if not create it
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'page_permissions' AND column_name = 'sort_order'
    `);

    if (columnCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE page_permissions 
        ADD COLUMN sort_order INTEGER DEFAULT 0
      `);
    }

    // Update each page's sort order
    for (let i = 0; i < pageOrders.length; i++) {
      const { id } = pageOrders[i];
      await client.query(
        "UPDATE page_permissions SET sort_order = $1, updated_at = NOW() WHERE id = $2",
        [i + 1, id]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({ 
      success: true, 
      message: "Menu order updated successfully" 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error updating menu order:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message 
    }, { status: 500 });
  } finally {
    client.release();
  }
}