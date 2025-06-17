import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// GET /api/training/public/engage-programs - Get engage programs for public access (no auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // Get engage programs with their materials - no authentication required for public access
    const query = `
      SELECT 
        ep.id,
        ep.session_id,
        ep.title,
        ep.description,
        ep.timing,
        ep.sort_order,
        ep.is_active,
        ep.created_at,
        ep.updated_at,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', em.id,
              'material_type', em.material_type,
              'title', em.title,
              'description', em.description,
              'file_path', em.file_path,
              'file_name', em.file_name,
              'file_size', em.file_size,
              'file_type', em.file_type,
              'external_url', em.external_url,
              'download_count', em.download_count,
              'is_active', em.is_active
            ) ORDER BY em.created_at
          ) FILTER (WHERE em.id IS NOT NULL), 
          '[]'::json
        ) as materials
      FROM tbl_training_engage_programs ep
      LEFT JOIN tbl_training_engage_materials em ON ep.id = em.engage_program_id AND em.is_active = true
      WHERE ep.session_id = $1 AND ep.is_active = true
      GROUP BY ep.id
      ORDER BY ep.timing, ep.sort_order
    `;

    const result = await pool.query(query, [sessionId]);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching public engage programs:", error);
    return NextResponse.json(
      { error: "Failed to fetch engage programs" },
      { status: 500 }
    );
  }
}