import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getDbClient } from "@/lib/database-config";

export async function POST(request: Request) {
  try {
    const { username, newPassword, confirmPassword } = await request.json();

    if (!username || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { message: "Username, new password, and confirmation are required" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { message: "Passwords do not match" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const client = await getDbClient();

    try {
      // Check if user exists and is admin
      const userResult = await client.query(
        `SELECT u.id, u.username, r.name as role
         FROM tbl_tarl_users u
         JOIN tbl_tarl_roles r ON u.role_id = r.id
         WHERE u.username = $1 AND r.name = 'admin'`,
        [username]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { message: "Admin user not found" },
          { status: 404 }
        );
      }

      const user = userResult.rows[0];

      // Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update the password
      await client.query(
        `UPDATE tbl_tarl_users 
         SET password = $1,
             failed_login_attempts = 0,
             account_locked_until = NULL,
             updated_at = NOW()
         WHERE id = $2`,
        [hashedPassword, user.id]
      );

      // Verify the new password works
      const verifyResult = await bcrypt.compare(newPassword, hashedPassword);

      return NextResponse.json({
        success: true,
        message: "Admin password updated successfully",
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        },
        verification: {
          password_verified: verifyResult,
          hash_format: hashedPassword.substring(0, 7) // Show first 7 chars for verification
        }
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Reset admin password error:", error);
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}