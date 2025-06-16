import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { cookies } from "next/headers";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// GET - Fetch training programs
export async function GET(request: NextRequest) {
  // Get session token from cookies
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session-token')?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = await pool.connect();

  try {
    // Validate session and get user info
    const sessionResult = await client.query(
      'SELECT user_id, username, role FROM user_sessions WHERE session_token = $1 AND expires_at > NOW()',
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = sessionResult.rows[0];

    // Check if user can view training programs
    const allowedRoles = ['admin', 'director', 'partner', 'coordinator', 'teacher'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const query = `
      SELECT 
        tp.*,
        creator.full_name as created_by_name,
        COUNT(DISTINCT ts.id) as session_count,
        COUNT(DISTINCT tpt.id) as total_participants
      FROM tbl_tarl_training_programs tp
      LEFT JOIN tbl_tarl_users creator ON tp.created_by = creator.id
      LEFT JOIN tbl_tarl_training_sessions ts ON tp.id = ts.program_id AND ts.is_active = true
      LEFT JOIN tbl_tarl_training_participants tpt ON ts.id = tpt.session_id
      WHERE tp.is_active = true
      GROUP BY tp.id, creator.full_name
      ORDER BY tp.created_at DESC
    `;

    const result = await client.query(query);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching training programs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

// POST - Create new training program
export async function POST(request: NextRequest) {
  // Get session token from cookies
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session-token')?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = await pool.connect();

  try {
    // Validate session and get user info
    const sessionResult = await client.query(
      'SELECT user_id, username, role FROM user_sessions WHERE session_token = $1 AND expires_at > NOW()',
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = sessionResult.rows[0];

    // Check if user can create training programs
    const allowedRoles = ['admin', 'director', 'partner'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to create training programs' }, { status: 403 });
    }

    const body = await request.json();
    const { program_name, description, program_type, duration_hours } = body;

    if (!program_name) {
      return NextResponse.json({ 
        error: 'Missing required field: program_name' 
      }, { status: 400 });
    }

    // Create the training program
    const result = await client.query(`
      INSERT INTO tbl_tarl_training_programs (
        program_name, description, program_type, duration_hours, created_by, is_active
      ) VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id, program_name, description, program_type, duration_hours, created_at
    `, [
      program_name, 
      description || null, 
      program_type || 'standard', 
      duration_hours || 8, 
      user.user_id
    ]);

    const newProgram = result.rows[0];

    return NextResponse.json({
      success: true,
      program: newProgram,
      message: 'Training program created successfully'
    });

  } catch (error) {
    console.error('Error creating training program:', error);
    
    // Check for duplicate program name
    if (error.code === '23505') {
      return NextResponse.json({ 
        error: 'A training program with this name already exists' 
      }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

// PUT - Update training program
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const programId = searchParams.get('id');

  if (!programId) {
    return NextResponse.json({ error: 'Program ID is required' }, { status: 400 });
  }

  // Get session token from cookies
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session-token')?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = await pool.connect();

  try {
    // Validate session and get user info
    const sessionResult = await client.query(
      'SELECT user_id, username, role FROM user_sessions WHERE session_token = $1 AND expires_at > NOW()',
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = sessionResult.rows[0];

    // Check if user can update training programs
    const allowedRoles = ['admin', 'director', 'partner'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions to update training programs' }, { status: 403 });
    }

    const body = await request.json();
    const { program_name, description, program_type, duration_hours } = body;

    const updateResult = await client.query(`
      UPDATE tbl_tarl_training_programs SET
        program_name = COALESCE($1, program_name),
        description = COALESCE($2, description),
        program_type = COALESCE($3, program_type),
        duration_hours = COALESCE($4, duration_hours),
        updated_at = NOW()
      WHERE id = $5 AND is_active = true
      RETURNING id, program_name, description, program_type, duration_hours, updated_at
    `, [
      program_name, description, program_type, duration_hours, parseInt(programId)
    ]);

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Training program not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      program: updateResult.rows[0],
      message: 'Training program updated successfully'
    });

  } catch (error) {
    console.error('Error updating training program:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

// DELETE - Soft delete training program
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const programId = searchParams.get('id');

  if (!programId) {
    return NextResponse.json({ error: 'Program ID is required' }, { status: 400 });
  }

  // Get session token from cookies
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session-token')?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = await pool.connect();

  try {
    // Validate session and get user info
    const sessionResult = await client.query(
      'SELECT user_id, username, role FROM user_sessions WHERE session_token = $1 AND expires_at > NOW()',
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = sessionResult.rows[0];

    // Check if user can delete training programs (admin only)
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete training programs' }, { status: 403 });
    }

    // Check if program has active sessions
    const sessionCheck = await client.query(`
      SELECT COUNT(*) as session_count 
      FROM tbl_tarl_training_sessions 
      WHERE program_id = $1 AND is_active = true AND session_status IN ('scheduled', 'ongoing')
    `, [parseInt(programId)]);

    if (parseInt(sessionCheck.rows[0].session_count) > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete program with active or scheduled sessions' 
      }, { status: 409 });
    }

    // Soft delete the program
    const deleteResult = await client.query(`
      UPDATE tbl_tarl_training_programs 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1 AND is_active = true
      RETURNING id, program_name
    `, [parseInt(programId)]);

    if (deleteResult.rows.length === 0) {
      return NextResponse.json({ error: 'Training program not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Training program "${deleteResult.rows[0].program_name}" deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting training program:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}