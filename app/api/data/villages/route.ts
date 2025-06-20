import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const communeId = searchParams.get("commune_id");

  const client = await pool.connect();

  try {
    let query = `
      SELECT 
        id,
        village_name,
        commune_id,
        created_at
      FROM tbl_tarl_villages
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (communeId) {
      query += ` AND commune_id = $${paramIndex}`;
      params.push(parseInt(communeId));
      paramIndex++;
    }

    query += ` ORDER BY village_name`;

    const result = await client.query(query, params);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching villages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}