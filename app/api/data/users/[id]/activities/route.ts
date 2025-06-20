import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";

const pool = getPool();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user
    const sessionResult = await pool.query(
      "SELECT id, role FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];
    
    // Admin can view any user's activities, others can only view their own
    if (currentUser.role !== 'admin' && currentUser.id !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get user activities
    const result = await pool.query(
      `SELECT id, user_id, action, details, created_at
       FROM tbl_tarl_user_activities
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching user activities:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 