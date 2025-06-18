import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { cookies } from "next/headers";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// POST - Mark attendance for multiple participants
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = parseInt(params.id);
  
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user
    const userResult = await pool.query(
      "SELECT id, role, full_name FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = userResult.rows[0];
    const body = await request.json();

    const { registration_ids, attendance_status = 'attended' } = body;

    if (!registration_ids || !Array.isArray(registration_ids) || registration_ids.length === 0) {
      return NextResponse.json(
        { error: "registration_ids array is required" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update attendance status for selected registrations
      const updateResult = await client.query(
        `UPDATE tbl_tarl_training_registrations 
         SET 
           attendance_status = $1,
           attendance_marked_at = NOW(),
           updated_at = NOW()
         WHERE id = ANY($2) AND session_id = $3
         RETURNING id, participant_name, participant_email`,
        [attendance_status, registration_ids, sessionId]
      );

      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: "No registrations found to update" },
          { status: 404 }
        );
      }

      // Update session attendance count
      await client.query(
        `UPDATE tbl_tarl_training_sessions 
         SET current_attendance = (
           SELECT COUNT(*) 
           FROM tbl_tarl_training_registrations 
           WHERE session_id = $1 AND attendance_status = 'attended' AND is_active = true
         )
         WHERE id = $1`,
        [sessionId]
      );

      // Log the bulk attendance action
      await client.query(
        `INSERT INTO tbl_tarl_user_activities (
           user_id, activity_type, activity_description, 
           related_table, related_id, activity_data
         ) VALUES ($1, 'bulk_attendance', $2, 'tbl_tarl_training_registrations', $3, $4)`,
        [
          currentUser.id,
          `Bulk attendance marking for session ${sessionId}`,
          sessionId,
          JSON.stringify({
            registration_ids,
            attendance_status,
            updated_count: updateResult.rows.length,
            participants: updateResult.rows.map(row => ({
              name: row.participant_name,
              email: row.participant_email
            }))
          })
        ]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Successfully marked attendance for ${updateResult.rows.length} participants`,
        data: {
          updated_count: updateResult.rows.length,
          updated_participants: updateResult.rows,
          attendance_status
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Error in bulk attendance:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}