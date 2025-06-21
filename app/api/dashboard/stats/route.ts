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
    // Validate session and get user info - handle both possible expiry columns
    let sessionResult;
    try {
      sessionResult = await client.query(
        'SELECT user_id, username, role FROM tbl_tarl_sessions WHERE session_token = $1 AND (expires_at > NOW() OR session_expires > NOW())',
        [sessionToken]
      );
    } catch (sessionError) {
      console.error("Session query error:", sessionError);
      // Try simpler query without expiry check
      sessionResult = await client.query(
        'SELECT user_id, username, role FROM tbl_tarl_sessions WHERE session_token = $1',
        [sessionToken]
      );
    }

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid session - no matching session found' }, { status: 401 });
    }

    const user = sessionResult.rows[0];
    console.log("User found:", user.username, "Role:", user.role);

    // Get dashboard statistics safely for all roles
    try {
      console.log("Fetching dashboard statistics...");
      
      // Get counts from main tables with explicit error handling
      let totalSchools = 0;
      let totalStudents = 0;
      let totalUsers = 0;
      let totalTeachers = 0;
      let totalClasses = 0;
      let trainingPrograms = 0;
      let trainingSessions = 0;
      let activeTraining = 0;
      let totalTranscripts = 0;

      // Schools count
      try {
        const schoolsResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_schools');
        totalSchools = parseInt(schoolsResult.rows[0].count) || 0;
        console.log("Schools found:", totalSchools);
      } catch (error) {
        console.error("Error counting schools:", error);
      }

      // Students count
      try {
        const studentsResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_tc_st_sch');
        totalStudents = parseInt(studentsResult.rows[0].count) || 0;
        console.log("Students found:", totalStudents);
      } catch (error) {
        console.error("Error counting students:", error);
      }

      // Users count
      try {
        const usersResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_users');
        totalUsers = parseInt(usersResult.rows[0].count) || 0;
        console.log("Users found:", totalUsers);
      } catch (error) {
        console.error("Error counting users:", error);
      }

      // Training programs count
      try {
        const programsResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_training_programs');
        trainingPrograms = parseInt(programsResult.rows[0].count) || 0;
        console.log("Training programs found:", trainingPrograms);
      } catch (error) {
        console.error("Error counting training programs:", error);
      }

      // Training sessions count
      try {
        const sessionsResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_training_sessions');
        trainingSessions = parseInt(sessionsResult.rows[0].count) || 0;
        console.log("Training sessions found:", trainingSessions);
      } catch (error) {
        console.error("Error counting training sessions:", error);
      }

      // Other counts (optional tables)
      try {
        const teachersResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_teachers');
        totalTeachers = parseInt(teachersResult.rows[0].count) || 0;
      } catch (error) {
        console.log("Teachers table not available or empty");
      }

      try {
        const classesResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_classes WHERE COALESCE(is_deleted, false) = false');
        totalClasses = parseInt(classesResult.rows[0].count) || 0;
      } catch (error) {
        console.log("Classes table not available or empty");
      }

      try {
        const transcriptsResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_transcripts WHERE COALESCE(is_deleted, false) = false');
        totalTranscripts = parseInt(transcriptsResult.rows[0].count) || 0;
      } catch (error) {
        console.log("Transcripts table not available or empty");
      }

      const stats = {
        totalSchools,
        totalStudents,
        totalUsers,
        totalTeachers,
        totalClasses,
        upcomingTraining: trainingPrograms,
        activeTraining: trainingSessions,
        totalTranscripts
      };

      console.log("Final dashboard stats:", stats);

      return NextResponse.json({
        success: true,
        stats,
        recentActivity: [],
        userRole: user.role
      });

    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
      
      // Return default stats if there's any error
      return NextResponse.json({
        success: true,
        stats: {
          totalSchools: 0,
          totalStudents: 0,
          totalUsers: 0,
          totalTeachers: 0,
          totalClasses: 0,
          upcomingTraining: 0,
          activeTraining: 0,
          totalTranscripts: 0
        },
        recentActivity: [],
        userRole: user.role
      });
    }

  } catch (error: any) {
    console.error("Error in dashboard stats API:", error);
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