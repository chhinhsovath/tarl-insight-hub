import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();

// POST - Get participant training history
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone } = body;

    if (!name || !phone) {
      return NextResponse.json({ 
        error: 'Name and phone number are required' 
      }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      // Get all training registrations for this participant
      const trainingsQuery = `
        SELECT 
          r.id,
          r.session_id,
          r.participant_name,
          r.participant_email,
          r.participant_phone,
          r.attendance_status,
          r.registration_method,
          r.created_at,
          r.attendance_marked_at,
          s.session_title,
          s.session_date,
          s.session_time,
          s.location,
          s.venue_address,
          p.program_name,
          p.description as program_description,
          -- Check if materials are available for this session
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM tbl_tarl_training_materials m 
              WHERE m.session_id = s.id AND m.is_active = true
            ) THEN true 
            ELSE false 
          END as materials_available
        FROM tbl_tarl_training_registrations r
        JOIN tbl_tarl_training_sessions s ON r.session_id = s.id
        LEFT JOIN tbl_tarl_training_programs p ON s.program_id = p.id
        WHERE 
          LOWER(TRIM(r.participant_name)) = LOWER(TRIM($1))
          AND TRIM(r.participant_phone) = TRIM($2)
          AND r.is_active = true
        ORDER BY s.session_date DESC, r.created_at DESC
      `;

      const result = await client.query(trainingsQuery, [name, phone]);

      const trainings = result.rows.map(row => ({
        id: row.session_id,
        registration_id: row.id,
        session_title: row.session_title,
        session_date: row.session_date,
        session_time: row.session_time,
        location: row.location,
        venue_address: row.venue_address,
        program_name: row.program_name,
        program_description: row.program_description,
        attendance_status: row.attendance_status,
        registration_method: row.registration_method,
        created_at: row.created_at,
        attendance_marked_at: row.attendance_marked_at,
        materials_available: row.materials_available
      }));

      return NextResponse.json({
        success: true,
        trainings: trainings,
        total_count: trainings.length,
        attended_count: trainings.filter(t => t.attendance_status === 'attended').length
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching participant trainings:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch training history' 
    }, { status: 500 });
  }
}