import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();

export async function GET(request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  try {
    const { schoolId: schoolIdStr } = await params;
    const schoolId = parseInt(schoolIdStr, 10);

    if (isNaN(schoolId)) {
      return NextResponse.json({ message: "Invalid School ID" }, { status: 400 });
    }

    const client = await pool.connect();
    const query = `
      SELECT 
        "sclAutoID" as id,
        "sclName" as name,
        "sclCode" as code,
        "sclCluster" as cluster,
        "sclCommune" as commune,
        "sclDistrict" as district,
        "sclProvince" as province,
        "sclZone" as zone,
        "sclOrder" as order,
        "sclStatus" as status,
        "sclImage" as image,
        "sclZoneName" as "zoneName",
        "sclProvinceName" as "provinceName",
        "sclDistrictName" as "districtName",
        "total_students" as "totalStudents",
        "total_teachers" as "totalTeachers",
        "total_teachers_female" as "totalTeachersFemale",
        "total_students_female" as "totalStudentsFemale"
      FROM
        tbl_tarl_schools
      WHERE "sclAutoID" = $1
    `;
    const result = await client.query(query, [schoolId]);
    client.release();

    if (result.rows.length > 0) {
      return NextResponse.json(result.rows[0]);
    } else {
      return NextResponse.json({ message: "School not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error fetching school by ID:", error);
    return NextResponse.json(
      { message: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  try {
    const { schoolId: schoolIdStr } = await params;
    const schoolId = parseInt(schoolIdStr, 10);

    if (isNaN(schoolId)) {
      return NextResponse.json({ message: "Invalid School ID" }, { status: 400 });
    }

    const data = await request.json();
    console.log('Received data for school update:', JSON.stringify(data, null, 2));
    
    const client = await pool.connect();
    let updateFields = [];
    let params = [];
    let paramIndex = 1;

    // Map frontend camelCase to database columns that exist
    if (data.name !== undefined) { updateFields.push(`"sclName" = $${paramIndex++}`); params.push(data.name); }
    if (data.code !== undefined) { updateFields.push(`"sclCode" = $${paramIndex++}`); params.push(data.code); }
    if (data.cluster !== undefined) { updateFields.push(`"sclCluster" = $${paramIndex++}`); params.push(data.cluster); }
    if (data.commune !== undefined) { updateFields.push(`"sclCommune" = $${paramIndex++}`); params.push(data.commune); }
    if (data.district !== undefined) { updateFields.push(`"sclDistrict" = $${paramIndex++}`); params.push(data.district); }
    if (data.province !== undefined) { updateFields.push(`"sclProvince" = $${paramIndex++}`); params.push(data.province); }
    if (data.zone !== undefined) { updateFields.push(`"sclZone" = $${paramIndex++}`); params.push(data.zone); }
    if (data.order !== undefined) { updateFields.push(`"sclOrder" = $${paramIndex++}`); params.push(data.order); }
    if (data.status !== undefined) { updateFields.push(`"sclStatus" = $${paramIndex++}`); params.push(data.status); }
    if (data.image !== undefined) { updateFields.push(`"sclImage" = $${paramIndex++}`); params.push(data.image); }
    if (data.zoneName !== undefined) { updateFields.push(`"sclZoneName" = $${paramIndex++}`); params.push(data.zoneName); }
    if (data.provinceName !== undefined) { updateFields.push(`"sclProvinceName" = $${paramIndex++}`); params.push(data.provinceName); }
    if (data.districtName !== undefined) { updateFields.push(`"sclDistrictName" = $${paramIndex++}`); params.push(data.districtName); }
    if (data.totalStudents !== undefined) { updateFields.push(`"total_students" = $${paramIndex++}`); params.push(data.totalStudents); }
    if (data.totalTeachers !== undefined) { updateFields.push(`"total_teachers" = $${paramIndex++}`); params.push(data.totalTeachers); }
    if (data.totalTeachersFemale !== undefined) { updateFields.push(`"total_teachers_female" = $${paramIndex++}`); params.push(data.totalTeachersFemale); }
    if (data.totalStudentsFemale !== undefined) { updateFields.push(`"total_students_female" = $${paramIndex++}`); params.push(data.totalStudentsFemale); }
    
    if (updateFields.length === 0) {
      client.release();
      return NextResponse.json({ message: "No fields to update" }, { status: 400 });
    }

    const query = `
      UPDATE tbl_tarl_schools
      SET ${updateFields.join(", ")},
      "updatedAt" = NOW()
      WHERE "sclAutoID" = $${paramIndex++}
      RETURNING *;
    `;
    params.push(schoolId);

    console.log('Update query:', query);
    console.log('Update params:', params);

    const result = await client.query(query, params);
    client.release();
    
    console.log('Update result rows:', result.rows.length);

    if (result.rows.length > 0) {
      return NextResponse.json(result.rows[0]);
    } else {
      return NextResponse.json({ message: "School not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error updating school:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 