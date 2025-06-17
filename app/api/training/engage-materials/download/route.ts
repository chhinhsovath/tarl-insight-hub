import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { cookies } from "next/headers";
import { readFile } from "fs/promises";
import path from "path";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// POST /api/training/engage-materials/download - Track download and return file
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { materialId, participantId } = body;

    if (!materialId) {
      return NextResponse.json(
        { error: "Material ID is required" },
        { status: 400 }
      );
    }

    // Get material details
    const materialResult = await pool.query(
      `SELECT * FROM tbl_training_engage_materials WHERE id = $1 AND is_active = true`,
      [materialId]
    );

    if (materialResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    const material = materialResult.rows[0];

    // Track download
    const userAgent = request.headers.get("user-agent") || "";
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     "";

    await pool.query(
      `INSERT INTO tbl_training_material_downloads 
       (material_id, participant_id, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4)`,
      [materialId, participantId || null, ipAddress, userAgent]
    );

    // Update download count
    await pool.query(
      `UPDATE tbl_training_engage_materials 
       SET download_count = download_count + 1 
       WHERE id = $1`,
      [materialId]
    );

    // Return download URL or redirect
    if (material.material_type === "link") {
      return NextResponse.json({ 
        type: "redirect",
        url: material.external_url 
      });
    } else if (material.material_type === "document") {
      return NextResponse.json({ 
        type: "download",
        url: material.file_path,
        filename: material.file_name
      });
    }

    return NextResponse.json(
      { error: "Invalid material type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing download:", error);
    return NextResponse.json(
      { error: "Failed to process download" },
      { status: 500 }
    );
  }
}

// GET /api/training/engage-materials/download/stats - Get download statistics
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session-token")?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get("materialId");
    const sessionId = searchParams.get("sessionId");

    let query = `
      SELECT 
        m.id,
        m.title,
        m.material_type,
        m.download_count,
        COUNT(DISTINCT d.id) as unique_downloads,
        COUNT(DISTINCT d.participant_id) as unique_participants,
        MAX(d.downloaded_at) as last_download
      FROM tbl_training_engage_materials m
      LEFT JOIN tbl_training_material_downloads d ON m.id = d.material_id
    `;

    const conditions = [];
    const params = [];

    if (materialId) {
      conditions.push(`m.id = $${params.length + 1}`);
      params.push(materialId);
    }

    if (sessionId) {
      query = `
        SELECT 
          m.id,
          m.title,
          m.material_type,
          m.download_count,
          COUNT(DISTINCT d.id) as unique_downloads,
          COUNT(DISTINCT d.participant_id) as unique_participants,
          MAX(d.downloaded_at) as last_download
        FROM tbl_training_engage_materials m
        JOIN tbl_training_engage_programs ep ON m.engage_program_id = ep.id
        LEFT JOIN tbl_training_material_downloads d ON m.id = d.material_id
      `;
      conditions.push(`ep.session_id = $${params.length + 1}`);
      params.push(sessionId);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` GROUP BY m.id, m.title, m.material_type, m.download_count`;

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching download stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch download statistics" },
      { status: 500 }
    );
  }
}