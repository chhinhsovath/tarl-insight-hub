import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communeCode = searchParams.get("communeCode");
    
    if (!communeCode) {
      return NextResponse.json(
        { error: "Commune code is required" },
        { status: 400 }
      );
    }
    
    const client = await pool.connect();
    
    try {
      // Get villages for the given commune from tbl_tarl_demographics
      const result = await client.query(`
        SELECT 
          id,
          vil_code as village_code,
          vil_name as village_name,
          com_code as commune_id
        FROM tbl_tarl_demographics 
        WHERE com_code = $1 
        AND vil_code IS NOT NULL 
        AND vil_name IS NOT NULL
        ORDER BY vil_name
      `, [parseInt(communeCode)]);
      
      return NextResponse.json(result.rows);
      
    } finally {
      client.release();
    }
    
  } catch (error: any) {
    console.error("Error fetching villages:", error);
    return NextResponse.json(
      { error: "Failed to fetch villages", details: error.message },
      { status: 500 }
    );
  }
}