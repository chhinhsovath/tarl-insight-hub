import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// POST - Participant login/authentication
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
      // Search for participant across all training registrations
      // We'll create a consolidated participant profile from registration data
      const participantQuery = `
        SELECT 
          MIN(r.id) as first_registration_id,
          r.participant_name as name,
          r.participant_email as email,
          r.participant_phone as phone,
          r.participant_role as role,
          r.school_name as organization,
          r.district,
          r.province,
          COUNT(r.id) as total_registrations,
          COUNT(CASE WHEN r.attendance_status = 'attended' THEN 1 END) as total_attended,
          MIN(r.created_at) as first_training_date,
          MAX(r.updated_at) as last_activity_date,
          CAST(
            (COUNT(CASE WHEN r.attendance_status = 'attended' THEN 1 END)::float / 
             NULLIF(COUNT(r.id), 0) * 100) AS DECIMAL(5,2)
          ) as attendance_rate
        FROM tbl_tarl_training_registrations r
        WHERE 
          LOWER(TRIM(r.participant_name)) = LOWER(TRIM($1))
          AND TRIM(r.participant_phone) = TRIM($2)
          AND r.is_active = true
        GROUP BY 
          r.participant_name, 
          r.participant_email, 
          r.participant_phone, 
          r.participant_role, 
          r.school_name, 
          r.district, 
          r.province
        LIMIT 1
      `;

      const result = await client.query(participantQuery, [name, phone]);

      if (result.rows.length === 0) {
        return NextResponse.json({ 
          error: 'No training records found for this name and phone combination. Please check your details or contact your training coordinator.' 
        }, { status: 404 });
      }

      const participant = result.rows[0];

      // Generate a simple participant ID for session management
      const participantId = `participant_${participant.first_registration_id}_${Date.now()}`;

      return NextResponse.json({
        success: true,
        participant: {
          id: participantId,
          name: participant.name,
          email: participant.email,
          phone: participant.phone,
          role: participant.role,
          organization: participant.organization,
          district: participant.district,
          province: participant.province,
          stats: {
            total_registrations: parseInt(participant.total_registrations),
            total_attended: parseInt(participant.total_attended),
            attendance_rate: parseFloat(participant.attendance_rate || 0),
            first_training_date: participant.first_training_date,
            last_activity_date: participant.last_activity_date
          }
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Participant authentication error:', error);
    return NextResponse.json({ 
      error: 'Authentication failed. Please try again.' 
    }, { status: 500 });
  }
}