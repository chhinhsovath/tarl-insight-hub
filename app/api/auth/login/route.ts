import { NextResponse } from "next/server"
import { Pool } from "pg"
import bcrypt from "bcrypt"
import { randomBytes } from "crypto"
import { cookies } from "next/headers"

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
})

const MAX_FAILED_ATTEMPTS = 5
const LOCK_DURATION_MINUTES = 30
const SESSION_EXPIRY_HOURS = 24

export async function POST(request: Request) {
  try {
    const { email, username, password } = await request.json()

    if ((!email && !username) || !password) {
      return NextResponse.json(
        { message: "Email/username and password are required" },
        { status: 400 }
      )
    }

    const client = await pool.connect()

    try {
      // Find user by email or username
      const result = await client.query(
        `SELECT id, full_name, email, username, role, school_id, 
                password, failed_login_attempts, account_locked_until, is_active
         FROM tbl_tarl_users 
         WHERE (email = $1 OR username = $2)`,
        [email || username, username || email]
      )

      const user = result.rows[0]

      if (!user) {
        return NextResponse.json(
          { message: "Invalid credentials" },
          { status: 401 }
        )
      }

      // Check if account is locked
      if (user.account_locked_until && user.account_locked_until > new Date()) {
        return NextResponse.json(
          { 
            message: "Account is locked. Please try again later.",
            lockedUntil: user.account_locked_until
          },
          { status: 423 }
        )
      }

      // Check if account is active
      if (!user.is_active) {
        return NextResponse.json(
          { message: "Account is inactive" },
          { status: 403 }
        )
      }

      // Normalize role to lowercase for consistent comparison
      user.role = user.role.toLowerCase()
      
      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password)

      if (!passwordMatch) {
        // Increment failed login attempts
        await client.query(
          `UPDATE tbl_tarl_users 
           SET failed_login_attempts = failed_login_attempts + 1,
               account_locked_until = CASE 
                 WHEN failed_login_attempts + 1 >= $1 
                 THEN NOW() + ($2 || ' minutes')::interval
                 ELSE NULL 
               END
           WHERE id = $3`,
          [MAX_FAILED_ATTEMPTS, LOCK_DURATION_MINUTES, user.id]
        )

        return NextResponse.json(
          { message: "Invalid credentials" },
          { status: 401 }
        )
      }

      // Generate session token and expiry
      const sessionToken = randomBytes(32).toString('hex')
      const sessionExpires = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000)

      // Reset failed login attempts, update last login, and store session token
      await client.query(
        `UPDATE tbl_tarl_users 
         SET failed_login_attempts = 0,
             account_locked_until = NULL,
             last_login = NOW(),
             session_token = $1,
             session_expires = $2
         WHERE id = $3`,
        [sessionToken, sessionExpires, user.id]
      )

      // Set session cookie
      const cookiesStore = await cookies()
      cookiesStore.set('session-token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: sessionExpires,
        path: '/',
        sameSite: 'lax',
      })

      // Remove sensitive fields from response
      const { password: _, failed_login_attempts: __, account_locked_until: ___, ...userWithoutSensitiveData } = user

      return NextResponse.json(userWithoutSensitiveData)
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
} 