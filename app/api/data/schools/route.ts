import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("search");
    const countOnly = searchParams.get("count") === "true";
    const limit = parseInt(searchParams.get("limit") || '25', 10);
    const offset = parseInt(searchParams.get("offset") || '0', 10);
    const filterZone = searchParams.get("zone");
    const filterProvince = searchParams.get("province");
    
    const client = await pool.connect();
    let query;
    const params = [];
    let whereClauses = [];
    let paramIndex = 1;

    if (searchTerm) {
      whereClauses.push(`"sclName" ILIKE $${paramIndex++}`);
      params.push(`%${searchTerm}%`);
    }
    if (filterZone) {
      whereClauses.push(`"sclZoneName" ILIKE $${paramIndex++}`);
      params.push(`%${filterZone}%`);
    }
    if (filterProvince) {
      whereClauses.push(`"sclProvinceName" ILIKE $${paramIndex++}`);
      params.push(`%${filterProvince}%`);
    }

    const whereClause = whereClauses.length > 0 ? " WHERE " + whereClauses.join(" AND ") : "";

    if (countOnly) {
      query = `SELECT COUNT(*) as total FROM tbl_tarl_schools${whereClause}`;
    } else {
      query = `
        SELECT 
          "sclAutoID" as id,
          "sclName" as name,
          "sclCode" as code,
          "sclCluster" as cluster,
          "sclCommune" as commune,
          "sclDistrict" as district,
          "sclProvince" as province,
          "sclZone" as zone,
          "sclOrder" as order,
          "sclStatus" as status,
          "sclImage" as image,
          "sclZoneName" as zoneName,
          "sclProvinceName" as provinceName,
          "sclDistrictName" as districtName
        FROM
          tbl_tarl_schools
        ${whereClause}
      `;
      query += ` ORDER BY "sclName" LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit, offset);
    }

    const result = await client.query(query, params);
    client.release();
    
    return NextResponse.json(countOnly ? { total: parseInt(result.rows[0].total) } : result.rows);
  } catch (error) {
    console.error("Error fetching schools:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
