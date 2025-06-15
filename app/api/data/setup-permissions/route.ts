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

export async function POST() {
  const client = await pool.connect();
  
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user
    const sessionResult = await client.query(
      "SELECT id, role_id FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];
    
    // Get current user's role name - only admin can setup permissions
    const roleRes = await client.query("SELECT name FROM tbl_tarl_roles WHERE id = $1", [currentUser.role_id]);
    const currentUserRole = roleRes.rows[0]?.name;
    
    if (!currentUserRole || currentUserRole.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    const results = [];

    // 1. Check if Page Management already exists, if not add it
    const existingPage = await client.query(`
      SELECT * FROM page_permissions WHERE page_path = $1
    `, ['/settings/page-permissions']);
    
    let pageResult;
    if (existingPage.rows.length === 0) {
      // Add Page Management if it doesn't exist
      pageResult = await client.query(`
        INSERT INTO page_permissions (page_path, page_name, icon_name, created_at, updated_at) 
        VALUES ($1, $2, $3, NOW(), NOW()) 
        RETURNING *
      `, ['/settings/page-permissions', 'Page Management', 'Shield']);
      results.push({ step: 'Page Management added', data: pageResult.rows[0] });
    } else {
      results.push({ step: 'Page Management already exists', data: existingPage.rows[0] });
    }

    // 2. Create role_page_permissions table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS role_page_permissions (
        id SERIAL PRIMARY KEY,
        role_name VARCHAR(50) NOT NULL,
        page_path VARCHAR(255) NOT NULL,
        can_access BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role_name, page_path)
      )
    `);
    
    results.push({ step: 'role_page_permissions table created' });

    // 3. Get all pages and create admin permissions
    const allPages = await client.query('SELECT page_path, page_name FROM page_permissions ORDER BY page_name');
    
    let adminPermissionsAdded = 0;
    for (const page of allPages.rows) {
      // Check if permission already exists
      const existingPerm = await client.query(`
        SELECT * FROM role_page_permissions WHERE role_name = 'admin' AND page_path = $1
      `, [page.page_path]);
      
      if (existingPerm.rows.length === 0) {
        // Add new permission
        await client.query(`
          INSERT INTO role_page_permissions (role_name, page_path, can_access, created_at, updated_at)
          VALUES ('admin', $1, true, NOW(), NOW())
        `, [page.page_path]);
        adminPermissionsAdded++;
      } else {
        // Update existing permission to ensure it's enabled
        await client.query(`
          UPDATE role_page_permissions 
          SET can_access = true, updated_at = NOW()
          WHERE role_name = 'admin' AND page_path = $1
        `, [page.page_path]);
        adminPermissionsAdded++;
      }
    }
    
    results.push({ 
      step: 'Admin permissions setup', 
      pagesCount: adminPermissionsAdded,
      pages: allPages.rows
    });

    // 4. Get final status
    const adminPerms = await client.query(`
      SELECT pp.page_name, pp.page_path, rpp.can_access
      FROM page_permissions pp
      LEFT JOIN role_page_permissions rpp ON pp.page_path = rpp.page_path AND rpp.role_name = 'admin'
      ORDER BY pp.page_name
    `);
    
    results.push({
      step: 'Final admin permissions status',
      adminPermissions: adminPerms.rows
    });

    return NextResponse.json({
      success: true,
      message: `Setup complete! Admin now has access to ${adminPermissionsAdded} pages.`,
      results
    });

  } catch (error) {
    console.error("Error setting up permissions:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message 
    }, { status: 500 });
  } finally {
    client.release();
  }
}