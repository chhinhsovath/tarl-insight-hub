import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/database-config";

export async function GET() {
  try {
    const client = await getDbClient();
    
    try {
      // Test connection
      const result = await client.query('SELECT NOW() as current_time');
      
      // Check if admin user exists
      const userCheck = await client.query(
        'SELECT username, role FROM tbl_tarl_users WHERE username = $1',
        ['admin1']
      );
      
      // Check if roles table exists
      const rolesCheck = await client.query(
        'SELECT name FROM tbl_tarl_roles LIMIT 5'
      );
      
      return NextResponse.json({
        success: true,
        message: "Database connection successful",
        current_time: result.rows[0].current_time,
        admin_user_exists: userCheck.rows.length > 0,
        admin_user: userCheck.rows[0] || null,
        available_roles: rolesCheck.rows,
        environment: {
          host: process.env.PGHOST,
          database: process.env.PGDATABASE,
          user: process.env.PGUSER,
          // Don't expose password
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
        environment: {
          host: process.env.PGHOST,
          database: process.env.PGDATABASE,
          user: process.env.PGUSER,
        }
      },
      { status: 500 }
    );
  }
}