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

  try {
    const client = await pool.connect();
    let queryText = 'SELECT id, name, name_kh, code, province_id FROM tbl_tarl_districts';
    const queryParams = [];

    if (provinceId) {
      queryText += ' WHERE province_id = $1';
      queryParams.push(provinceId);
    }

    const res = await client.query(queryText, queryParams);
    client.release();
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error("Error fetching districts:", error);
    return NextResponse.json({ message: "Error fetching districts" }, { status: 500 });
  }
} 