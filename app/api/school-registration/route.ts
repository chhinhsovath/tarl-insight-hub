import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { getAuditLogger } from "@/lib/audit-logger";

const pool = getPool();

// Enhanced registration handler for comprehensive school information
async function handleEnhancedRegistration(client: any, request: NextRequest, body: any) {
  const { schoolId, schoolData } = body;
  
  // For public registration, we don't require authentication
  // Instead, we'll log it as a public registration
  const user = {
    id: null,
    username: schoolData.directorName || 'Unknown Director',
    role: 'public'
  };

  // Create comprehensive registration table if it doesn't exist
  await client.query(`
    CREATE TABLE IF NOT EXISTS tbl_tarl_school_registrations (
      id SERIAL PRIMARY KEY,
      school_id INTEGER,
      registered_by INTEGER,
      
      -- Basic Information
      school_type VARCHAR(50),
      school_level VARCHAR(50),
      established_year INTEGER,
      total_classes INTEGER,
      total_students INTEGER,
      total_teachers INTEGER,
      
      -- School Details
      school_code VARCHAR(50),
      school_cluster VARCHAR(100),
      school_zone VARCHAR(100),
      school_zone_name VARCHAR(100),
      
      -- Demographic Areas
      province_id INTEGER,
      district_id INTEGER,
      commune_id INTEGER,
      village_id INTEGER,
      province_name VARCHAR(100),
      district_name VARCHAR(100),
      commune_name VARCHAR(100),
      village_name VARCHAR(100),
      detailed_address TEXT,
      postal_code VARCHAR(20),
      
      -- Infrastructure
      building_condition VARCHAR(50),
      classroom_count INTEGER,
      toilet_count INTEGER,
      library_available BOOLEAN DEFAULT FALSE,
      computer_lab_available BOOLEAN DEFAULT FALSE,
      internet_available BOOLEAN DEFAULT FALSE,
      electricity_available BOOLEAN DEFAULT FALSE,
      water_source_available BOOLEAN DEFAULT FALSE,
      
      -- Director Information
      director_name VARCHAR(255),
      director_gender VARCHAR(10),
      director_age INTEGER,
      director_phone VARCHAR(50),
      director_email VARCHAR(255),
      director_education VARCHAR(100),
      director_experience INTEGER,
      
      -- Contact & Location
      school_phone VARCHAR(50),
      school_email VARCHAR(255),
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      
      -- Additional Information
      challenges TEXT,
      achievements TEXT,
      support_needed TEXT,
      notes TEXT,
      
      registration_date TIMESTAMP DEFAULT NOW(),
      status VARCHAR(20) DEFAULT 'pending',
      approved_by INTEGER,
      approved_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await client.query('BEGIN');

  try {
    // Fetch demographic names if IDs are provided
    let demographicData = {
      provinceName: null,
      districtName: null, 
      communeName: null,
      villageName: null
    };

    // If we have a village ID, we can get all demographic info from tbl_tarl_demographics
    if (schoolData.villageId) {
      try {
        const demographicResult = await client.query(`
          SELECT 
            pro_code, pro_name,
            dis_code, dis_name,
            com_code, com_name,
            vil_code, vil_name
          FROM tbl_tarl_demographics 
          WHERE id = $1
        `, [parseInt(schoolData.villageId)]);

        if (demographicResult.rows.length > 0) {
          const demo = demographicResult.rows[0];
          demographicData.provinceName = demo.pro_name;
          demographicData.districtName = demo.dis_name;
          demographicData.communeName = demo.com_name;
          demographicData.villageName = demo.vil_name;
        }
      } catch (error) {
        console.error('Error fetching demographic data:', error);
      }
    } else {
      // Fallback: get names individually if IDs are provided
      try {
        const queries = [];
        if (schoolData.provinceId) {
          queries.push(client.query('SELECT DISTINCT pro_name FROM tbl_tarl_demographics WHERE pro_code = $1', [parseInt(schoolData.provinceId)]));
        }
        if (schoolData.districtId) {
          queries.push(client.query('SELECT DISTINCT dis_name FROM tbl_tarl_demographics WHERE dis_code = $1', [parseInt(schoolData.districtId)]));
        }
        if (schoolData.communeId) {
          queries.push(client.query('SELECT DISTINCT com_name FROM tbl_tarl_demographics WHERE com_code = $1', [parseInt(schoolData.communeId)]));
        }

        const results = await Promise.all(queries);
        
        if (schoolData.provinceId && results[0]?.rows.length > 0) {
          demographicData.provinceName = results[0].rows[0].pro_name;
        }
        if (schoolData.districtId && results[1]?.rows.length > 0) {
          demographicData.districtName = results[1].rows[0].dis_name;
        }
        if (schoolData.communeId && results[2]?.rows.length > 0) {
          demographicData.communeName = results[2].rows[0].com_name;
        }
      } catch (error) {
        console.error('Error fetching demographic names:', error);
      }
    }

    // Insert comprehensive school registration data
    const insertResult = await client.query(`
      INSERT INTO tbl_tarl_school_registrations (
        school_id, registered_by, school_type, school_level, established_year,
        total_classes, total_students, total_teachers, 
        school_code, school_cluster, school_zone,
        province_id, district_id, commune_id, village_id,
        province_name, district_name, commune_name, village_name,
        detailed_address, postal_code,
        building_condition, classroom_count, toilet_count, 
        library_available, computer_lab_available, internet_available, 
        electricity_available, water_source_available,
        director_name, director_gender, director_age, director_phone,
        director_email, director_education, director_experience,
        school_phone, school_email, latitude, longitude,
        challenges, achievements, support_needed, notes,
        registration_date, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
        $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41,
        NOW(), 'pending'
      )
      RETURNING id
    `, [
      schoolId, user.id || null,
      schoolData.schoolType || null, schoolData.schoolLevel || null,
      schoolData.establishedYear ? parseInt(schoolData.establishedYear) : null,
      schoolData.totalClasses ? parseInt(schoolData.totalClasses) : null,
      schoolData.totalStudents ? parseInt(schoolData.totalStudents) : null,
      schoolData.totalTeachers ? parseInt(schoolData.totalTeachers) : null,
      schoolData.schoolCode || null, schoolData.schoolCluster || null, schoolData.schoolZone || null,
      schoolData.provinceId ? parseInt(schoolData.provinceId) : null,
      schoolData.districtId ? parseInt(schoolData.districtId) : null,
      schoolData.communeId ? parseInt(schoolData.communeId) : null,
      schoolData.villageId ? parseInt(schoolData.villageId) : null,
      demographicData.provinceName, demographicData.districtName, 
      demographicData.communeName, demographicData.villageName,
      schoolData.detailedAddress || null, schoolData.postalCode || null,
      schoolData.buildingCondition || null,
      schoolData.classroomCount ? parseInt(schoolData.classroomCount) : null,
      schoolData.toiletCount ? parseInt(schoolData.toiletCount) : null,
      schoolData.libraryAvailable === 'yes',
      schoolData.computerLabAvailable === 'yes',
      schoolData.internetAvailable === 'yes',
      schoolData.electricityAvailable === 'yes',
      schoolData.waterSourceAvailable === 'yes',
      schoolData.directorName || null, schoolData.directorGender || null,
      schoolData.directorAge ? parseInt(schoolData.directorAge) : null,
      schoolData.directorPhone || null, schoolData.directorEmail || null,
      schoolData.directorEducation || null,
      schoolData.directorExperience ? parseInt(schoolData.directorExperience) : null,
      schoolData.schoolPhone || null, schoolData.schoolEmail || null,
      schoolData.latitude ? parseFloat(schoolData.latitude) : null,
      schoolData.longitude ? parseFloat(schoolData.longitude) : null,
      schoolData.challenges || null, schoolData.achievements || null,
      schoolData.supportNeeded || null, schoolData.notes || null
    ]);

    const registrationId = insertResult.rows[0].id;

    // Log the registration activity
    const auditLogger = getAuditLogger(pool);
    await auditLogger.logActivity({
      userId: user.id || undefined,
      username: user.username,
      userRole: user.role,
      actionType: 'CREATE',
      tableName: 'tbl_tarl_school_registrations',
      recordId: registrationId,
      newData: { schoolId, ...schoolData },
      changesSummary: `Comprehensive school registration submitted for school ID ${schoolId} by ${schoolData.directorName || 'Unknown Director'}`,
      ipAddress: getClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined
    });

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Comprehensive school registration submitted successfully',
      registrationId: registrationId,
      status: 'pending'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

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
    
    // Handle both old and new API format
    const isEnhancedForm = body.schoolId && body.schoolData;
    
    if (isEnhancedForm) {
      // New enhanced form handling
      return handleEnhancedRegistration(client, request, body);
    }
    
    // Legacy form handling
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
      userId: undefined, // No user ID for public registration
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