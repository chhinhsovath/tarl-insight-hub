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

    // Get dashboard statistics safely for all roles
    try {
      // Get real data from actual tables
      const schoolsResult = await client.query(`
        SELECT COUNT(*) as count FROM tbl_tarl_schools
      `).catch(() => ({ rows: [{ count: 0 }] }));

      const studentsResult = await client.query(`
        SELECT COUNT(*) as count FROM tbl_tarl_tc_st_sch
      `).catch(() => ({ rows: [{ count: 0 }] }));

      const usersResult = await client.query(`
        SELECT COUNT(*) as count FROM tbl_tarl_users 
        WHERE COALESCE(is_active, true) = true
      `).catch(() => ({ rows: [{ count: 0 }] }));

      const teachersResult = await client.query(`
        SELECT COUNT(*) as count FROM tbl_tarl_teachers
      `).catch(() => ({ rows: [{ count: 0 }] }));

      const classesResult = await client.query(`
        SELECT COUNT(*) as count FROM tbl_tarl_classes 
        WHERE COALESCE(is_deleted, false) = false
      `).catch(() => ({ rows: [{ count: 0 }] }));

      const trainingProgramsResult = await client.query(`
        SELECT COUNT(*) as count FROM tbl_tarl_training_programs
      `).catch(() => ({ rows: [{ count: 0 }] }));

      const trainingSessionsResult = await client.query(`
        SELECT COUNT(*) as count FROM tbl_tarl_training_sessions
      `).catch(() => ({ rows: [{ count: 0 }] }));

      const activeTrainingResult = await client.query(`
        SELECT COUNT(*) as count FROM tbl_tarl_training_sessions 
        WHERE COALESCE(session_status, 'scheduled') = 'ongoing'
      `).catch(() => ({ rows: [{ count: 0 }] }));

      const transcriptsResult = await client.query(`
        SELECT COUNT(*) as count FROM tbl_tarl_transcripts 
        WHERE COALESCE(is_deleted, false) = false
      `).catch(() => ({ rows: [{ count: 0 }] }));

      // Real stats from actual data
      const stats = {
        totalSchools: parseInt(schoolsResult.rows[0].count) || 0,
        totalStudents: parseInt(studentsResult.rows[0].count) || 0,
        totalUsers: parseInt(usersResult.rows[0].count) || 0,
        totalTeachers: parseInt(teachersResult.rows[0].count) || 0,
        totalClasses: parseInt(classesResult.rows[0].count) || 0,
        upcomingTraining: parseInt(trainingProgramsResult.rows[0].count) || 0,
        activeTraining: parseInt(activeTrainingResult.rows[0].count) || 0,
        totalTranscripts: parseInt(transcriptsResult.rows[0].count) || 0
      };

      // Log the stats for debugging
      console.log("Dashboard stats fetched:", stats);

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