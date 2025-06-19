import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// GET - Get public session information (no authentication required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = parseInt(id);
  
  try {
    const client = await pool.connect();
    
    try {
      // Get session details with current attendance count
      const sessionResult = await client.query(`
        SELECT 
          s.id,
          s.session_title,
          s.session_date,
          s.session_time,
          s.location,
          s.venue_address,
          COALESCE(s.capacity, s.max_participants) as capacity,
          s.registration_deadline,
          s.session_status,
          p.program_name,
          p.description as program_description,
          COUNT(r.id) FILTER (WHERE r.is_active = true) as current_registrations,
          COUNT(r.id) FILTER (WHERE r.attendance_status = 'attended' AND r.is_active = true) as current_attendance
        FROM tbl_tarl_training_sessions s
        LEFT JOIN tbl_tarl_training_programs p ON s.program_id = p.id
        LEFT JOIN tbl_tarl_training_registrations r ON s.id = r.session_id
        WHERE s.id = $1
        GROUP BY s.id, p.program_name, p.description
      `, [sessionId]);

      if (sessionResult.rows.length === 0) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      const session = sessionResult.rows[0];

      // Check if registration is still open
      const now = new Date();
      const sessionDate = new Date(session.session_date);
      const registrationDeadline = session.registration_deadline 
        ? new Date(session.registration_deadline)
        : sessionDate;

      const isRegistrationOpen = now <= registrationDeadline && 
                                session.session_status !== 'cancelled' &&
                                session.session_status !== 'completed';

      const isSessionStarted = now >= sessionDate;
      const isSessionCompleted = session.session_status === 'completed' ||
                                (now > sessionDate && session.session_status !== 'ongoing');

      return NextResponse.json({
        id: session.id,
        session_title: session.session_title,
        session_date: session.session_date,
        session_time: session.session_time,
        location: session.location,
        venue_address: session.venue_address,
        capacity: session.capacity || 0,
        current_registrations: parseInt(session.current_registrations || 0),
        current_attendance: parseInt(session.current_attendance || 0),
        program_name: session.program_name,
        program_description: session.program_description,
        registration_deadline: session.registration_deadline,
        session_status: session.session_status,
        is_registration_open: isRegistrationOpen,
        is_session_started: isSessionStarted,
        is_session_completed: isSessionCompleted,
        spots_available: session.capacity 
          ? Math.max(0, session.capacity - parseInt(session.current_registrations || 0))
          : null
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Error fetching public session:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}