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
    const res = await client.query('SELECT * FROM tbl_tarl_subjects');
    client.release();
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json({ message: "Error fetching subjects" }, { status: 500 });
  }
} 