import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";

const pool = getPool();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const transcriptId = parseInt(id);

    // Get transcript with related data
    const query = `
      SELECT 
        t.*,
        s.student_name,
        s.student_id as student_code,
        c.class_name,
        c.academic_year as class_academic_year,
        sch."sclName" as school_name,
        sch."sclCode" as school_code,
        te.teacher_name,
        u.full_name as created_by_name,
        gs.letter_grade,
        gs.grade_point,
        gs.description as grade_description
      FROM tbl_tarl_transcripts t
      LEFT JOIN tbl_tarl_students s ON t.student_id = s.id
      LEFT JOIN tbl_tarl_classes c ON t.class_id = c.id
      LEFT JOIN tbl_tarl_school_list sch ON s.school_id = sch."sclAutoID"
      LEFT JOIN tbl_tarl_teachers te ON t.teacher_id = te.id
      LEFT JOIN tbl_tarl_users u ON t.created_by = u.id
      LEFT JOIN tbl_tarl_grade_scales gs ON t.score BETWEEN gs.min_score AND gs.max_score
      WHERE t.id = $1 AND t.is_deleted = false
    `;

    const result = await client.query(query, [transcriptId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
    }

    const transcript = result.rows[0];

    // Check if user has access to this transcript
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
      `, [transcript.student_id, user.user_id]);

      if (accessCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Access denied to this transcript' }, { status: 403 });
      }
    }

    return NextResponse.json(transcript);

  } catch (error) {
    console.error('Error fetching transcript:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const transcriptId = parseInt(id);

    // Check if user can update transcripts
    const allowedRoles = ['admin', 'director', 'teacher', 'coordinator'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if transcript exists and user has access
    const existingTranscript = await client.query(
      'SELECT * FROM tbl_tarl_transcripts WHERE id = $1 AND is_deleted = false',
      [transcriptId]
    );

    if (existingTranscript.rows.length === 0) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
    }

    const transcript = existingTranscript.rows[0];

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
      `, [transcript.student_id, user.user_id]);

      if (accessCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Access denied to this transcript' }, { status: 403 });
      }
    }

    const body = await request.json();
    const {
      score,
      grade,
      remarks,
      teacher_id,
      is_final
    } = body;

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

    // Update transcript
    const updateResult = await client.query(`
      UPDATE tbl_tarl_transcripts 
      SET 
        score = COALESCE($1, score),
        grade = COALESCE($2, grade),
        remarks = COALESCE($3, remarks),
        teacher_id = COALESCE($4, teacher_id),
        is_final = COALESCE($5, is_final),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [score, calculatedGrade, remarks, teacher_id, is_final, transcriptId]);

    const updatedTranscript = updateResult.rows[0];

    return NextResponse.json({
      success: true,
      transcript: updatedTranscript,
      message: 'Transcript updated successfully'
    });

  } catch (error) {
    console.error('Error updating transcript:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const transcriptId = parseInt(id);

    // Check if user can delete transcripts
    const allowedRoles = ['admin', 'director'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if transcript exists and user has access
    const existingTranscript = await client.query(
      'SELECT * FROM tbl_tarl_transcripts WHERE id = $1 AND is_deleted = false',
      [transcriptId]
    );

    if (existingTranscript.rows.length === 0) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
    }

    const transcript = existingTranscript.rows[0];

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
      `, [transcript.student_id, user.user_id]);

      if (accessCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Access denied to this transcript' }, { status: 403 });
      }
    }

    // Soft delete transcript
    await client.query(`
      UPDATE tbl_tarl_transcripts 
      SET 
        is_deleted = true,
        deleted_at = CURRENT_TIMESTAMP,
        deleted_by = $1
      WHERE id = $2
    `, [user.user_id, transcriptId]);

    return NextResponse.json({
      success: true,
      message: 'Transcript deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting transcript:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}