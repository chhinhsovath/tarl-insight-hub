import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";

const pool = getPool();

// POST - Quick register and mark attendance in one step
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = parseInt(id);
  
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

    const {
      participant_email,
      participant_name,
      participant_phone,
      participant_role,
      school_name,
      district,
      province,
      mark_attendance = true
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

      // Check session capacity
      const sessionResult = await client.query(
        `SELECT s.max_participants as capacity, COUNT(r.id) as current_registrations
         FROM tbl_tarl_training_sessions s
         LEFT JOIN tbl_tarl_training_registrations r ON s.id = r.session_id AND r.is_active = true
         WHERE s.id = $1
         GROUP BY s.id, s.max_participants`,
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
        `SELECT id, attendance_status, master_participant_id 
         FROM tbl_tarl_training_registrations
         WHERE session_id = $1 AND LOWER(participant_email) = LOWER($2)`,
        [sessionId, participant_email]
      );

      let registrationId;
      let masterParticipantId;
      let isNewParticipant = false;
      let message;

      if (existingResult.rows.length > 0) {
        // Already registered - just update attendance if needed
        const existing = existingResult.rows[0];
        registrationId = existing.id;
        masterParticipantId = existing.master_participant_id;

        if (mark_attendance && existing.attendance_status !== 'attended') {
          await client.query(
            `UPDATE tbl_tarl_training_registrations 
             SET attendance_status = 'attended', 
                 attendance_marked_at = NOW(),
                 updated_at = NOW()
             WHERE id = $1`,
            [registrationId]
          );
          message = "Attendance marked successfully for existing registration";
        } else if (existing.attendance_status === 'attended') {
          message = "Participant already checked in";
        } else {
          message = "Registration updated";
        }
      } else {
        // Check capacity for new registration
        if (session.capacity && currentRegistrations >= session.capacity) {
          await client.query('ROLLBACK');
          return NextResponse.json(
            { error: "Session is at full capacity" },
            { status: 400 }
          );
        }

        // Check if participant exists in master table
        const masterResult = await client.query(
          "SELECT id FROM tbl_tarl_master_participants WHERE email = LOWER($1)",
          [participant_email]
        );

        if (masterResult.rows.length === 0) {
          isNewParticipant = true;
        }

        // Create new registration (trigger will handle master participant creation/linking)
        const registrationResult = await client.query(
          `INSERT INTO tbl_tarl_training_registrations (
             session_id, participant_email, participant_name, participant_phone,
             participant_role, school_name, district, province,
             attendance_status, attendance_marked_at, registration_method
           ) VALUES ($1, LOWER($2), $3, $4, $5, $6, $7, $8, $9, $10, 'on-site')
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
            mark_attendance ? 'attended' : 'registered',
            mark_attendance ? new Date() : null
          ]
        );

        registrationId = registrationResult.rows[0].id;
        masterParticipantId = registrationResult.rows[0].master_participant_id;

        if (mark_attendance) {
          message = isNewParticipant 
            ? "New participant registered and attendance marked successfully"
            : "Returning participant registered and attendance marked successfully";
        } else {
          message = isNewParticipant 
            ? "New participant registered successfully"
            : "Returning participant registered successfully";
        }
      }

      // Note: We don't update a current_attendance column as it doesn't exist
      // The attendance count is calculated dynamically when needed

      // Log the action
      await client.query(
        `INSERT INTO tbl_tarl_user_activities (
           user_id, action, details
         ) VALUES ($1, $2, $3)`,
        [
          currentUser.id,
          'quick_registration',
          JSON.stringify({
            action: `Quick registration for session ${sessionId}`,
            session_id: sessionId,
            registration_id: registrationId,
            participant_email,
            participant_name,
            attendance_marked: mark_attendance,
            is_new_participant: isNewParticipant
          })
        ]
      );

      await client.query('COMMIT');

      // Get updated session stats
      const updatedStatsResult = await client.query(
        `SELECT 
           COUNT(*) as total_registered,
           COUNT(*) FILTER (WHERE attendance_status = 'attended') as total_attended
         FROM tbl_tarl_training_registrations 
         WHERE session_id = $1 AND is_active = true`,
        [sessionId]
      );

      const stats = updatedStatsResult.rows[0];

      return NextResponse.json({
        success: true,
        message,
        data: {
          registration_id: registrationId,
          master_participant_id: masterParticipantId,
          is_new_participant: isNewParticipant,
          attendance_marked: mark_attendance,
          session_stats: {
            total_registered: parseInt(stats.total_registered),
            total_attended: parseInt(stats.total_attended)
          }
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Error in quick registration:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// GET - Get quick registration statistics for a session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = parseInt(id);
  
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT 
         s.session_title,
         s.session_date,
         s.max_participants as capacity,
         COUNT(r.id) as total_registered,
         COUNT(r.id) FILTER (WHERE r.attendance_status = 'attended') as total_attended,
         COUNT(r.id) FILTER (WHERE r.registration_method = 'on-site') as onsite_registrations,
         COUNT(DISTINCT r.master_participant_id) FILTER (WHERE r.master_participant_id IS NOT NULL) as unique_participants
       FROM tbl_tarl_training_sessions s
       LEFT JOIN tbl_tarl_training_registrations r ON s.id = r.session_id AND r.is_active = true
       WHERE s.id = $1
       GROUP BY s.id, s.session_title, s.session_date, s.max_participants`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error("Error fetching quick registration stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}