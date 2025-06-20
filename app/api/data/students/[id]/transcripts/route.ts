import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";

const pool = getPool();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  
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
    const { id } = await params;
    const studentId = parseInt(id);

    // Check if user has access to this student
    if (user.role !== 'admin') {
      const accessCheck = await client.query(`
        SELECT 1 FROM tbl_tarl_students st
        LEFT JOIN tbl_tarl_classes c ON st.class_id = c.id
        WHERE st.id = $1 AND (
          (st.school_id IN (
            SELECT school_id FROM user_school_assignments 
            WHERE user_id = $2 AND is_active = true
          )) OR
          (c.id IN (
            SELECT class_id FROM teacher_class_assignments 
            WHERE teacher_id = $2 AND is_active = true
          ))
        )
      `, [studentId, user.user_id]);

      if (accessCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Access denied to this student' }, { status: 403 });
      }
    }

    // First check if transcripts table exists, if not create it
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_transcripts (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL,
        month VARCHAR(7) NOT NULL, -- YYYY-MM format
        year VARCHAR(4) NOT NULL,
        reading_level VARCHAR(10),
        math_level VARCHAR(20),
        attendance INTEGER DEFAULT 0,
        behavior_score INTEGER DEFAULT 0,
        notes TEXT,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, month)
      )
    `);

    let query = `
      SELECT 
        t.*,
        st.first_name,
        st.last_name,
        st.student_id as student_code,
        u.first_name as created_by_first_name,
        u.last_name as created_by_last_name
      FROM student_transcripts t
      LEFT JOIN tbl_tarl_students st ON t.student_id = st.id
      LEFT JOIN tbl_tarl_users u ON t.created_by = u.id
      WHERE t.student_id = $1
    `;

    const params = [studentId];
    let paramIndex = 2;

    if (month) {
      query += ` AND t.month = $${paramIndex}`;
      params.push(month);
      paramIndex++;
    }

    if (year) {
      query += ` AND t.year = $${paramIndex}`;
      params.push(year);
      paramIndex++;
    }

    query += ` ORDER BY t.year DESC, t.month DESC`;

    const result = await client.query(query, params);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching student transcripts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const studentId = parseInt(id);

    // Check if user can create transcripts
    const allowedRoles = ['admin', 'director', 'partner', 'teacher', 'coordinator'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if user has access to this student
    if (user.role !== 'admin') {
      const accessCheck = await client.query(`
        SELECT 1 FROM tbl_tarl_students st
        LEFT JOIN tbl_tarl_classes c ON st.class_id = c.id
        WHERE st.id = $1 AND (
          (st.school_id IN (
            SELECT school_id FROM user_school_assignments 
            WHERE user_id = $2 AND is_active = true
          )) OR
          (c.id IN (
            SELECT class_id FROM teacher_class_assignments 
            WHERE teacher_id = $2 AND is_active = true
          ))
        )
      `, [studentId, user.user_id]);

      if (accessCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Access denied to this student' }, { status: 403 });
      }
    }

    const body = await request.json();
    const { 
      month, 
      year, 
      reading_level, 
      math_level, 
      attendance, 
      behavior_score, 
      notes 
    } = body;

    if (!month || !year || !reading_level || !math_level) {
      return NextResponse.json({ 
        error: 'Missing required fields: month, year, reading_level, math_level' 
      }, { status: 400 });
    }

    // Create transcripts table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_transcripts (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL,
        month VARCHAR(7) NOT NULL, -- YYYY-MM format
        year VARCHAR(4) NOT NULL,
        reading_level VARCHAR(10),
        math_level VARCHAR(20),
        attendance INTEGER DEFAULT 0,
        behavior_score INTEGER DEFAULT 0,
        notes TEXT,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, month)
      )
    `);

    // Insert or update transcript
    const insertResult = await client.query(`
      INSERT INTO student_transcripts (
        student_id, month, year, reading_level, math_level, 
        attendance, behavior_score, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (student_id, month) 
      DO UPDATE SET 
        year = EXCLUDED.year,
        reading_level = EXCLUDED.reading_level,
        math_level = EXCLUDED.math_level,
        attendance = EXCLUDED.attendance,
        behavior_score = EXCLUDED.behavior_score,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      studentId, 
      month, 
      year, 
      reading_level, 
      math_level, 
      attendance || 0, 
      behavior_score || 0, 
      notes || '',
      user.user_id
    ]);

    const transcript = insertResult.rows[0];

    return NextResponse.json({
      success: true,
      transcript,
      message: 'Transcript saved successfully'
    });

  } catch (error) {
    console.error('Error saving student transcript:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}