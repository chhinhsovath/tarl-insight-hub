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
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT DISTINCT "sclZoneName" FROM tbl_tarl_schools WHERE "sclZoneName" IS NOT NULL ORDER BY "sclZoneName"');
    client.release();
    return NextResponse.json(result.rows.map(row => row.sclZoneName));
  } catch (error) {
    console.error("Error fetching unique zones:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 