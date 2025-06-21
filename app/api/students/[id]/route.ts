import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";

const pool = getPool();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const studentId = params.id;
  
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
      'SELECT user_id, username, role FROM tbl_tarl_sessions WHERE session_token = $1 AND expires_at > NOW()',
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = sessionResult.rows[0];

    const query = `
      SELECT 
        s.*,
        c.class_name,
        c.grade_level,
        sch."sclName" as school_name
      FROM tbl_tarl_students s
      LEFT JOIN tbl_tarl_classes c ON s.class_id = c.id
      LEFT JOIN tbl_tarl_school_list sch ON s.school_id = sch."sclAutoID"
      WHERE s.id = $1 AND s.is_deleted = false
    `;

    const result = await client.query(query, [studentId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const studentId = params.id;
  
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
      'SELECT user_id, username, role FROM tbl_tarl_sessions WHERE session_token = $1 AND expires_at > NOW()',
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = sessionResult.rows[0];

    // Check if user can update students
    const allowedRoles = ['admin', 'director', 'teacher', 'coordinator'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      student_name, 
      student_id, 
      class_id, 
      sex, 
      date_of_birth, 
      parent_name, 
      parent_phone, 
      address,
      province_id,
      district_id,
      commune_id,
      village_id,
      province,
      district,
      commune,
      village
    } = body;

    if (!student_name || !student_id || !class_id || !sex || !date_of_birth || !parent_name) {
      return NextResponse.json({ 
        error: 'Missing required fields: student_name, student_id, class_id, sex, date_of_birth, parent_name' 
      }, { status: 400 });
    }

    await client.query('BEGIN');

    // Get school_id from class
    const classResult = await client.query(
      'SELECT school_id FROM tbl_tarl_classes WHERE id = $1',
      [class_id]
    );

    if (classResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    const school_id = classResult.rows[0].school_id;

    // Check if student ID already exists (excluding current student)
    const existingStudent = await client.query(
      'SELECT id FROM tbl_tarl_students WHERE student_id = $1 AND id != $2 AND is_deleted = false',
      [student_id, studentId]
    );

    if (existingStudent.rows.length > 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Student ID already exists' }, { status: 409 });
    }

    // Update the student
    const updateResult = await client.query(`
      UPDATE tbl_tarl_students 
      SET 
        student_name = $1,
        student_id = $2,
        class_id = $3,
        school_id = $4,
        sex = $5,
        date_of_birth = $6,
        parent_name = $7,
        parent_phone = $8,
        address = $9,
        province_id = $10,
        district_id = $11,
        commune_id = $12,
        village_id = $13,
        province_name = $14,
        district_name = $15,
        commune_name = $16,
        village_name = $17,
        updated_at = NOW()
      WHERE id = $18 AND is_deleted = false
      RETURNING id, student_name, student_id, status
    `, [
      student_name,
      student_id,
      class_id,
      school_id,
      sex,
      date_of_birth,
      parent_name,
      parent_phone || null,
      address || null,
      province_id || null,
      district_id || null,
      commune_id || null,
      village_id || null,
      province || null,
      district || null,
      commune || null,
      village || null,
      studentId
    ]);

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Student not found or already deleted' }, { status: 404 });
    }

    const updatedStudent = updateResult.rows[0];

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      student: updatedStudent,
      message: 'Student updated successfully'
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error updating student:', error);
    
    // Handle duplicate key violations
    if (error.code === '23505') {
      if (error.constraint?.includes('student_id')) {
        return NextResponse.json(
          { error: 'Student ID already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const studentId = params.id;
  
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
      'SELECT user_id, username, role FROM tbl_tarl_sessions WHERE session_token = $1 AND expires_at > NOW()',
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = sessionResult.rows[0];

    // Check if user can delete students
    const allowedRoles = ['admin', 'director'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await client.query('BEGIN');

    // Check if student has transcripts
    const transcriptCheck = await client.query(
      'SELECT COUNT(*) as transcript_count FROM tbl_tarl_transcripts WHERE student_id = $1 AND is_deleted = false',
      [studentId]
    );

    const transcriptCount = parseInt(transcriptCheck.rows[0].transcript_count);
    
    if (transcriptCount > 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ 
        error: `Cannot delete student with ${transcriptCount} transcript records. Please archive the student instead.` 
      }, { status: 400 });
    }

    // Soft delete the student
    const deleteResult = await client.query(`
      UPDATE tbl_tarl_students 
      SET 
        is_deleted = true,
        deleted_at = NOW(),
        deleted_by = $1,
        updated_at = NOW()
      WHERE id = $2 AND is_deleted = false
      RETURNING id, student_name
    `, [user.user_id, studentId]);

    if (deleteResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Student not found or already deleted' }, { status: 404 });
    }

    const deletedStudent = deleteResult.rows[0];

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: `Student "${deletedStudent.student_name}" deleted successfully`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}