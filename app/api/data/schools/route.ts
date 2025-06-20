import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("search");
    const countOnly = searchParams.get("count") === "true";
    const limit = parseInt(searchParams.get("limit") || '24', 10);
    const offset = parseInt(searchParams.get("offset") || '0', 10);
    const filterZone = searchParams.get("zone");
    const filterProvince = searchParams.get("province");
    const status = searchParams.get("status");
    
    const client = await pool.connect();
    let query;
    const params = [];
    let whereClauses = [];
    let paramIndex = 1;

    if (searchTerm) {
      whereClauses.push(`"sclName" ILIKE $${paramIndex++}`);
      params.push(`%${searchTerm}%`);
    }
    if (filterZone) {
      whereClauses.push(`"sclZoneName" ILIKE $${paramIndex++}`);
      params.push(`%${filterZone}%`);
    }
    if (filterProvince) {
      whereClauses.push(`"sclProvinceName" ILIKE $${paramIndex++}`);
      params.push(`%${filterProvince}%`);
    }
    if (status !== null && status !== undefined) {
      whereClauses.push(`"sclStatus" = $${paramIndex++}`);
      params.push(parseInt(status));
    }

    const whereClause = whereClauses.length > 0 ? " WHERE " + whereClauses.join(" AND ") : "";

    if (countOnly) {
      query = `SELECT COUNT(*) as total FROM tbl_tarl_schools${whereClause}`;
    } else {
      query = `
        SELECT 
          "sclAutoID" as id,
          "sclName" as name,
          "sclCode" as code,
          "sclStatus" as status,
          "sclZoneName" as "zoneName",
          "sclProvinceName" as "provinceName",
          "sclDistrictName" as "districtName",
          "total_students" as "totalStudents",
          "total_teachers" as "totalTeachers",
          "total_teachers_female" as "totalTeachersFemale",
          "total_students_female" as "totalStudentsFemale"
        FROM
          tbl_tarl_schools
        ${whereClause}
      `;
      query += ` ORDER BY "sclName" LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit, offset);
    }

    const result = await client.query(query, params);
    client.release();
    
    return NextResponse.json(countOnly ? { total: parseInt(result.rows[0].total) } : result.rows);
  } catch (error) {
    console.error("Error fetching schools:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}