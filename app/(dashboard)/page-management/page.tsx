"use client"

import { useEffect, useState } from "react"
import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

const roles = ["Admin", "Teacher", "Coordinator", "Collector"]

const pages = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/schools", label: "Schools" },
  { path: "/users", label: "Users" },
  { path: "/students", label: "Students" },
  { path: "/collection", label: "Data Collection" },
  { path: "/observations", label: "Observations" },
  { path: "/observations/new", label: "New Observation" },
  { path: "/observations/list", label: "Observations List" },
  { path: "/progress", label: "Progress" },
  { path: "/training", label: "Training" },
  { path: "/reports", label: "Reports" },
  { path: "/results", label: "Results" },
  { path: "/analytics", label: "Analytics" },
  { path: "/visits", label: "Visits" },
  { path: "/settings", label: "Settings" },
]

export default function PageManagement() {
  const { permissions, updatePermissions } = useAuth()
  const [localPerms, setLocalPerms] = useState<Record<string, string[]>>({})

  useEffect(() => {
    setLocalPerms(permissions)
  }, [permissions])

  const toggle = (path: string, role: string) => {
    setLocalPerms((prev) => {
      const current = prev[path] || []
      const exists = current.includes(role)
      const updated = exists ? current.filter((r) => r !== role) : [...current, role]
      return { ...prev, [path]: updated }
    })
  }

  const handleSave = () => {
    updatePermissions(localPerms)
  }

  return (
    <PageLayout title="Page Management" description="Control page access by role">
      <Card className="soft-card">
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2">Page</th>
                  {roles.map((role) => (
                    <th key={role} className="p-2 text-center">{role}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr key={page.path} className="border-t">
                    <td className="p-2">{page.label}</td>
                    {roles.map((role) => (
                      <td key={role} className="p-2 text-center">
                        <Checkbox
                          checked={(localPerms[page.path] || []).includes(role)}
                          onCheckedChange={() => toggle(page.path, role)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleSave}>Save</Button>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  )
}
