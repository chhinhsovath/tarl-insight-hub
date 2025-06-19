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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user
    const sessionResult = await pool.query(
      "SELECT id, role_id FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Check if Khmer columns exist
    const khmerCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'page_permissions' 
      AND column_name IN ('page_name_kh', 'page_title_kh')
    `);
    
    const hasKhmer = khmerCheck.rows.length >= 2;

    // Fetch all pages from the existing page_permissions table
    // Check if sort_order column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'page_permissions' AND column_name = 'sort_order'
    `);
    
    const hasSortOrder = columnCheck.rows.length > 0;
    
    // Check if hierarchical columns exist
    const hierarchyCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'page_permissions' 
      AND column_name IN ('parent_page_id', 'is_parent_menu', 'menu_level')
    `);
    
    const hasHierarchy = hierarchyCheck.rows.length >= 3;
    
    const result = await pool.query(`
      SELECT id, page_path, page_name, icon_name, created_at, updated_at
      ${hasKhmer ? ', page_name_kh, page_title_kh' : ''}
      ${hasSortOrder ? ', sort_order' : ''}
      ${hasHierarchy ? ', parent_page_id, is_parent_menu, menu_level' : ''}
      FROM page_permissions 
      WHERE is_displayed_in_menu = true AND menu_visibility = 'visible'
      ORDER BY ${hasSortOrder ? 'sort_order ASC, ' : ''}parent_page_id NULLS FIRST, page_name ASC
    `);
    
    return NextResponse.json({ pages: result.rows });
  } catch (error) {
    console.error("Error fetching page permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { page_path, page_name, icon_name } = await request.json();
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user
    const sessionResult = await pool.query(
      "SELECT id, role_id FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];
    
    // Get current user's role name - only admin can add pages
    const roleRes = await pool.query("SELECT name FROM tbl_tarl_roles WHERE id = $1", [currentUser.role_id]);
    const currentUserRole = roleRes.rows[0]?.name;
    
    if (!currentUserRole || currentUserRole.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    if (!page_path || !page_name) {
      return NextResponse.json({ error: "page_path and page_name are required" }, { status: 400 });
    }

    const result = await pool.query(
      "INSERT INTO page_permissions (page_path, page_name, icon_name) VALUES ($1, $2, $3) RETURNING *",
      [page_path, page_name, icon_name || 'FileText']
    );

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error("Error creating page permission:", error);
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json({ error: "Page path already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user
    const sessionResult = await pool.query(
      "SELECT id, role_id FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];
    
    // Get current user's role name - only admin can update translations
    const roleRes = await pool.query("SELECT name FROM tbl_tarl_roles WHERE id = $1", [currentUser.role_id]);
    const currentUserRole = roleRes.rows[0]?.name;
    
    if (!currentUserRole || !['admin', 'director'].includes(currentUserRole.toLowerCase())) {
      return NextResponse.json({ error: "Access denied. Admin or Director role required." }, { status: 403 });
    }

    // Handle different types of updates
    if (body.action === 'update_translation') {
      const { pageId, page_name_kh, page_title_kh } = body;
      
      if (!pageId) {
        return NextResponse.json({ error: "pageId is required" }, { status: 400 });
      }

      // Check if Khmer columns exist, add them if not
      const khmerCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'page_permissions' 
        AND column_name IN ('page_name_kh', 'page_title_kh')
      `);
      
      if (khmerCheck.rows.length < 2) {
        // Add Khmer columns if they don't exist
        await pool.query(`
          ALTER TABLE page_permissions 
          ADD COLUMN IF NOT EXISTS page_name_kh VARCHAR(200),
          ADD COLUMN IF NOT EXISTS page_title_kh VARCHAR(200)
        `);
      }

      const result = await pool.query(`
        UPDATE page_permissions 
        SET page_name_kh = $1, page_title_kh = $2, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $3 
        RETURNING *`,
        [page_name_kh, page_title_kh, pageId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Page not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, page: result.rows[0] });

    } else if (body.action === 'bulk_update_translations') {
      const { updates } = body;
      
      if (!Array.isArray(updates)) {
        return NextResponse.json({ error: "updates must be an array" }, { status: 400 });
      }

      // Check if Khmer columns exist, add them if not
      const khmerCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'page_permissions' 
        AND column_name IN ('page_name_kh', 'page_title_kh')
      `);
      
      if (khmerCheck.rows.length < 2) {
        // Add Khmer columns if they don't exist
        await pool.query(`
          ALTER TABLE page_permissions 
          ADD COLUMN IF NOT EXISTS page_name_kh VARCHAR(200),
          ADD COLUMN IF NOT EXISTS page_title_kh VARCHAR(200)
        `);
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        for (const update of updates) {
          const { pageId, page_name_kh, page_title_kh } = update;
          await client.query(`
            UPDATE page_permissions 
            SET page_name_kh = $1, page_title_kh = $2, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $3`,
            [page_name_kh, page_title_kh, pageId]
          );
        }
        
        await client.query('COMMIT');
        return NextResponse.json({ success: true, updated: updates.length });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Error updating page permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}