import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { validateTrainingAccess, getActionFromMethod } from "@/lib/training-permissions";

const pool = new Pool({
  user: process.env.PGUSER || 'user',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'tarl_insight_hub',
  password: process.env.PGPASSWORD || '',
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// GET - Fetch training programs
export async function GET(request: NextRequest) {
  // Validate training access
  const authResult = await validateTrainingAccess('training-programs', 'view');
  
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const user = authResult.user!;
  const client = await pool.connect();

  try {

    const query = `
      SELECT 
        tp.*,
        creator.full_name as created_by_name,
        COUNT(DISTINCT ts.id)::int as session_count,
        COUNT(DISTINCT tpt.id)::int as total_participants,
        COUNT(DISTINCT tm.id)::int as materials_count
      FROM tbl_tarl_training_programs tp
      LEFT JOIN tbl_tarl_users creator ON tp.created_by = creator.id
      LEFT JOIN tbl_tarl_training_sessions ts ON tp.id = ts.program_id AND ts.is_active = true
      LEFT JOIN tbl_tarl_training_participants tpt ON ts.id = tpt.session_id
      LEFT JOIN tbl_tarl_training_materials tm ON tp.id = tm.program_id AND tm.is_active = true
      WHERE tp.is_active = true
      GROUP BY tp.id, creator.full_name
      ORDER BY tp.created_at DESC
    `;

    const result = await client.query(query);
    
    // For detailed view, also fetch materials for each program
    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get('include_materials') === 'true';
    
    if (includeDetails && result.rows.length > 0) {
      const programIds = result.rows.map(p => p.id);
      const materialsQuery = `
        SELECT 
          tm.*,
          creator.full_name as created_by_name
        FROM tbl_tarl_training_materials tm
        LEFT JOIN tbl_tarl_users creator ON tm.created_by = creator.id
        WHERE tm.program_id = ANY($1) AND tm.is_active = true
        ORDER BY tm.program_id, tm.sort_order ASC, tm.created_at DESC
      `;
      
      const materialsResult = await client.query(materialsQuery, [programIds]);
      const materialsByProgram = materialsResult.rows.reduce((acc, material) => {
        if (!acc[material.program_id]) acc[material.program_id] = [];
        acc[material.program_id].push(material);
        return acc;
      }, {} as Record<number, any[]>);
      
      // Add materials to each program
      result.rows.forEach(program => {
        program.materials = materialsByProgram[program.id] || [];
      });
    }
    
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
  // Validate training access
  const authResult = await validateTrainingAccess('training-programs', 'create');
  
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 403 });
  }

  const user = authResult.user!;
  const client = await pool.connect();

  try {

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

  } catch (error: any) {
    console.error('Error creating training program:', error);
    
    // Check for duplicate program name
    if (error.code === '23505') {
      return NextResponse.json({ 
        error: 'A training program with this name already exists' 
      }, { status: 409 });
    }

    // Check for table not found
    if (error.code === '42P01') {
      return NextResponse.json({ 
        error: 'Training programs table not found. Please run database setup.' 
      }, { status: 500 });
    }
    
    // Database connection error
    if (error.code === 'ECONNREFUSED' || error.code === '28P01') {
      return NextResponse.json({ 
        error: 'Database connection failed. Please check database configuration.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: `Internal server error: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
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

  // Validate training access
  const authResult = await validateTrainingAccess('training-programs', 'update');
  
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 403 });
  }

  const user = authResult.user!;
  const client = await pool.connect();

  try {

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

  } catch (error: any) {
    console.error('Error updating training program:', error);
    return NextResponse.json({ 
      error: `Internal server error: ${error.message || 'Unknown error'}` 
    }, { status: 500 });
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

  // Validate training access
  const authResult = await validateTrainingAccess('training-programs', 'delete');
  
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 403 });
  }

  const user = authResult.user!;
  const client = await pool.connect();

  try {

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