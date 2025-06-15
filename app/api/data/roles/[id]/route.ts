import { NextResponse } from "next/server";
import { Pool } from "pg";
import { cookies } from "next/headers";
import { AuditLogger } from "@/lib/audit-logger";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const roleId = parseInt(params.id);
    const { name } = await request.json();
    
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user info for audit
    const sessionResult = await pool.query(
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

    if (isNaN(roleId)) {
      return NextResponse.json({ error: "Invalid role ID" }, { status: 400 });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check if role exists and get current name
    const existingRole = await pool.query(
      "SELECT id, name FROM tbl_tarl_roles WHERE id = $1",
      [roleId]
    );

    if (existingRole.rows.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const currentRoleName = existingRole.rows[0].name;

    // Check if another role already has this name
    const duplicateRole = await pool.query(
      "SELECT id FROM tbl_tarl_roles WHERE LOWER(name) = LOWER($1) AND id != $2",
      [trimmedName, roleId]
    );

    if (duplicateRole.rows.length > 0) {
      return NextResponse.json({ error: "Role name already exists" }, { status: 409 });
    }

    // Update role
    const result = await pool.query(
      "UPDATE tbl_tarl_roles SET name = $1 WHERE id = $2 RETURNING id, name, description",
      [trimmedName, roleId]
    );

    // Log audit entry
    await AuditLogger.logRoleChange(
      'updated',
      roleId,
      trimmedName,
      currentUser.id,
      currentRoleName,
      currentUser.full_name,
      currentUser.role_name
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const roleId = parseInt(params.id);
    
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user info for audit
    const sessionResult = await pool.query(
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

    if (isNaN(roleId)) {
      return NextResponse.json({ error: "Invalid role ID" }, { status: 400 });
    }

    // Check if role exists
    const existingRole = await pool.query(
      "SELECT id, name FROM tbl_tarl_roles WHERE id = $1",
      [roleId]
    );

    if (existingRole.rows.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Check if any users are assigned to this role
    const usersWithRole = await pool.query(
      "SELECT COUNT(*) as count FROM tbl_tarl_users WHERE role_id = $1",
      [roleId]
    );

    if (parseInt(usersWithRole.rows[0].count) > 0) {
      return NextResponse.json({ 
        error: "Cannot delete role. There are users assigned to this role." 
      }, { status: 409 });
    }

    // Delete role permissions first
    await pool.query(
      "DELETE FROM role_page_permissions WHERE role = $1",
      [existingRole.rows[0].name]
    );

    // Delete role
    await pool.query("DELETE FROM tbl_tarl_roles WHERE id = $1", [roleId]);

    // Log audit entry
    await AuditLogger.logRoleChange(
      'deleted',
      roleId,
      existingRole.rows[0].name,
      currentUser.id,
      undefined,
      currentUser.full_name,
      currentUser.role_name
    );

    return NextResponse.json({ 
      success: true, 
      message: "Role deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}