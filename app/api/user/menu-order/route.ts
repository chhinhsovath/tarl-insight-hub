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

// GET - Fetch user's personal menu order
export async function GET() {
  const client = await pool.connect();
  
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user info
    const sessionResult = await client.query(
      "SELECT u.id, u.full_name, r.name as role_name FROM tbl_tarl_users u JOIN tbl_tarl_roles r ON u.role_id = r.id WHERE u.session_token = $1 AND u.session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];

    // Check if user_menu_order table exists, create if not
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'user_menu_order'
    `);

    if (tableCheck.rows.length === 0) {
      await client.query(`
        CREATE TABLE user_menu_order (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES tbl_tarl_users(id) ON DELETE CASCADE,
          page_id INTEGER REFERENCES page_permissions(id) ON DELETE CASCADE,
          sort_order INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, page_id)
        )
      `);
      
      // Create indexes
      await client.query(`
        CREATE INDEX idx_user_menu_order_user_id ON user_menu_order(user_id)
      `);
      await client.query(`
        CREATE INDEX idx_user_menu_order_sort ON user_menu_order(user_id, sort_order)
      `);
    }

    // Check if user_menu_preferences table exists, create if not
    const prefsTableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'user_menu_preferences'
    `);

    if (prefsTableCheck.rows.length === 0) {
      await client.query(`
        CREATE TABLE user_menu_preferences (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES tbl_tarl_users(id) ON DELETE CASCADE UNIQUE,
          use_personal_order BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
    }

    // Get user's menu preferences
    const prefsResult = await client.query(
      "SELECT use_personal_order FROM user_menu_preferences WHERE user_id = $1",
      [currentUser.id]
    );

    const usePersonalOrder = prefsResult.rows[0]?.use_personal_order || false;

    // Get pages with user's custom order if they have one, otherwise use default order
    let pagesQuery;
    let queryParams;

    // Check if hierarchical columns exist
    const hierarchyCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'page_permissions' 
      AND column_name IN ('parent_page_id', 'is_parent_menu', 'menu_level')
    `);
    
    const hasHierarchy = hierarchyCheck.rows.length >= 3;
    const hierarchyColumns = hasHierarchy ? ', pp.parent_page_id, pp.is_parent_menu, pp.menu_level' : '';

    if (usePersonalOrder) {
      // Get pages with user's custom sort order
      pagesQuery = `
        SELECT 
          pp.id,
          pp.page_name,
          pp.page_name_kh,
          pp.page_path,
          pp.page_title,
          pp.page_title_kh,
          pp.icon_name,
          pp.sort_order,
          COALESCE(umo.sort_order, pp.sort_order, 999) as user_sort_order,
          pp.created_at,
          pp.updated_at
          ${hierarchyColumns}
        FROM page_permissions pp
        JOIN role_page_permissions rpp ON pp.id = rpp.page_id
        LEFT JOIN user_menu_order umo ON pp.id = umo.page_id AND umo.user_id = $1
        WHERE rpp.role = $2 AND rpp.is_allowed = true
        ORDER BY ${hasHierarchy ? 'pp.parent_page_id NULLS FIRST, ' : ''}user_sort_order ASC, pp.page_name ASC
      `;
      queryParams = [currentUser.id, currentUser.role_name];
    } else {
      // Get pages with default system order
      pagesQuery = `
        SELECT 
          pp.id,
          pp.page_name,
          pp.page_name_kh,
          pp.page_path,
          pp.page_title,
          pp.page_title_kh,
          pp.icon_name,
          pp.sort_order,
          pp.sort_order as user_sort_order,
          pp.created_at,
          pp.updated_at
          ${hierarchyColumns}
        FROM page_permissions pp
        JOIN role_page_permissions rpp ON pp.id = rpp.page_id
        WHERE rpp.role = $1 AND rpp.is_allowed = true
        ORDER BY ${hasHierarchy ? 'pp.parent_page_id NULLS FIRST, ' : ''}pp.sort_order ASC, pp.page_name ASC
      `;
      queryParams = [currentUser.role_name];
    }

    const pagesResult = await client.query(pagesQuery, queryParams);

    return NextResponse.json({
      pages: pagesResult.rows,
      usePersonalOrder,
      userRole: currentUser.role_name
    });

  } catch (error: any) {
    console.error("Error fetching user menu order:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message 
    }, { status: 500 });
  } finally {
    client.release();
  }
}

// PUT - Save user's personal menu order
export async function PUT(request: Request) {
  const client = await pool.connect();
  
  try {
    const { pageOrders, usePersonalOrder } = await request.json();
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user info
    const sessionResult = await client.query(
      "SELECT u.id, u.full_name, r.name as role_name FROM tbl_tarl_users u JOIN tbl_tarl_roles r ON u.role_id = r.id WHERE u.session_token = $1 AND u.session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];

    if (!Array.isArray(pageOrders)) {
      return NextResponse.json({ error: "pageOrders must be an array" }, { status: 400 });
    }

    await client.query('BEGIN');

    // Save or update user menu preferences
    await client.query(`
      INSERT INTO user_menu_preferences (user_id, use_personal_order, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        use_personal_order = EXCLUDED.use_personal_order,
        updated_at = NOW()
    `, [currentUser.id, usePersonalOrder]);

    if (usePersonalOrder && pageOrders.length > 0) {
      // Clear existing user menu order
      await client.query(
        "DELETE FROM user_menu_order WHERE user_id = $1",
        [currentUser.id]
      );

      // Insert new user menu order
      for (let i = 0; i < pageOrders.length; i++) {
        const { pageId, sortOrder } = pageOrders[i];
        await client.query(`
          INSERT INTO user_menu_order (user_id, page_id, sort_order, updated_at)
          VALUES ($1, $2, $3, NOW())
        `, [currentUser.id, pageId, sortOrder || (i + 1)]);
      }
    }

    await client.query('COMMIT');

    return NextResponse.json({ 
      success: true, 
      message: usePersonalOrder 
        ? "Personal menu order saved successfully" 
        : "Menu preferences updated (using default order)"
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Error saving user menu order:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message 
    }, { status: 500 });
  } finally {
    client.release();
  }
}

// DELETE - Reset user's menu order to default
export async function DELETE() {
  const client = await pool.connect();
  
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user info
    const sessionResult = await client.query(
      "SELECT u.id, u.full_name, r.name as role_name FROM tbl_tarl_users u JOIN tbl_tarl_roles r ON u.role_id = r.id WHERE u.session_token = $1 AND u.session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];

    await client.query('BEGIN');

    // Delete user's custom menu order
    await client.query(
      "DELETE FROM user_menu_order WHERE user_id = $1",
      [currentUser.id]
    );

    // Reset preferences to use default order
    await client.query(`
      INSERT INTO user_menu_preferences (user_id, use_personal_order, updated_at)
      VALUES ($1, false, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        use_personal_order = false,
        updated_at = NOW()
    `, [currentUser.id]);

    await client.query('COMMIT');

    return NextResponse.json({ 
      success: true, 
      message: "Menu order reset to default successfully" 
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Error resetting user menu order:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message 
    }, { status: 500 });
  } finally {
    client.release();
  }
}