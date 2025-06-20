import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT id, name, name_kh, code FROM tbl_tarl_provinces ORDER BY name");
    client.release();
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 