import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";
import { AuditLogger } from "@/lib/audit-logger";

const pool = getPool();

export async function PUT(request: Request) {
  const client = await pool.connect();
  
  try {
    const { pageOrders } = await request.json();
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user info for audit
    const sessionResult = await client.query(
      "SELECT u.id, u.full_name, r.name as role_name FROM tbl_tarl_users u JOIN tbl_tarl_roles r ON u.role_id = r.id WHERE u.session_token = $1 AND u.session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];
    
    if (!currentUser.role_name || currentUser.role_name.toLowerCase() !== 'admin') {
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

    // Log audit entry
    await AuditLogger.logMenuOrderChange(
      currentUser.id,
      pageOrders.length,
      currentUser.full_name,
      currentUser.role_name
    );

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