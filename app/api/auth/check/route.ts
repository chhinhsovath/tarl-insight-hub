import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getDbClient } from "@/lib/database-config"

export async function GET() {
  try {
    const cookiesStore = await cookies()
    const sessionToken = cookiesStore.get("session-token")?.value
    const userType = cookiesStore.get("user-type")?.value

    if (!sessionToken) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      )
    }

    const client = await getDbClient()

    try {
      let user = null;

      if (userType === 'staff' || !userType) {
        // Check staff users table
        const result = await client.query(
          `SELECT id, full_name, email, username, role, school_id, is_active
           FROM tbl_tarl_users
           WHERE session_token = $1 AND session_expires > NOW()`,
          [sessionToken]
        )
        user = result.rows[0];
        if (user) {
          user.role = user.role.toLowerCase();
        }
      }

      if (!user && userType === 'participant') {
        // For participants, we don't store session tokens in database
        // Instead, validate that the session token exists and user-type is participant
        // The actual participant data will be loaded from localStorage on client side
        return NextResponse.json({
          id: 'participant_session',
          full_name: 'Participant',
          role: 'participant',
          is_active: true,
          userType: 'participant'
        });
      }

      if (!user) {
        return NextResponse.json(
          { message: "Session expired" },
          { status: 401 }
        )
      }

      // Remove sensitive fields from response
      const { password: _, failed_login_attempts: __, account_locked_until: ___, ...userWithoutSensitiveData } = user

      return NextResponse.json(userWithoutSensitiveData)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
} 