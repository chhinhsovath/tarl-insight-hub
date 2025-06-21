import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();

export async function GET(request: NextRequest) {
  const client = await pool.connect();

  try {
    console.log("Testing database connection for dashboard...");
    
    // Test basic counts without authentication
    const schoolsResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_schools');
    const studentsResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_tc_st_sch');
    const programsResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_training_programs');
    const sessionsResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_training_sessions');

    const testStats = {
      schools: parseInt(schoolsResult.rows[0].count) || 0,
      students: parseInt(studentsResult.rows[0].count) || 0,
      programs: parseInt(programsResult.rows[0].count) || 0,
      sessions: parseInt(sessionsResult.rows[0].count) || 0
    };

    console.log("Test stats:", testStats);

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      stats: testStats
    });

  } catch (error: any) {
    console.error("Database test error:", error);
    return NextResponse.json(
      { 
        error: "Database connection failed", 
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}