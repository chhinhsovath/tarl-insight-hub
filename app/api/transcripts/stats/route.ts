import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";

const pool = getPool();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const academicYear = searchParams.get('academicYear');
  const classId = searchParams.get('classId');
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
      'SELECT id as user_id, username, role FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()',
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = sessionResult.rows[0];

    // Build base query with permissions
    let baseConditions = 't.is_deleted = false';
    const params: any[] = [];
    let paramIndex = 1;

    // Apply user permissions
    if (user.role !== 'admin') {
      baseConditions += ` AND (
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

    // Apply filters
    if (academicYear) {
      baseConditions += ` AND t.academic_year = $${paramIndex}`;
      params.push(academicYear);
      paramIndex++;
    }

    if (classId) {
      baseConditions += ` AND t.class_id = $${paramIndex}`;
      params.push(parseInt(classId));
      paramIndex++;
    }

    if (schoolId) {
      baseConditions += ` AND s.school_id = $${paramIndex}`;
      params.push(parseInt(schoolId));
      paramIndex++;
    }

    // Get overall statistics
    const overallStatsQuery = `
      SELECT 
        COUNT(*) as total_entries,
        COUNT(DISTINCT t.student_id) as total_students,
        COUNT(DISTINCT t.subject) as total_subjects,
        AVG(t.score) as average_score,
        COUNT(CASE WHEN t.is_final = true THEN 1 END) as final_entries
      FROM tbl_tarl_transcripts t
      LEFT JOIN tbl_tarl_students s ON t.student_id = s.id
      WHERE ${baseConditions}
    `;

    const overallStats = await client.query(overallStatsQuery, params);

    // Get grade distribution
    const gradeDistributionQuery = `
      SELECT 
        gs.letter_grade,
        gs.description,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentage
      FROM tbl_tarl_transcripts t
      LEFT JOIN tbl_tarl_students s ON t.student_id = s.id
      LEFT JOIN tbl_tarl_grade_scales gs ON t.score BETWEEN gs.min_score AND gs.max_score
      WHERE ${baseConditions} AND t.score IS NOT NULL
      GROUP BY gs.letter_grade, gs.description, gs.min_score
      ORDER BY gs.min_score DESC
    `;

    const gradeDistribution = await client.query(gradeDistributionQuery, params);

    // Get subject performance
    const subjectPerformanceQuery = `
      SELECT 
        t.subject,
        COUNT(*) as total_entries,
        AVG(t.score) as average_score,
        MIN(t.score) as min_score,
        MAX(t.score) as max_score,
        COUNT(CASE WHEN t.score >= 70 THEN 1 END) as passing_count
      FROM tbl_tarl_transcripts t
      LEFT JOIN tbl_tarl_students s ON t.student_id = s.id
      WHERE ${baseConditions} AND t.score IS NOT NULL
      GROUP BY t.subject
      ORDER BY average_score DESC
    `;

    const subjectPerformance = await client.query(subjectPerformanceQuery, params);

    // Get assessment period breakdown
    const assessmentPeriodQuery = `
      SELECT 
        t.assessment_period,
        COUNT(*) as total_entries,
        AVG(t.score) as average_score,
        COUNT(DISTINCT t.student_id) as student_count
      FROM tbl_tarl_transcripts t
      LEFT JOIN tbl_tarl_students s ON t.student_id = s.id
      WHERE ${baseConditions}
      GROUP BY t.assessment_period
      ORDER BY 
        CASE t.assessment_period
          WHEN 'monthly' THEN 1
          WHEN 'quarterly' THEN 2
          WHEN 'semester' THEN 3
          WHEN 'final' THEN 4
          ELSE 5
        END
    `;

    const assessmentPeriods = await client.query(assessmentPeriodQuery, params);

    // Get top performing students
    const topStudentsQuery = `
      SELECT 
        s.student_name,
        s.student_id as student_code,
        c.class_name,
        AVG(t.score) as average_score,
        COUNT(*) as subject_count
      FROM tbl_tarl_transcripts t
      LEFT JOIN tbl_tarl_students s ON t.student_id = s.id
      LEFT JOIN tbl_tarl_classes c ON t.class_id = c.id
      WHERE ${baseConditions} AND t.score IS NOT NULL
      GROUP BY s.id, s.student_name, s.student_id, c.class_name
      HAVING COUNT(*) >= 3
      ORDER BY average_score DESC
      LIMIT 10
    `;

    const topStudents = await client.query(topStudentsQuery, params);

    return NextResponse.json({
      overallStats: overallStats.rows[0],
      gradeDistribution: gradeDistribution.rows,
      subjectPerformance: subjectPerformance.rows,
      assessmentPeriods: assessmentPeriods.rows,
      topStudents: topStudents.rows
    });

  } catch (error) {
    console.error('Error fetching transcript statistics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}