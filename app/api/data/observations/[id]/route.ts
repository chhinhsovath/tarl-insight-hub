import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT * FROM tbl_tarl_observation_responses WHERE id = $1', [id]);
    client.release();
    if (res.rows.length === 0) {
      return NextResponse.json({ message: "Observation not found" }, { status: 404 });
    }
    return NextResponse.json(res.rows[0]);
  } catch (error) {
    console.error("Error fetching observation by ID:", error);
    return NextResponse.json({ message: "Error fetching observation" }, { status: 500 });
  }
} 