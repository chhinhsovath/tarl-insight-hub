import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { AuditLogger } from "@/lib/audit-logger"

interface Page {
  id: number
  page_path: string
  page_name: string
  icon_name: string
}

interface RolePermission {
  id: number
  role: string
  page_id: number
  is_allowed: boolean
}

interface PermissionWithPage {
  id: number
  page_path: string
  page_name: string
  icon_name: string
  is_allowed: boolean
}

const pool = getPool();

export async function GET() {
  try {
    const client = await pool.connect();

    // Get all pages ordered by sort_order if available
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'page_permissions' AND column_name = 'sort_order'
    `);
    
    const hasSortOrder = columnCheck.rows.length > 0;
    const pagesRes = await client.query(`
      SELECT * FROM page_permissions 
      ORDER BY ${hasSortOrder ? 'sort_order ASC, ' : ''}page_name ASC
    `);
    const pages: Page[] = pagesRes.rows;

    // Get all role permissions
    const rolePermissionsRes = await client.query('SELECT * FROM role_page_permissions');
    const rolePermissions: RolePermission[] = rolePermissionsRes.rows;

    client.release();

    // Group permissions by role
    const permissionsByRole = (rolePermissions as RolePermission[]).reduce((acc: Record<string, PermissionWithPage[]>, permission) => {
      const page = (pages as Page[]).find((p) => p.id === permission.page_id)
      if (!page) return acc

      const lowercasedRole = permission.role.toLowerCase()

      if (!acc[lowercasedRole]) {
        acc[lowercasedRole] = []
      }

      acc[lowercasedRole].push({
        id: permission.page_id,
        page_path: page.page_path,
        page_name: page.page_name,
        icon_name: page.icon_name,
        is_allowed: permission.is_allowed,
      })

      return acc
    }, {})

    return NextResponse.json(permissionsByRole)
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const client = await pool.connect();
  
  try {
    const { role, pageId, isAllowed } = await request.json()
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session and get user info for audit
    const sessionResult = await client.query(
      "SELECT u.id, u.full_name, r.name as role_name FROM tbl_tarl_users u JOIN tbl_tarl_roles r ON u.role_id = r.id WHERE u.session_token = $1 AND u.session_expires > NOW()",
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const currentUser = sessionResult.rows[0];

    // Get page info for audit
    const pageResult = await client.query(
      "SELECT page_name, page_path FROM page_permissions WHERE id = $1",
      [pageId]
    );

    if (pageResult.rows.length === 0) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const pageInfo = pageResult.rows[0];

    // Get current permission value for audit
    const currentPermResult = await client.query(
      "SELECT is_allowed FROM role_page_permissions WHERE role = $1 AND page_id = $2",
      [role, pageId]
    );

    const currentValue = currentPermResult.rows[0]?.is_allowed;

    // Update permission
    const updateQuery = 'UPDATE role_page_permissions SET is_allowed = $1 WHERE role = $2 AND page_id = $3';
    const { rowCount } = await client.query(updateQuery, [isAllowed, role, pageId]);

    if (rowCount === 0) {
      // Permission doesn't exist, create it
      await client.query(
        'INSERT INTO role_page_permissions (role, page_id, is_allowed, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())',
        [role, pageId, isAllowed]
      );
    }

    // Log audit entry (only if permission actually changed)
    if (currentValue !== isAllowed) {
      await AuditLogger.logPermissionChange(
        isAllowed ? 'granted' : 'revoked',
        role,
        pageInfo.page_name,
        pageInfo.page_path,
        currentUser.id,
        currentUser.full_name,
        currentUser.role_name
      );
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating permission:", error)
    return NextResponse.json({ error: "Failed to update permission" }, { status: 500 })
  } finally {
    client.release();
  }
} 