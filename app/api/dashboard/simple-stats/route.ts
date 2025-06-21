import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();

// Simple dashboard stats without authentication for testing
export async function GET() {
  let client;
  
  try {
    client = await pool.connect();
    console.log("Database connection established for simple stats");
    
    // Get basic counts
    const schoolsResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_schools');
    const studentsResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_tc_st_sch');
    const programsResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_training_programs');
    const sessionsResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_training_sessions');
    const usersResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_users');

    const stats = {
      totalSchools: parseInt(schoolsResult.rows[0].count) || 0,
      totalStudents: parseInt(studentsResult.rows[0].count) || 0,
      totalUsers: parseInt(usersResult.rows[0].count) || 0,
      totalTeachers: 0,
      totalClasses: 0,
      upcomingTraining: parseInt(programsResult.rows[0].count) || 0,
      activeTraining: parseInt(sessionsResult.rows[0].count) || 0,
      totalTranscripts: 0
    };

    console.log("Simple stats fetched successfully:", stats);

    return NextResponse.json({
      success: true,
      stats,
      recentActivity: [],
      userRole: "admin"
    });

  } catch (error: any) {
    console.error("Simple stats error:", error);
    return NextResponse.json(
      { 
        error: "Database error in simple stats", 
        details: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}