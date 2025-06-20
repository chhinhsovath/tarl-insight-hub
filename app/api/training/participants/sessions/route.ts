import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";

const pool = getPool();

export async function GET(request: Request) {
  try {
    const cookiesStore = await cookies();
    const sessionToken = cookiesStore.get('session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const client = await pool.connect();

    try {
      // Verify session and get user
      const sessionResult = await client.query(
        "SELECT id, full_name, email, role FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
        [sessionToken]
      );

      if (sessionResult.rows.length === 0) {
        return NextResponse.json(
          { message: "Invalid or expired session" },
          { status: 401 }
        );
      }

      const user = sessionResult.rows[0];

      // Only allow participants to access this endpoint
      if (user.role !== 'participant') {
        return NextResponse.json(
          { message: "Access denied" },
          { status: 403 }
        );
      }

      // Get participant's training sessions
      const sessionsQuery = `
        SELECT 
          ts.id,
          ts.session_title,
          ts.session_date,
          ts.session_time,
          ts.location,
          ts.session_status,
          tp_prog.program_name,
          trainer.full_name as trainer_name,
          tpt.registration_status,
          tpt.attendance_confirmed
        FROM tbl_tarl_training_participants tpt
        JOIN tbl_tarl_training_sessions ts ON tpt.session_id = ts.id
        LEFT JOIN tbl_tarl_training_programs tp_prog ON ts.program_id = tp_prog.id
        LEFT JOIN tbl_tarl_users trainer ON ts.trainer_id = trainer.id
        WHERE tpt.participant_email = $1
        ORDER BY ts.session_date DESC
      `;

      const sessionsResult = await client.query(sessionsQuery, [user.email]);

      return NextResponse.json(sessionsResult.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching participant sessions:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}