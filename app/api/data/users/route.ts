import { NextResponse } from "next/server";
import { Pool } from "pg";
import { cookies } from "next/headers";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

export async function POST(request: Request) {
  try {
    const filters = await request.json();
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      console.error("API Error: Unauthorized - No session token provided.")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user
    const sessionResult = await pool.query(
      "SELECT id, role FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      console.error("API Error: Invalid session - Session token is invalid or expired.")
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];
    
    // Check if user has admin role for user management (case-insensitive)
    if (currentUser.role.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    // Build the query with filters
    let query = "SELECT * FROM tbl_tarl_users WHERE 1=1";
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (filters.search) {
      query += ` AND (
        full_name ILIKE $${paramIndex} OR
        email ILIKE $${paramIndex} OR
        phone ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.role && filters.role !== "all") {
      query += ` AND role = $${paramIndex}`;
      queryParams.push(filters.role);
      paramIndex++;
    }

    if (filters.schoolId && filters.schoolId !== "all") {
      query += ` AND school_id = $${paramIndex}`;
      queryParams.push(filters.schoolId);
      paramIndex++;
    }

    if (filters.isActive !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      queryParams.push(filters.isActive);
      paramIndex++;
    }

    if (filters.startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      queryParams.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      queryParams.push(filters.endDate);
      paramIndex++;
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, queryParams);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("API Error: An unexpected error occurred while fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 