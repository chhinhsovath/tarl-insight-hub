import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";

const pool = getPool();

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
    const { transcripts } = body;

    if (!Array.isArray(transcripts) || transcripts.length === 0) {
      return NextResponse.json({
        error: 'Invalid request: transcripts must be a non-empty array'
      }, { status: 400 });
    }

    await client.query('BEGIN');

    const results = [];
    const errors = [];

    for (let i = 0; i < transcripts.length; i++) {
      const transcript = transcripts[i];
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
      } = transcript;

      try {
        // Validate required fields
        if (!student_id || !academic_year || !subject || !assessment_period) {
          errors.push({
            index: i,
            error: 'Missing required fields: student_id, academic_year, subject, assessment_period'
          });
          continue;
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
            errors.push({
              index: i,
              error: 'Access denied to student'
            });
            continue;
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

        results.push({
          index: i,
          transcript: insertResult.rows[0],
          success: true
        });

      } catch (error) {
        console.error(`Error processing transcript at index ${i}:`, error);
        errors.push({
          index: i,
          error: 'Internal processing error'
        });
      }
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      results,
      errors,
      summary: {
        total: transcripts.length,
        successful: results.length,
        failed: errors.length
      },
      message: `Bulk transcript operation completed. ${results.length} successful, ${errors.length} failed.`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in bulk transcript creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(request: NextRequest) {
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

    // Check if user can update transcripts
    const allowedRoles = ['admin', 'director', 'teacher', 'coordinator'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { transcript_ids, updates } = body;

    if (!Array.isArray(transcript_ids) || transcript_ids.length === 0) {
      return NextResponse.json({
        error: 'Invalid request: transcript_ids must be a non-empty array'
      }, { status: 400 });
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({
        error: 'Invalid request: updates must be an object'
      }, { status: 400 });
    }

    await client.query('BEGIN');

    // Check user access to all transcripts
    if (user.role !== 'admin') {
      const accessCheck = await client.query(`
        SELECT t.id FROM tbl_tarl_transcripts t
        LEFT JOIN tbl_tarl_students s ON t.student_id = s.id
        LEFT JOIN tbl_tarl_classes c ON t.class_id = c.id
        WHERE t.id = ANY($1) AND t.is_deleted = false AND (
          s.school_id IN (
            SELECT school_id FROM user_school_assignments 
            WHERE user_id = $2 AND is_active = true
          ) OR
          c.id IN (
            SELECT class_id FROM teacher_class_assignments 
            WHERE teacher_id = $2 AND is_active = true
          )
        )
      `, [transcript_ids, user.user_id]);

      if (accessCheck.rows.length !== transcript_ids.length) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Access denied to some transcripts' }, { status: 403 });
      }
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (updates.score !== undefined) {
      updateFields.push(`score = $${paramIndex}`);
      updateValues.push(updates.score);
      paramIndex++;
    }

    if (updates.grade !== undefined) {
      updateFields.push(`grade = $${paramIndex}`);
      updateValues.push(updates.grade);
      paramIndex++;
    }

    if (updates.remarks !== undefined) {
      updateFields.push(`remarks = $${paramIndex}`);
      updateValues.push(updates.remarks);
      paramIndex++;
    }

    if (updates.teacher_id !== undefined) {
      updateFields.push(`teacher_id = $${paramIndex}`);
      updateValues.push(updates.teacher_id);
      paramIndex++;
    }

    if (updates.is_final !== undefined) {
      updateFields.push(`is_final = $${paramIndex}`);
      updateValues.push(updates.is_final);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({
        error: 'No valid update fields provided'
      }, { status: 400 });
    }

    // Add updated_at field
    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    // Add transcript_ids to the values array
    updateValues.push(transcript_ids);

    const updateQuery = `
      UPDATE tbl_tarl_transcripts
      SET ${updateFields.join(', ')}
      WHERE id = ANY($${paramIndex}) AND is_deleted = false
      RETURNING *
    `;

    const result = await client.query(updateQuery, updateValues);

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      updated_transcripts: result.rows,
      count: result.rows.length,
      message: `Successfully updated ${result.rows.length} transcripts`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in bulk transcript update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}