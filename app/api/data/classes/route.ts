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
  const teacherId = searchParams.get('teacherId');
  const schoolId = searchParams.get('schoolId');
  
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

    let query = `
      SELECT 
        c.*,
        s.school_name,
        s.school_code,
        COUNT(st.id) as student_count,
        u.first_name as teacher_first_name,
        u.last_name as teacher_last_name
      FROM tbl_tarl_classes c
      LEFT JOIN tbl_tarl_schools s ON c.school_id = s.id
      LEFT JOIN tbl_tarl_students st ON c.id = st.class_id AND st.is_active = true
      LEFT JOIN tbl_tarl_users u ON c.teacher_id = u.id
      WHERE c.is_active = true
    `;

    const params = [];
    let paramIndex = 1;

    if (teacherId) {
      // Get classes for specific teacher
      query += ` AND EXISTS (
        SELECT 1 FROM teacher_class_assignments tca 
        WHERE tca.class_id = c.id AND tca.teacher_id = $${paramIndex} AND tca.is_active = true
      )`;
      params.push(parseInt(teacherId));
      paramIndex++;
    }

    if (schoolId) {
      query += ` AND c.school_id = $${paramIndex}`;
      params.push(parseInt(schoolId));
      paramIndex++;
    }

    // Apply hierarchy filtering based on user role
    if (user.role !== 'admin') {
      // Add hierarchy filtering logic here
      // For now, teachers can only see their own classes
      if (user.role === 'teacher') {
        query += ` AND EXISTS (
          SELECT 1 FROM teacher_class_assignments tca 
          WHERE tca.class_id = c.id AND tca.teacher_id = $${paramIndex} AND tca.is_active = true
        )`;
        params.push(user.user_id);
      }
    }

    query += `
      GROUP BY c.id, s.school_name, s.school_code, u.first_name, u.last_name
      ORDER BY s.school_name, c.class_level, c.class_name
    `;

    const result = await client.query(query, params);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching classes:', error);
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

    // Check if user can create classes
    const allowedRoles = ['admin', 'director', 'partner', 'teacher', 'coordinator'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { class_name, class_level, school_id, academic_year, teacher_id, subject } = body;

    if (!class_name || !class_level || !school_id || !academic_year) {
      return NextResponse.json({ 
        error: 'Missing required fields: class_name, class_level, school_id, academic_year' 
      }, { status: 400 });
    }

    await client.query('BEGIN');

    // Create the class
    const insertResult = await client.query(`
      INSERT INTO tbl_tarl_classes (
        class_name, class_level, school_id, teacher_id, academic_year, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
      RETURNING id, class_name, class_level, school_id, academic_year
    `, [class_name, class_level, school_id, teacher_id || null, academic_year]);

    const newClass = insertResult.rows[0];

    // If teacher_id is provided, create teacher-class assignment
    if (teacher_id) {
      await client.query(`
        INSERT INTO teacher_class_assignments (teacher_id, class_id, subject, assigned_by, is_active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (teacher_id, class_id, subject) DO UPDATE SET is_active = true
      `, [teacher_id, newClass.id, subject || 'General', user.user_id]);
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      class: newClass,
      message: 'Class created successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating class:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}