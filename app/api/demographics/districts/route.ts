import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provinceCode = searchParams.get("provinceCode");
    
    if (!provinceCode) {
      return NextResponse.json(
        { error: "Province code is required" },
        { status: 400 }
      );
    }
    
    const client = await pool.connect();
    
    try {
      // Get unique districts for the given province from tbl_tarl_demographics
      const result = await client.query(`
        SELECT DISTINCT 
          dis_code as id,
          dis_name as name,
          pro_code as province_id
        FROM tbl_tarl_demographics 
        WHERE pro_code = $1 
        AND dis_code IS NOT NULL 
        AND dis_name IS NOT NULL
        ORDER BY dis_name
      `, [parseInt(provinceCode)]);
      
      return NextResponse.json(result.rows);
      
    } finally {
      client.release();
    }
    
  } catch (error: any) {
    console.error("Error fetching districts:", error);
    return NextResponse.json(
      { error: "Failed to fetch districts", details: error.message },
      { status: 500 }
    );
  }
}