import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

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