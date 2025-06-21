import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = getPool();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "20");
    
    console.log("Public school search request:", { searchTerm, limit });
    
    const client = await pool.connect();
    
    try {
      let query;
      let params: any[] = [];
      
      if (searchTerm.trim()) {
        // Search by school name, code, province, district
        query = `
          SELECT 
            "sclAutoID",
            "sclName", 
            "sclCode",
            "sclZoneName",
            "sclProvinceName",
            "sclDistrictName", 
            "sclCommune" as "sclCommuneName",
            "sclCluster" as "sclVillageName",
            "sclCluster",
            "sclZone",
            "sclStatus"
          FROM tbl_tarl_schools
          WHERE (
            "sclName" ILIKE $1 OR 
            "sclCode" ILIKE $1 OR
            "sclProvinceName" ILIKE $1 OR
            "sclDistrictName" ILIKE $1 OR
            "sclCommune" ILIKE $1 OR
            "sclCluster" ILIKE $1 OR
            "sclZoneName" ILIKE $1
          )
          AND COALESCE("sclStatus", 1) = 1
          ORDER BY "sclName"
          LIMIT $2
        `;
        params = [`%${searchTerm}%`, limit];
      } else {
        // Return empty array if no search term
        return NextResponse.json([]);
      }
      
      console.log("Executing query:", query);
      console.log("With params:", params);
      
      const result = await client.query(query, params);
      
      console.log(`Found ${result.rows.length} schools`);
      
      return NextResponse.json(result.rows);
      
    } finally {
      client.release();
    }
    
  } catch (error: any) {
    console.error("Public schools API error:", error);
    return NextResponse.json(
      { error: "Failed to search schools", details: error.message },
      { status: 500 }
    );
  }
}