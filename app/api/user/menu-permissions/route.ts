import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { transformMenuItemsForRole } from "@/lib/role-dashboard-mapping";
import { getPool } from "@/lib/database-config";

const pool = getPool();

interface MenuItem {
  id: number;
  page_name: string;
  page_name_kh?: string;
  page_path: string;
  page_title?: string;
  page_title_kh?: string;
  icon_name?: string;
  parent_page_id?: number;
  sort_order: number;
  category?: string;
  is_allowed: boolean;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    console.log('Session token exists:', !!sessionToken);

    if (!sessionToken) {
      console.log('No session token found in cookies');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user
    console.log('Checking session for token:', sessionToken?.substring(0, 10) + '...');
    const sessionResult = await pool.query(
      "SELECT id, role_id, role, full_name FROM tbl_tarl_users WHERE session_token = $1 AND session_expires > NOW()",
      [sessionToken]
    );

    console.log('Session query result:', sessionResult.rows.length > 0 ? 'User found' : 'No user found');
    if (sessionResult.rows.length === 0) {
      console.log('Invalid or expired session');
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const user = sessionResult.rows[0];
    
    // If user doesn't have role field, get it from role_id
    let userRole = user.role;
    if (!userRole && user.role_id) {
      const roleResult = await pool.query("SELECT name FROM tbl_tarl_roles WHERE id = $1", [user.role_id]);
      userRole = roleResult.rows[0]?.name;
    }
    
    // Check if Khmer columns exist
    const khmerCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'page_permissions' 
      AND column_name IN ('page_name_kh', 'page_title_kh')
    `);
    
    const hasKhmer = khmerCheck.rows.length >= 2;
    const khmerColumns = hasKhmer ? ', pp.page_name_kh, pp.page_title_kh' : '';

    // Check if menu display columns exist
    const displayCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'page_permissions' 
      AND column_name IN ('is_displayed_in_menu', 'menu_visibility')
    `);
    
    const hasDisplayColumns = displayCheck.rows.length >= 2;
    const menuDisplayConditions = hasDisplayColumns 
      ? 'AND pp.is_displayed_in_menu = true AND pp.menu_visibility = \'visible\''
      : ''; // No additional filtering if columns don't exist

    // Get menu items the user has permission to access
    const menuResult = await pool.query(`
      SELECT 
        pp.id,
        pp.page_name,
        pp.page_path,
        pp.icon_name,
        pp.parent_page_id,
        pp.sort_order,
        rpp.is_allowed
        ${khmerColumns}
      FROM page_permissions pp
      JOIN role_page_permissions rpp ON pp.id = rpp.page_id
      WHERE rpp.role = $1 
        AND rpp.is_allowed = true
        ${menuDisplayConditions}
      ORDER BY pp.sort_order ASC, pp.page_name ASC
    `, [userRole]);

    const allowedMenuItems = menuResult.rows as MenuItem[];
    
    // Build hierarchical menu structure
    const menuMap = new Map<number, MenuItem & { children?: MenuItem[] }>();
    const rootItems: (MenuItem & { children?: MenuItem[] })[] = [];

    // First pass: create all menu items
    allowedMenuItems.forEach(item => {
      menuMap.set(item.id, { ...item, children: [] });
    });

    // Second pass: build hierarchy
    allowedMenuItems.forEach(item => {
      const menuItem = menuMap.get(item.id)!;
      
      if (item.parent_page_id && menuMap.has(item.parent_page_id)) {
        // This is a child item and parent exists in allowed items
        const parent = menuMap.get(item.parent_page_id)!;
        parent.children!.push(menuItem);
      } else if (!item.parent_page_id) {
        // This is a root item
        rootItems.push(menuItem);
      }
      // If parent doesn't exist in allowed items, skip this item
    });

    // Filter out empty parent items (parents with no accessible children)
    const filteredRootItems = rootItems.filter(item => {
      // Keep if it's not a parent, or if it's a parent with children
      return !item.parent_page_id || (item.children && item.children.length > 0);
    });

    // Sort children within each parent
    filteredRootItems.forEach(item => {
      if (item.children && item.children.length > 0) {
        item.children.sort((a, b) => (a.sort_order || 999) - (b.sort_order || 999));
      }
    });

    // Transform menu items to use role-specific dashboard URLs
    const transformedMenuItems = transformMenuItemsForRole(filteredRootItems, userRole);

    console.log(`User ${userRole} has access to ${allowedMenuItems.length} menu items`);
    console.log('Filtered menu structure:', transformedMenuItems.map(item => ({
      name: item.page_name,
      path: item.page_path,
      children: item.children?.map(child => ({ name: child.page_name, path: child.page_path })) || []
    })));

    return NextResponse.json({
      menuItems: transformedMenuItems,
      userRole: userRole,
      totalAllowed: allowedMenuItems.length
    });

  } catch (error) {
    console.error("Error fetching user menu permissions:", error);
    console.error("Error details:", error instanceof Error ? error.message : error);
    console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}