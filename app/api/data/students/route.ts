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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');
  const schoolId = searchParams.get('schoolId');
  const userId = searchParams.get('userId');
  
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

    let query = `
      SELECT 
        st.*,
        c.class_name,
        c.class_level,
        c.academic_year,
        s.school_name,
        s.school_code,
        CASE 
          WHEN st.date_of_birth IS NOT NULL 
          THEN DATE_PART('year', AGE(st.date_of_birth))
          ELSE NULL 
        END as age
      FROM tbl_tarl_students st
      LEFT JOIN tbl_tarl_classes c ON st.class_id = c.id
      LEFT JOIN tbl_tarl_schools s ON st.school_id = s.id
      WHERE st.is_active = true
    `;

    const params = [];
    let paramIndex = 1;

    if (classId) {
      query += ` AND st.class_id = $${paramIndex}`;
      params.push(parseInt(classId));
      paramIndex++;
    }

    if (schoolId) {
      query += ` AND st.school_id = $${paramIndex}`;
      params.push(parseInt(schoolId));
      paramIndex++;
    }

    // Apply hierarchy filtering based on user role
    if (user.role !== 'admin') {
      const currentUserId = userId ? parseInt(userId) : user.user_id;
      
      if (user.role === 'teacher') {
        // Teachers can only see students in their classes
        query += ` AND EXISTS (
          SELECT 1 FROM teacher_class_assignments tca 
          WHERE tca.class_id = st.class_id AND tca.teacher_id = $${paramIndex} AND tca.is_active = true
        )`;
        params.push(currentUserId);
        paramIndex++;
      } else if (['director', 'partner', 'coordinator'].includes(user.role)) {
        // Directors/Partners can see students in their assigned schools
        query += ` AND EXISTS (
          SELECT 1 FROM user_school_assignments usa 
          WHERE usa.school_id = st.school_id AND usa.user_id = $${paramIndex} AND usa.is_active = true
        )`;
        params.push(currentUserId);
        paramIndex++;
      }
    }

    query += ` ORDER BY st.last_name, st.first_name`;

    const result = await client.query(query, params);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(request: NextRequest) {
  // Get session token from cookies
  const cookieStore = cookies();
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

    // Check if user can create students
    const allowedRoles = ['admin', 'director', 'partner', 'teacher', 'coordinator'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      student_id, 
      first_name, 
      last_name, 
      date_of_birth, 
      gender, 
      class_id, 
      school_id,
      parent_name,
      parent_phone,
      address
    } = body;

    if (!student_id || !first_name || !last_name || !school_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: student_id, first_name, last_name, school_id' 
      }, { status: 400 });
    }

    // Check if student_id already exists
    const existingStudent = await client.query(
      'SELECT id FROM tbl_tarl_students WHERE student_id = $1',
      [student_id]
    );

    if (existingStudent.rows.length > 0) {
      return NextResponse.json({ 
        error: 'Student ID already exists' 
      }, { status: 400 });
    }

    // Create the student
    const insertResult = await client.query(`
      INSERT INTO tbl_tarl_students (
        student_id, first_name, last_name, date_of_birth, gender, 
        class_id, school_id, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
      RETURNING *
    `, [
      student_id, 
      first_name, 
      last_name, 
      date_of_birth || null, 
      gender || null, 
      class_id || null, 
      school_id
    ]);

    const newStudent = insertResult.rows[0];

    return NextResponse.json({
      success: true,
      student: newStudent,
      message: 'Student created successfully'
    });

  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
} 