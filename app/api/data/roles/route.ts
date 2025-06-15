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
    const result = await pool.query("SELECT id, name FROM tbl_tarl_roles ORDER BY name ASC");
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 