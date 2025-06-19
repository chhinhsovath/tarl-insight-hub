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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id)

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session-token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify session and get user
    const sessionResult = await pool.query(
      "SELECT id, role FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    )

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    const currentUser = sessionResult.rows[0]
    
    // Check if user has admin role for password reset (case-insensitive)
    if (currentUser.role.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 })
    }

    // Get user to reset password for
    const userResult = await pool.query(
      "SELECT id, full_name, email FROM tbl_tarl_users WHERE id = $1",
      [userId]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userToReset = userResult.rows[0]

    // Generate new password hash for "12345" (default reset password)
    const defaultPassword = "12345"
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)

    // Update password and reset failed attempts
    await pool.query(
      `UPDATE tbl_tarl_users 
       SET password = $1, 
           failed_login_attempts = 0,
           account_locked_until = NULL,
           updated_at = NOW() 
       WHERE id = $2`,
      [hashedPassword, userId]
    )

    // Log activity
    await pool.query(
      `INSERT INTO tbl_tarl_user_activities (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [
        currentUser.id,
        "reset_user_password",
        `Reset password for user: ${userToReset.full_name} (${userToReset.email})`,
      ]
    )

    return NextResponse.json({ 
      message: "Password reset successfully. New password is: 12345",
      user: {
        id: userToReset.id,
        full_name: userToReset.full_name,
        email: userToReset.email
      }
    })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}