import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const districtCode = searchParams.get("districtCode");
    
    if (!districtCode) {
      return NextResponse.json(
        { error: "District code is required" },
        { status: 400 }
      );
    }
    
    const client = await pool.connect();
    
    try {
      // Get unique communes for the given district from tbl_tarl_demographics
      const result = await client.query(`
        SELECT DISTINCT 
          com_code as id,
          com_name as commune_name,
          dis_code as district_id
        FROM tbl_tarl_demographics 
        WHERE dis_code = $1 
        AND com_code IS NOT NULL 
        AND com_name IS NOT NULL
        ORDER BY com_name
      `, [parseInt(districtCode)]);
      
      return NextResponse.json(result.rows);
      
    } finally {
      client.release();
    }
    
  } catch (error: any) {
    console.error("Error fetching communes:", error);
    return NextResponse.json(
      { error: "Failed to fetch communes", details: error.message },
      { status: 500 }
    );
  }
}