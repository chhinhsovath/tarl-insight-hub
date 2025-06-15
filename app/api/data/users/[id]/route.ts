import { NextResponse } from "next/server";
import { Pool } from "pg";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user
    const sessionResult = await pool.query(
      "SELECT id, role FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];
    
    // Admin can view any user, others can only view themselves (case-insensitive)
    if (currentUser.role.toLowerCase() !== 'admin' && currentUser.id !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get user details
    const result = await pool.query(
      `SELECT id, full_name, email, username, role, school_id, phone, is_active, 
              created_at, updated_at, last_login
       FROM tbl_tarl_users 
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const userId = parseInt(params.id);

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

    // Check if user exists and get current data
    const existingUserResult = await pool.query(
      "SELECT id, full_name, email, role_id, school_id, phone, is_active FROM tbl_tarl_users WHERE id = $1",
      [userId]
    );

    if (existingUserResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingUser = existingUserResult.rows[0];

    // Merge existing data with provided update data
    const updatedUserData = {
      ...existingUser,
      ...body
    };

    let { full_name, email, role_id, role, school_id, phone, is_active } = updatedUserData;

    // Determine role_id
    let finalRoleId = role_id;
    if (!finalRoleId && role) {
      const roleLookup = await pool.query("SELECT id FROM tbl_tarl_roles WHERE name = $1", [role.toLowerCase()]);
      finalRoleId = roleLookup.rows[0]?.id;
      if (!finalRoleId) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
    }
    if (!finalRoleId) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    // Update user
    const result = await pool.query(
      `UPDATE tbl_tarl_users
       SET full_name = $1,
           email = $2,
           role_id = $3,
           school_id = $4,
           phone = $5,
           is_active = $6,
           updated_at = NOW()
       WHERE id = $7
       RETURNING id, full_name, email, role_id, school_id, phone, is_active, created_at`,
      [full_name, email, finalRoleId, school_id, phone, is_active, userId]
    );

    // Get the role name for the response
    const updatedUser = result.rows[0];
    const newRoleRes = await pool.query("SELECT name FROM tbl_tarl_roles WHERE id = $1", [updatedUser.role_id]);
    updatedUser.role = newRoleRes.rows[0]?.name;

    // Log activity
    await pool.query(
      `INSERT INTO tbl_tarl_user_activities (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [
        currentUser.id,
        "update_user",
        `Updated user: ${updatedUser.full_name} (${updatedUser.email})`,
      ]
    );

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user
    const sessionResult = await pool.query(
      "SELECT id, role FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];
    
    // Check if user has admin role for user management
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    // Check if user exists
    const existingUser = await pool.query(
      "SELECT id, full_name, email FROM tbl_tarl_users WHERE id = $1",
      [userId]
    );

    if (existingUser.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete user
    await pool.query("DELETE FROM tbl_tarl_users WHERE id = $1", [userId]);

    // Log activity
    await pool.query(
      `INSERT INTO tbl_tarl_user_activities (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [
        currentUser.id,
        "delete_user",
        `Deleted user: ${existingUser.rows[0].full_name} (${existingUser.rows[0].email})`,
      ]
    );

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 