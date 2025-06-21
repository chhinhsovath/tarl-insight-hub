import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";

const pool = getPool();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const status = searchParams.get('status') || 'all';
  const classId = searchParams.get('classId');
  const schoolId = searchParams.get('schoolId');
  const search = searchParams.get('search') || '';
  
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
      `SELECT id as user_id, username, role FROM tbl_tarl_users 
       WHERE session_token = $1 AND session_expires > NOW()`,
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = sessionResult.rows[0];
    const offset = (page - 1) * limit;

    // Build WHERE clause for existing student data
    let whereConditions = ['1=1'];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (schoolId) {
      whereConditions.push(`s.school_id = $${paramIndex}`);
      queryParams.push(parseInt(schoolId));
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(
        s.student_name ILIKE $${paramIndex} OR 
        s.student_id ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Build additional WHERE conditions for students
    if (whereConditions[0] === '1=1') {
      whereConditions = ['s.student_id IS NOT NULL', 's.student_status = 1'];
    } else {
      whereConditions.push('s.student_id IS NOT NULL', 's.student_status = 1');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count from existing student data - distinct students only
    const countResult = await client.query(`
      SELECT COUNT(DISTINCT s.student_id) as total
      FROM tbl_tarl_tc_st_sch s
      LEFT JOIN tbl_tarl_schools sch ON s.school_id = sch."sclAutoID"
      ${whereClause}
    `, queryParams);

    const total = parseInt(countResult.rows[0].total);

    // Get paginated results from existing student data - distinct students only
    const studentsResult = await client.query(`
      SELECT DISTINCT ON (s.student_id)
        s.id,
        s.student_name,
        s.student_id,
        NULL as class_id,
        s.school_id,
        s.student_sex as sex,
        NULL as date_of_birth,
        NULL as parent_name,
        NULL as parent_phone,
        NULL as address,
        CASE WHEN s.student_status = 1 THEN 'active' ELSE 'inactive' END as status,
        NULL as enrollment_date,
        NOW() as created_at,
        NOW() as updated_at,
        s.province_name as province,
        NULL as district,
        NULL as commune,
        NULL as village,
        NULL as class_name,
        NULL as grade_level,
        s.school_name
      FROM tbl_tarl_tc_st_sch s
      LEFT JOIN tbl_tarl_schools sch ON s.school_id = sch."sclAutoID"
      ${whereClause}
      ORDER BY s.student_id, s.id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, limit, offset]);

    return NextResponse.json({
      success: true,
      data: studentsResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error("Error fetching students:", error);
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
      `SELECT id as user_id, username, role FROM tbl_tarl_users 
       WHERE session_token = $1 AND session_expires > NOW()`,
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = sessionResult.rows[0];

    // Check if user can create students
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

    // Check if student ID already exists
    const existingStudent = await client.query(
      'SELECT id FROM tbl_tarl_students WHERE student_id = $1 AND is_deleted = false',
      [student_id]
    );

    if (existingStudent.rows.length > 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Student ID already exists' }, { status: 409 });
    }

    // Insert new student
    const insertResult = await client.query(`
      INSERT INTO tbl_tarl_students (
        student_name, 
        student_id, 
        class_id, 
        school_id, 
        sex, 
        date_of_birth, 
        parent_name, 
        parent_phone, 
        address,
        province_id,
        district_id,
        commune_id,
        village_id,
        province_name,
        district_name,
        commune_name,
        village_name,
        status, 
        enrollment_date, 
        created_by, 
        created_at, 
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'active', CURRENT_DATE, $18, NOW(), NOW())
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
      user.user_id
    ]);

    const newStudent = insertResult.rows[0];

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      student: newStudent,
      message: 'Student added successfully'
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating student:', error);
    
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