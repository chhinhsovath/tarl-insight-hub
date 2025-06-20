import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();

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