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

      // Get training materials for sessions the participant is registered for
      const materialsQuery = `
        SELECT DISTINCT
          tm.id,
          tm.material_name,
          tm.material_type,
          tm.file_path,
          tm.external_url,
          tm.description,
          ts.id as session_id,
          ts.session_title
        FROM tbl_tarl_training_materials tm
        JOIN tbl_tarl_training_sessions ts ON tm.program_id = ts.program_id
        JOIN tbl_tarl_training_participants tpt ON ts.id = tpt.session_id
        WHERE tpt.participant_email = $1 
          AND tm.is_active = true
          AND (tm.timing = 'during' OR tm.timing = 'after' OR ts.session_status = 'completed')
        ORDER BY ts.session_date DESC, tm.sort_order ASC
      `;

      const materialsResult = await client.query(materialsQuery, [user.email]);

      return NextResponse.json(materialsResult.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching participant materials:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}