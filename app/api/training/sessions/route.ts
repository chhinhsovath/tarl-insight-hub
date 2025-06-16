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
        COUNT(DISTINCT tpt.id) as participant_count,
        COUNT(DISTINCT CASE WHEN tpt.attendance_confirmed = true THEN tpt.id END) as confirmed_count,
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
      feedback_form_data
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
        created_by, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
      RETURNING id, session_title, session_date, session_time, location
    `, [
      program_id, session_title, session_date, session_time, location,
      venue_address || null, max_participants || 50, trainer_id || null, 
      coordinator_id || null, registration_deadline || null,
      registration_form_data ? JSON.stringify(registration_form_data) : null,
      feedback_form_data ? JSON.stringify(feedback_form_data) : null,
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

  const user = authResult.user!;
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
      session_status
    } = body;

    const updateResult = await client.query(`
      UPDATE tbl_tarl_training_sessions SET
        session_title = COALESCE($1, session_title),
        session_date = COALESCE($2, session_date),
        session_time = COALESCE($3, session_time),
        location = COALESCE($4, location),
        venue_address = COALESCE($5, venue_address),
        max_participants = COALESCE($6, max_participants),
        trainer_id = COALESCE($7, trainer_id),
        coordinator_id = COALESCE($8, coordinator_id),
        registration_deadline = COALESCE($9, registration_deadline),
        session_status = COALESCE($10, session_status),
        updated_at = NOW()
      WHERE id = $11 AND is_active = true
      RETURNING id, session_title, session_date, session_time, location, session_status
    `, [
      session_title, session_date, session_time, location, venue_address,
      max_participants, trainer_id, coordinator_id, registration_deadline,
      session_status, parseInt(sessionId)
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