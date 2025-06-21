import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { getAuditLogger, getUserDataFromSession } from "@/lib/audit-logger";

const pool = getPool();
const auditLogger = getAuditLogger(pool);

export async function GET(request: NextRequest) {
  try {
    // Validate admin access
    const user = await getUserDataFromSession();
    if (!user || !['admin', 'director'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;
    const client = await pool.connect();

    try {
      // Build WHERE clause
      let whereConditions = ['1=1'];
      let queryParams: any[] = [];
      let paramIndex = 1;

      if (status !== 'all') {
        whereConditions.push(`sr.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }

      if (search) {
        whereConditions.push(`(
          sr.director_name ILIKE $${paramIndex} OR 
          s."sclName" ILIKE $${paramIndex} OR 
          s."sclCode" ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Get registrations with school information
      const registrationsResult = await client.query(`
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
        WHERE ${whereClause}
        ORDER BY sr.registration_date DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...queryParams, limit, offset]);

      // Get total count
      const countResult = await client.query(`
        SELECT COUNT(*) as total
        FROM tbl_tarl_school_registrations sr
        LEFT JOIN tbl_tarl_schools s ON sr.school_id = s."sclAutoID"
        WHERE ${whereClause}
      `, queryParams);

      const total = parseInt(countResult.rows[0].total);

      // Log access
      await auditLogger.logActivity({
        userId: user.user_id,
        username: user.username,
        userRole: user.role,
        actionType: 'READ',
        tableName: 'tbl_tarl_school_registrations',
        changesSummary: `Accessed school registrations list (${registrationsResult.rows.length} records)`,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined
      });

      return NextResponse.json({
        success: true,
        registrations: registrationsResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error("Error fetching school registrations:", error);
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}