import { NextResponse } from "next/server"
import { Pool } from "pg"
import { cookies } from "next/headers"

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id)

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
    
    // Admin can view any user's sessions, others can only view their own (case-insensitive)
    if (currentUser.role.toLowerCase() !== 'admin' && currentUser.id !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get current session info for this user (we only store one session per user in our system)
    const result = await pool.query(
      `SELECT id, session_token, session_expires, last_login, created_at
       FROM tbl_tarl_users
       WHERE id = $1 AND session_token IS NOT NULL`,
      [userId]
    )

    // Format the response to match expected session structure
    const sessions = result.rows.map(user => ({
      id: user.id,
      token: user.session_token.substring(0, 8) + '...', // Show only first 8 chars for security
      created_at: user.last_login || user.created_at,
      expires_at: user.session_expires,
      last_activity_at: user.last_login
    }))

    return NextResponse.json(sessions)
  } catch (error) {
    console.error("Error fetching user sessions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id)

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
    
    // Admin can terminate any user's session, others can only terminate their own (case-insensitive)
    if (currentUser.role.toLowerCase() !== 'admin' && currentUser.id !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get user info before terminating session
    const userResult = await pool.query(
      "SELECT full_name, email FROM tbl_tarl_users WHERE id = $1",
      [userId]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const targetUser = userResult.rows[0]

    // Terminate session by clearing session token and expiry
    await pool.query(
      "UPDATE tbl_tarl_users SET session_token = NULL, session_expires = NULL WHERE id = $1",
      [userId]
    )

    // Log activity
    await pool.query(
      `INSERT INTO tbl_tarl_user_activities (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [
        currentUser.id,
        "terminate_session",
        `Terminated session for user: ${targetUser.full_name} (${targetUser.email})`
      ]
    )

    return NextResponse.json({ message: "Session terminated successfully" })
  } catch (error) {
    console.error("Error terminating session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 