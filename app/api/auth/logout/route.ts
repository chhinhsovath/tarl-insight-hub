import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getDbClient } from "@/lib/database-config"

export async function POST() {
  try {
    const cookiesStore = await cookies()
    const sessionToken = cookiesStore.get("session-token")?.value

    if (sessionToken) {
      const client = await getDbClient()

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

      // Clear session cookies
      cookiesStore.delete("session-token")
      cookiesStore.delete("user-type")
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