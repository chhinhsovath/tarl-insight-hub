import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// Helper function to check if user has permission to access users page
async function checkUserManagementPermission(userId: number): Promise<boolean> {
  try {
    // First check if permission tables exist
    const tablesExist = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'tbl_tarl_pages'
      ) AND EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'tbl_tarl_role_permissions'
      ) as tables_exist
    `);
    
    if (!tablesExist.rows[0]?.tables_exist) {
      console.warn("Permission tables don't exist yet. Falling back to role-based access.");
      // Fallback: check if user is admin
      const roleResult = await pool.query(`
        SELECT r.name 
        FROM tbl_tarl_users u 
        JOIN tbl_tarl_roles r ON u.role_id = r.id 
        WHERE u.id = $1
      `, [userId]);
      
      return roleResult.rows[0]?.name?.toLowerCase() === 'admin';
    }

    const result = await pool.query(`
      SELECT rp.can_access
      FROM tbl_tarl_users u
      JOIN tbl_tarl_roles r ON u.role_id = r.id
      JOIN tbl_tarl_role_permissions rp ON r.id = rp.role_id
      JOIN tbl_tarl_pages p ON rp.page_id = p.id
      WHERE u.id = $1 AND p.path = '/users' AND rp.can_access = true
    `, [userId]);
    
    return result.rows.length > 0;
  } catch (error) {
    console.error("Error checking user management permission:", error);
    // Fallback: check if user is admin
    try {
      const roleResult = await pool.query(`
        SELECT r.name 
        FROM tbl_tarl_users u 
        JOIN tbl_tarl_roles r ON u.role_id = r.id 
        WHERE u.id = $1
      `, [userId]);
      
      return roleResult.rows[0]?.name?.toLowerCase() === 'admin';
    } catch (fallbackError) {
      console.error("Fallback permission check failed:", fallbackError);
      return false;
    }
  }
}

// Helper function to log user access
async function logUserAccess(userId: number, action: string, details?: any): Promise<void> {
  try {
    // Check if audit table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'tbl_tarl_permission_audit'
      ) as table_exists
    `);
    
    if (!tableExists.rows[0]?.table_exists) {
      console.warn("Audit table doesn't exist yet. Skipping audit log.");
      return;
    }

    await pool.query(`
      INSERT INTO tbl_tarl_permission_audit (role_id, page_id, action, changed_by, created_at)
      SELECT u.role_id, p.id, $2, $1, NOW()
      FROM tbl_tarl_users u, tbl_tarl_pages p
      WHERE u.id = $1 AND p.path = '/users'
    `, [userId, action]);
  } catch (error) {
    console.error("Error logging user access:", error);
    // Don't fail the request if audit logging fails
  }
}

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
      "SELECT id, role_id, full_name FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      console.error("API Error: Invalid session - Session token is invalid or expired.")
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];
    
    // Get current user's role name
    const roleRes = await pool.query("SELECT name FROM tbl_tarl_roles WHERE id = $1", [currentUser.role_id]);
    const currentUserRole = roleRes.rows[0]?.name;
    
    // Check if user has permission to access users page
    const hasPermission = await checkUserManagementPermission(currentUser.id);
    
    if (!hasPermission) {
      console.error(`API Error: Access denied - User ${currentUser.full_name} (${currentUserRole}) lacks permission to access users.`);
      return NextResponse.json({ 
        error: "Access denied. You don't have permission to manage users.",
        requiredPermission: "users"
      }, { status: 403 });
    }

    // Log user access for audit trail
    await logUserAccess(currentUser.id, "accessed_users_list", { filters });

    // Build the query with filters
    let query = `SELECT u.*, r.name AS role FROM tbl_tarl_users u JOIN tbl_tarl_roles r ON u.role_id = r.id WHERE 1=1`;
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (filters.search) {
      query += ` AND (
        u.full_name ILIKE $${paramIndex} OR
        u.email ILIKE $${paramIndex} OR
        u.phone ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.role && filters.role !== "all") {
      // Look up role_id from tbl_tarl_roles
      const roleLookup = await pool.query("SELECT id FROM tbl_tarl_roles WHERE name = $1", [filters.role.toLowerCase()]);
      const roleId = roleLookup.rows[0]?.id;
      if (roleId) {
        query += ` AND u.role_id = $${paramIndex}`;
        queryParams.push(roleId);
        paramIndex++;
      } else {
        // No users will match an unknown role
        return NextResponse.json([]);
      }
    }

    if (filters.schoolId && filters.schoolId !== "all") {
      query += ` AND u.school_id = $${paramIndex}`;
      queryParams.push(filters.schoolId);
      paramIndex++;
    }

    if (filters.isActive !== undefined) {
      query += ` AND u.is_active = $${paramIndex}`;
      queryParams.push(filters.isActive);
      paramIndex++;
    }

    if (filters.startDate) {
      query += ` AND u.created_at >= $${paramIndex}`;
      queryParams.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      query += ` AND u.created_at <= $${paramIndex}`;
      queryParams.push(filters.endDate);
      paramIndex++;
    }

    query += " ORDER BY u.created_at DESC";

    const result = await pool.query(query, queryParams);
    
    // Enhanced response with metadata
    const response = {
      users: result.rows,
      metadata: {
        total: result.rows.length,
        requestedBy: {
          id: currentUser.id,
          name: currentUser.full_name,
          role: currentUserRole
        },
        filters: filters,
        timestamp: new Date().toISOString()
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("API Error: An unexpected error occurred while fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET method for simpler user listing
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user
    const sessionResult = await pool.query(
      "SELECT id, role_id, full_name FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];
    
    // Check permission
    const hasPermission = await checkUserManagementPermission(currentUser.id);
    
    if (!hasPermission) {
      return NextResponse.json({ 
        error: "Access denied. You don't have permission to view users.",
        requiredPermission: "users"
      }, { status: 403 });
    }

    // Log access
    await logUserAccess(currentUser.id, "viewed_users_page");

    // Simple query with optional filters
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
      SELECT u.id, u.full_name, u.email, u.phone, u.is_active, u.created_at, u.last_login,
             r.name AS role, r.id AS role_id
      FROM tbl_tarl_users u 
      JOIN tbl_tarl_roles r ON u.role_id = r.id 
      WHERE 1=1
    `;
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (role && role !== 'all') {
      query += ` AND r.name = $${paramIndex}`;
      queryParams.push(role);
      paramIndex++;
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM tbl_tarl_users u 
      JOIN tbl_tarl_roles r ON u.role_id = r.id 
      WHERE 1=1
    `;
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (u.full_name ILIKE $${countParamIndex} OR u.email ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (role && role !== 'all') {
      countQuery += ` AND r.name = $${countParamIndex}`;
      countParams.push(role);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    return NextResponse.json({
      users: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error("API Error: An unexpected error occurred while fetching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 