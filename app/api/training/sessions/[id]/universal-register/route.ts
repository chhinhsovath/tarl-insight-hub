import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// POST - Universal registration endpoint
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
      master_participant_id,
      action = 'register'
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

      // Check if session exists and has capacity
      const sessionResult = await client.query(
        `SELECT s.capacity, s.session_title, COUNT(r.id) as current_registrations
         FROM tbl_tarl_training_sessions s
         LEFT JOIN tbl_tarl_training_registrations r ON s.id = r.session_id AND r.is_active = true
         WHERE s.id = $1
         GROUP BY s.id, s.capacity, s.session_title`,
        [sessionId]
      );

      if (sessionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      const session = sessionResult.rows[0];
      const currentRegistrations = parseInt(session.current_registrations || 0);

      // Check if already registered
      const existingResult = await client.query(
        `SELECT id, attendance_status 
         FROM tbl_tarl_training_registrations
         WHERE session_id = $1 AND LOWER(participant_email) = LOWER($2) AND is_active = true`,
        [sessionId, participant_email]
      );

      if (existingResult.rows.length > 0) {
        await client.query('ROLLBACK');
        const existing = existingResult.rows[0];
        return NextResponse.json({
          error: existing.attendance_status === 'attended' 
            ? "Already registered and attended this session"
            : "Already registered for this session",
          registration_id: existing.id
        }, { status: 409 });
      }

      // Check capacity
      if (session.capacity && currentRegistrations >= session.capacity) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: "Session is at full capacity" },
          { status: 400 }
        );
      }

      // Create registration (triggers will handle master participant linking)
      const registrationResult = await client.query(
        `INSERT INTO tbl_tarl_training_registrations (
           session_id, participant_email, participant_name, participant_phone,
           participant_role, school_name, district, province,
           attendance_status, registration_method, master_participant_id
         ) VALUES ($1, LOWER($2), $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
          'registered',
          qr_id ? 'qr_code' : 'online',
          master_participant_id
        ]
      );

      const registration = registrationResult.rows[0];

      // Note: We don't update registration/attendance counts in the sessions table
      // These are calculated dynamically when needed

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: master_participant_id 
          ? `Welcome back! Registration successful for ${participant_name}`
          : `Registration successful for ${participant_name}`,
        data: {
          registration_id: registration.id,
          master_participant_id: registration.master_participant_id,
          session_title: session.session_title,
          is_returning_participant: !!master_participant_id
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Error in universal registration:", error);
    return NextResponse.json(
      { 
        error: "Registration failed",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}