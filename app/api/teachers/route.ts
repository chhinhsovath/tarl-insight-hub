import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPool } from "@/lib/database-config";
import { getAuditLogger } from "@/lib/audit-logger";

const pool = getPool();

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const remote = request.headers.get('x-vercel-forwarded-for');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (real) {
    return real.trim();
  }
  if (remote) {
    return remote.split(',')[0].trim();
  }
  return 'unknown';
}

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

    // Check permissions
    if (!['admin', 'director'].includes(currentUser.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ['t.is_deleted = false'];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // For directors, only show teachers from their school
    if (currentUser.role === 'director' && currentUser.school_id) {
      whereConditions.push(`t.school_id = $${paramIndex}`);
      queryParams.push(currentUser.school_id);
      paramIndex++;
    }

    if (status !== 'all') {
      whereConditions.push(`t.registration_status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(
        t.teacher_name ILIKE $${paramIndex} OR 
        t.teacher_id ILIKE $${paramIndex} OR 
        t.phone ILIKE $${paramIndex} OR
        t.email ILIKE $${paramIndex} OR
        t.subject_specialization ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await client.query(`
      SELECT COUNT(*) as total
      FROM tbl_tarl_teachers t
      ${whereClause}
    `, queryParams);

    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const teachersResult = await client.query(`
      SELECT 
        t.id,
        t.teacher_name,
        t.teacher_id,
        t.school_id,
        t.school_code,
        t.sex,
        t.age,
        t.phone,
        t.email,
        t.subject_specialization,
        t.years_experience,
        t.registration_status,
        t.user_id,
        t.created_at,
        t.updated_at,
        s."sclName" as school_name,
        u.username as user_username
      FROM tbl_tarl_teachers t
      LEFT JOIN tbl_tarl_school_list s ON t.school_id = s."sclAutoID"
      LEFT JOIN tbl_tarl_users u ON t.user_id = u.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, limit, offset]);

    return NextResponse.json({
      success: true,
      data: teachersResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error("Error fetching teachers:", error);
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

export async function POST(request: NextRequest) {
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

    // Check permissions
    if (!['admin', 'director'].includes(currentUser.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const {
      teacher_name,
      teacher_id,
      sex,
      age,
      phone,
      email,
      subject_specialization,
      years_experience
    } = body;

    // Validate required fields
    const requiredFields = {
      teacher_name: "Teacher name",
      teacher_id: "Teacher ID",
      sex: "Gender",
      phone: "Phone number"
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${label} is required` },
          { status: 400 }
        );
      }
    }

    // Validate email format if provided
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Determine school_id based on user role
    let schoolId;
    if (currentUser.role === 'director') {
      if (!currentUser.school_id) {
        return NextResponse.json(
          { error: "Director must be assigned to a school" },
          { status: 400 }
        );
      }
      schoolId = currentUser.school_id;
    } else {
      // For admin, we could allow school selection, but for now use their school if they have one
      schoolId = currentUser.school_id;
    }

    // Check if teacher ID already exists
    const existingTeacher = await client.query(
      'SELECT id FROM tbl_tarl_teachers WHERE teacher_id = $1 AND is_deleted = false',
      [teacher_id]
    );

    if (existingTeacher.rows.length > 0) {
      return NextResponse.json(
        { error: "Teacher ID already exists" },
        { status: 409 }
      );
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await client.query(
        'SELECT id FROM tbl_tarl_teachers WHERE email = $1 AND is_deleted = false',
        [email]
      );

      if (existingEmail.rows.length > 0) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 }
        );
      }
    }

    // Get school code if we have school_id
    let schoolCode = null;
    if (schoolId) {
      const schoolResult = await client.query(
        'SELECT "sclCode" FROM tbl_tarl_school_list WHERE "sclAutoID" = $1',
        [schoolId]
      );
      schoolCode = schoolResult.rows[0]?.sclCode;
    }

    await client.query('BEGIN');

    // Insert new teacher
    const insertResult = await client.query(`
      INSERT INTO tbl_tarl_teachers (
        teacher_name,
        teacher_id,
        school_id,
        school_code,
        sex,
        age,
        phone,
        email,
        subject_specialization,
        years_experience,
        registration_status,
        created_by,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING id, teacher_name, teacher_id, registration_status
    `, [
      teacher_name,
      teacher_id,
      schoolId,
      schoolCode,
      sex,
      age ? parseInt(age) : null,
      phone,
      email || null,
      subject_specialization || null,
      years_experience ? parseInt(years_experience) : null,
      'approved', // Auto-approve teachers added by directors
      currentUser.id
    ]);

    const newTeacher = insertResult.rows[0];

    // Log the activity
    const auditLogger = getAuditLogger(pool);
    await auditLogger.logActivity({
      userId: currentUser.id,
      username: currentUser.full_name,
      userRole: currentUser.role,
      actionType: 'CREATE',
      tableName: 'tbl_tarl_teachers',
      recordId: newTeacher.id,
      newData: newTeacher,
      changesSummary: `Teacher "${teacher_name}" (${teacher_id}) added by ${currentUser.full_name}`,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined
    });

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: "Teacher added successfully",
      data: newTeacher
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Teacher creation error:", error);
    
    // Handle duplicate key violations
    if (error.code === '23505') {
      if (error.constraint?.includes('teacher_id')) {
        return NextResponse.json(
          { error: "Teacher ID already exists" },
          { status: 409 }
        );
      }
      if (error.constraint?.includes('email')) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 }
        );
      }
    }

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