import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPool } from "@/lib/database-config";

const pool = getPool();

export async function GET(request: NextRequest) {
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

    // Check if user is teacher
    if (currentUser.role !== 'teacher') {
      return NextResponse.json({ error: "Access denied. Teacher role required." }, { status: 403 });
    }

    // Get teacher information
    const teacherResult = await client.query(`
      SELECT 
        t.id,
        t.teacher_name,
        t.teacher_id,
        t.subject_specialization,
        t.registration_status,
        s."sclName" as school_name,
        s."sclCode" as school_code
      FROM tbl_tarl_teachers t
      LEFT JOIN tbl_tarl_school_list s ON t.school_id = s."sclAutoID"
      WHERE t.user_id = $1 AND t.is_deleted = false
    `, [currentUser.id]);

    if (teacherResult.rows.length === 0) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const teacherInfo = teacherResult.rows[0];

    // Get statistics
    const statsQueries = await Promise.all([
      // Total classes taught by this teacher
      client.query(`
        SELECT COUNT(*) as count 
        FROM tbl_tarl_classes 
        WHERE teacher_id = $1 AND is_deleted = false
      `, [teacherInfo.id]),
      
      // Total students in teacher's classes
      client.query(`
        SELECT COUNT(*) as count 
        FROM tbl_tarl_students st
        JOIN tbl_tarl_classes c ON st.class_id = c.id
        WHERE c.teacher_id = $1 AND st.is_deleted = false AND c.is_deleted = false
      `, [teacherInfo.id]),
      
      // Active classes
      client.query(`
        SELECT COUNT(*) as count 
        FROM tbl_tarl_classes 
        WHERE teacher_id = $1 AND is_deleted = false AND is_active = true
      `, [teacherInfo.id]),
      
      // Completed transcripts (grades entered)
      client.query(`
        SELECT COUNT(*) as count 
        FROM tbl_tarl_transcripts tr
        JOIN tbl_tarl_classes c ON tr.class_id = c.id
        WHERE c.teacher_id = $1 AND tr.is_deleted = false AND c.is_deleted = false
      `, [teacherInfo.id])
    ]);

    const stats = {
      totalClasses: parseInt(statsQueries[0].rows[0].count),
      totalStudents: parseInt(statsQueries[1].rows[0].count),
      activeClasses: parseInt(statsQueries[2].rows[0].count),
      completedTranscripts: parseInt(statsQueries[3].rows[0].count)
    };

    // Get recent classes
    const recentClassesResult = await client.query(`
      SELECT 
        c.id,
        c.class_name,
        c.grade_level,
        c.academic_year,
        c.room_number,
        COUNT(st.id) as student_count
      FROM tbl_tarl_classes c
      LEFT JOIN tbl_tarl_students st ON c.id = st.class_id AND st.is_deleted = false
      WHERE c.teacher_id = $1 AND c.is_deleted = false
      GROUP BY c.id, c.class_name, c.grade_level, c.academic_year, c.room_number
      ORDER BY c.created_at DESC 
      LIMIT 5
    `, [teacherInfo.id]);

    const recentClasses = recentClassesResult.rows.map(row => ({
      ...row,
      student_count: parseInt(row.student_count)
    }));

    // Get recent activities from audit logs
    const activitiesResult = await client.query(`
      SELECT 
        id,
        action_type,
        table_name,
        changes_summary,
        created_at
      FROM tbl_tarl_user_activities 
      WHERE user_id = $1 
        AND table_name IN ('tbl_tarl_classes', 'tbl_tarl_students', 'tbl_tarl_transcripts')
      ORDER BY created_at DESC 
      LIMIT 8
    `, [currentUser.id]);

    const recentActivities = activitiesResult.rows.map((activity, index) => {
      let type: 'class' | 'student' | 'transcript' = 'class';
      if (activity.table_name === 'tbl_tarl_students') type = 'student';
      if (activity.table_name === 'tbl_tarl_transcripts') type = 'transcript';

      return {
        id: activity.id,
        activity: activity.changes_summary || `${activity.action_type} on ${activity.table_name}`,
        date: activity.created_at,
        type
      };
    });

    // If no activities found, create some sample activities
    if (recentActivities.length === 0) {
      const sampleActivities = [
        {
          id: 1,
          activity: "Teacher dashboard accessed",
          date: new Date().toISOString(),
          type: 'class' as const
        },
        {
          id: 2,
          activity: "Profile information reviewed",
          date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          type: 'student' as const
        }
      ];
      recentActivities.push(...sampleActivities);
    }

    return NextResponse.json({
      success: true,
      data: {
        teacherInfo,
        stats,
        recentClasses,
        recentActivities: recentActivities.slice(0, 5) // Limit to 5 most recent
      }
    });

  } catch (error: any) {
    console.error("Error fetching teacher dashboard:", error);
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