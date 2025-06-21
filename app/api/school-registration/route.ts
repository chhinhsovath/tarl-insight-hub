import { NextRequest, NextResponse } from "next/server";
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

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const body = await request.json();
    const {
      schoolName,
      schoolCode,
      directorName,
      directorSex,
      directorAge,
      directorPhone,
      directorEmail,
      provinceId,
      districtId,
      communeId,
      villageId,
      note,
      gpsLatitude,
      gpsLongitude
    } = body;

    // Validate required fields
    const requiredFields = {
      schoolName: "School name",
      schoolCode: "School code", 
      directorName: "Director name",
      directorSex: "Director gender",
      directorPhone: "Director phone",
      provinceId: "Province",
      districtId: "District",
      communeId: "Commune", 
      villageId: "Village",
      gpsLatitude: "GPS latitude",
      gpsLongitude: "GPS longitude"
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
    if (directorEmail && !/\S+@\S+\.\S+/.test(directorEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if school code already exists
    const existingSchool = await client.query(
      'SELECT "sclAutoID" FROM tbl_tarl_school_list WHERE "sclCode" = $1 AND is_deleted = false',
      [schoolCode]
    );

    if (existingSchool.rows.length > 0) {
      return NextResponse.json(
        { error: "School code already exists" },
        { status: 409 }
      );
    }

    // Check if director email already exists (if provided)
    if (directorEmail) {
      const existingEmail = await client.query(
        'SELECT "sclAutoID" FROM tbl_tarl_school_list WHERE director_email = $1 AND is_deleted = false',
        [directorEmail]
      );

      if (existingEmail.rows.length > 0) {
        return NextResponse.json(
          { error: "Director email already exists" },
          { status: 409 }
        );
      }
    }

    // Fetch location names from demographic tables
    const locationQueries = await Promise.all([
      client.query('SELECT name, name_kh FROM tbl_tarl_provinces WHERE id = $1', [provinceId]),
      client.query('SELECT name, name_kh FROM tbl_tarl_districts WHERE id = $1', [districtId]),
      client.query('SELECT commune_name FROM tbl_tarl_communes WHERE id = $1', [communeId]),
      client.query('SELECT village_name FROM tbl_tarl_villages WHERE id = $1', [villageId])
    ]);

    const provinceName = locationQueries[0].rows[0]?.name || '';
    const districtName = locationQueries[1].rows[0]?.name || '';
    const communeName = locationQueries[2].rows[0]?.commune_name || '';
    const villageName = locationQueries[3].rows[0]?.village_name || '';

    await client.query('BEGIN');

    // Insert new school registration
    const insertResult = await client.query(`
      INSERT INTO tbl_tarl_school_list (
        "sclName", 
        "sclCode", 
        director_name, 
        director_sex, 
        director_age, 
        director_phone, 
        director_email,
        village,
        "commune",
        "district", 
        "province",
        village_id,
        commune_id,
        district_id,
        province_id,
        note,
        gps_latitude,
        gps_longitude,
        registration_status,
        "createdAt",
        "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
      RETURNING "sclAutoID", "sclName", "sclCode", director_name, registration_status
    `, [
      schoolName,
      schoolCode, 
      directorName,
      directorSex,
      directorAge ? parseInt(directorAge) : null,
      directorPhone,
      directorEmail || null,
      villageName,
      communeName,
      districtName,
      provinceName,
      parseInt(villageId),
      parseInt(communeId),
      parseInt(districtId),
      parseInt(provinceId),
      note || null,
      parseFloat(gpsLatitude),
      parseFloat(gpsLongitude),
      'pending'
    ]);

    const newSchool = insertResult.rows[0];

    // Log the registration activity
    const auditLogger = getAuditLogger(pool);
    await auditLogger.logActivity({
      userId: null, // No user ID for public registration
      username: directorName,
      userRole: 'public',
      actionType: 'CREATE',
      tableName: 'tbl_tarl_school_list',
      recordId: newSchool.sclAutoID,
      newData: newSchool,
      changesSummary: `School registration submitted: "${schoolName}" (${schoolCode}) by director ${directorName}`,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined
    });

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: "School registration submitted successfully",
      data: {
        schoolId: newSchool.sclAutoID,
        schoolName: newSchool.sclName,
        schoolCode: newSchool.sclCode,
        directorName: newSchool.director_name,
        status: newSchool.registration_status
      }
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("School registration error:", error);
    
    // Handle duplicate key violations
    if (error.code === '23505') {
      if (error.constraint?.includes('sclCode')) {
        return NextResponse.json(
          { error: "School code already exists" },
          { status: 409 }
        );
      }
      if (error.constraint?.includes('director_email')) {
        return NextResponse.json(
          { error: "Director email already exists" },
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

export async function GET(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ['s.is_deleted = false'];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (status !== 'all') {
      whereConditions.push(`s.registration_status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(
        s."sclName" ILIKE $${paramIndex} OR 
        s."sclCode" ILIKE $${paramIndex} OR 
        s.director_name ILIKE $${paramIndex} OR
        s.village ILIKE $${paramIndex} OR
        s."commune" ILIKE $${paramIndex} OR
        s."district" ILIKE $${paramIndex} OR
        s."province" ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await client.query(`
      SELECT COUNT(*) as total
      FROM tbl_tarl_school_list s
      ${whereClause}
    `, queryParams);

    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const schoolsResult = await client.query(`
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
        ab.full_name as approved_by_name
      FROM tbl_tarl_school_list s
      LEFT JOIN tbl_tarl_users ab ON s.approved_by = ab.id
      ${whereClause}
      ORDER BY s."createdAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, limit, offset]);

    return NextResponse.json({
      success: true,
      data: schoolsResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error("Error fetching school registrations:", error);
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