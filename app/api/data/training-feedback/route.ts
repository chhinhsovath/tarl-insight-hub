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
    const res = await client.query('SELECT * FROM tbl_tarl_training_feedback');
    client.release();
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error("Error fetching training feedback:", error);
    return NextResponse.json({ message: "Error fetching training feedback" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const feedback = await request.json();
    const client = await pool.connect();
    const res = await client.query(
      `INSERT INTO tbl_tarl_training_feedback (
        user_id, training_id, rating, comments, created_at
      ) VALUES (
        $1, $2, $3, $4, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        feedback.user_id, feedback.training_id, feedback.rating, feedback.comments
      ]
    );
    client.release();
    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating training feedback:", error);
    return NextResponse.json({ message: "Error creating training feedback" }, { status: 500 });
  }
} 