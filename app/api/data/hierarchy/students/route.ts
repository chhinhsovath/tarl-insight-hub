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
  const classId = searchParams.get('classId');
  const schoolId = searchParams.get('schoolId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const client = await pool.connect();

  try {
    const hierarchy = await HierarchyPermissionManager.getUserHierarchy(parseInt(userId));
    
    if (!hierarchy) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let query = `
      SELECT DISTINCT
        st.*,
        c.class_name,
        c.class_level,
        s.school_name,
        s.school_code
      FROM tbl_tarl_students st
      LEFT JOIN tbl_tarl_classes c ON st.class_id = c.id
      LEFT JOIN tbl_tarl_schools s ON st.school_id = s.id
      WHERE st.is_active = true
    `;

    const params = [];
    let paramIndex = 1;

    // Admin gets all students
    if (hierarchy.role === 'Admin') {
      if (classId) {
        query += ` AND st.class_id = $${paramIndex}`;
        params.push(parseInt(classId));
        paramIndex++;
      }
      if (schoolId) {
        query += ` AND st.school_id = $${paramIndex}`;
        params.push(parseInt(schoolId));
        paramIndex++;
      }
    } else {
      // Apply hierarchy filters
      const conditions = [];

      // Teachers can only see their class students
      if (hierarchy.role === 'Teacher' && hierarchy.accessible_classes?.length) {
        if (classId && hierarchy.accessible_classes.includes(parseInt(classId))) {
          conditions.push(`st.class_id = ${classId}`);
        } else {
          conditions.push(`st.class_id IN (${hierarchy.accessible_classes.join(',')})`);
        }
      }

      // Directors/Partners can see students in their assigned regions
      if (['Director', 'Partner'].includes(hierarchy.role)) {
        const schoolConditions = [];
        
        if (hierarchy.accessible_schools?.length) {
          schoolConditions.push(`st.school_id IN (${hierarchy.accessible_schools.join(',')})`);
        }
        
        if (hierarchy.accessible_districts?.length) {
          schoolConditions.push(`s.district_id IN (${hierarchy.accessible_districts.join(',')})`);
        }
        
        if (hierarchy.accessible_provinces?.length) {
          schoolConditions.push(`s.province_id IN (${hierarchy.accessible_provinces.join(',')})`);
        }
        
        if (hierarchy.accessible_zones?.length) {
          schoolConditions.push(`s.zone_id IN (${hierarchy.accessible_zones.join(',')})`);
        }

        if (schoolConditions.length > 0) {
          conditions.push(`(${schoolConditions.join(' OR ')})`);
        }

        if (classId) {
          query += ` AND st.class_id = $${paramIndex}`;
          params.push(parseInt(classId));
          paramIndex++;
        }
        if (schoolId) {
          query += ` AND st.school_id = $${paramIndex}`;
          params.push(parseInt(schoolId));
          paramIndex++;
        }
      }

      // Collectors typically don't access student data directly
      if (hierarchy.role === 'Collector') {
        conditions.push('1=0'); // No access to students
      }

      if (conditions.length > 0) {
        query += ` AND (${conditions.join(' OR ')})`;
      } else if (hierarchy.role !== 'Admin') {
        query += ' AND 1=0';
      }
    }

    query += ' ORDER BY st.last_name, st.first_name';

    const result = await client.query(query, params);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching accessible students:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}