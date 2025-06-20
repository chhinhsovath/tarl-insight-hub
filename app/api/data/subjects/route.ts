import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();

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