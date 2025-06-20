import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();

export async function GET() {
  const client = await pool.connect();

  try {
    const query = `
      SELECT 
        id,
        country_name,
        country_code,
        created_at
      FROM tbl_tarl_countries
      ORDER BY country_name
    `;

    const result = await client.query(query);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}