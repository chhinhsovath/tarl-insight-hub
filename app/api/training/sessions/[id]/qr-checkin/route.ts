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

// POST - Process QR code check-in
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

    const { identifier, registration_id, participant_email, qr_code_data } = body;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      let registration;

      // Try to find registration by different methods
      if (registration_id) {
        // Direct registration ID
        const regResult = await client.query(
          `SELECT id, participant_name, participant_email, attendance_status
           FROM tbl_tarl_training_registrations
           WHERE id = $1 AND session_id = $2 AND is_active = true`,
          [registration_id, sessionId]
        );
        registration = regResult.rows[0];
      } else if (participant_email || identifier) {
        // Email-based lookup
        const email = participant_email || identifier;
        const regResult = await client.query(
          `SELECT id, participant_name, participant_email, attendance_status
           FROM tbl_tarl_training_registrations
           WHERE LOWER(participant_email) = LOWER($1) AND session_id = $2 AND is_active = true`,
          [email, sessionId]
        );
        registration = regResult.rows[0];
      } else if (qr_code_data) {
        // Parse QR code data
        try {
          const qrData = typeof qr_code_data === 'string' ? JSON.parse(qr_code_data) : qr_code_data;
          if (qrData.registration_id) {
            const regResult = await client.query(
              `SELECT id, participant_name, participant_email, attendance_status
               FROM tbl_tarl_training_registrations
               WHERE id = $1 AND session_id = $2 AND is_active = true`,
              [qrData.registration_id, sessionId]
            );
            registration = regResult.rows[0];
          } else if (qrData.email) {
            const regResult = await client.query(
              `SELECT id, participant_name, participant_email, attendance_status
               FROM tbl_tarl_training_registrations
               WHERE LOWER(participant_email) = LOWER($1) AND session_id = $2 AND is_active = true`,
              [qrData.email, sessionId]
            );
            registration = regResult.rows[0];
          }
        } catch (parseError) {
          // Treat as plain text identifier
          const regResult = await client.query(
            `SELECT id, participant_name, participant_email, attendance_status
             FROM tbl_tarl_training_registrations
             WHERE (LOWER(participant_email) = LOWER($1) OR id::text = $1) 
               AND session_id = $2 AND is_active = true`,
            [qr_code_data, sessionId]
          );
          registration = regResult.rows[0];
        }
      }

      if (!registration) {
        await client.query('ROLLBACK');
        return NextResponse.json({
          status: 'not_found',
          message: 'Participant not found for this session',
          participant_name: 'Unknown',
          participant_email: identifier || participant_email || 'unknown'
        });
      }

      // Check if already checked in
      if (registration.attendance_status === 'attended') {
        await client.query('ROLLBACK');
        return NextResponse.json({
          status: 'already_checked',
          message: 'Participant already checked in',
          participant_name: registration.participant_name,
          participant_email: registration.participant_email
        });
      }

      // Mark attendance
      await client.query(
        `UPDATE tbl_tarl_training_registrations 
         SET 
           attendance_status = 'attended',
           attendance_marked_at = NOW(),
           updated_at = NOW()
         WHERE id = $1`,
        [registration.id]
      );

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

      // Log QR check-in activity
      await client.query(
        `INSERT INTO tbl_tarl_user_activities (
           user_id, activity_type, activity_description, 
           related_table, related_id, activity_data
         ) VALUES ($1, 'qr_checkin', $2, 'tbl_tarl_training_registrations', $3, $4)`,
        [
          currentUser.id,
          `QR check-in for ${registration.participant_name}`,
          registration.id,
          JSON.stringify({
            session_id: sessionId,
            participant_name: registration.participant_name,
            participant_email: registration.participant_email,
            qr_method: qr_code_data ? 'qr_scan' : 'manual_entry'
          })
        ]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        status: 'success',
        message: 'Check-in successful',
        participant_name: registration.participant_name,
        participant_email: registration.participant_email,
        registration_id: registration.id
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Error in QR check-in:", error);
    return NextResponse.json(
      { 
        status: 'error',
        message: "Failed to process check-in",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}