import { NextResponse } from "next/server";
import { Pool } from "pg";
import { cookies } from "next/headers";
import { ActionPermissionManager } from "@/lib/action-permissions";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

// POST - Check if user can perform specific action
export async function POST(request: Request) {
  try {
    const { pageName, actionName, userRole } = await request.json();
    
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
    
    // Use provided userRole or default to current user's role
    const roleToCheck = userRole || currentUser.role_name;

    if (!pageName || !actionName) {
      return NextResponse.json({ error: "Missing required fields: pageName, actionName" }, { status: 400 });
    }

    const canPerform = await ActionPermissionManager.canPerformAction(roleToCheck, pageName, actionName);
    
    return NextResponse.json({ 
      canPerform,
      userRole: roleToCheck,
      pageName,
      actionName
    });
  } catch (error) {
    console.error("Error checking action permission:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET - Check multiple actions at once
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageName = searchParams.get('pageName');
    const actions = searchParams.get('actions'); // comma-separated list
    const userRole = searchParams.get('userRole');
    
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
    
    // Use provided userRole or default to current user's role
    const roleToCheck = userRole || currentUser.role_name;

    if (!pageName) {
      return NextResponse.json({ error: "Missing required field: pageName" }, { status: 400 });
    }

    const actionsToCheck = actions ? actions.split(',') : ActionPermissionManager.getAvailableActions();
    const permissions: Record<string, boolean> = {};
    
    for (const action of actionsToCheck) {
      permissions[action.trim()] = await ActionPermissionManager.canPerformAction(roleToCheck, pageName, action.trim());
    }
    
    return NextResponse.json({ 
      permissions,
      userRole: roleToCheck,
      pageName
    });
  } catch (error) {
    console.error("Error checking action permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}