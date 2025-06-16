import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

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