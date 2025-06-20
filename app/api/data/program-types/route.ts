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
    const result = await client.query("SELECT id, program_type FROM program_types ORDER BY program_type")
    client.release()
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching program types:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
} 