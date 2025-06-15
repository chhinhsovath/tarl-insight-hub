import { NextResponse } from "next/server"
import { Pool } from "pg"
import { cookies } from "next/headers"
import bcrypt from "bcrypt"

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { full_name, email, username, password, role_id, role, school_id, phone, is_active } = body

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session-token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify session and get user
    const sessionResult = await pool.query(
      "SELECT id, role_id FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    )

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const currentUser = sessionResult.rows[0]
    // Get current user's role name
    const roleRes = await pool.query("SELECT name FROM tbl_tarl_roles WHERE id = $1", [currentUser.role_id]);
    const currentUserRole = roleRes.rows[0]?.name;
    if (!currentUserRole || currentUserRole.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 })
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM tbl_tarl_users WHERE email = $1 OR username = $2",
      [email, username]
    )

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 400 }
      )
    }

    // Determine role_id
    let finalRoleId = role_id;
    if (!finalRoleId && role) {
      const roleLookup = await pool.query("SELECT id FROM tbl_tarl_roles WHERE name = $1", [role.toLowerCase()]);
      finalRoleId = roleLookup.rows[0]?.id;
      if (!finalRoleId) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 })
      }
    }
    if (!finalRoleId) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const result = await pool.query(
      `INSERT INTO tbl_tarl_users (
        full_name,
        email,
        username,
        password,
        role_id,
        school_id,
        phone,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, full_name, email, username, role_id, school_id, phone, is_active, created_at`,
      [full_name, email, username, hashedPassword, finalRoleId, school_id || null, phone, is_active]
    )

    // Get the role name for the response
    const newUser = result.rows[0];
    const newRoleRes = await pool.query("SELECT name FROM tbl_tarl_roles WHERE id = $1", [newUser.role_id]);
    newUser.role = newRoleRes.rows[0]?.name;

    // Log activity
    await pool.query(
      `INSERT INTO tbl_tarl_user_activities (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [
        currentUser.id,
        "create_user",
        `Created user: ${full_name} (${email})`,
      ]
    )

    return NextResponse.json(newUser)
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 