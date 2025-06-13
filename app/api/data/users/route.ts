import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const provinceId = searchParams.get('provinceId');
  const districtId = searchParams.get('districtId');
  const schoolId = searchParams.get('schoolId');

  try {
    const client = await pool.connect();
    let queryText = `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.role,
        u.province_id,
        u.district_id,
        u.school_id,
        u.created_at,
        u.updated_at,
        p.name as province_name,
        d.name as district_name,
        s.name as school_name
      FROM tbl_tarl_users u
      LEFT JOIN tbl_tarl_provinces p ON u.province_id = p.id
      LEFT JOIN tbl_tarl_districts d ON u.district_id = d.id
      LEFT JOIN tbl_tarl_schools s ON u.school_id = s.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (role) {
      queryText += ` AND u.role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }

    if (provinceId) {
      queryText += ` AND u.province_id = $${paramCount}`;
      params.push(provinceId);
      paramCount++;
    }

    if (districtId) {
      queryText += ` AND u.district_id = $${paramCount}`;
      params.push(districtId);
      paramCount++;
    }

    if (schoolId) {
      queryText += ` AND u.school_id = $${paramCount}`;
      params.push(schoolId);
      paramCount++;
    }

    queryText += " ORDER BY u.full_name";

    const res = await client.query(queryText, params);
    client.release();
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ message: "Error fetching users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, email, role, provinceId, districtId, schoolId } = body;

    const client = await pool.connect();
    const res = await client.query(
      `INSERT INTO tbl_tarl_users (full_name, email, role, province_id, district_id, school_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [full_name, email, role, provinceId, districtId, schoolId]
    );
    client.release();

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ message: "Error creating user" }, { status: 500 });
  }
} 