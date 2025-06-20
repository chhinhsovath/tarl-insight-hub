import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { validateTrainingAccess } from "@/lib/training-permissions";

const pool = getPool();

// GET - Fetch training feedback
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  const getStats = searchParams.get('stats') === 'true';
  
  // Validate training access
  const authResult = await validateTrainingAccess('training-feedback', 'view');
  
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const user = authResult.user!;
  const client = await pool.connect();

  try {
    if (getStats) {
      // Get feedback statistics
      let baseQuery = `
        FROM tbl_tarl_training_feedback tf
        LEFT JOIN tbl_tarl_training_sessions ts ON tf.session_id = ts.id
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      // Apply role-based filtering for teachers
      if (user.role === 'teacher') {
        baseQuery += ` AND ts.trainer_id = $${paramIndex}`;
        params.push(user.user_id);
        paramIndex++;
      }

      // Get overall statistics
      const statsQuery = `
        SELECT 
          COUNT(*)::int as total_feedback,
          COUNT(CASE WHEN overall_rating >= 4 THEN 1 END)::int as positive_feedback,
          COUNT(CASE WHEN overall_rating <= 2 THEN 1 END)::int as negative_feedback,
          ROUND(AVG(overall_rating), 2) as average_rating,
          ROUND(AVG(content_rating), 2) as avg_content_rating,
          ROUND(AVG(trainer_rating), 2) as avg_trainer_rating,
          ROUND(AVG(venue_rating), 2) as avg_venue_rating,
          COUNT(CASE WHEN would_recommend = true THEN 1 END)::int as would_recommend,
          COUNT(DISTINCT tf.session_id)::int as sessions_with_feedback
        ${baseQuery}
      `;

      const statsResult = await client.query(statsQuery, params);
      
      // Get recent feedback (last 5)
      const recentQuery = `
        SELECT 
          tf.id,
          tf.overall_rating,
          tf.comments,
          tf.submission_time,
          tf.is_anonymous,
          ts.session_title,
          tp.program_name
        ${baseQuery}
        LEFT JOIN tbl_tarl_training_programs tp ON ts.program_id = tp.id
        ORDER BY tf.submission_time DESC
        LIMIT 5
      `;

      const recentResult = await client.query(recentQuery, params);

      // Provide default values if no data exists
      const defaultStats = {
        total_feedback: 0,
        positive_feedback: 0,
        negative_feedback: 0,
        average_rating: 0,
        avg_content_rating: 0,
        avg_trainer_rating: 0,
        avg_venue_rating: 0,
        would_recommend: 0,
        sessions_with_feedback: 0
      };

      return NextResponse.json({
        statistics: statsResult.rows[0] || defaultStats,
        recent_feedback: recentResult.rows || []
      });
    } else {
      // Get feedback list
      let query = `
        SELECT 
          tf.*,
          ts.session_title,
          ts.session_date,
          ts.session_time,
          ts.location,
          tp.program_name,
          tpt.participant_name,
          tpt.participant_email
        FROM tbl_tarl_training_feedback tf
        LEFT JOIN tbl_tarl_training_sessions ts ON tf.session_id = ts.id
        LEFT JOIN tbl_tarl_training_programs tp ON ts.program_id = tp.id
        LEFT JOIN tbl_tarl_training_participants tpt ON tf.participant_id = tpt.id
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      if (sessionId) {
        query += ` AND tf.session_id = $${paramIndex}`;
        params.push(parseInt(sessionId));
        paramIndex++;
      }

      // Apply role-based filtering for teachers
      if (user.role === 'teacher') {
        query += ` AND ts.trainer_id = $${paramIndex}`;
        params.push(user.user_id);
        paramIndex++;
      }

      query += ` ORDER BY tf.submission_time DESC`;

      const result = await client.query(query, params);
      
      return NextResponse.json(result.rows);
    }
  } catch (error) {
    console.error('Error fetching training feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

// POST - Submit training feedback (public endpoint)
export async function POST(request: NextRequest) {
  const client = await pool.connect();

  try {
    const body = await request.json();
    const {
      session_id,
      participant_id,
      feedback_data,
      overall_rating,
      trainer_rating,
      content_rating,
      venue_rating,
      would_recommend,
      comments,
      suggestions,
      submitted_via,
      is_anonymous
    } = body;

    if (!session_id || !feedback_data) {
      return NextResponse.json({ 
        error: 'Missing required fields: session_id, feedback_data' 
      }, { status: 400 });
    }

    // Check if session exists
    const sessionCheck = await client.query(`
      SELECT id, session_title FROM tbl_tarl_training_sessions 
      WHERE id = $1 AND is_active = true
    `, [parseInt(session_id)]);

    if (sessionCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Training session not found' }, { status: 404 });
    }

    // Submit feedback to new training feedback table
    const result = await client.query(`
      INSERT INTO tbl_tarl_training_feedback (
        session_id, participant_id, feedback_data, overall_rating, trainer_rating,
        content_rating, venue_rating, would_recommend, comments, suggestions,
        submitted_via, is_anonymous, submission_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING id, session_id, overall_rating, submission_time
    `, [
      parseInt(session_id),
      participant_id || null,
      JSON.stringify(feedback_data),
      overall_rating || null,
      trainer_rating || null,
      content_rating || null,
      venue_rating || null,
      would_recommend || null,
      comments || null,
      suggestions || null,
      submitted_via || 'manual',
      is_anonymous || false
    ]);

    const newFeedback = result.rows[0];

    return NextResponse.json({
      success: true,
      feedback: newFeedback,
      session_title: sessionCheck.rows[0].session_title,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}