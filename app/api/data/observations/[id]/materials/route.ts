import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT * FROM tbl_tarl_observation_materials WHERE observation_id = $1', [id]);
    client.release();
    return NextResponse.json(res.rows);
  } catch (error) {
    console.error("Error fetching observation materials:", error);
    return NextResponse.json({ message: "Error fetching observation materials" }, { status: 500 });
  }
} 