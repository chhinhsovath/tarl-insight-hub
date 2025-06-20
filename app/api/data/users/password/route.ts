import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

export async function PUT(request: Request) {
  try {
    const sessionToken = cookies().get('session-token')?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const client = await pool.connect();
    const { current_password, new_password } = await request.json();

    // Get user from session
    const sessionResult = await client.query(
      'SELECT user_id FROM tbl_tarl_sessions WHERE session_token = $1 AND session_expires > NOW()',
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      client.release();
      return NextResponse.json(
        { message: "Invalid session" },
        { status: 401 }
      );
    }

    const userId = sessionResult.rows[0].user_id;

    // Get current password hash
    const userResult = await client.query(
      'SELECT password FROM tbl_tarl_users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      client.release();
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Verify current password
    const isValid = await bcrypt.compare(current_password, userResult.rows[0].password);
    if (!isValid) {
      client.release();
      return NextResponse.json(
        { message: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await client.query(
      'UPDATE tbl_tarl_users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    // Log activity
    await client.query(
      'INSERT INTO tbl_tarl_user_activities (user_id, action, details) VALUES ($1, $2, $3)',
      [userId, 'Password Update', 'User updated their password']
    );

    client.release();
    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { message: "Error updating password" },
      { status: 500 }
    );
  }
} 