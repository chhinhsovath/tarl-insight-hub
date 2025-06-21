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

export async function PUT(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user info
    const sessionResult = await client.query(
      "SELECT id, full_name, role FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];

    // Check if user is admin
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const body = await request.json();
    const { schoolId, action, note } = body;

    // Validate input
    if (!schoolId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: "Invalid input parameters" }, { status: 400 });
    }

    if (action === 'reject' && !note?.trim()) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    // Get current school data
    const schoolResult = await client.query(
      'SELECT * FROM tbl_tarl_school_list WHERE "sclAutoID" = $1 AND is_deleted = false',
      [schoolId]
    );

    if (schoolResult.rows.length === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const school = schoolResult.rows[0];

    if (school.registration_status !== 'pending') {
      return NextResponse.json({ 
        error: `School has already been ${school.registration_status}` 
      }, { status: 400 });
    }

    await client.query('BEGIN');

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    // Update school status
    const updateResult = await client.query(`
      UPDATE tbl_tarl_school_list 
      SET 
        registration_status = $1,
        approved_by = $2,
        approved_at = NOW(),
        "updatedAt" = NOW()
      WHERE "sclAutoID" = $3
      RETURNING "sclAutoID", "sclName", "sclCode", registration_status
    `, [newStatus, currentUser.id, schoolId]);

    const updatedSchool = updateResult.rows[0];

    // If approved, create director user account
    let directorCredentials = null;
    if (action === 'approve') {
      // Generate username and password for director
      const directorUsername = `dir_${school.sclCode.toLowerCase()}`;
      const tempPassword = Math.random().toString(36).slice(-8); // Generate 8-char password

      // Get director role ID
      const directorRoleResult = await client.query(
        "SELECT id FROM tbl_tarl_roles WHERE name = 'director'"
      );

      if (directorRoleResult.rows.length === 0) {
        // Create director role if it doesn't exist
        await client.query(`
          INSERT INTO tbl_tarl_roles (name, description, created_at, updated_at)
          VALUES ('director', 'School Director', NOW(), NOW())
        `);
        
        const newRoleResult = await client.query(
          "SELECT id FROM tbl_tarl_roles WHERE name = 'director'"
        );
        var directorRoleId = newRoleResult.rows[0].id;
      } else {
        var directorRoleId = directorRoleResult.rows[0].id;
      }

      // Create director user account
      const userResult = await client.query(`
        INSERT INTO tbl_tarl_users (
          username, 
          password, 
          full_name, 
          email, 
          phone, 
          role_id, 
          role, 
          school_id, 
          created_at, 
          updated_at,
          is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), true)
        RETURNING id, username
      `, [
        directorUsername,
        tempPassword, // In production, this should be hashed
        school.director_name,
        school.director_email,
        school.director_phone,
        directorRoleId,
        'director',
        schoolId
      ]);

      const newUser = userResult.rows[0];

      // Update school with director user ID
      await client.query(
        'UPDATE tbl_tarl_school_list SET director_user_id = $1 WHERE "sclAutoID" = $2',
        [newUser.id, schoolId]
      );

      directorCredentials = {
        username: directorUsername,
        password: tempPassword,
        userId: newUser.id
      };
    }

    // Log the approval/rejection activity
    const auditLogger = getAuditLogger(pool);
    await auditLogger.logActivity({
      userId: currentUser.id,
      username: currentUser.full_name,
      userRole: currentUser.role,
      actionType: 'UPDATE',
      tableName: 'tbl_tarl_school_list',
      recordId: schoolId,
      oldData: school,
      newData: updatedSchool,
      changesSummary: `School "${school.sclName}" (${school.sclCode}) ${action}ed by ${currentUser.full_name}. ${note ? `Note: ${note}` : ''}`,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined
    });

    // If director account was created, log that too
    if (directorCredentials) {
      await auditLogger.logActivity({
        userId: currentUser.id,
        username: currentUser.full_name,
        userRole: currentUser.role,
        actionType: 'CREATE',
        tableName: 'tbl_tarl_users',
        recordId: directorCredentials.userId,
        newData: {
          username: directorCredentials.username,
          role: 'director',
          school_id: schoolId,
          full_name: school.director_name
        },
        changesSummary: `Director account created for approved school "${school.sclName}" - Username: ${directorCredentials.username}`,
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') || undefined
      });
    }

    await client.query('COMMIT');

    const response: any = {
      success: true,
      message: `School ${action}ed successfully`,
      data: {
        schoolId: updatedSchool.sclAutoID,
        schoolName: updatedSchool.sclName,
        schoolCode: updatedSchool.sclCode,
        status: updatedSchool.registration_status,
        approvedBy: currentUser.full_name,
        approvedAt: new Date().toISOString()
      }
    };

    // Include director credentials in response if school was approved
    if (directorCredentials) {
      response.directorCredentials = {
        username: directorCredentials.username,
        password: directorCredentials.password,
        message: "Director login credentials (please share securely with the director)"
      };
    }

    return NextResponse.json(response);

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("School approval error:", error);
    
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
      "SELECT id, full_name, role FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];

    // Check if user is admin
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');

    if (!schoolId) {
      return NextResponse.json({ error: "School ID is required" }, { status: 400 });
    }

    // Get school details with approval information
    const schoolResult = await client.query(`
      SELECT 
        s."sclAutoID" as id,
        s."sclName" as school_name,
        s."sclCode" as school_code,
        s.director_name,
        s.director_sex,
        s.director_age,
        s.director_phone,
        s.director_email,
        s.village,
        s."commune",
        s."district",
        s."province",
        s.note,
        s.gps_latitude,
        s.gps_longitude,
        s.registration_status,
        s.approved_by,
        s.approved_at,
        s."createdAt" as created_at,
        s."updatedAt" as updated_at,
        ab.full_name as approved_by_name,
        du.username as director_username
      FROM tbl_tarl_school_list s
      LEFT JOIN tbl_tarl_users ab ON s.approved_by = ab.id
      LEFT JOIN tbl_tarl_users du ON s.director_user_id = du.id
      WHERE s."sclAutoID" = $1 AND s.is_deleted = false
    `, [schoolId]);

    if (schoolResult.rows.length === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: schoolResult.rows[0]
    });

  } catch (error: any) {
    console.error("Error fetching school details:", error);
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