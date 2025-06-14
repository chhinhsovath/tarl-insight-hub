import { NextResponse } from "next/server"
import { Pool } from "pg"

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
})

export async function GET() {
  try {
    const client = await pool.connect()
    const result = await client.query("SELECT id, level_name, subject, level_order FROM tarl_levels ORDER BY subject, level_order")
    client.release()
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching TaRL levels:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
} 