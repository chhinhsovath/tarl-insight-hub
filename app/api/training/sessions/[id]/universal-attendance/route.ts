import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// POST - Universal attendance marking endpoint
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = parseInt(id);
  
  try {
    const body = await request.json();

    const {
      participant_name,
      participant_email,
      participant_phone,
      participant_role,
      school_name,
      district,
      province,
      qr_id,
      master_participant_id
    } = body;

    if (!participant_email || !participant_name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if session exists
      const sessionResult = await client.query(
        `SELECT session_title, max_participants as capacity FROM tbl_tarl_training_sessions WHERE id = $1`,
        [sessionId]
      );

      if (sessionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      const session = sessionResult.rows[0];

      // Check if already registered
      const existingResult = await client.query(
        `SELECT id, attendance_status 
         FROM tbl_tarl_training_registrations
         WHERE session_id = $1 AND LOWER(participant_email) = LOWER($2) AND is_active = true`,
        [sessionId, participant_email]
      );

      let registrationId;
      let isNewRegistration = false;
      let message = '';

      if (existingResult.rows.length > 0) {
        // Already registered
        const existing = existingResult.rows[0];
        registrationId = existing.id;

        if (existing.attendance_status === 'attended') {
          await client.query('ROLLBACK');
          return NextResponse.json({
            success: true,
            message: `${participant_name} is already marked as attended`,
            data: {
              registration_id: registrationId,
              already_attended: true
            }
          });
        }

        // Mark attendance for existing registration
        await client.query(
          `UPDATE tbl_tarl_training_registrations 
           SET 
             attendance_status = 'attended',
             attendance_marked_at = NOW(),
             updated_at = NOW()
           WHERE id = $1`,
          [registrationId]
        );

        message = `Attendance marked for ${participant_name}`;

      } else {
        // Auto-register and mark attendance
        const registrationResult = await client.query(
          `INSERT INTO tbl_tarl_training_registrations (
             session_id, participant_email, participant_name, participant_phone,
             participant_role, school_name, district, province,
             attendance_status, attendance_marked_at, registration_method, master_participant_id
           ) VALUES ($1, LOWER($2), $3, $4, $5, $6, $7, $8, 'attended', NOW(), $9, $10)
           RETURNING id, master_participant_id`,
          [
            sessionId,
            participant_email,
            participant_name,
            participant_phone,
            participant_role,
            school_name,
            district,
            province,
            qr_id ? 'qr_code' : 'walk_in',
            master_participant_id
          ]
        );

        registrationId = registrationResult.rows[0].id;
        isNewRegistration = true;
        message = master_participant_id 
          ? `Welcome back! ${participant_name} registered and attendance marked`
          : `${participant_name} registered and attendance marked`;
      }

      // Note: We don't update a current_attendance column as it doesn't exist
      // The attendance count is calculated dynamically when needed

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: message,
        data: {
          registration_id: registrationId,
          master_participant_id: master_participant_id,
          session_title: session.session_title,
          is_new_registration: isNewRegistration,
          is_returning_participant: !!master_participant_id,
          attendance_marked: true
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Error in universal attendance:", error);
    return NextResponse.json(
      { 
        error: "Attendance marking failed",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}