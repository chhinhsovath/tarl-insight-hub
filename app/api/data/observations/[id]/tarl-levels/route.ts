import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT * FROM tbl_tarl_observation_tarl_levels WHERE observation_id = $1', [id]);
    client.release();
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error("Error fetching observation Tarl levels:", error);
    return NextResponse.json({ message: "Error fetching observation Tarl levels" }, { status: 500 });
  }
} 