import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { validateTrainingAccess } from "@/lib/training-permissions";

const pool = getPool();

// GET - Fetch training flow status for a session
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  const flowStage = searchParams.get('stage');
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

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
        tf.*,
        ts.session_title,
        ts.session_date,
        ts.session_time,
        ts.session_status,
        completer.full_name as completed_by_name
      FROM tbl_tarl_training_flow tf
      LEFT JOIN tbl_tarl_training_sessions ts ON tf.session_id = ts.id
      LEFT JOIN tbl_tarl_users completer ON tf.completed_by = completer.id
      WHERE tf.session_id = $1
    `;

    const params: (number | string)[] = [parseInt(sessionId)];

    if (flowStage) {
      query += ` AND tf.flow_stage = $2`;
      params.push(flowStage);
    }

    query += ` ORDER BY 
      CASE tf.flow_stage 
        WHEN 'before' THEN 1 
        WHEN 'during' THEN 2 
        WHEN 'after' THEN 3 
        ELSE 4 
      END`;

    const result = await client.query(query, params);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching training flow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

// PUT - Update training flow stage
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  const flowStage = searchParams.get('stage');

  if (!sessionId || !flowStage) {
    return NextResponse.json({ error: 'Session ID and flow stage are required' }, { status: 400 });
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
      stage_status, 
      stage_data, 
      qr_code_generated, 
      participants_notified, 
      materials_distributed, 
      feedback_collected 
    } = body;

    // Validate flow stage
    const validStages = ['before', 'during', 'after'];
    if (!validStages.includes(flowStage)) {
      return NextResponse.json({ 
        error: `Invalid flow stage. Must be one of: ${validStages.join(', ')}` 
      }, { status: 400 });
    }

    // Validate stage status
    const validStatuses = ['pending', 'active', 'completed'];
    if (stage_status && !validStatuses.includes(stage_status)) {
      return NextResponse.json({ 
        error: `Invalid stage status. Must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 });
    }

    let updateFields = [];
    let updateValues = [];
    let paramIndex = 1;

    if (stage_status !== undefined) {
      updateFields.push(`stage_status = $${paramIndex}`);
      updateValues.push(stage_status);
      paramIndex++;
      
      // If marking as completed, set completion timestamp
      if (stage_status === 'completed') {
        updateFields.push(`stage_completed_at = NOW()`);
        updateFields.push(`completed_by = $${paramIndex}`);
        updateValues.push(user.user_id);
        paramIndex++;
      }
    }

    if (stage_data !== undefined) {
      updateFields.push(`stage_data = $${paramIndex}`);
      updateValues.push(JSON.stringify(stage_data));
      paramIndex++;
    }

    if (qr_code_generated !== undefined) {
      updateFields.push(`qr_code_generated = $${paramIndex}`);
      updateValues.push(qr_code_generated);
      paramIndex++;
    }

    if (participants_notified !== undefined) {
      updateFields.push(`participants_notified = $${paramIndex}`);
      updateValues.push(participants_notified);
      paramIndex++;
    }

    if (materials_distributed !== undefined) {
      updateFields.push(`materials_distributed = $${paramIndex}`);
      updateValues.push(materials_distributed);
      paramIndex++;
    }

    if (feedback_collected !== undefined) {
      updateFields.push(`feedback_collected = $${paramIndex}`);
      updateValues.push(feedback_collected);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(parseInt(sessionId), flowStage);

    const updateQuery = `
      UPDATE tbl_tarl_training_flow SET
        ${updateFields.join(', ')}
      WHERE session_id = $${paramIndex} AND flow_stage = $${paramIndex + 1}
      RETURNING id, session_id, flow_stage, stage_status, stage_data, 
                qr_code_generated, participants_notified, materials_distributed, 
                feedback_collected, stage_completed_at, updated_at
    `;

    const updateResult = await client.query(updateQuery, updateValues);

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Training flow stage not found' }, { status: 404 });
    }

    // Auto-update session status based on flow completion
    if (stage_status === 'completed') {
      await updateSessionStatus(client, parseInt(sessionId), flowStage);
    }

    return NextResponse.json({
      success: true,
      flow_stage: updateResult.rows[0],
      message: `Training flow ${flowStage} stage updated successfully`
    });

  } catch (error) {
    console.error('Error updating training flow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

// POST - Initialize flow for a new session (if not already done)
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
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Check if session exists
    const sessionCheck = await client.query(`
      SELECT id, session_title FROM tbl_tarl_training_sessions 
      WHERE id = $1 AND is_active = true
    `, [parseInt(session_id)]);

    if (sessionCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Training session not found' }, { status: 404 });
    }

    // Check if flow already exists
    const existingFlow = await client.query(`
      SELECT flow_stage FROM tbl_tarl_training_flow WHERE session_id = $1
    `, [parseInt(session_id)]);

    if (existingFlow.rows.length > 0) {
      return NextResponse.json({ 
        error: 'Training flow already initialized for this session',
        existing_stages: existingFlow.rows.map(row => row.flow_stage)
      }, { status: 409 });
    }

    await client.query('BEGIN');

    // Initialize the three-stage flow
    const flowStages = [
      {
        stage: 'before',
        description: 'Pre-training activities: Registration, QR code generation, participant notifications',
        tasks: ['Generate QR codes for registration', 'Send invitations to participants', 'Prepare training materials', 'Set up venue'],
        checklist: ['QR codes generated', 'Invitations sent', 'Materials prepared', 'Venue confirmed']
      },
      {
        stage: 'during',
        description: 'Training session activities: Attendance confirmation, material distribution, session delivery',
        tasks: ['Confirm participant attendance', 'Distribute training materials', 'Conduct training session', 'Monitor engagement'],
        checklist: ['Attendance confirmed', 'Materials distributed', 'Session conducted', 'Engagement monitored']
      },
      {
        stage: 'after',
        description: 'Post-training activities: Feedback collection, follow-up, reporting',
        tasks: ['Collect participant feedback', 'Generate training reports', 'Follow up with participants', 'Archive materials'],
        checklist: ['Feedback collected', 'Reports generated', 'Follow-up completed', 'Materials archived']
      }
    ];

    const createdStages = [];

    for (const stage of flowStages) {
      const result = await client.query(`
        INSERT INTO tbl_tarl_training_flow (session_id, flow_stage, stage_data)
        VALUES ($1, $2, $3)
        RETURNING id, session_id, flow_stage, stage_status, stage_data, created_at
      `, [parseInt(session_id), stage.stage, JSON.stringify(stage)]);
      
      createdStages.push(result.rows[0]);
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      flow_stages: createdStages,
      session_title: sessionCheck.rows[0].session_title,
      message: 'Training flow initialized successfully with three stages'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing training flow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

// Helper function to update session status based on flow completion
async function updateSessionStatus(client: any, sessionId: number, completedStage: string) {
  try {
    // Get all flow stages for this session
    const flowResult = await client.query(`
      SELECT flow_stage, stage_status FROM tbl_tarl_training_flow 
      WHERE session_id = $1
    `, [sessionId]);

    const stages = flowResult.rows;
    const beforeCompleted = stages.find(s => s.flow_stage === 'before')?.stage_status === 'completed';
    const duringCompleted = stages.find(s => s.flow_stage === 'during')?.stage_status === 'completed';
    const afterCompleted = stages.find(s => s.flow_stage === 'after')?.stage_status === 'completed';

    let newSessionStatus = 'scheduled'; // default

    if (afterCompleted) {
      newSessionStatus = 'completed';
    } else if (duringCompleted || completedStage === 'during') {
      newSessionStatus = 'ongoing';
    } else if (beforeCompleted) {
      newSessionStatus = 'scheduled';
    }

    // Update session status
    await client.query(`
      UPDATE tbl_tarl_training_sessions 
      SET session_status = $1, updated_at = NOW()
      WHERE id = $2
    `, [newSessionStatus, sessionId]);

    console.log(`Session ${sessionId} status updated to: ${newSessionStatus}`);
  } catch (error) {
    console.error('Error updating session status:', error);
    // Don't throw error as this is a helper function
  }
}