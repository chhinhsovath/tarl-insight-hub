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
  const userId = searchParams.get('userId');

  try {
    const client = await pool.connect();
    let queryText = 'SELECT * FROM tbl_tarl_observation_responses';
    const queryParams = [];

    if (userId) {
      queryText += ' WHERE created_by = $1';
      queryParams.push(userId);
    }

    const res = await client.query(queryText, queryParams);
    client.release();
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error("Error fetching observations:", error);
    return NextResponse.json({ message: "Error fetching observations" }, { status: 500 });
  }
} 