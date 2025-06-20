import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { HierarchyPermissionManager } from "@/lib/hierarchy-permissions";

const pool = getPool();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const client = await pool.connect();

  try {
    const hierarchy = await HierarchyPermissionManager.getUserHierarchy(parseInt(userId));
    
    if (!hierarchy) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Admin gets all schools - use basic query without complex joins
    if (hierarchy.role === 'admin' || hierarchy.role === 'Admin') {
      // Check if schools table exists first
      const tableCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'tbl_tarl_schools'
      `);
      
      if (tableCheck.rows.length === 0) {
        // Fallback to basic schools table structure
        const result = await client.query(`
          SELECT *
          FROM schools
          ORDER BY name
        `);
        return NextResponse.json(result.rows);
      }
      
      const result = await client.query(`
        SELECT 
          "sclAutoID" as id,
          "sclName" as name,
          "sclCode" as code,
          "sclStatus" as status,
          "sclZoneName" as "zoneName",
          "sclProvinceName" as "provinceName",
          "sclDistrictName" as "districtName",
          "total_students" as "totalStudents",
          "total_teachers" as "totalTeachers",
          "total_teachers_female" as "totalTeachersFemale",
          "total_students_female" as "totalStudentsFemale"
        FROM tbl_tarl_schools
        ORDER BY "sclName"
      `);
      
      return NextResponse.json(result.rows);
    }

    // For non-admin users, return basic schools list for now
    // This avoids complex joins with tables that might not exist
    
    // Check if tbl_tarl_schools exists
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'tbl_tarl_schools'
    `);
    
    if (tableCheck.rows.length === 0) {
      // Fallback to simpler school query or return empty array
      return NextResponse.json([]);
    }
    
    const result = await client.query(`
      SELECT *
      FROM tbl_tarl_schools
      ORDER BY school_name
    `);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching accessible schools:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  } finally {
    client.release();
  }
}