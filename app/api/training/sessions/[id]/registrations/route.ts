import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";

const pool = getPool();

// GET - Get all registrations for a training session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = parseInt(id);
  
  try {
    // Check if it's a public request (from attendance page)
    const isPublicRequest = request.headers.get('referer')?.includes('/training/attendance');
    
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    // Allow public access for attendance page
    if (!isPublicRequest && !sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session if not public request
    if (!isPublicRequest && sessionToken) {
      const userResult = await pool.query(
        "SELECT id, role, full_name FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
        [sessionToken]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
      }
    }

    const client = await pool.connect();
    
    try {
      // Get all registrations for the session
      const registrationsResult = await client.query(
        `SELECT 
           id,
           participant_name,
           participant_email,
           participant_phone,
           participant_role,
           school_name,
           district,
           province,
           attendance_status,
           registration_method,
           created_at,
           updated_at,
           attendance_marked_at
         FROM tbl_tarl_training_registrations
         WHERE session_id = $1 AND is_active = true
         ORDER BY 
           CASE attendance_status 
             WHEN 'attended' THEN 1 
             WHEN 'registered' THEN 2 
             ELSE 3 
           END,
           participant_name ASC`,
        [sessionId]
      );

      return NextResponse.json(registrationsResult.rows);

    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}