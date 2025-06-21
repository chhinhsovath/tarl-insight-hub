import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";

const pool = getPool();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reportType = searchParams.get('type'); // 'student', 'class', 'subject', 'period'
  const studentId = searchParams.get('studentId');
  const classId = searchParams.get('classId');
  const subject = searchParams.get('subject');
  const academicYear = searchParams.get('academicYear');
  const assessmentPeriod = searchParams.get('assessmentPeriod');
  const format = searchParams.get('format') || 'json'; // 'json', 'csv'

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

    let reportData;

    switch (reportType) {
      case 'student':
        reportData = await generateStudentReport(client, user, studentId, academicYear);
        break;
      case 'class':
        reportData = await generateClassReport(client, user, classId, academicYear, assessmentPeriod);
        break;
      case 'subject':
        reportData = await generateSubjectReport(client, user, subject, academicYear, classId);
        break;
      case 'period':
        reportData = await generatePeriodReport(client, user, assessmentPeriod, academicYear, classId);
        break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    if (format === 'csv') {
      const csv = convertToCSV(reportData.data);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${reportType}-report-${Date.now()}.csv"`
        }
      });
    }

    return NextResponse.json(reportData);

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

async function generateStudentReport(client: any, user: any, studentId: string | null, academicYear: string | null) {
  if (!studentId) {
    throw new Error('Student ID is required for student report');
  }

  // Check access permissions
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
    `, [parseInt(studentId), user.user_id]);

    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied to this student');
    }
  }

  // Get student information
  const studentInfo = await client.query(`
    SELECT 
      s.*,
      c.class_name,
      c.academic_year as current_academic_year,
      sch."sclName" as school_name
    FROM tbl_tarl_students s
    LEFT JOIN tbl_tarl_classes c ON s.class_id = c.id
    LEFT JOIN tbl_tarl_school_list sch ON s.school_id = sch."sclAutoID"
    WHERE s.id = $1 AND s.is_deleted = false
  `, [parseInt(studentId)]);

  if (studentInfo.rows.length === 0) {
    throw new Error('Student not found');
  }

  // Get transcript data
  let transcriptQuery = `
    SELECT 
      t.*,
      te.teacher_name,
      gs.letter_grade,
      gs.grade_point,
      gs.description as grade_description
    FROM tbl_tarl_transcripts t
    LEFT JOIN tbl_tarl_teachers te ON t.teacher_id = te.id
    LEFT JOIN tbl_tarl_grade_scales gs ON t.score BETWEEN gs.min_score AND gs.max_score
    WHERE t.student_id = $1 AND t.is_deleted = false
  `;

  const params = [parseInt(studentId)];

  if (academicYear) {
    transcriptQuery += ` AND t.academic_year = $2`;
    params.push(academicYear);
  }

  transcriptQuery += ` ORDER BY t.academic_year, t.assessment_period, t.subject`;

  const transcripts = await client.query(transcriptQuery, params);

  // Calculate statistics
  const stats = await client.query(`
    SELECT 
      COUNT(*) as total_subjects,
      AVG(score) as overall_gpa,
      COUNT(CASE WHEN score >= 70 THEN 1 END) as passing_subjects,
      COUNT(CASE WHEN is_final = true THEN 1 END) as final_grades
    FROM tbl_tarl_transcripts
    WHERE student_id = $1 AND is_deleted = false AND score IS NOT NULL
    ${academicYear ? 'AND academic_year = $2' : ''}
  `, academicYear ? [parseInt(studentId), academicYear] : [parseInt(studentId)]);

  return {
    reportType: 'student',
    student: studentInfo.rows[0],
    transcripts: transcripts.rows,
    statistics: stats.rows[0],
    generatedAt: new Date().toISOString(),
    data: transcripts.rows // For CSV export
  };
}

async function generateClassReport(client: any, user: any, classId: string | null, academicYear: string | null, assessmentPeriod: string | null) {
  if (!classId) {
    throw new Error('Class ID is required for class report');
  }

  // Check access permissions
  if (user.role !== 'admin') {
    const accessCheck = await client.query(`
      SELECT 1 FROM tbl_tarl_classes c
      LEFT JOIN tbl_tarl_school_list s ON c.school_id = s."sclAutoID"
      WHERE c.id = $1 AND (
        c.school_id IN (
          SELECT school_id FROM user_school_assignments 
          WHERE user_id = $2 AND is_active = true
        ) OR
        c.id IN (
          SELECT class_id FROM teacher_class_assignments 
          WHERE teacher_id = $2 AND is_active = true
        )
      )
    `, [parseInt(classId), user.user_id]);

    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied to this class');
    }
  }

  // Get class information
  const classInfo = await client.query(`
    SELECT 
      c.*,
      t.teacher_name,
      sch."sclName" as school_name,
      COUNT(DISTINCT s.id) as student_count
    FROM tbl_tarl_classes c
    LEFT JOIN tbl_tarl_teachers t ON c.teacher_id = t.id
    LEFT JOIN tbl_tarl_school_list sch ON c.school_id = sch."sclAutoID"
    LEFT JOIN tbl_tarl_students s ON c.id = s.class_id AND s.is_deleted = false
    WHERE c.id = $1 AND c.is_deleted = false
    GROUP BY c.id, t.teacher_name, sch."sclName"
  `, [parseInt(classId)]);

  if (classInfo.rows.length === 0) {
    throw new Error('Class not found');
  }

  // Build transcript query
  let transcriptQuery = `
    SELECT 
      t.*,
      s.student_name,
      s.student_id as student_code,
      te.teacher_name,
      gs.letter_grade,
      gs.grade_point
    FROM tbl_tarl_transcripts t
    LEFT JOIN tbl_tarl_students s ON t.student_id = s.id
    LEFT JOIN tbl_tarl_teachers te ON t.teacher_id = te.id
    LEFT JOIN tbl_tarl_grade_scales gs ON t.score BETWEEN gs.min_score AND gs.max_score
    WHERE t.class_id = $1 AND t.is_deleted = false
  `;

  const params = [parseInt(classId)];
  let paramIndex = 2;

  if (academicYear) {
    transcriptQuery += ` AND t.academic_year = $${paramIndex}`;
    params.push(academicYear);
    paramIndex++;
  }

  if (assessmentPeriod) {
    transcriptQuery += ` AND t.assessment_period = $${paramIndex}`;
    params.push(assessmentPeriod);
    paramIndex++;
  }

  transcriptQuery += ` ORDER BY s.student_name, t.subject`;

  const transcripts = await client.query(transcriptQuery, params);

  // Get class statistics
  const stats = await client.query(`
    SELECT 
      COUNT(DISTINCT t.student_id) as total_students,
      COUNT(DISTINCT t.subject) as total_subjects,
      AVG(t.score) as class_average,
      COUNT(CASE WHEN t.score >= 70 THEN 1 END) as passing_grades,
      COUNT(*) as total_entries
    FROM tbl_tarl_transcripts t
    WHERE t.class_id = $1 AND t.is_deleted = false AND t.score IS NOT NULL
    ${academicYear ? 'AND t.academic_year = $2' : ''}
    ${assessmentPeriod ? `AND t.assessment_period = $${academicYear ? '3' : '2'}` : ''}
  `, params.slice(0, paramIndex - 1));

  return {
    reportType: 'class',
    class: classInfo.rows[0],
    transcripts: transcripts.rows,
    statistics: stats.rows[0],
    generatedAt: new Date().toISOString(),
    data: transcripts.rows
  };
}

async function generateSubjectReport(client: any, user: any, subject: string | null, academicYear: string | null, classId: string | null) {
  if (!subject) {
    throw new Error('Subject is required for subject report');
  }

  // Build query with user permissions
  let baseCondition = 't.is_deleted = false AND LOWER(t.subject) = LOWER($1)';
  const params = [subject];
  let paramIndex = 2;

  if (user.role !== 'admin') {
    baseCondition += ` AND (
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

  if (academicYear) {
    baseCondition += ` AND t.academic_year = $${paramIndex}`;
    params.push(academicYear);
    paramIndex++;
  }

  if (classId) {
    baseCondition += ` AND t.class_id = $${paramIndex}`;
    params.push(parseInt(classId));
    paramIndex++;
  }

  const transcripts = await client.query(`
    SELECT 
      t.*,
      s.student_name,
      s.student_id as student_code,
      c.class_name,
      te.teacher_name,
      gs.letter_grade,
      gs.grade_point
    FROM tbl_tarl_transcripts t
    LEFT JOIN tbl_tarl_students s ON t.student_id = s.id
    LEFT JOIN tbl_tarl_classes c ON t.class_id = c.id
    LEFT JOIN tbl_tarl_teachers te ON t.teacher_id = te.id
    LEFT JOIN tbl_tarl_grade_scales gs ON t.score BETWEEN gs.min_score AND gs.max_score
    WHERE ${baseCondition}
    ORDER BY c.class_name, s.student_name
  `, params);

  const stats = await client.query(`
    SELECT 
      COUNT(*) as total_entries,
      COUNT(DISTINCT t.student_id) as total_students,
      COUNT(DISTINCT t.class_id) as total_classes,
      AVG(t.score) as subject_average,
      MIN(t.score) as min_score,
      MAX(t.score) as max_score,
      COUNT(CASE WHEN t.score >= 70 THEN 1 END) as passing_grades
    FROM tbl_tarl_transcripts t
    LEFT JOIN tbl_tarl_students s ON t.student_id = s.id
    WHERE ${baseCondition} AND t.score IS NOT NULL
  `, params);

  return {
    reportType: 'subject',
    subject,
    transcripts: transcripts.rows,
    statistics: stats.rows[0],
    generatedAt: new Date().toISOString(),
    data: transcripts.rows
  };
}

async function generatePeriodReport(client: any, user: any, assessmentPeriod: string | null, academicYear: string | null, classId: string | null) {
  if (!assessmentPeriod) {
    throw new Error('Assessment period is required for period report');
  }

  // Build query with user permissions
  let baseCondition = 't.is_deleted = false AND t.assessment_period = $1';
  const params = [assessmentPeriod];
  let paramIndex = 2;

  if (user.role !== 'admin') {
    baseCondition += ` AND (
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

  if (academicYear) {
    baseCondition += ` AND t.academic_year = $${paramIndex}`;
    params.push(academicYear);
    paramIndex++;
  }

  if (classId) {
    baseCondition += ` AND t.class_id = $${paramIndex}`;
    params.push(parseInt(classId));
    paramIndex++;
  }

  const transcripts = await client.query(`
    SELECT 
      t.*,
      s.student_name,
      s.student_id as student_code,
      c.class_name,
      te.teacher_name,
      gs.letter_grade,
      gs.grade_point
    FROM tbl_tarl_transcripts t
    LEFT JOIN tbl_tarl_students s ON t.student_id = s.id
    LEFT JOIN tbl_tarl_classes c ON t.class_id = c.id
    LEFT JOIN tbl_tarl_teachers te ON t.teacher_id = te.id
    LEFT JOIN tbl_tarl_grade_scales gs ON t.score BETWEEN gs.min_score AND gs.max_score
    WHERE ${baseCondition}
    ORDER BY c.class_name, t.subject, s.student_name
  `, params);

  const stats = await client.query(`
    SELECT 
      COUNT(*) as total_entries,
      COUNT(DISTINCT t.student_id) as total_students,
      COUNT(DISTINCT t.subject) as total_subjects,
      AVG(t.score) as period_average,
      COUNT(CASE WHEN t.score >= 70 THEN 1 END) as passing_grades
    FROM tbl_tarl_transcripts t
    LEFT JOIN tbl_tarl_students s ON t.student_id = s.id
    WHERE ${baseCondition} AND t.score IS NOT NULL
  `, params);

  return {
    reportType: 'period',
    assessmentPeriod,
    academicYear,
    transcripts: transcripts.rows,
    statistics: stats.rows[0],
    generatedAt: new Date().toISOString(),
    data: transcripts.rows
  };
}

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');

  return csvContent;
}