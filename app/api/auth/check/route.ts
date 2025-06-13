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

export async function GET() {
  try {
    const cookiesStore = await cookies()
    const sessionToken = cookiesStore.get("session-token")?.value

    if (!sessionToken) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      )
    }

    const client = await pool.connect()

    try {
      const result = await client.query(
        `SELECT id, full_name, email, username, role, school_id, province_id, district_id, is_active
         FROM tbl_tarl_users
         WHERE session_token = $1 AND session_expires > NOW()`,
        [sessionToken]
      )

      const user = result.rows[0]

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