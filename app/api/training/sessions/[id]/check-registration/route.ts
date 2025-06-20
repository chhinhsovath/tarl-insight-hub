import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();

// GET - Check if participant is registered for a session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = parseInt(id);
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({ 
      error: 'Email parameter is required' 
    }, { status: 400 });
  }

  const client = await pool.connect();

  try {
    // Check registration status
    const registrationResult = await client.query(`
      SELECT 
        id,
        attendance_status,
        registration_method,
        created_at,
        attendance_marked_at
      FROM tbl_tarl_training_registrations
      WHERE session_id = $1 
        AND LOWER(participant_email) = LOWER($2)
        AND is_active = true
    `, [sessionId, email]);

    if (registrationResult.rows.length === 0) {
      return NextResponse.json({
        isRegistered: false,
        isAttended: false,
        message: 'Not registered for this session'
      });
    }

    const registration = registrationResult.rows[0];
    const isAttended = registration.attendance_status === 'attended';

    return NextResponse.json({
      isRegistered: true,
      isAttended: isAttended,
      registration_id: registration.id,
      registration_method: registration.registration_method,
      registered_at: registration.created_at,
      attended_at: registration.attendance_marked_at,
      message: isAttended 
        ? 'Already registered and attended'
        : 'Registered but not attended yet'
    });

  } catch (error) {
    console.error('Error checking registration:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    client.release();
  }
}