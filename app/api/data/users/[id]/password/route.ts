import { NextResponse } from "next/server"
import { Pool } from "pg"
import { cookies } from "next/headers"
import bcrypt from "bcrypt"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { current_password, new_password } = body
    const userId = parseInt(params.id)

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify session and get user
    const sessionResult = await pool.query(
      "SELECT user_id FROM tbl_tarl_sessions WHERE token = $1 AND expires_at > NOW()",
      [sessionToken]
    )

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    // Get user's current password
    const userResult = await pool.query(
      "SELECT password FROM tbl_tarl_users WHERE id = $1",
      [userId]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify current password
    const isValid = await bcrypt.compare(
      current_password,
      userResult.rows[0].password
    )

    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10)

    // Update password
    await pool.query(
      "UPDATE tbl_tarl_users SET password = $1, updated_at = NOW() WHERE id = $2",
      [hashedPassword, userId]
    )

    // Log activity
    await pool.query(
      `INSERT INTO tbl_tarl_user_activities (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [sessionResult.rows[0].user_id, "change_password", "Changed user password"]
    )

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Error updating password:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 