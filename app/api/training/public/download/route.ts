import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();

// POST /api/training/public/download - Track material downloads (no auth required)
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

    // Update download count
    await pool.query(
      `UPDATE tbl_training_engage_materials 
       SET download_count = download_count + 1 
       WHERE id = $1`,
      [materialId]
    );

    // Get material info for tracking
    const materialResult = await pool.query(
      `SELECT 
        m.*, 
        ep.session_id,
        s.session_title
      FROM tbl_training_engage_materials m
      JOIN tbl_training_engage_programs ep ON m.engage_program_id = ep.id
      JOIN tbl_tarl_training_sessions s ON ep.session_id = s.id
      WHERE m.id = $1`,
      [materialId]
    );

    if (materialResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    const material = materialResult.rows[0];

    // Track download activity
    await pool.query(
      `INSERT INTO tbl_training_material_downloads 
       (material_id, session_id, participant_id, download_timestamp, ip_address) 
       VALUES ($1, $2, $3, NOW(), $4)`,
      [
        materialId,
        material.session_id,
        participantId || null,
        request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
      ]
    ).catch(() => {
      // Ignore error if downloads table doesn't exist
    });

    return NextResponse.json({ 
      success: true,
      downloadUrl: material.external_url || material.file_path
    });
  } catch (error) {
    console.error("Error tracking download:", error);
    return NextResponse.json(
      { error: "Failed to track download" },
      { status: 500 }
    );
  }
}