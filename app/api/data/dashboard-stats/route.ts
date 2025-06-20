import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provinceId = searchParams.get('provinceId');
  const districtId = searchParams.get('districtId');
  const schoolId = searchParams.get('schoolId');

  try {
    const client = await pool.connect();
    let queryText = `
      SELECT 
        (SELECT COUNT(*) FROM tbl_tarl_users WHERE role = 'Teacher'
          ${provinceId ? `AND province_id = ${client.escapeLiteral(provinceId)}` : ''}
          ${districtId ? `AND district_id = ${client.escapeLiteral(districtId)}` : ''}
          ${schoolId ? `AND school_id = ${client.escapeLiteral(schoolId)}` : ''}
        ) AS total_teachers,
        (SELECT COUNT(*) FROM tbl_tarl_students
          ${provinceId ? `WHERE province_id = ${client.escapeLiteral(provinceId)}` : ''}
          ${districtId ? `${provinceId ? 'AND' : 'WHERE'} district_id = ${client.escapeLiteral(districtId)}` : ''}
          ${schoolId ? `${provinceId || districtId ? 'AND' : 'WHERE'} school_id = ${client.escapeLiteral(schoolId)}` : ''}
        ) AS total_students,
        (SELECT COUNT(*) FROM tbl_tarl_schools
          ${provinceId ? `WHERE province_id = ${client.escapeLiteral(provinceId)}` : ''}
          ${districtId ? `${provinceId ? 'AND' : 'WHERE'} district_id = ${client.escapeLiteral(districtId)}` : ''}
          ${schoolId ? `${provinceId || districtId ? 'AND' : 'WHERE'} id = ${client.escapeLiteral(schoolId)}` : ''}
        ) AS total_schools,
        (SELECT COUNT(*) FROM tbl_tarl_observation_responses
          ${provinceId ? `WHERE province_id = ${client.escapeLiteral(provinceId)}` : ''}
          ${districtId ? `${provinceId ? 'AND' : 'WHERE'} district_id = ${client.escapeLiteral(districtId)}` : ''}
          ${schoolId ? `${provinceId || districtId ? 'AND' : 'WHERE'} school_id = ${client.escapeLiteral(schoolId)}` : ''}
        ) AS total_observations
    `;

    const res = await client.query(queryText);
    client.release();
    return NextResponse.json(res.rows[0]);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json({ message: "Error fetching dashboard stats" }, { status: 500 });
  }
} 