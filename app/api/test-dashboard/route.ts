import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();

export async function GET(request: NextRequest) {
  const client = await pool.connect();

  try {
    console.log("Testing database connection and table structure...");
    
    // Test basic counts
    const schoolsResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_schools');
    const allRecordsResult = await client.query('SELECT COUNT(*) as count FROM tbl_tarl_tc_st_sch');
    
    // Test distinct counts
    const distinctStudentsResult = await client.query(`
      SELECT COUNT(DISTINCT student_id) as count 
      FROM tbl_tarl_tc_st_sch 
      WHERE student_id IS NOT NULL AND student_status = 1
    `);
    
    const distinctTeachersResult = await client.query(`
      SELECT COUNT(DISTINCT teacher_id) as count 
      FROM tbl_tarl_tc_st_sch 
      WHERE teacher_id IS NOT NULL AND teacher_status = 1
    `);
    
    const distinctSchoolsResult = await client.query(`
      SELECT COUNT(DISTINCT school_id) as count 
      FROM tbl_tarl_tc_st_sch 
      WHERE school_id IS NOT NULL
    `);

    const testStats = {
      total_schools_main_table: parseInt(schoolsResult.rows[0].count) || 0,
      total_records_tc_st_sch: parseInt(allRecordsResult.rows[0].count) || 0,
      distinct_students: parseInt(distinctStudentsResult.rows[0].count) || 0,
      distinct_teachers: parseInt(distinctTeachersResult.rows[0].count) || 0,
      distinct_schools_in_tc_st_sch: parseInt(distinctSchoolsResult.rows[0].count) || 0,
      message: "This shows the correct counts for dashboard display"
    };

    console.log("Table analysis:", testStats);

    return NextResponse.json({
      success: true,
      message: "Database analysis complete",
      analysis: testStats
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