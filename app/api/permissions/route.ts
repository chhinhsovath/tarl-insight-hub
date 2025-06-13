import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get all pages
    const { data: pages, error: pagesError } = await supabase
      .from("page_permissions")
      .select("*")

    if (pagesError) throw pagesError

    // Get all role permissions
    const { data: rolePermissions, error: rolePermissionsError } = await supabase
      .from("role_page_permissions")
      .select("*")

    if (rolePermissionsError) throw rolePermissionsError

    // Group permissions by role
    const permissionsByRole = (rolePermissions as RolePermission[]).reduce((acc: Record<string, PermissionWithPage[]>, permission) => {
      const page = (pages as Page[]).find((p) => p.id === permission.page_id)
      if (!page) return acc

      if (!acc[permission.role]) {
        acc[permission.role] = []
      }

      acc[permission.role].push({
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
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Update permission
    const { error } = await supabase
      .from("role_page_permissions")
      .update({ is_allowed: isAllowed })
      .match({ role, page_id: pageId })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating permission:", error)
    return NextResponse.json({ error: "Failed to update permission" }, { status: 500 })
  }
} 