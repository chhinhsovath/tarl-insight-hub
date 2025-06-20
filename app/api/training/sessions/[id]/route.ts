import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// GET /api/training/sessions/[id] - Get a single session (public endpoint for materials access)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id);
    
    if (isNaN(sessionId)) {
      return NextResponse.json(
        { error: "Invalid session ID" },
        { status: 400 }
      );
    }

    // Get session information - no authentication required for public materials access
    const query = `
      SELECT 
        s.id,
        s.session_title,
        s.session_date,
        s.session_time,
        s.location,
        s.venue_address,
        s.session_status,
        s.agenda,
        s.notes,
        p.program_name
      FROM tbl_tarl_training_sessions s
      LEFT JOIN tbl_tarl_training_programs p ON s.program_id = p.id
      WHERE s.id = $1
    `;

    const result = await pool.query(query, [sessionId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session information" },
      { status: 500 }
    );
  }
}