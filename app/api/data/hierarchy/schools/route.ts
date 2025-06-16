import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import { HierarchyPermissionManager } from "@/lib/hierarchy-permissions";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

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

    // Admin gets all schools
    if (hierarchy.role === 'Admin') {
      const result = await client.query(`
        SELECT 
          s.*,
          p.province_name,
          d.district_name,
          z.zone_name_en as zone_name
        FROM tbl_tarl_schools s
        LEFT JOIN tbl_tarl_province p ON s.province_id = p."prvAutoID"
        LEFT JOIN tbl_tarl_district d ON s.district_id = d.id
        LEFT JOIN tbl_tarl_zones z ON s.zone_id = z.zone_id
        ORDER BY s.school_name
      `);
      
      return NextResponse.json(result.rows);
    }

    // Build query based on user's hierarchy access
    let query = `
      SELECT DISTINCT
        s.*,
        p.province_name,
        d.district_name,
        z.zone_name_en as zone_name,
        uas.access_type
      FROM tbl_tarl_schools s
      LEFT JOIN tbl_tarl_province p ON s.province_id = p."prvAutoID"
      LEFT JOIN tbl_tarl_district d ON s.district_id = d.id
      LEFT JOIN tbl_tarl_zones z ON s.zone_id = z.zone_id
      LEFT JOIN user_accessible_schools uas ON s.id = uas.school_id AND uas.user_id = $1
      WHERE 1=1
    `;

    const params = [parseInt(userId)];

    // Add hierarchy filters
    const conditions = [];
    
    if (hierarchy.accessible_zones?.length) {
      conditions.push(`s.zone_id IN (${hierarchy.accessible_zones.join(',')})`);
    }
    
    if (hierarchy.accessible_provinces?.length) {
      conditions.push(`s.province_id IN (${hierarchy.accessible_provinces.join(',')})`);
    }
    
    if (hierarchy.accessible_districts?.length) {
      conditions.push(`s.district_id IN (${hierarchy.accessible_districts.join(',')})`);
    }
    
    if (hierarchy.accessible_schools?.length) {
      conditions.push(`s.id IN (${hierarchy.accessible_schools.join(',')})`);
    }

    if (conditions.length > 0) {
      query += ` AND (${conditions.join(' OR ')})`;
    } else if (hierarchy.role !== 'Admin') {
      // If no specific assignments, return empty result for non-admin users
      query += ' AND 1=0';
    }

    query += ' ORDER BY s.school_name';

    const result = await client.query(query, params);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching accessible schools:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}