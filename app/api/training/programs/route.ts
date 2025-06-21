import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { validateTrainingAccess, getActionFromMethod } from "@/lib/training-permissions";
import { getAuditLogger, getClientIP, getUserDataFromSession } from "@/lib/audit-logger";

const pool = getPool();
const auditLogger = getAuditLogger(pool);

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
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('id');
    const includeDetails = searchParams.get('include_materials') === 'true';

    // If requesting a specific program by ID
    if (programId) {
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
        WHERE tp.id = $1 AND (tp.is_deleted = false OR tp.is_deleted IS NULL)
        GROUP BY tp.id, creator.full_name
      `;

      const result = await client.query(query, [parseInt(programId)]);
      
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Program not found' }, { status: 404 });
      }

      const program = result.rows[0];

      // Add materials if requested
      if (includeDetails) {
        const materialsQuery = `
          SELECT 
            tm.*,
            creator.full_name as created_by_name
          FROM tbl_tarl_training_materials tm
          LEFT JOIN tbl_tarl_users creator ON tm.created_by = creator.id
          WHERE tm.program_id = $1 AND tm.is_active = true
          ORDER BY tm.sort_order ASC, tm.created_at DESC
        `;
        
        const materialsResult = await client.query(materialsQuery, [parseInt(programId)]);
        program.materials = materialsResult.rows;
      }

      return NextResponse.json(program);
    }

    // Fetch all programs
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
      WHERE (tp.is_deleted = false OR tp.is_deleted IS NULL)
      GROUP BY tp.id, creator.full_name
      ORDER BY tp.created_at DESC
    `;

    const result = await client.query(query);
    
    // Log read access
    await auditLogger.logActivity({
      userId: user.user_id,
      username: user.username,
      userRole: user.role,
      actionType: 'READ',
      tableName: 'tbl_tarl_training_programs',
      changesSummary: `Retrieved ${result.rows.length} training programs`,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined
    });
    
    // For detailed view, also fetch materials for each program
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

    // Set session variables for database triggers
    await auditLogger.setSessionVariables(
      user.user_id,
      user.username,
      user.role
    );

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

    // Log creation activity
    await auditLogger.logActivity({
      userId: user.user_id,
      username: user.username,
      userRole: user.role,
      actionType: 'CREATE',
      tableName: 'tbl_tarl_training_programs',
      recordId: newProgram.id,
      newData: newProgram,
      changesSummary: `Created training program "${newProgram.program_name}"`,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined
    });

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

    // Get original data for audit trail
    const originalResult = await client.query(`
      SELECT * FROM tbl_tarl_training_programs 
      WHERE id = $1 AND (is_deleted = false OR is_deleted IS NULL)
    `, [parseInt(programId)]);

    if (originalResult.rows.length === 0) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    const originalData = originalResult.rows[0];

    // Set session variables for database triggers
    await auditLogger.setSessionVariables(
      user.user_id,
      user.username,
      user.role
    );

    const updateResult = await client.query(`
      UPDATE tbl_tarl_training_programs SET
        program_name = COALESCE($1, program_name),
        description = COALESCE($2, description),
        program_type = COALESCE($3, program_type),
        duration_hours = COALESCE($4, duration_hours),
        updated_at = NOW()
      WHERE id = $5 AND (is_deleted = false OR is_deleted IS NULL)
      RETURNING id, program_name, description, program_type, duration_hours, updated_at
    `, [
      program_name, description, program_type, duration_hours, parseInt(programId)
    ]);

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Training program not found' }, { status: 404 });
    }

    const updatedProgram = updateResult.rows[0];

    // Log update activity with old and new data
    await auditLogger.logActivity({
      userId: user.user_id,
      username: user.username,
      userRole: user.role,
      actionType: 'UPDATE',
      tableName: 'tbl_tarl_training_programs',
      recordId: parseInt(programId),
      oldData: originalData,
      newData: updatedProgram,
      changesSummary: `Updated training program "${updatedProgram.program_name}"`,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined
    });

    return NextResponse.json({
      success: true,
      program: updatedProgram,
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
    // Get program details and delete reason from request body
    const body = await request.json().catch(() => ({}));
    const deleteReason = body.reason || 'No reason provided';

    // Check if program exists and is not already deleted
    const programCheck = await client.query(`
      SELECT * FROM tbl_tarl_training_programs 
      WHERE id = $1 AND (is_deleted = false OR is_deleted IS NULL)
    `, [parseInt(programId)]);

    if (programCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Program not found or already deleted' }, { status: 404 });
    }

    const program = programCheck.rows[0];

    // Check if program has active sessions
    const sessionCheck = await client.query(`
      SELECT COUNT(*) as session_count 
      FROM tbl_tarl_training_sessions 
      WHERE program_id = $1 AND (is_deleted = false OR is_deleted IS NULL) AND session_status IN ('scheduled', 'ongoing')
    `, [parseInt(programId)]);

    if (parseInt(sessionCheck.rows[0].session_count) > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete program with active or scheduled sessions' 
      }, { status: 409 });
    }

    // Use audit logger soft delete function
    const success = await auditLogger.softDelete({
      tableName: 'tbl_tarl_training_programs',
      recordId: parseInt(programId),
      userId: user.user_id,
      username: user.username,
      deleteReason
    });

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Training program "${program.program_name}" soft deleted successfully`,
      programId: parseInt(programId),
      canBeRestored: true
    });

  } catch (error) {
    console.error('Error deleting training program:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}