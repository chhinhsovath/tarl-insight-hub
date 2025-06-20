import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();

async function validateSession(sessionToken: string) {
  const result = await pool.query(
    `SELECT id, role FROM tbl_tarl_users 
     WHERE session_token = $1 AND session_expires > NOW() AND is_active = true`,
    [sessionToken]
  );
  return result.rows[0];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = request.cookies.get("session-token")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await validateSession(sessionToken);
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { id } = await params;
    const sessionId = id;

    // Get session basic information
    const sessionQuery = `
      SELECT 
        ts.*,
        tp.program_name,
        t.full_name as trainer_name,
        c.full_name as coordinator_name
      FROM tbl_tarl_training_sessions ts
      LEFT JOIN tbl_tarl_training_programs tp ON ts.program_id = tp.id
      LEFT JOIN tbl_tarl_users t ON ts.trainer_id = t.id
      LEFT JOIN tbl_tarl_users c ON ts.coordinator_id = c.id
      WHERE ts.id = $1
    `;

    // Get registration statistics
    const registrationQuery = `
      SELECT 
        COUNT(*) as total_registrations,
        COUNT(CASE WHEN attendance_status = 'confirmed' THEN 1 END) as confirmed_count,
        COUNT(CASE WHEN attendance_status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN attendance_status = 'cancelled' THEN 1 END) as cancelled_count
      FROM tbl_tarl_training_registrations 
      WHERE session_id = $1 AND is_active = true
    `;

    // Get attendance statistics
    const attendanceQuery = `
      SELECT 
        COUNT(*) as total_attendance,
        COUNT(CASE WHEN attendance_status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN attendance_status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN attendance_status = 'late' THEN 1 END) as late_count
      FROM tbl_tarl_training_attendance 
      WHERE session_id = $1
    `;

    // Get feedback statistics
    const feedbackQuery = `
      SELECT 
        COUNT(*) as total_feedback,
        AVG(overall_rating::numeric) as average_rating,
        COUNT(CASE WHEN overall_rating >= 4 THEN 1 END) as positive_feedback,
        COUNT(CASE WHEN overall_rating <= 2 THEN 1 END) as negative_feedback
      FROM tbl_tarl_training_feedback 
      WHERE session_id = $1 AND is_active = true
    `;

    // Get engage programs count
    const engageProgramsQuery = `
      SELECT 
        COUNT(*) as total_programs,
        COUNT(CASE WHEN timing = 'before' THEN 1 END) as before_count,
        COUNT(CASE WHEN timing = 'during' THEN 1 END) as during_count,
        COUNT(CASE WHEN timing = 'after' THEN 1 END) as after_count,
        (SELECT COUNT(*) FROM tbl_training_engage_materials tem 
         WHERE tem.engage_program_id IN 
         (SELECT id FROM tbl_training_engage_programs WHERE session_id = $1 AND is_active = true)
         AND tem.is_active = true) as total_materials
      FROM tbl_training_engage_programs 
      WHERE session_id = $1 AND is_active = true
    `;

    // Get photo activities count
    const photoActivitiesQuery = `
      SELECT 
        COUNT(*) as total_photos,
        COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_count,
        COUNT(CASE WHEN is_public = true THEN 1 END) as public_count
      FROM tbl_training_photo_activities 
      WHERE session_id = $1 AND is_active = true
    `;

    // Get recent activities (last 10)
    const recentActivitiesQuery = `
      SELECT 'registration' as type, full_name as participant_name, created_at, 'registered' as action
      FROM tbl_tarl_training_registrations r
      JOIN tbl_tarl_users u ON r.user_id = u.id
      WHERE r.session_id = $1 AND r.is_active = true
      
      UNION ALL
      
      SELECT 'attendance' as type, full_name as participant_name, check_in_time as created_at, 
             CASE WHEN attendance_status = 'present' THEN 'checked in' ELSE attendance_status END as action
      FROM tbl_tarl_training_attendance a
      JOIN tbl_tarl_users u ON a.user_id = u.id
      WHERE a.session_id = $1 AND a.check_in_time IS NOT NULL
      
      UNION ALL
      
      SELECT 'feedback' as type, full_name as participant_name, created_at, 'submitted feedback' as action
      FROM tbl_tarl_training_feedback f
      JOIN tbl_tarl_users u ON f.user_id = u.id
      WHERE f.session_id = $1 AND f.is_active = true
      
      UNION ALL
      
      SELECT 'photo' as type, u.full_name as participant_name, pa.created_at, 'uploaded photo' as action
      FROM tbl_training_photo_activities pa
      JOIN tbl_tarl_users u ON pa.uploaded_by = u.id
      WHERE pa.session_id = $1 AND pa.is_active = true
      
      ORDER BY created_at DESC
      LIMIT 10
    `;

    // Execute queries with error handling for missing tables
    const sessionResult = await pool.query(sessionQuery, [sessionId]);
    
    let registrationResult, attendanceResult, feedbackResult, engageProgramsResult, photoActivitiesResult, recentActivitiesResult;
    
    try {
      registrationResult = await pool.query(registrationQuery, [sessionId]);
    } catch (error) {
      console.log('Registration table not found, using empty data');
      registrationResult = { rows: [{ total_registrations: 0, confirmed_count: 0, pending_count: 0, cancelled_count: 0 }] };
    }
    
    try {
      attendanceResult = await pool.query(attendanceQuery, [sessionId]);
    } catch (error) {
      console.log('Attendance table not found, using empty data');
      attendanceResult = { rows: [{ total_attendance: 0, present_count: 0, absent_count: 0, late_count: 0 }] };
    }
    
    try {
      feedbackResult = await pool.query(feedbackQuery, [sessionId]);
    } catch (error) {
      console.log('Feedback table not found, using empty data');
      feedbackResult = { rows: [{ total_feedback: 0, average_rating: 0, positive_feedback: 0, negative_feedback: 0 }] };
    }
    
    try {
      engageProgramsResult = await pool.query(engageProgramsQuery, [sessionId]);
    } catch (error) {
      console.log('Engage programs table not found, using empty data');
      engageProgramsResult = { rows: [{ total_programs: 0, before_count: 0, during_count: 0, after_count: 0, total_materials: 0 }] };
    }
    
    try {
      photoActivitiesResult = await pool.query(photoActivitiesQuery, [sessionId]);
    } catch (error) {
      console.log('Photo activities table not found, using empty data');
      photoActivitiesResult = { rows: [{ total_photos: 0, featured_count: 0, public_count: 0 }] };
    }
    
    try {
      recentActivitiesResult = await pool.query(recentActivitiesQuery, [sessionId]);
    } catch (error) {
      console.log('Recent activities query failed, using empty data');
      recentActivitiesResult = { rows: [] };
    }

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const overview = {
      session: sessionResult.rows[0],
      statistics: {
        registration: registrationResult.rows[0] || {},
        attendance: attendanceResult.rows[0] || {},
        feedback: feedbackResult.rows[0] || {},
        engagePrograms: engageProgramsResult.rows[0] || {},
        photoActivities: photoActivitiesResult.rows[0] || {}
      },
      recentActivities: recentActivitiesResult.rows || []
    };

    return NextResponse.json(overview);
  } catch (error) {
    console.error("Error fetching session overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch session overview" },
      { status: 500 }
    );
  }
}