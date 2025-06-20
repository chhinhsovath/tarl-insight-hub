import { NextResponse } from "next/server";
import { getPool } from "@/lib/database-config";
import { cookies } from "next/headers";
import { ActionPermissionManager } from "@/lib/action-permissions";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// GET - Fetch action permissions (with optional filters)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageName = searchParams.get('pageName');
    const role = searchParams.get('role');
    const userRole = searchParams.get('userRole'); // For getting user's permissions
    
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session
    const sessionResult = await pool.query(
      "SELECT u.id, r.name as role_name FROM tbl_tarl_users u JOIN tbl_tarl_roles r ON u.role_id = r.id WHERE u.session_token = $1 AND u.session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];

    // If requesting user's own permissions, allow any authenticated user
    if (userRole) {
      const permissions = await ActionPermissionManager.getUserActionPermissions(userRole);
      return NextResponse.json({ permissions });
    }

    // For admin operations (viewing/managing all permissions), require admin role
    if (!currentUser.role_name || currentUser.role_name.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: "Access denied. Admin role required." }, { status: 403 });
    }

    if (pageName) {
      const permissions = await ActionPermissionManager.getPageActionPermissions(pageName, role);
      return NextResponse.json({ permissions });
    }

    // Get all action permissions
    const client = await pool.connect();
    try {
      let query = `
        SELECT 
          pap.id,
          pap.page_id,
          pap.action_name,
          pap.role,
          pap.is_allowed,
          pp.page_name,
          pp.page_path
        FROM page_action_permissions pap
        JOIN page_permissions pp ON pap.page_id = pp.id
        ORDER BY pp.page_name, pap.role, pap.action_name
      `;

      const result = await client.query(query);
      
      // Group by page and role for easier frontend consumption
      const groupedPermissions: Record<string, Record<string, any>> = {};
      
      result.rows.forEach(row => {
        const pageKey = row.page_name;
        const roleKey = row.role;
        
        if (!groupedPermissions[pageKey]) {
          groupedPermissions[pageKey] = {
            page_id: row.page_id,
            page_name: row.page_name,
            page_path: row.page_path,
            roles: {}
          };
        }
        
        if (!groupedPermissions[pageKey].roles[roleKey]) {
          groupedPermissions[pageKey].roles[roleKey] = {
            role: row.role,
            actions: {}
          };
        }
        
        groupedPermissions[pageKey].roles[roleKey].actions[row.action_name] = row.is_allowed;
      });

      return NextResponse.json({ 
        permissions: groupedPermissions,
        availableActions: ActionPermissionManager.getAvailableActions()
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching action permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update action permission
export async function PUT(request: Request) {
  try {
    const { pageId, role, actionName, isAllowed } = await request.json();
    
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and check if user is admin
    const sessionResult = await pool.query(
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

    if (!pageId || !role || !actionName || typeof isAllowed !== 'boolean') {
      return NextResponse.json({ error: "Missing required fields: pageId, role, actionName, isAllowed" }, { status: 400 });
    }

    const changedBy = {
      userId: currentUser.id,
      username: currentUser.username || 'Unknown',
      role: currentUser.role_name
    };
    
    const success = await ActionPermissionManager.updateActionPermission(pageId, role, actionName, isAllowed, changedBy);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: `Action permission ${isAllowed ? 'granted' : 'revoked'} successfully` 
      });
    } else {
      return NextResponse.json({ error: "Failed to update action permission" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error updating action permission:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Bulk update action permissions for a role
export async function POST(request: Request) {
  try {
    const { pageId, role, actions } = await request.json();
    
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and check if user is admin
    const sessionResult = await pool.query(
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

    if (!pageId || !role || !actions || typeof actions !== 'object') {
      return NextResponse.json({ error: "Missing required fields: pageId, role, actions" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const changedBy = {
        userId: currentUser.id,
        username: currentUser.username || 'Unknown',
        role: currentUser.role_name
      };
      
      // Update each action permission
      for (const [actionName, isAllowed] of Object.entries(actions)) {
        if (typeof isAllowed === 'boolean') {
          await ActionPermissionManager.updateActionPermission(pageId, role, actionName, isAllowed, changedBy);
        }
      }
      
      await client.query('COMMIT');
      
      return NextResponse.json({ 
        success: true, 
        message: `Bulk action permissions updated successfully for ${role}` 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error bulk updating action permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}