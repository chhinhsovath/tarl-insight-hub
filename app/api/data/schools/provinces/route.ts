import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();

export async function GET(request: Request) {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT DISTINCT "sclProvinceName" FROM tbl_tarl_schools WHERE "sclProvinceName" IS NOT NULL ORDER BY "sclProvinceName"');
    client.release();
    return NextResponse.json(result.rows.map(row => row.sclProvinceName));
  } catch (error) {
    console.error("Error fetching unique provinces:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 