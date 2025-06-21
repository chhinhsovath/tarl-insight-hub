import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { getAuditLogger, getUserDataFromSession } from "@/lib/audit-logger";

const pool = getPool();
const auditLogger = getAuditLogger(pool);

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validate admin access
    const user = await getUserDataFromSession();
    if (!user || !['admin', 'director'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const registrationId = parseInt(params.id);
    const { action, notes } = await request.json();

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'reject' && !notes?.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get registration details
      const registrationResult = await client.query(`
        SELECT sr.*, s."sclName" as school_name, s."sclCode" as school_code
        FROM tbl_tarl_school_registrations sr
        LEFT JOIN tbl_tarl_schools s ON sr.school_id = s."sclAutoID"
        WHERE sr.id = $1
      `, [registrationId]);

      if (registrationResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
      }

      const registration = registrationResult.rows[0];

      if (registration.status !== 'pending') {
        await client.query('ROLLBACK');
        return NextResponse.json({ 
          error: `Registration has already been ${registration.status}` 
        }, { status: 400 });
      }

      // Update registration status
      const updateResult = await client.query(`
        UPDATE tbl_tarl_school_registrations 
        SET 
          status = $1,
          approved_by = $2,
          approved_date = NOW(),
          updated_at = NOW(),
          notes = CASE 
            WHEN $3 IS NOT NULL THEN COALESCE(notes, '') || CASE WHEN notes IS NOT NULL AND notes != '' THEN E'\n\n' ELSE '' END || 'Admin ' || $1 || ' (' || NOW()::date || '): ' || $3
            ELSE notes
          END
        WHERE id = $4
        RETURNING *
      `, [action === 'approve' ? 'approved' : 'rejected', user.user_id, notes, registrationId]);

      const updatedRegistration = updateResult.rows[0];

      // If approved, create user account for the director
      if (action === 'approve') {
        // Check if user already exists with this phone number
        const existingUserResult = await client.query(`
          SELECT id FROM tbl_tarl_users WHERE phone_number = $1
        `, [registration.director_phone]);

        if (existingUserResult.rows.length === 0) {
          // Create new user account for the director
          const newUserResult = await client.query(`
            INSERT INTO tbl_tarl_users (
              full_name, 
              username, 
              phone_number, 
              email, 
              role, 
              password_hash,
              school_id,
              is_active,
              created_at,
              updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
            RETURNING id, username
          `, [
            registration.director_name,
            `director_${registration.director_phone}`, // Generate username
            registration.director_phone,
            registration.director_email || null,
            'teacher', // Default role for school directors
            '$2b$10$defaulthash', // Placeholder - will need to be reset
            registration.school_id
          ]);

          const newUser = newUserResult.rows[0];

          // Log user creation
          await auditLogger.logActivity({
            userId: user.user_id,
            username: user.username,
            userRole: user.role,
            actionType: 'CREATE',
            tableName: 'tbl_tarl_users',
            recordId: newUser.id,
            newData: newUser,
            changesSummary: `Created user account for approved school director: ${registration.director_name}`,
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
            userAgent: request.headers.get('user-agent') || undefined
          });
        }
      }

      await client.query('COMMIT');

      // Log approval/rejection activity
      await auditLogger.logActivity({
        userId: user.user_id,
        username: user.username,
        userRole: user.role,
        actionType: 'UPDATE',
        tableName: 'tbl_tarl_school_registrations',
        recordId: registrationId,
        oldData: registration,
        newData: updatedRegistration,
        changesSummary: `${action === 'approve' ? 'Approved' : 'Rejected'} school registration for ${registration.school_name || registration.director_name}${notes ? ` with notes: ${notes}` : ''}`,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined
      });

      // Send notification (placeholder for future implementation)
      // await sendNotificationToDirector(registration, action, notes);

      return NextResponse.json({
        success: true,
        message: `Registration ${action}d successfully`,
        registration: updatedRegistration
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error("Error processing registration approval:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET method to retrieve specific registration details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validate admin access
    const user = await getUserDataFromSession();
    if (!user || !['admin', 'director'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const registrationId = parseInt(params.id);
    const client = await pool.connect();

    try {
      const result = await client.query(`
        SELECT 
          sr.*,
          s."sclName" as school_name,
          s."sclCode" as school_code,
          s."sclProvinceName" as school_province,
          s."sclDistrictName" as school_district,
          s."sclCommune" as school_commune,
          approver.full_name as approved_by_name
        FROM tbl_tarl_school_registrations sr
        LEFT JOIN tbl_tarl_schools s ON sr.school_id = s."sclAutoID"
        LEFT JOIN tbl_tarl_users approver ON sr.approved_by = approver.id
        WHERE sr.id = $1
      `, [registrationId]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        registration: result.rows[0]
      });

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error("Error fetching registration details:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}