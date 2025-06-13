"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface PagePermission {
  id: number
  page_path: string
  page_name: string
  icon_name: string
  is_allowed: boolean
}

export default function PagePermissionsPage() {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<Record<string, PagePermission[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    try {
      const response = await fetch("/api/permissions")
      const data = await response.json()
      setPermissions(data)
    } catch (error) {
      console.error("Error fetching permissions:", error)
      toast.error("Failed to load permissions")
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionChange = async (role: string, pageId: number, isAllowed: boolean) => {
    try {
      const response = await fetch("/api/permissions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          pageId,
          isAllowed,
        }),
      })

      if (!response.ok) throw new Error("Failed to update permission")

      // Update local state
      setPermissions((prev) => ({
        ...prev,
        [role]: prev[role].map((p) =>
          p.id === pageId ? { ...p, is_allowed: isAllowed } : p
        ),
      }))

      toast.success("Permission updated successfully")
    } catch (error) {
      console.error("Error updating permission:", error)
      toast.error("Failed to update permission")
    }
  }

  if (!user || user.role !== "Admin") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-red-50 to-gray-100">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <PageLayout
      title="Page Permissions"
      description="Manage page access permissions for different roles"
    >
      <Card>
        <CardHeader>
          <CardTitle>Role-based Page Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="Teacher" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="Teacher">Teacher</TabsTrigger>
              <TabsTrigger value="Coordinator">Coordinator</TabsTrigger>
              <TabsTrigger value="Staff">Staff</TabsTrigger>
            </TabsList>

            {["Teacher", "Coordinator", "Staff"].map((role) => (
              <TabsContent key={role} value={role}>
                <div className="space-y-4">
                  {permissions[role]?.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <Badge variant="secondary">{permission.page_path}</Badge>
                        <span className="font-medium">{permission.page_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={permission.is_allowed}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(role, permission.id, checked)
                          }
                        />
                        <Label>{permission.is_allowed ? "Allowed" : "Denied"}</Label>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </PageLayout>
  )
} 