import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";

const pool = getPool();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const classId = searchParams.get('classId');
  const academicYear = searchParams.get('academicYear');
  const subject = searchParams.get('subject');
  const assessmentPeriod = searchParams.get('assessmentPeriod');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

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
      'SELECT id as user_id, username, role FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()',
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = sessionResult.rows[0];

    // Build query based on user role and permissions
    let query = `
      SELECT 
        t.*,
        s.student_name,
        s.student_id as student_code,
        c.class_name,
        c.academic_year as class_academic_year,
        sch."sclName" as school_name,
        sch."sclCode" as school_code,
        te.teacher_name,
        u.full_name as created_by_name,
        gs.letter_grade,
        gs.grade_point,
        gs.description as grade_description
      FROM tbl_tarl_transcripts t
      LEFT JOIN tbl_tarl_students s ON t.student_id = s.id
      LEFT JOIN tbl_tarl_classes c ON t.class_id = c.id
      LEFT JOIN tbl_tarl_school_list sch ON s.school_id = sch."sclAutoID"
      LEFT JOIN tbl_tarl_teachers te ON t.teacher_id = te.id
      LEFT JOIN tbl_tarl_users u ON t.created_by = u.id
      LEFT JOIN tbl_tarl_grade_scales gs ON t.score BETWEEN gs.min_score AND gs.max_score
      WHERE t.is_deleted = false
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // Apply filters based on user role
    if (user.role !== 'admin') {
      // For non-admin users, apply hierarchy-based filtering
      query += ` AND (
        s.school_id IN (
          SELECT school_id FROM user_school_assignments 
          WHERE user_id = $${paramIndex} AND is_active = true
        ) OR
        t.class_id IN (
          SELECT class_id FROM teacher_class_assignments 
          WHERE teacher_id = $${paramIndex} AND is_active = true
        )
      )`;
      params.push(user.user_id);
      paramIndex++;
    }

    // Apply search filters
    if (studentId) {
      query += ` AND t.student_id = $${paramIndex}`;
      params.push(parseInt(studentId));
      paramIndex++;
    }

    if (classId) {
      query += ` AND t.class_id = $${paramIndex}`;
      params.push(parseInt(classId));
      paramIndex++;
    }

    if (academicYear) {
      query += ` AND t.academic_year = $${paramIndex}`;
      params.push(academicYear);
      paramIndex++;
    }

    if (subject) {
      query += ` AND LOWER(t.subject) LIKE LOWER($${paramIndex})`;
      params.push(`%${subject}%`);
      paramIndex++;
    }

    if (assessmentPeriod) {
      query += ` AND t.assessment_period = $${paramIndex}`;
      params.push(assessmentPeriod);
      paramIndex++;
    }

    // Add ordering and pagination
    query += ` ORDER BY t.academic_year DESC, t.assessment_period, t.subject, s.student_name`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await client.query(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM tbl_tarl_transcripts t
      LEFT JOIN tbl_tarl_students s ON t.student_id = s.id
      WHERE t.is_deleted = false
    `;

    let countParams: any[] = [];
    let countParamIndex = 1;

    // Apply same filters for count
    if (user.role !== 'admin') {
      countQuery += ` AND (
        s.school_id IN (
          SELECT school_id FROM user_school_assignments 
          WHERE user_id = $${countParamIndex} AND is_active = true
        ) OR
        t.class_id IN (
          SELECT class_id FROM teacher_class_assignments 
          WHERE teacher_id = $${countParamIndex} AND is_active = true
        )
      )`;
      countParams.push(user.user_id);
      countParamIndex++;
    }

    if (studentId) {
      countQuery += ` AND t.student_id = $${countParamIndex}`;
      countParams.push(parseInt(studentId));
      countParamIndex++;
    }

    if (classId) {
      countQuery += ` AND t.class_id = $${countParamIndex}`;
      countParams.push(parseInt(classId));
      countParamIndex++;
    }

    if (academicYear) {
      countQuery += ` AND t.academic_year = $${countParamIndex}`;
      countParams.push(academicYear);
      countParamIndex++;
    }

    if (subject) {
      countQuery += ` AND LOWER(t.subject) LIKE LOWER($${countParamIndex})`;
      countParams.push(`%${subject}%`);
      countParamIndex++;
    }

    if (assessmentPeriod) {
      countQuery += ` AND t.assessment_period = $${countParamIndex}`;
      countParams.push(assessmentPeriod);
      countParamIndex++;
    }

    const countResult = await client.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.total || 0);

    return NextResponse.json({
      transcripts: result.rows,
      pagination: {
        total,
        limit,
        offset,
        totalPages: Math.ceil(total / limit),
        currentPage: Math.floor(offset / limit) + 1
      }
    });

  } catch (error) {
    console.error('Error fetching transcripts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      'SELECT id as user_id, username, role FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()',
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = sessionResult.rows[0];

    // Check if user can create transcripts
    const allowedRoles = ['admin', 'director', 'teacher', 'coordinator'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      student_id,
      class_id,
      academic_year,
      subject,
      assessment_period,
      assessment_month,
      score,
      grade,
      remarks,
      teacher_id,
      is_final = false
    } = body;

    // Validate required fields
    if (!student_id || !academic_year || !subject || !assessment_period) {
      return NextResponse.json({
        error: 'Missing required fields: student_id, academic_year, subject, assessment_period'
      }, { status: 400 });
    }

    // Check if user has access to the student/class
    if (user.role !== 'admin') {
      const accessCheck = await client.query(`
        SELECT 1 FROM tbl_tarl_students s
        LEFT JOIN tbl_tarl_classes c ON s.class_id = c.id
        WHERE s.id = $1 AND (
          s.school_id IN (
            SELECT school_id FROM user_school_assignments 
            WHERE user_id = $2 AND is_active = true
          ) OR
          c.id IN (
            SELECT class_id FROM teacher_class_assignments 
            WHERE teacher_id = $2 AND is_active = true
          )
        )
      `, [student_id, user.user_id]);

      if (accessCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Access denied to this student' }, { status: 403 });
      }
    }

    // Calculate grade from score if not provided
    let calculatedGrade = grade;
    if (score && !grade) {
      const gradeResult = await client.query(
        'SELECT letter_grade FROM tbl_tarl_grade_scales WHERE $1 BETWEEN min_score AND max_score LIMIT 1',
        [score]
      );
      if (gradeResult.rows.length > 0) {
        calculatedGrade = gradeResult.rows[0].letter_grade;
      }
    }

    // Insert or update transcript
    const insertResult = await client.query(`
      INSERT INTO tbl_tarl_transcripts (
        student_id, class_id, academic_year, subject, assessment_period, 
        assessment_month, score, grade, remarks, teacher_id, is_final, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (student_id, subject, academic_year, assessment_period, assessment_month) 
      DO UPDATE SET 
        class_id = EXCLUDED.class_id,
        score = EXCLUDED.score,
        grade = EXCLUDED.grade,
        remarks = EXCLUDED.remarks,
        teacher_id = EXCLUDED.teacher_id,
        is_final = EXCLUDED.is_final,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      student_id,
      class_id,
      academic_year,
      subject,
      assessment_period,
      assessment_month,
      score,
      calculatedGrade,
      remarks,
      teacher_id,
      is_final,
      user.user_id
    ]);

    const transcript = insertResult.rows[0];

    return NextResponse.json({
      success: true,
      transcript,
      message: 'Transcript saved successfully'
    });

  } catch (error) {
    console.error('Error creating transcript:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}