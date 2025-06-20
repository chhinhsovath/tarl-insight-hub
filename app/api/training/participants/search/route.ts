import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();

// GET - Search participants by name, email, or phone
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ 
      error: 'Query parameter is required and must be at least 2 characters' 
    }, { status: 400 });
  }

  const client = await pool.connect();

  try {
    // Search in master participants table
    const searchResult = await client.query(`
      SELECT 
        mp.id,
        mp.email,
        mp.full_name,
        mp.phone,
        mp.role,
        mp.organization,
        mp.district,
        mp.province,
        mp.total_sessions_registered,
        mp.total_sessions_attended,
        CASE 
          WHEN mp.total_sessions_registered > 0 THEN 
            ROUND((mp.total_sessions_attended::NUMERIC / mp.total_sessions_registered) * 100, 1)
          ELSE 0 
        END as attendance_rate,
        mp.first_training_date,
        mp.last_training_date,
        mp.created_at
      FROM tbl_tarl_master_participants mp
      WHERE 
        LOWER(mp.full_name) LIKE LOWER($1) OR
        LOWER(mp.email) LIKE LOWER($1) OR
        LOWER(mp.phone) LIKE LOWER($1) OR
        LOWER(mp.organization) LIKE LOWER($1)
      ORDER BY 
        CASE 
          WHEN LOWER(mp.full_name) LIKE LOWER($2) THEN 1
          WHEN LOWER(mp.email) LIKE LOWER($2) THEN 2
          WHEN LOWER(mp.phone) LIKE LOWER($2) THEN 3
          ELSE 4
        END,
        mp.total_sessions_attended DESC,
        mp.full_name ASC
      LIMIT 20
    `, [`%${query.trim()}%`, `${query.trim()}%`]);

    // Get recent training history for each participant
    const participantsWithHistory = await Promise.all(
      searchResult.rows.map(async (participant) => {
        const historyResult = await client.query(`
          SELECT 
            ts.session_title,
            ts.session_date,
            tp.attendance_confirmed,
            tprog.program_name
          FROM tbl_tarl_training_participants tp
          JOIN tbl_tarl_training_sessions ts ON tp.session_id = ts.id
          LEFT JOIN tbl_tarl_training_programs tprog ON ts.program_id = tprog.id
          WHERE tp.master_participant_id = $1
          ORDER BY ts.session_date DESC
          LIMIT 3
        `, [participant.id]);

        return {
          ...participant,
          recent_history: historyResult.rows
        };
      })
    );

    return NextResponse.json({
      participants: participantsWithHistory,
      total_found: searchResult.rows.length,
      search_query: query
    });

  } catch (error) {
    console.error('Error searching participants:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    client.release();
  }
}