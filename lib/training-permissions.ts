import { Pool } from "pg";
import { cookies } from "next/headers";

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

export interface UserSession {
  user_id: number;
  username: string;
  role: string;
  full_name?: string;
}

export async function validateTrainingAccess(
  requiredPage: string, 
  requiredAction: 'view' | 'create' | 'update' | 'delete' | 'export' = 'view'
): Promise<{ success: boolean; user?: UserSession; error?: string }> {
  const client = await pool.connect();
  
  try {
    // Get session token from cookies
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token')?.value;

    if (!sessionToken) {
      return { success: false, error: 'No session token provided' };
    }

    // Validate session and get user info
    const sessionResult = await client.query(
      'SELECT user_id, username, role FROM tbl_tarl_sessions WHERE session_token = $1 AND expires_at > NOW()',
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return { success: false, error: 'Invalid or expired session' };
    }

    const user = sessionResult.rows[0] as UserSession;

    // Get user's full name
    const userDetailsResult = await client.query(
      'SELECT full_name FROM tbl_tarl_users WHERE id = $1',
      [user.user_id]
    );

    if (userDetailsResult.rows.length > 0) {
      user.full_name = userDetailsResult.rows[0].full_name;
    }

    // Check page permission
    const pagePermissionResult = await client.query(`
      SELECT pp.id, pp.page_name, rpp.has_access
      FROM page_permissions pp
      LEFT JOIN role_page_permissions rpp ON pp.id = rpp.page_id AND rpp.role = $1
      WHERE pp.page_name = $2
    `, [user.role, requiredPage]);

    if (pagePermissionResult.rows.length === 0) {
      // If page doesn't exist in permissions, use legacy role-based check
      return checkLegacyTrainingPermissions(user, requiredPage, requiredAction);
    }

    const pagePermission = pagePermissionResult.rows[0];
    if (!pagePermission.has_access) {
      return { success: false, error: 'Insufficient permissions to access this page' };
    }

    // Check action permission
    const actionPermissionResult = await client.query(`
      SELECT is_allowed
      FROM page_action_permissions
      WHERE page_id = $1 AND role = $2 AND action_name = $3
    `, [pagePermission.id, user.role, requiredAction]);

    if (actionPermissionResult.rows.length === 0) {
      // If action permission doesn't exist, use legacy role-based check
      return checkLegacyTrainingPermissions(user, requiredPage, requiredAction);
    }

    const actionPermission = actionPermissionResult.rows[0];
    if (!actionPermission.is_allowed) {
      return { success: false, error: `Insufficient permissions to ${requiredAction} on this page` };
    }

    return { success: true, user };

  } catch (error) {
    console.error('Error validating training access:', error);
    return { success: false, error: 'Internal server error during permission check' };
  } finally {
    client.release();
  }
}

// Legacy permission check for backward compatibility
function checkLegacyTrainingPermissions(
  user: UserSession, 
  page: string, 
  action: string
): { success: boolean; user?: UserSession; error?: string } {
  
  const allowedRoles = ['admin', 'director', 'partner', 'coordinator', 'teacher'];
  
  if (!allowedRoles.includes(user.role)) {
    return { success: false, error: 'Insufficient role permissions' };
  }

  // Role-based restrictions
  if (user.role === 'teacher') {
    // Teachers can only view sessions and participants for their own sessions
    if (page === 'training-programs' || page === 'training-qr-codes') {
      if (action !== 'view') {
        return { success: false, error: 'Teachers can only view this resource' };
      }
    }
  }

  if (user.role === 'coordinator') {
    // Coordinators cannot create/update/delete programs
    if (page === 'training-programs' && ['create', 'update', 'delete'].includes(action)) {
      return { success: false, error: 'Coordinators cannot modify training programs' };
    }
  }

  // If no specific restrictions, allow access
  return { success: true, user };
}

// Helper function to get training page name from API path
export function getTrainingPageFromPath(path: string): string {
  if (path.includes('/training/sessions')) return 'training-sessions';
  if (path.includes('/training/programs')) return 'training-programs';
  if (path.includes('/training/participants')) return 'training-participants';
  if (path.includes('/training/qr-codes')) return 'training-qr-codes';
  if (path.includes('/training/flow')) return 'training-sessions'; // Flow is part of sessions
  return 'training';
}

// Helper function to get action from HTTP method
export function getActionFromMethod(method: string): 'view' | 'create' | 'update' | 'delete' {
  switch (method) {
    case 'GET': return 'view';
    case 'POST': return 'create';
    case 'PUT': 
    case 'PATCH': return 'update';
    case 'DELETE': return 'delete';
    default: return 'view';
  }
}