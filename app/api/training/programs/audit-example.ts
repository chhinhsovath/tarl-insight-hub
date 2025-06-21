// Example: Training Programs API with Audit Integration
// This shows how to integrate the audit system with CRUD operations

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/database';
import { getAuditLogger, getClientIP, getUserDataFromSession } from '@/lib/audit-logger';

const pool = getPool();
const auditLogger = getAuditLogger(pool);

// GET /api/training/programs - List programs with soft delete filtering
export async function GET(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    // Get session from cookies or headers
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = getUserDataFromSession(session);
    
    // Query only non-deleted records
    const result = await client.query(`
      SELECT * FROM tbl_tarl_training_programs 
      WHERE is_deleted = false OR is_deleted IS NULL
      ORDER BY created_at DESC
    `);

    // Log read access
    await auditLogger.logActivity({
      userId: userData.userId,
      username: userData.username,
      userRole: userData.userRole,
      actionType: 'READ',
      tableName: 'tbl_tarl_training_programs',
      changesSummary: `Retrieved ${result.rows.length} training programs`,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined
    });

    return NextResponse.json({ 
      success: true, 
      programs: result.rows,
      count: result.rows.length 
    });

  } catch (error) {
    console.error('Error fetching training programs:', error);
    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 });
  } finally {
    client.release();
  }
}

// POST /api/training/programs - Create new program with audit logging
export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = getUserDataFromSession(session);
    const body = await request.json();
    
    // Set session variables for database triggers
    await auditLogger.setSessionVariables(
      userData.userId!,
      userData.username!,
      userData.userRole
    );

    // Insert new program
    const result = await client.query(`
      INSERT INTO tbl_tarl_training_programs (
        program_name, description, program_type, duration_hours, created_by
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      body.program_name,
      body.description,
      body.program_type || 'standard',
      body.duration_hours || 8,
      userData.userId
    ]);

    const newProgram = result.rows[0];

    // Manual audit log for additional context
    await auditLogger.logActivity({
      userId: userData.userId,
      username: userData.username,
      userRole: userData.userRole,
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
      program: newProgram 
    });

  } catch (error) {
    console.error('Error creating training program:', error);
    return NextResponse.json({ error: 'Failed to create program' }, { status: 500 });
  } finally {
    client.release();
  }
}

// PUT /api/training/programs/[id] - Update program with audit logging
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const client = await pool.connect();
  
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = getUserDataFromSession(session);
    const body = await request.json();
    const programId = parseInt(params.id);

    // Get original data for audit trail
    const originalResult = await client.query(`
      SELECT * FROM tbl_tarl_training_programs 
      WHERE id = $1 AND (is_deleted = false OR is_deleted IS NULL)
    `, [programId]);

    if (originalResult.rows.length === 0) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    const originalData = originalResult.rows[0];

    // Set session variables for database triggers
    await auditLogger.setSessionVariables(
      userData.userId!,
      userData.username!,
      userData.userRole
    );

    // Update program
    const result = await client.query(`
      UPDATE tbl_tarl_training_programs 
      SET program_name = $1, description = $2, program_type = $3, 
          duration_hours = $4, updated_at = NOW()
      WHERE id = $5 AND (is_deleted = false OR is_deleted IS NULL)
      RETURNING *
    `, [
      body.program_name || originalData.program_name,
      body.description || originalData.description,
      body.program_type || originalData.program_type,
      body.duration_hours || originalData.duration_hours,
      programId
    ]);

    const updatedProgram = result.rows[0];

    // Manual audit log with old and new data
    await auditLogger.logActivity({
      userId: userData.userId,
      username: userData.username,
      userRole: userData.userRole,
      actionType: 'UPDATE',
      tableName: 'tbl_tarl_training_programs',
      recordId: programId,
      oldData: originalData,
      newData: updatedProgram,
      changesSummary: `Updated training program "${updatedProgram.program_name}"`,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined
    });

    return NextResponse.json({ 
      success: true, 
      program: updatedProgram 
    });

  } catch (error) {
    console.error('Error updating training program:', error);
    return NextResponse.json({ error: 'Failed to update program' }, { status: 500 });
  } finally {
    client.release();
  }
}

// DELETE /api/training/programs/[id] - Soft delete with audit logging
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const client = await pool.connect();
  
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = getUserDataFromSession(session);
    const programId = parseInt(params.id);
    const body = await request.json();
    const deleteReason = body.reason || 'No reason provided';

    // Check if program exists and is not already deleted
    const checkResult = await client.query(`
      SELECT * FROM tbl_tarl_training_programs 
      WHERE id = $1 AND (is_deleted = false OR is_deleted IS NULL)
    `, [programId]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Program not found or already deleted' }, { status: 404 });
    }

    // Use audit logger soft delete function
    const success = await auditLogger.softDelete({
      tableName: 'tbl_tarl_training_programs',
      recordId: programId,
      userId: userData.userId!,
      username: userData.username!,
      deleteReason
    });

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Program soft deleted successfully',
      programId,
      canBeRestored: true
    });

  } catch (error) {
    console.error('Error deleting training program:', error);
    return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 });
  } finally {
    client.release();
  }
}

// PATCH /api/training/programs/[id]/restore - Restore soft-deleted program
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const client = await pool.connect();
  
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = getUserDataFromSession(session);
    const programId = parseInt(params.id);

    // Check if user has admin/restore permissions
    if (userData.userRole !== 'admin' && userData.userRole !== 'director') {
      return NextResponse.json({ error: 'Insufficient permissions to restore records' }, { status: 403 });
    }

    // Use audit logger restore function
    const success = await auditLogger.restoreRecord({
      tableName: 'tbl_tarl_training_programs',
      recordId: programId,
      userId: userData.userId!,
      username: userData.username!
    });

    if (!success) {
      return NextResponse.json({ error: 'Failed to restore program or program not found' }, { status: 404 });
    }

    // Get restored program data
    const restoredResult = await client.query(`
      SELECT * FROM tbl_tarl_training_programs WHERE id = $1
    `, [programId]);

    return NextResponse.json({ 
      success: true, 
      message: 'Program restored successfully',
      program: restoredResult.rows[0]
    });

  } catch (error) {
    console.error('Error restoring training program:', error);
    return NextResponse.json({ error: 'Failed to restore program' }, { status: 500 });
  } finally {
    client.release();
  }
}

// Helper function to get session from request (implement based on your auth system)
function getSessionFromRequest(request: NextRequest) {
  // This should be implemented based on your authentication system
  // For example, extracting from cookies, JWT tokens, etc.
  const sessionToken = request.cookies.get('session-token')?.value;
  if (!sessionToken) return null;
  
  // Validate and decode session token
  // Return session object with user information
  return {
    user: {
      id: 1, // example user ID
      username: 'example_user',
      role: 'admin'
    }
  };
}