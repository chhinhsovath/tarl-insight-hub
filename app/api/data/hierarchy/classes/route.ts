import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacherId');
  const schoolId = searchParams.get('schoolId');

  const client = await pool.connect();

  try {
    let query = `
      SELECT 
        c.*,
        s.school_name,
        s.school_code,
        COUNT(st.id) as student_count
      FROM tbl_tarl_classes c
      LEFT JOIN tbl_tarl_schools s ON c.school_id = s.id
      LEFT JOIN tbl_tarl_students st ON c.id = st.class_id AND st.is_active = true
    `;

    const params = [];
    let paramIndex = 1;
    const conditions = ['c.is_active = true'];

    if (teacherId) {
      // Get classes assigned to this teacher
      query += `
        JOIN teacher_class_assignments tca ON c.id = tca.class_id 
        AND tca.teacher_id = $${paramIndex} AND tca.is_active = true
      `;
      params.push(parseInt(teacherId));
      paramIndex++;
    }

    if (schoolId) {
      conditions.push(`c.school_id = $${paramIndex}`);
      params.push(parseInt(schoolId));
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += `
      GROUP BY c.id, s.school_name, s.school_code
      ORDER BY s.school_name, c.class_level, c.class_name
    `;

    const result = await client.query(query, params);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}