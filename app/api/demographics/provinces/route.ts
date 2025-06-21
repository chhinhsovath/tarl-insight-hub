import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();

export async function GET(request: NextRequest) {
  try {
    const client = await pool.connect();
    
    try {
      // Get unique provinces from tbl_tarl_demographics
      const result = await client.query(`
        SELECT DISTINCT 
          pro_code as id,
          pro_name as name
        FROM tbl_tarl_demographics 
        WHERE pro_code IS NOT NULL AND pro_name IS NOT NULL
        ORDER BY pro_name
      `);
      
      return NextResponse.json(result.rows);
      
    } finally {
      client.release();
    }
    
  } catch (error: any) {
    console.error("Error fetching provinces:", error);
    return NextResponse.json(
      { error: "Failed to fetch provinces", details: error.message },
      { status: 500 }
    );
  }
}