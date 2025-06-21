import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPool } from "@/lib/database-config";
import { getAuditLogger } from "@/lib/audit-logger";

const pool = getPool();

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const remote = request.headers.get('x-vercel-forwarded-for');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (real) {
    return real.trim();
  }
  if (remote) {
    return remote.split(',')[0].trim();
  }
  return 'unknown';
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const client = await pool.connect();
  
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user info
    const sessionResult = await client.query(
      "SELECT id, full_name, role, school_id FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];

    // Check permissions
    if (!['admin', 'director', 'teacher'].includes(currentUser.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const teacherId = parseInt(params.id);
    if (isNaN(teacherId)) {
      return NextResponse.json({ error: "Invalid teacher ID" }, { status: 400 });
    }

    // Build query with role-based filtering
    let whereClause = 't.id = $1 AND t.is_deleted = false';
    let queryParams = [teacherId];

    // Directors can only see teachers from their school
    if (currentUser.role === 'director' && currentUser.school_id) {
      whereClause += ' AND t.school_id = $2';
      queryParams.push(currentUser.school_id);
    }

    const teacherResult = await client.query(`
      SELECT 
        t.id,
        t.teacher_name,
        t.teacher_id,
        t.school_id,
        t.school_code,
        t.sex,
        t.age,
        t.phone,
        t.email,
        t.subject_specialization,
        t.years_experience,
        t.registration_status,
        t.user_id,
        t.created_by,
        t.created_at,
        t.updated_at,
        s."sclName" as school_name,
        s."sclCode" as school_code_full,
        u.username as user_username,
        cb.full_name as created_by_name
      FROM tbl_tarl_teachers t
      LEFT JOIN tbl_tarl_school_list s ON t.school_id = s."sclAutoID"
      LEFT JOIN tbl_tarl_users u ON t.user_id = u.id
      LEFT JOIN tbl_tarl_users cb ON t.created_by = cb.id
      WHERE ${whereClause}
    `, queryParams);

    if (teacherResult.rows.length === 0) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: teacherResult.rows[0]
    });

  } catch (error: any) {
    console.error("Error fetching teacher:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const client = await pool.connect();
  
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user info
    const sessionResult = await client.query(
      "SELECT id, full_name, role, school_id FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];

    // Check permissions
    if (!['admin', 'director'].includes(currentUser.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const teacherId = parseInt(params.id);
    if (isNaN(teacherId)) {
      return NextResponse.json({ error: "Invalid teacher ID" }, { status: 400 });
    }

    // Get current teacher data
    let whereClause = 'id = $1 AND is_deleted = false';
    let queryParams = [teacherId];

    // Directors can only update teachers from their school
    if (currentUser.role === 'director' && currentUser.school_id) {
      whereClause += ' AND school_id = $2';
      queryParams.push(currentUser.school_id);
    }

    const currentTeacherResult = await client.query(
      `SELECT * FROM tbl_tarl_teachers WHERE ${whereClause}`,
      queryParams
    );

    if (currentTeacherResult.rows.length === 0) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const currentTeacher = currentTeacherResult.rows[0];

    const body = await request.json();
    const {
      teacher_name,
      teacher_id,
      sex,
      age,
      phone,
      email,
      subject_specialization,
      years_experience
    } = body;

    // Validate required fields
    const requiredFields = {
      teacher_name: "Teacher name",
      teacher_id: "Teacher ID",
      sex: "Gender",
      phone: "Phone number"
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${label} is required` },
          { status: 400 }
        );
      }
    }

    // Validate email format if provided
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if teacher ID already exists (excluding current teacher)
    const existingTeacher = await client.query(
      'SELECT id FROM tbl_tarl_teachers WHERE teacher_id = $1 AND id != $2 AND is_deleted = false',
      [teacher_id, teacherId]
    );

    if (existingTeacher.rows.length > 0) {
      return NextResponse.json(
        { error: "Teacher ID already exists" },
        { status: 409 }
      );
    }

    // Check if email already exists (excluding current teacher, if provided)
    if (email) {
      const existingEmail = await client.query(
        'SELECT id FROM tbl_tarl_teachers WHERE email = $1 AND id != $2 AND is_deleted = false',
        [email, teacherId]
      );

      if (existingEmail.rows.length > 0) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 }
        );
      }
    }

    await client.query('BEGIN');

    // Update teacher
    const updateResult = await client.query(`
      UPDATE tbl_tarl_teachers SET
        teacher_name = $1,
        teacher_id = $2,
        sex = $3,
        age = $4,
        phone = $5,
        email = $6,
        subject_specialization = $7,
        years_experience = $8,
        updated_at = NOW()
      WHERE id = $9
      RETURNING id, teacher_name, teacher_id, registration_status
    `, [
      teacher_name,
      teacher_id,
      sex,
      age ? parseInt(age) : null,
      phone,
      email || null,
      subject_specialization || null,
      years_experience ? parseInt(years_experience) : null,
      teacherId
    ]);

    const updatedTeacher = updateResult.rows[0];

    // Log the activity
    const auditLogger = getAuditLogger(pool);
    await auditLogger.logActivity({
      userId: currentUser.id,
      username: currentUser.full_name,
      userRole: currentUser.role,
      actionType: 'UPDATE',
      tableName: 'tbl_tarl_teachers',
      recordId: teacherId,
      oldData: currentTeacher,
      newData: updatedTeacher,
      changesSummary: `Teacher "${teacher_name}" (${teacher_id}) updated by ${currentUser.full_name}`,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined
    });

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: "Teacher updated successfully",
      data: updatedTeacher
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Teacher update error:", error);
    
    // Handle duplicate key violations
    if (error.code === '23505') {
      if (error.constraint?.includes('teacher_id')) {
        return NextResponse.json(
          { error: "Teacher ID already exists" },
          { status: 409 }
        );
      }
      if (error.constraint?.includes('email')) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const client = await pool.connect();
  
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user info
    const sessionResult = await client.query(
      "SELECT id, full_name, role, school_id FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];

    // Check permissions
    if (!['admin', 'director'].includes(currentUser.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const teacherId = parseInt(params.id);
    if (isNaN(teacherId)) {
      return NextResponse.json({ error: "Invalid teacher ID" }, { status: 400 });
    }

    // Get current teacher data
    let whereClause = 'id = $1 AND is_deleted = false';
    let queryParams = [teacherId];

    // Directors can only delete teachers from their school
    if (currentUser.role === 'director' && currentUser.school_id) {
      whereClause += ' AND school_id = $2';
      queryParams.push(currentUser.school_id);
    }

    const teacherResult = await client.query(
      `SELECT * FROM tbl_tarl_teachers WHERE ${whereClause}`,
      queryParams
    );

    if (teacherResult.rows.length === 0) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const teacher = teacherResult.rows[0];

    // Check if teacher has classes assigned
    const classesResult = await client.query(
      'SELECT COUNT(*) as count FROM tbl_tarl_classes WHERE teacher_id = $1 AND is_deleted = false',
      [teacherId]
    );

    const hasClasses = parseInt(classesResult.rows[0].count) > 0;

    await client.query('BEGIN');

    // Use soft delete
    const auditLogger = getAuditLogger(pool);
    const success = await auditLogger.softDelete({
      tableName: 'tbl_tarl_teachers',
      recordId: teacherId,
      userId: currentUser.id,
      username: currentUser.full_name,
      deleteReason: hasClasses 
        ? `Teacher deleted but has ${classesResult.rows[0].count} classes assigned`
        : 'Teacher deleted by director',
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined
    });

    if (!success) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: "Failed to delete teacher" },
        { status: 500 }
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: hasClasses 
        ? "Teacher soft deleted (has active classes)"
        : "Teacher deleted successfully",
      hasClasses
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Teacher deletion error:", error);
    
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}