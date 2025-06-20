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
  const districtId = searchParams.get("district_id");

  const client = await pool.connect();

  try {
    let query = `
      SELECT 
        id,
        commune_name,
        district_id,
        created_at
      FROM tbl_tarl_communes
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (districtId) {
      query += ` AND district_id = $${paramIndex}`;
      params.push(parseInt(districtId));
      paramIndex++;
    }

    query += ` ORDER BY commune_name`;

    const result = await client.query(query, params);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching communes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}