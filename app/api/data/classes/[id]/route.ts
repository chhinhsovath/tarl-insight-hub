import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";

const pool = getPool();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const classId = params.id;
  
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
        c.*,
        s.school_name,
        s.school_code,
        COUNT(st.id) as student_count,
        t.teacher_name,
        t.teacher_id as teacher_code
      FROM tbl_tarl_classes c
      LEFT JOIN tbl_tarl_school_list s ON c.school_id = s."sclAutoID"
      LEFT JOIN tbl_tarl_students st ON c.id = st.class_id AND st.is_deleted = false
      LEFT JOIN tbl_tarl_teachers t ON c.teacher_id = t.id
      WHERE c.id = $1 AND c.is_deleted = false
      GROUP BY c.id, s.school_name, s.school_code, t.teacher_name, t.teacher_id
    `;

    const result = await client.query(query, [classId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching class:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const classId = params.id;
  
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

    // Check if user can update classes
    const allowedRoles = ['admin', 'director', 'partner', 'teacher', 'coordinator'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { class_name, grade_level, academic_year, teacher_id, school_id, room_number, schedule_info } = body;

    if (!class_name || !grade_level || !academic_year || !school_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: class_name, grade_level, academic_year, school_id' 
      }, { status: 400 });
    }

    await client.query('BEGIN');

    // Update the class
    const updateResult = await client.query(`
      UPDATE tbl_tarl_classes 
      SET 
        class_name = $1,
        grade_level = $2,
        academic_year = $3,
        teacher_id = $4,
        school_id = $5,
        room_number = $6,
        schedule_info = $7,
        updated_at = NOW()
      WHERE id = $8 AND is_deleted = false
      RETURNING id, class_name, grade_level, academic_year
    `, [class_name, grade_level, academic_year, teacher_id || null, school_id, room_number || null, schedule_info || null, classId]);

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Class not found or already deleted' }, { status: 404 });
    }

    const updatedClass = updateResult.rows[0];

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      class: updatedClass,
      message: 'Class updated successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating class:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const classId = params.id;
  
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

    // Check if user can delete classes
    const allowedRoles = ['admin', 'director', 'partner'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await client.query('BEGIN');

    // Check if class has students
    const studentCheck = await client.query(
      'SELECT COUNT(*) as student_count FROM tbl_tarl_students WHERE class_id = $1 AND is_deleted = false',
      [classId]
    );

    const studentCount = parseInt(studentCheck.rows[0].student_count);
    
    if (studentCount > 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ 
        error: `Cannot delete class with ${studentCount} enrolled students. Please transfer students first.` 
      }, { status: 400 });
    }

    // Soft delete the class
    const deleteResult = await client.query(`
      UPDATE tbl_tarl_classes 
      SET 
        is_deleted = true,
        deleted_at = NOW(),
        deleted_by = $1,
        updated_at = NOW()
      WHERE id = $2 AND is_deleted = false
      RETURNING id, class_name
    `, [user.user_id, classId]);

    if (deleteResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Class not found or already deleted' }, { status: 404 });
    }

    const deletedClass = deleteResult.rows[0];

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: `Class "${deletedClass.class_name}" deleted successfully`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting class:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}