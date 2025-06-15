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
  try {
    const result = await pool.query("SELECT id, name, description FROM tbl_tarl_roles ORDER BY name ASC");
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, description = '' } = await request.json();
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check if role already exists
    const existingRole = await pool.query(
      "SELECT id FROM tbl_tarl_roles WHERE LOWER(name) = LOWER($1)",
      [trimmedName]
    );

    if (existingRole.rows.length > 0) {
      return NextResponse.json({ error: "Role name already exists" }, { status: 409 });
    }

    // Create new role
    const result = await pool.query(
      "INSERT INTO tbl_tarl_roles (name, description) VALUES ($1, $2) RETURNING id, name, description",
      [trimmedName, description]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 