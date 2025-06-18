import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// POST - Mark attendance for a registered participant
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;
  const client = await pool.connect();

  try {
    const body = await request.json();
    const { registration_id, qr_id } = body;

    if (!registration_id) {
      return NextResponse.json({ 
        error: 'Registration ID is required' 
      }, { status: 400 });
    }

    // Verify registration exists and belongs to this session
    const registrationCheck = await client.query(`
      SELECT 
        r.id,
        r.participant_name,
        r.participant_email,
        r.attendance_status,
        r.session_id
      FROM tbl_tarl_training_registrations r
      WHERE r.id = $1 AND r.session_id = $2
    `, [registration_id, parseInt(sessionId)]);

    if (registrationCheck.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Registration not found for this session' 
      }, { status: 404 });
    }

    const registration = registrationCheck.rows[0];

    // Check if already attended
    if (registration.attendance_status === 'attended') {
      return NextResponse.json({ 
        error: 'Attendance already marked for this participant' 
      }, { status: 400 });
    }

    await client.query('BEGIN');

    // Mark attendance
    await client.query(`
      UPDATE tbl_tarl_training_registrations
      SET 
        attendance_status = 'attended',
        attendance_marked_at = NOW(),
        attendance_marked_by = 'Public QR/Walk-in'
      WHERE id = $1
    `, [registration_id]);

    // Update session attendance count
    await client.query(`
      UPDATE tbl_tarl_training_sessions
      SET current_attendance = current_attendance + 1
      WHERE id = $1
    `, [parseInt(sessionId)]);

    // Log QR code usage if QR ID provided
    if (qr_id) {
      await client.query(`
        UPDATE tbl_tarl_qr_codes 
        SET usage_count = usage_count + 1, last_used_at = NOW()
        WHERE id = $1
      `, [parseInt(qr_id)]);

      await client.query(`
        INSERT INTO tbl_tarl_qr_usage_log (
          qr_code_id, session_id, participant_id, action_type, scan_result
        ) VALUES ($1, $2, $3, 'attendance', 'success')
      `, [parseInt(qr_id), parseInt(sessionId), registration.participant_email]);
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      participant: {
        name: registration.participant_name,
        email: registration.participant_email
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error marking attendance:', error);
    return NextResponse.json({ 
      error: 'Failed to mark attendance' 
    }, { status: 500 });
  } finally {
    client.release();
  }
}