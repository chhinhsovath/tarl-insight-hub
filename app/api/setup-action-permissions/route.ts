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

    // Verify session and check if user is admin
    const sessionResult = await client.query(
      "SELECT u.id, r.name as role_name FROM tbl_tarl_users u JOIN tbl_tarl_roles r ON u.role_id = r.id WHERE u.session_token = $1 AND u.session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];
    
    if (!currentUser.role_name || currentUser.role_name.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    await client.query('BEGIN');

    // Check if action permissions table already exists
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'page_action_permissions'
    `);

    if (tableCheck.rows.length === 0) {
      // Create action permissions table
      await client.query(`
        CREATE TABLE page_action_permissions (
          id SERIAL PRIMARY KEY,
          page_id INTEGER REFERENCES page_permissions(id) ON DELETE CASCADE,
          action_name VARCHAR(50) NOT NULL, -- 'view', 'create', 'update', 'delete', 'export', 'bulk_update'
          role VARCHAR(50) NOT NULL,
          is_allowed BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(page_id, action_name, role) -- Prevent duplicate permissions
        )
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX idx_page_action_permissions_page_id ON page_action_permissions(page_id)
      `);
      
      await client.query(`
        CREATE INDEX idx_page_action_permissions_role ON page_action_permissions(role)
      `);
      
      await client.query(`
        CREATE INDEX idx_page_action_permissions_action ON page_action_permissions(action_name)
      `);

      // Get all pages and roles for default setup
      const pagesResult = await client.query('SELECT id, page_name FROM page_permissions ORDER BY page_name');
      const rolesResult = await client.query('SELECT name FROM tbl_tarl_roles ORDER BY name');
      
      const pages = pagesResult.rows;
      const roles = rolesResult.rows;

      // Define default actions for each page type
      const defaultActions = {
        'schools': ['view', 'create', 'update', 'delete', 'export'],
        'users': ['view', 'create', 'update', 'delete', 'export'],
        'observations': ['view', 'create', 'update', 'delete', 'export'],
        'reports': ['view', 'export'],
        'settings': ['view', 'update'],
        'default': ['view'] // fallback for any other pages
      };

      // Define default role permissions (admin gets all, others get restricted)
      const rolePermissions = {
        'admin': ['view', 'create', 'update', 'delete', 'export', 'bulk_update'],
        'director': ['view', 'create', 'update', 'export'],
        'coordinator': ['view', 'create', 'update'],
        'partner': ['view', 'export'],
        'teacher': ['view'],
        'collector': ['view', 'create'],
        'intern': ['view']
      };

      // Insert default action permissions for all page-role combinations
      for (const page of pages) {
        const pageName = page.page_name.toLowerCase().replace(/\s+/g, '_');
        const actions = defaultActions[pageName] || defaultActions['default'];
        
        for (const role of roles) {
          const roleName = role.name.toLowerCase();
          const allowedActions = rolePermissions[roleName] || ['view'];
          
          for (const action of actions) {
            const isAllowed = allowedActions.includes(action);
            
            await client.query(`
              INSERT INTO page_action_permissions (page_id, action_name, role, is_allowed)
              VALUES ($1, $2, $3, $4)
            `, [page.id, action, role.name, isAllowed]);
          }
        }
      }
    }

    await client.query('COMMIT');
    
    // Get sample action permissions to return
    const samplePermissions = await client.query(`
      SELECT pap.*, pp.page_name 
      FROM page_action_permissions pap
      JOIN page_permissions pp ON pap.page_id = pp.id
      WHERE pap.is_allowed = true
      ORDER BY pp.page_name, pap.action_name 
      LIMIT 10
    `);

    return NextResponse.json({
      success: true,
      message: "Action-level permission system initialized successfully",
      actionPermissionsTable: "page_action_permissions",
      samplePermissions: samplePermissions.rows,
      actionsCreated: samplePermissions.rows.length
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error setting up action permission system:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message 
    }, { status: 500 });
  } finally {
    client.release();
  }
}