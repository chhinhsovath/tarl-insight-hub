import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

export async function GET() {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT * FROM tbl_tarl_students');
    client.release();
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ message: "Error fetching students" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const student = await request.json();
    const client = await pool.connect();
    const res = await client.query(
      `INSERT INTO tbl_tarl_students (
        full_name, gender, date_of_birth, place_of_birth, 
        national_id, province_id, district_id, school_id,
        grade, current_level, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        student.full_name, student.gender, student.date_of_birth, student.place_of_birth,
        student.national_id, student.province_id, student.district_id, student.school_id,
        student.grade, student.current_level
      ]
    );
    client.release();
    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json({ message: "Error creating student" }, { status: 500 });
  }
} 