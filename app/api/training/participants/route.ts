import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { cookies } from "next/headers";
import { validateTrainingAccess } from "@/lib/training-permissions";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// GET - Fetch training participants
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  const status = searchParams.get('status');
  
  // Validate training access
  const authResult = await validateTrainingAccess('training-participants', 'view');
  
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const user = authResult.user!;
  const client = await pool.connect();

  try {

    let query = `
      SELECT 
        tp.*,
        ts.session_title,
        ts.session_date,
        ts.session_time,
        ts.location,
        tprog.program_name,
        confirmer.full_name as confirmed_by_name,
        sch."sclName" as school_name
      FROM tbl_tarl_training_participants tp
      LEFT JOIN tbl_tarl_training_sessions ts ON tp.session_id = ts.id
      LEFT JOIN tbl_tarl_training_programs tprog ON ts.program_id = tprog.id
      LEFT JOIN tbl_tarl_users confirmer ON tp.confirmed_by = confirmer.id
      LEFT JOIN tbl_tarl_schools sch ON tp.school_id = sch."sclAutoID"
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (sessionId) {
      query += ` AND tp.session_id = $${paramIndex}`;
      params.push(parseInt(sessionId));
      paramIndex++;
    }

    if (status) {
      query += ` AND tp.registration_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Apply role-based filtering
    if (user.role === 'teacher') {
      query += ` AND ts.trainer_id = $${paramIndex}`;
      params.push(user.user_id);
      paramIndex++;
    }

    query += ` ORDER BY tp.created_at DESC`;

    const result = await client.query(query, params);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching training participants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

// POST - Register new participant (can be used by public forms)
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isPublic = searchParams.get('public') === 'true';

  const client = await pool.connect();

  try {
    let user = null;
    
    // If not public registration, validate session
    if (!isPublic) {
      const authResult = await validateTrainingAccess('training-participants', 'create');
      
      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
      }

      user = authResult.user!;
    }

    const body = await request.json();
    const {
      session_id,
      participant_name,
      participant_email,
      participant_phone,
      participant_role,
      school_name,
      school_id,
      district,
      province,
      registration_data
    } = body;

    if (!session_id || !participant_name || !participant_email) {
      return NextResponse.json({ 
        error: 'Missing required fields: session_id, participant_name, participant_email' 
      }, { status: 400 });
    }

    // Check if session exists and is still accepting registrations
    const sessionCheck = await client.query(`
      SELECT ts.*, tp.program_name
      FROM tbl_tarl_training_sessions ts
      LEFT JOIN tbl_tarl_training_programs tp ON ts.program_id = tp.id
      WHERE ts.id = $1 AND ts.is_active = true
    `, [parseInt(session_id)]);

    if (sessionCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Training session not found' }, { status: 404 });
    }

    const session = sessionCheck.rows[0];

    // Check registration deadline
    if (session.registration_deadline && new Date() > new Date(session.registration_deadline)) {
      return NextResponse.json({ error: 'Registration deadline has passed' }, { status: 400 });
    }

    // Check if session is full
    const participantCount = await client.query(`
      SELECT COUNT(*) as count 
      FROM tbl_tarl_training_participants 
      WHERE session_id = $1 AND registration_status IN ('registered', 'confirmed')
    `, [parseInt(session_id)]);

    if (session.max_participants && parseInt(participantCount.rows[0].count) >= session.max_participants) {
      return NextResponse.json({ error: 'Training session is full' }, { status: 400 });
    }

    // Check for duplicate registration
    const duplicateCheck = await client.query(`
      SELECT id FROM tbl_tarl_training_participants 
      WHERE session_id = $1 AND participant_email = $2
    `, [parseInt(session_id), participant_email]);

    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json({ error: 'Email already registered for this session' }, { status: 409 });
    }

    // Register the participant
    const registrationMethod = isPublic ? 'qr_code' : 'manual';
    const result = await client.query(`
      INSERT INTO tbl_tarl_training_participants (
        session_id, participant_name, participant_email, participant_phone,
        participant_role, school_name, school_id, district, province,
        registration_method, registration_data, registration_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'registered')
      RETURNING id, participant_name, participant_email, registration_status, created_at
    `, [
      parseInt(session_id), participant_name, participant_email, participant_phone || null,
      participant_role || null, school_name || null, school_id || null,
      district || null, province || null, registrationMethod,
      registration_data ? JSON.stringify(registration_data) : null
    ]);

    const newParticipant = result.rows[0];

    return NextResponse.json({
      success: true,
      participant: newParticipant,
      session: {
        title: session.session_title,
        date: session.session_date,
        time: session.session_time,
        location: session.location,
        program: session.program_name
      },
      message: 'Registration successful'
    });

  } catch (error) {
    console.error('Error registering participant:', error);
    
    // Check for duplicate email constraint
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return NextResponse.json({ 
        error: 'This email is already registered for this session' 
      }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

// PUT - Update participant status (confirm attendance, etc.)
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const participantId = searchParams.get('id');
  const isPublic = searchParams.get('public') === 'true';

  if (!participantId) {
    return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });
  }

  let user = null;
  
  // If not public update, validate training access
  if (!isPublic) {
    const authResult = await validateTrainingAccess('training-participants', 'update');
    
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    user = authResult.user!;
  }
  const client = await pool.connect();

  try {

    const body = await request.json();
    const { registration_status, attendance_confirmed } = body;

    let updateFields = [];
    let updateValues = [];
    let paramIndex = 1;

    if (registration_status !== undefined) {
      updateFields.push(`registration_status = $${paramIndex}`);
      updateValues.push(registration_status);
      paramIndex++;
    }

    if (attendance_confirmed !== undefined) {
      updateFields.push(`attendance_confirmed = $${paramIndex}`);
      updateValues.push(attendance_confirmed);
      paramIndex++;
      
      if (attendance_confirmed) {
        updateFields.push(`attendance_time = NOW()`);
        if (user) {
          updateFields.push(`confirmed_by = $${paramIndex}`);
          updateValues.push(user.user_id);
          paramIndex++;
        }
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(parseInt(participantId));

    const updateQuery = `
      UPDATE tbl_tarl_training_participants SET
        ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, participant_name, participant_email, registration_status, attendance_confirmed, attendance_time
    `;

    const updateResult = await client.query(updateQuery, updateValues);

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      participant: updateResult.rows[0],
      message: 'Participant updated successfully'
    });

  } catch (error) {
    console.error('Error updating participant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}