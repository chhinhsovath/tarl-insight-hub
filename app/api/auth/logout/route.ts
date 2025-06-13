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

export async function POST() {
  try {
    const cookiesStore = await cookies()
    const sessionToken = cookiesStore.get("session-token")?.value

    if (sessionToken) {
      const client = await pool.connect()

      try {
        // Clear session token in database
        await client.query(
          `UPDATE tbl_tarl_users 
           SET session_token = NULL, 
               session_expires = NULL 
           WHERE session_token = $1`,
          [sessionToken]
        )
      } finally {
        client.release()
      }

      // Clear session cookie
      cookiesStore.delete("session-token")
    }

    return NextResponse.json({ message: "Logged out successfully" })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
} 