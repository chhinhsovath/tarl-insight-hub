"use client"

import { useState, useEffect, useCallback } from "react"
import { PageLayout } from "@/components/page-layout"
import { StatsCard } from "@/components/stats-card"
import { Filters } from "@/components/filters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserForm } from "@/components/user-form"
import { Users, Plus, Mail, Phone, School, UserCheck } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import type { User } from "@/lib/types"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<any>({})
  const [showAddDialog, setShowAddDialog] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [filters])

  const loadUsers = async () => {
    setLoading(true)
    try {
      let res = await fetch('/api/users')
      let data: User[] = await res.json()

      // Apply filters
      if (filters.schoolId) {
        data = data.filter((user) => user.school_id === filters.schoolId)
      }
      if (filters.role) {
        data = data.filter((user) => user.role === filters.role)
      }

      setUsers(data)
    } catch (error) {
      console.error("Error loading users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters)
  }, [])

  const handleAddUser = () => {
    setShowAddDialog(true)
  }

  const handleUserAdded = () => {
    setShowAddDialog(false)
    loadUsers()
  }

  const getRoleBadge = (role: string) => {
    const roleColors = {
      admin: "bg-red-100 text-red-800",
      teacher: "bg-blue-100 text-blue-800",
      collector: "bg-green-100 text-green-800",
    }
    return (
      <Badge className={roleColors[role as keyof typeof roleColors] || "bg-gray-100 text-gray-800"}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  const roleStats = users.reduce(
    (acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <PageLayout
        title="User Management"
        description="Manage system users and their permissions"
        action={{
          label: "Add User",
          onClick: handleAddUser,
          icon: Plus,
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="lg:col-span-1">
            <Filters onFilterChange={handleFilterChange} showRoleFilter />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatsCard
                title="Total Users"
                value={loading ? "..." : users.length}
                description="Active users"
                icon={Users}
                iconColor="text-blue-500"
              />
              <StatsCard
                title="Admins"
                value={loading ? "..." : roleStats.admin || 0}
                description="System administrators"
                icon={UserCheck}
                iconColor="text-red-500"
              />
              <StatsCard
                title="Teachers"
                value={loading ? "..." : roleStats.teacher || 0}
                description="Teaching staff"
                icon={School}
                iconColor="text-blue-500"
              />
              <StatsCard
                title="Collectors"
                value={loading ? "..." : roleStats.collector || 0}
                description="Data collectors"
                icon={Users}
                iconColor="text-green-500"
              />
            </div>

            {/* Users Directory */}
            <Card className="soft-card">
              <CardHeader>
                <CardTitle>User Directory</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-gray-500">Loading users...</div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No users found for the selected filters.</div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{user.full_name}</h3>
                            <p className="text-sm text-gray-600">{user.position || "No position specified"}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getRoleBadge(user.role)}
                            <Badge
                              variant={user.is_active ? "default" : "secondary"}
                              className={user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                            >
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {user.email && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4" />
                              <span>{user.email}</span>
                            </div>
                          )}
                          {user.phone && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-gray-100">
                          <span>School ID: {user.school_id || "N/A"}</span>
                          <span>Added: {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add User Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <UserForm onSuccess={handleUserAdded} onCancel={() => setShowAddDialog(false)} />
          </DialogContent>
        </Dialog>
      </PageLayout>
    </ProtectedRoute>
  )
}
