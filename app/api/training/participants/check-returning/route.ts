import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();

// GET - Check if participant is returning and get their history
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
  }

  const client = await pool.connect();

  try {
    // Check if participant exists in master table
    const masterQuery = `
      SELECT 
        mp.*,
        COUNT(DISTINCT tp.session_id) FILTER (WHERE tp.attendance_confirmed = true) as sessions_attended,
        MAX(ts.session_date) as last_session_date,
        ARRAY_AGG(DISTINCT tprog.program_name) FILTER (WHERE tprog.program_name IS NOT NULL) as programs_attended
      FROM tbl_tarl_master_participants mp
      LEFT JOIN tbl_tarl_training_participants tp ON mp.id = tp.master_participant_id
      LEFT JOIN tbl_tarl_training_sessions ts ON tp.session_id = ts.id
      LEFT JOIN tbl_tarl_training_programs tprog ON ts.program_id = tprog.id
      WHERE mp.email = $1
      GROUP BY mp.id
    `;

    const masterResult = await client.query(masterQuery, [email]);
    
    if (masterResult.rows.length === 0) {
      // New participant
      return NextResponse.json({
        isReturning: false,
        message: 'Welcome! This is your first training with us.'
      });
    }

    const participant = masterResult.rows[0];

    // Get recent training history (last 5 sessions)
    const historyQuery = `
      SELECT 
        ts.id as session_id,
        ts.session_title,
        ts.session_date,
        ts.location,
        tprog.program_name,
        tp.attendance_confirmed,
        tp.registration_status,
        CASE 
          WHEN tp.attendance_confirmed = true THEN 'Attended'
          WHEN tp.registration_status = 'cancelled' THEN 'Cancelled'
          WHEN ts.session_date < CURRENT_DATE THEN 'No Show'
          ELSE 'Registered'
        END as status
      FROM tbl_tarl_training_participants tp
      JOIN tbl_tarl_training_sessions ts ON tp.session_id = ts.id
      LEFT JOIN tbl_tarl_training_programs tprog ON ts.program_id = tprog.id
      WHERE tp.master_participant_id = $1
      ORDER BY ts.session_date DESC
      LIMIT 5
    `;

    const historyResult = await client.query(historyQuery, [participant.id]);

    // Calculate attendance rate
    const attendanceRate = participant.total_sessions_registered > 0
      ? Math.round((participant.sessions_attended / participant.total_sessions_registered) * 100)
      : 0;

    return NextResponse.json({
      isReturning: true,
      participant: {
        id: participant.id,
        email: participant.email,
        fullName: participant.full_name,
        phone: participant.phone,
        role: participant.role,
        organization: participant.organization,
        district: participant.district,
        province: participant.province,
        totalSessionsAttended: parseInt(participant.sessions_attended || 0),
        lastSessionDate: participant.last_session_date,
        attendanceRate: attendanceRate,
        programsAttended: participant.programs_attended || []
      },
      recentHistory: historyResult.rows,
      welcomeMessage: `Welcome back, ${participant.full_name}! Great to see you again.`,
      stats: {
        totalRegistered: participant.total_sessions_registered || 0,
        totalAttended: parseInt(participant.sessions_attended || 0),
        firstTrainingDate: participant.first_training_date,
        daysSinceLastTraining: participant.last_session_date 
          ? Math.floor((new Date().getTime() - new Date(participant.last_session_date).getTime()) / (1000 * 3600 * 24))
          : null
      }
    });

  } catch (error) {
    console.error('Error checking returning participant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}