import { NextResponse } from "next/server"
import { Pool } from "pg"

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

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

export async function GET() {
  try {
    const client = await pool.connect();

    // Get all pages
    const pagesRes = await client.query('SELECT * FROM page_permissions');
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
  try {
    const { role, pageId, isAllowed } = await request.json()
    const client = await pool.connect();

    // Update permission
    const updateQuery = 'UPDATE role_page_permissions SET is_allowed = $1 WHERE role = $2 AND page_id = $3';
    const { rowCount } = await client.query(updateQuery, [isAllowed, role, pageId]);

    client.release();

    if (rowCount === 0) throw new Error("Permission not found or not updated");

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating permission:", error)
    return NextResponse.json({ error: "Failed to update permission" }, { status: 500 })
  }
} 