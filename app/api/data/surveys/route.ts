import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();

export async function GET() {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT * FROM tbl_tarl_surveys');
    client.release();
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error("Error fetching surveys:", error);
    return NextResponse.json({ message: "Error fetching surveys" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const survey = await request.json();
    const client = await pool.connect();
    const res = await client.query(
      `INSERT INTO tbl_tarl_surveys (
        title, description, status, created_at
      ) VALUES (
        $1, $2, $3, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        survey.title, survey.description, survey.status
      ]
    );
    client.release();
    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating survey:", error);
    return NextResponse.json({ message: "Error creating survey" }, { status: 500 });
  }
} 