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
  const provinceId = searchParams.get('provinceId');
  const districtId = searchParams.get('districtId');
  const schoolId = searchParams.get('schoolId');
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  try {
    const client = await pool.connect();
    let queryText = `
      SELECT 
        province_id,
        district_id,
        school_id,
        EXTRACT(YEAR FROM assessment_date) AS assessment_year,
        EXTRACT(MONTH FROM assessment_date) AS assessment_month,
        SUM(CASE WHEN assessment_level = 1 THEN 1 ELSE 0 END) AS level_1_count,
        SUM(CASE WHEN assessment_level = 2 THEN 1 ELSE 0 END) AS level_2_count,
        SUM(CASE WHEN assessment_level = 3 THEN 1 ELSE 0 END) AS level_3_count,
        SUM(CASE WHEN assessment_level = 4 THEN 1 ELSE 0 END) AS level_4_count,
        SUM(CASE WHEN assessment_level = 5 THEN 1 ELSE 0 END) AS level_5_count
      FROM tbl_tarl_learning_progress_summary
    `;
    const queryParams = [];
    const conditions = [];
    let paramCount = 1;

    if (provinceId) {
      conditions.push(`province_id = $${paramCount++}`);
      queryParams.push(provinceId);
    }
    if (districtId) {
      conditions.push(`district_id = $${paramCount++}`);
      queryParams.push(districtId);
    }
    if (schoolId) {
      conditions.push(`school_id = $${paramCount++}`);
      queryParams.push(schoolId);
    }
    if (year) {
      conditions.push(`EXTRACT(YEAR FROM assessment_date) = $${paramCount++}`);
      queryParams.push(year);
    }
    if (month) {
      conditions.push(`EXTRACT(MONTH FROM assessment_date) = $${paramCount++}`);
      queryParams.push(month);
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(' AND ')}`;
    }

    queryText += `
      GROUP BY province_id, district_id, school_id, assessment_year, assessment_month
      ORDER BY assessment_year DESC, assessment_month DESC
    `;

    const res = await client.query(queryText, queryParams);
    client.release();
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error("Error fetching learning progress summary:", error);
    return NextResponse.json({ message: "Error fetching learning progress summary" }, { status: 500 });
  }
} 