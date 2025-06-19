import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getDbClient } from "@/lib/database-config";

export async function POST(request: Request) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier) {
      return NextResponse.json(
        { message: "Identifier is required" },
        { status: 400 }
      );
    }

    const client = await getDbClient();

    try {
      // Get user details
      const result = await client.query(
        `SELECT u.id, u.full_name, u.email, u.username, r.name as role, 
                u.password, u.failed_login_attempts, u.account_locked_until, 
                u.is_active, u.created_at
         FROM tbl_tarl_users u
         JOIN tbl_tarl_roles r ON u.role_id = r.id
         WHERE (u.email = $1 OR u.username = $1)`,
        [identifier]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({
          found: false,
          message: "User not found"
        });
      }

      const user = result.rows[0];
      
      let passwordCheck = null;
      if (password) {
        // Test password comparison
        try {
          passwordCheck = {
            provided: password,
            stored_hash: user.password,
            bcrypt_result: await bcrypt.compare(password, user.password),
            hash_format_check: user.password.startsWith('$2b$') || user.password.startsWith('$2a$')
          };
        } catch (bcryptError) {
          passwordCheck = {
            error: "bcrypt comparison failed",
            details: bcryptError instanceof Error ? bcryptError.message : String(bcryptError)
          };
        }
      }

      return NextResponse.json({
        found: true,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          username: user.username,
          role: user.role,
          is_active: user.is_active,
          failed_login_attempts: user.failed_login_attempts,
          account_locked_until: user.account_locked_until,
          created_at: user.created_at,
          password_exists: !!user.password,
          password_length: user.password ? user.password.length : 0
        },
        password_check: passwordCheck
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Debug user error:", error);
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}