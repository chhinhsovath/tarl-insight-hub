import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";

const pool = getPool();

export async function GET(request: NextRequest) {
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

    // Get dashboard statistics based on user role
    let statsQuery = '';
    let params: any[] = [];

    if (user.role === 'admin') {
      // Admin can see all statistics
      statsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM tbl_tarl_school_list WHERE registration_status = 'approved') as total_schools,
          (SELECT COUNT(*) FROM tbl_tarl_tc_st_sch) as total_students,
          (SELECT COUNT(*) FROM tbl_tarl_users WHERE is_active = true) as total_users,
          (SELECT COUNT(*) FROM tbl_tarl_teachers WHERE status = 'approved') as total_teachers,
          (SELECT COUNT(*) FROM tbl_tarl_classes WHERE is_deleted = false) as total_classes,
          (SELECT COUNT(*) FROM tbl_tarl_training_sessions WHERE session_status = 'scheduled' AND session_date >= CURRENT_DATE) as upcoming_training,
          (SELECT COUNT(*) FROM tbl_tarl_training_sessions WHERE session_status = 'ongoing') as active_training,
          (SELECT COUNT(*) FROM tbl_tarl_transcripts WHERE is_deleted = false) as total_transcripts
      `;
    } else if (user.role === 'director') {
      // Director can see statistics for their schools
      statsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM tbl_tarl_school_list s 
           INNER JOIN tbl_tarl_users u ON s.director_id = u.id 
           WHERE u.id = $1 AND s.registration_status = 'approved') as total_schools,
          (SELECT COUNT(*) FROM tbl_tarl_tc_st_sch st 
           INNER JOIN tbl_tarl_school_list s ON st.school_id = s."sclAutoID" 
           INNER JOIN tbl_tarl_users u ON s.director_id = u.id 
           WHERE u.id = $1) as total_students,
          (SELECT COUNT(*) FROM tbl_tarl_teachers t 
           INNER JOIN tbl_tarl_school_list s ON t.school_id = s."sclAutoID" 
           INNER JOIN tbl_tarl_users u ON s.director_id = u.id 
           WHERE u.id = $1 AND t.status = 'approved') as total_teachers,
          (SELECT COUNT(*) FROM tbl_tarl_classes c 
           INNER JOIN tbl_tarl_school_list s ON c.school_id = s."sclAutoID" 
           INNER JOIN tbl_tarl_users u ON s.director_id = u.id 
           WHERE u.id = $1 AND c.is_deleted = false) as total_classes,
          0 as total_users,
          0 as upcoming_training,
          0 as active_training,
          (SELECT COUNT(*) FROM tbl_tarl_transcripts tr 
           INNER JOIN tbl_tarl_students st ON tr.student_id = st.id 
           INNER JOIN tbl_tarl_school_list s ON st.school_id = s."sclAutoID" 
           INNER JOIN tbl_tarl_users u ON s.director_id = u.id 
           WHERE u.id = $1 AND tr.is_deleted = false) as total_transcripts
      `;
      params = [user.user_id];
    } else if (user.role === 'teacher') {
      // Teacher can see statistics for their classes
      statsQuery = `
        SELECT 
          1 as total_schools,
          (SELECT COUNT(*) FROM tbl_tarl_students st 
           INNER JOIN tbl_tarl_classes c ON st.class_id = c.id 
           WHERE c.teacher_id = $1 AND st.is_deleted = false) as total_students,
          (SELECT COUNT(*) FROM tbl_tarl_classes WHERE teacher_id = $1 AND is_deleted = false) as total_classes,
          0 as total_users,
          0 as total_teachers,
          0 as upcoming_training,
          0 as active_training,
          (SELECT COUNT(*) FROM tbl_tarl_transcripts tr 
           INNER JOIN tbl_tarl_students st ON tr.student_id = st.id 
           INNER JOIN tbl_tarl_classes c ON st.class_id = c.id 
           WHERE c.teacher_id = $1 AND tr.is_deleted = false) as total_transcripts
      `;
      params = [user.user_id];
    } else {
      // Default limited view for other roles
      statsQuery = `
        SELECT 
          0 as total_schools,
          0 as total_students,
          0 as total_users,
          0 as total_teachers,
          0 as total_classes,
          0 as upcoming_training,
          0 as active_training,
          0 as total_transcripts
      `;
    }

    const statsResult = await client.query(statsQuery, params);
    const stats = statsResult.rows[0];

    // Get recent activity based on user role
    let activityQuery = '';
    let activityParams: any[] = [];

    if (user.role === 'admin') {
      activityQuery = `
        SELECT 
          'school' as type,
          s.name as title,
          s.created_at as time,
          'School registered' as description
        FROM tbl_tarl_schools s 
        WHERE s.status = 'pending'
        ORDER BY s.created_at DESC 
        LIMIT 5
      `;
    } else if (user.role === 'director') {
      activityQuery = `
        SELECT 
          'teacher' as type,
          t.teacher_name as title,
          t.created_at as time,
          'Teacher application' as description
        FROM tbl_tarl_teachers t 
        INNER JOIN tbl_tarl_schools s ON t.school_id = s.id 
        INNER JOIN tbl_tarl_users u ON s.director_id = u.id 
        WHERE u.id = $1 AND t.status = 'pending'
        ORDER BY t.created_at DESC 
        LIMIT 5
      `;
      activityParams = [user.user_id];
    } else if (user.role === 'teacher') {
      activityQuery = `
        SELECT 
          'student' as type,
          st.student_name as title,
          st.created_at as time,
          'Student enrolled' as description
        FROM tbl_tarl_students st 
        INNER JOIN tbl_tarl_classes c ON st.class_id = c.id 
        WHERE c.teacher_id = $1 AND st.is_deleted = false
        ORDER BY st.created_at DESC 
        LIMIT 5
      `;
      activityParams = [user.user_id];
    }

    let recentActivity = [];
    if (activityQuery) {
      const activityResult = await client.query(activityQuery, activityParams);
      recentActivity = activityResult.rows;
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalSchools: parseInt(stats.total_schools) || 0,
        totalStudents: parseInt(stats.total_students) || 0,
        totalUsers: parseInt(stats.total_users) || 0,
        totalTeachers: parseInt(stats.total_teachers) || 0,
        totalClasses: parseInt(stats.total_classes) || 0,
        upcomingTraining: parseInt(stats.upcoming_training) || 0,
        activeTraining: parseInt(stats.active_training) || 0,
        totalTranscripts: parseInt(stats.total_transcripts) || 0
      },
      recentActivity,
      userRole: user.role
    });

  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
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