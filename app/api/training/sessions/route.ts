import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { validateTrainingAccess } from "@/lib/training-permissions";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// GET - Fetch training sessions
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('id');
  const trainerId = searchParams.get('trainer_id');
  const status = searchParams.get('status');
  const programId = searchParams.get('program_id');
  
  // Validate training access
  const authResult = await validateTrainingAccess('training-sessions', 'view');
  
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const user = authResult.user!;
  const client = await pool.connect();

  try {

    let query = `
      SELECT 
        ts.*,
        tp.program_name,
        tp.description as program_description,
        tp.program_type,
        tp.duration_hours,
        trainer.full_name as trainer_name,
        coordinator.full_name as coordinator_name,
        COUNT(DISTINCT tpt.id)::int as participant_count,
        COUNT(DISTINCT CASE WHEN tpt.attendance_confirmed = true THEN tpt.id END)::int as confirmed_count,
        tf_before.stage_status as before_status,
        tf_during.stage_status as during_status,
        tf_after.stage_status as after_status
      FROM tbl_tarl_training_sessions ts
      LEFT JOIN tbl_tarl_training_programs tp ON ts.program_id = tp.id
      LEFT JOIN tbl_tarl_users trainer ON ts.trainer_id = trainer.id
      LEFT JOIN tbl_tarl_users coordinator ON ts.coordinator_id = coordinator.id
      LEFT JOIN tbl_tarl_training_participants tpt ON ts.id = tpt.session_id
      LEFT JOIN tbl_tarl_training_flow tf_before ON ts.id = tf_before.session_id AND tf_before.flow_stage = 'before'
      LEFT JOIN tbl_tarl_training_flow tf_during ON ts.id = tf_during.session_id AND tf_during.flow_stage = 'during'
      LEFT JOIN tbl_tarl_training_flow tf_after ON ts.id = tf_after.session_id AND tf_after.flow_stage = 'after'
      WHERE ts.is_active = true
    `;

    const params = [];
    let paramIndex = 1;

    // If fetching a specific session by ID
    if (sessionId) {
      query += ` AND ts.id = $${paramIndex}`;
      params.push(parseInt(sessionId));
      paramIndex++;
    } else {
      // Apply filters only when not fetching by ID
      if (trainerId) {
        query += ` AND ts.trainer_id = $${paramIndex}`;
        params.push(parseInt(trainerId));
        paramIndex++;
      }

      if (status) {
        query += ` AND ts.session_status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (programId) {
        query += ` AND ts.program_id = $${paramIndex}`;
        params.push(parseInt(programId));
        paramIndex++;
      }
    }

    // Apply role-based filtering
    if (user.role === 'teacher') {
      query += ` AND ts.trainer_id = $${paramIndex}`;
      params.push(user.user_id);
    }

    query += `
      GROUP BY ts.id, tp.id, trainer.full_name, coordinator.full_name, 
               tf_before.stage_status, tf_during.stage_status, tf_after.stage_status
      ORDER BY ts.session_date DESC, ts.session_time DESC
    `;

    const result = await client.query(query, params);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching training sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

// POST - Create new training session
export async function POST(request: NextRequest) {
  // Validate training access
  const authResult = await validateTrainingAccess('training-sessions', 'create');
  
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const user = authResult.user!;
  const client = await pool.connect();

  try {

    const body = await request.json();
    const {
      program_id,
      session_title,
      session_date,
      session_time,
      location,
      venue_address,
      max_participants,
      trainer_id,
      coordinator_id,
      registration_deadline,
      registration_form_data,
      feedback_form_data,
      agenda,
      notes
    } = body;

    if (!program_id || !session_title || !session_date || !session_time || !location) {
      return NextResponse.json({ 
        error: 'Missing required fields: program_id, session_title, session_date, session_time, location' 
      }, { status: 400 });
    }

    await client.query('BEGIN');

    // Create the training session
    const insertResult = await client.query(`
      INSERT INTO tbl_tarl_training_sessions (
        program_id, session_title, session_date, session_time, location, 
        venue_address, max_participants, trainer_id, coordinator_id, 
        registration_deadline, registration_form_data, feedback_form_data, 
        agenda, notes, created_by, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true)
      RETURNING id, session_title, session_date, session_time, location
    `, [
      program_id, session_title, session_date, session_time, location,
      venue_address || null, max_participants || 50, trainer_id || null, 
      coordinator_id || null, registration_deadline || null,
      registration_form_data ? JSON.stringify(registration_form_data) : null,
      feedback_form_data ? JSON.stringify(feedback_form_data) : null,
      agenda || null, notes || null,
      user.user_id
    ]);

    const newSession = insertResult.rows[0];

    // Initialize the three-stage training flow
    const flowStages = [
      {
        stage: 'before',
        description: 'Pre-training activities: Registration, QR code generation, participant notifications',
        tasks: ['Generate QR codes', 'Send invitations', 'Prepare materials']
      },
      {
        stage: 'during',
        description: 'Training session activities: Attendance confirmation, material distribution',
        tasks: ['Confirm attendance', 'Distribute materials', 'Conduct training']
      },
      {
        stage: 'after',
        description: 'Post-training activities: Feedback collection, follow-up',
        tasks: ['Collect feedback', 'Generate reports', 'Follow up with participants']
      }
    ];

    for (const stage of flowStages) {
      await client.query(`
        INSERT INTO tbl_tarl_training_flow (session_id, flow_stage, stage_data)
        VALUES ($1, $2, $3)
      `, [newSession.id, stage.stage, JSON.stringify(stage)]);
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      session: newSession,
      message: 'Training session created successfully with three-stage flow'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating training session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

// PUT - Update training session
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  // Validate training access
  const authResult = await validateTrainingAccess('training-sessions', 'update');
  
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const client = await pool.connect();

  try {
    const body = await request.json();
    const {
      session_title,
      session_date,
      session_time,
      location,
      venue_address,
      max_participants,
      trainer_id,
      coordinator_id,
      registration_deadline,
      session_status,
      agenda,
      notes
    } = body;

    console.log('Received update data:', {
      session_title, session_date, session_time, location, venue_address,
      max_participants, trainer_id, coordinator_id, registration_deadline, session_status
    });

    const updateResult = await client.query(`
      UPDATE tbl_tarl_training_sessions SET
        session_title = $1,
        session_date = $2,
        session_time = $3,
        location = $4,
        venue_address = $5,
        max_participants = $6,
        trainer_id = $7,
        coordinator_id = $8,
        registration_deadline = $9,
        session_status = $10,
        agenda = $11,
        notes = $12,
        updated_at = NOW()
      WHERE id = $13 AND is_active = true
      RETURNING id, session_title, session_date, session_time, location, session_status, registration_deadline
    `, [
      session_title,
      session_date,
      session_time,
      location,
      venue_address,
      max_participants,
      trainer_id,
      coordinator_id,
      registration_deadline,
      session_status,
      agenda || null,
      notes || null,
      parseInt(sessionId)
    ]);

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Training session not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      session: updateResult.rows[0],
      message: 'Training session updated successfully'
    });

  } catch (error) {
    console.error('Error updating training session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

// DELETE - Delete training session
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('id');
  const forceDelete = searchParams.get('force') === 'true';

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  // Validate training access
  const authResult = await validateTrainingAccess('training-sessions', 'delete');
  
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if session exists and get details
    const sessionCheck = await client.query(`
      SELECT id, session_title, session_status FROM tbl_tarl_training_sessions 
      WHERE id = $1 AND is_active = true
    `, [parseInt(sessionId)]);

    if (sessionCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Training session not found' }, { status: 404 });
    }

    const session = sessionCheck.rows[0];

    // Check if session has participants
    const participantsCheck = await client.query(`
      SELECT COUNT(*) as participant_count FROM tbl_tarl_training_participants 
      WHERE session_id = $1
    `, [parseInt(sessionId)]);

    const participantCount = parseInt(participantsCheck.rows[0].participant_count);

    if (participantCount > 0 && !forceDelete) {
      await client.query('ROLLBACK');
      return NextResponse.json({ 
        error: 'Cannot delete session with registered participants. Please remove participants first.',
        participantCount: participantCount,
        canForceDelete: true
      }, { status: 400 });
    }

    // If force delete is requested, first remove all participants
    if (forceDelete && participantCount > 0) {
      await client.query(`
        DELETE FROM tbl_tarl_training_participants WHERE session_id = $1
      `, [parseInt(sessionId)]);
      console.log(`Force deleted ${participantCount} participants for session ${sessionId}`);
    }

    // Soft delete the session (set is_active = false)
    await client.query(`
      UPDATE tbl_tarl_training_sessions 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
    `, [parseInt(sessionId)]);

    // Also clean up related training flow entries
    await client.query(`
      DELETE FROM tbl_tarl_training_flow WHERE session_id = $1
    `, [parseInt(sessionId)]);

    // Clean up any QR codes for this session
    await client.query(`
      UPDATE tbl_tarl_qr_codes 
      SET is_active = false, updated_at = NOW()
      WHERE session_id = $1
    `, [parseInt(sessionId)]);

    await client.query('COMMIT');

    let message = `Training session "${session.session_title}" deleted successfully`;
    if (forceDelete && participantCount > 0) {
      message += ` (${participantCount} participant registrations were also removed)`;
    }

    return NextResponse.json({
      success: true,
      message: message
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting training session:', error);
    console.error('Session ID:', sessionId);
    console.error('Force Delete:', forceDelete);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage
    }, { status: 500 });
  } finally {
    client.release();
  }
}