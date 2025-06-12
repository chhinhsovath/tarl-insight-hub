"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { Filters } from "@/components/filters"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DatabaseService } from "@/lib/database"
import { Users, Phone, UserCheck, Plus } from "lucide-react"
import type { User } from "@/lib/types"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<any>({})

  useEffect(() => {
    loadUsers()
  }, [filters])

  const loadUsers = async () => {
    setLoading(true)
    try {
      let data = await DatabaseService.getUsers()

      // Apply filters
      if (filters.provinceId) {
        data = data.filter((user) => user.province_id === filters.provinceId)
      }
      if (filters.districtId) {
        data = data.filter((user) => user.district_id === filters.districtId)
      }
      if (filters.schoolId) {
        data = data.filter((user) => user.school_id === filters.schoolId)
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

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge className={isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    const roleColors = {
      admin: "bg-purple-100 text-purple-800",
      teacher: "bg-blue-100 text-blue-800",
      coordinator: "bg-green-100 text-green-800",
      staff: "bg-gray-100 text-gray-800",
    }
    return (
      <Badge className={roleColors[role.toLowerCase() as keyof typeof roleColors] || "bg-gray-100 text-gray-800"}>
        {role}
      </Badge>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">TaRL Insight Hub</h1>
          <p className="text-sm text-gray-600 mt-1">Teaching at the Right Level</p>
        </div>
        <div className="px-4">
          <Navigation />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Users Management</h2>
            <p className="text-sm text-gray-600">Manage program participants and staff</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters */}
            <div className="lg:col-span-1">
              <Filters onFilterChange={handleFilterChange} />
            </div>

            {/* Users Content */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg">Loading users...</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                        <p className="text-xs text-muted-foreground">Active users</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Teachers</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {users.filter((u) => u.role.toLowerCase() === "teacher").length}
                        </div>
                        <p className="text-xs text-muted-foreground">Teaching staff</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Coordinators</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {users.filter((u) => u.role.toLowerCase() === "coordinator").length}
                        </div>
                        <p className="text-xs text-muted-foreground">Program coordinators</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Admin</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {users.filter((u) => u.role.toLowerCase() === "admin").length}
                        </div>
                        <p className="text-xs text-muted-foreground">System administrators</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Users List */}
                  <Card>
                    <CardHeader>
                      <CardTitle>User Directory</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {users.map((user) => (
                          <div key={user.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-medium text-lg">{user.full_name}</h3>
                                <p className="text-sm text-gray-600">{user.email || "No email provided"}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {getRoleBadge(user.role)}
                                {getStatusBadge(user.is_active)}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              {user.phone && (
                                <div className="flex items-center space-x-2">
                                  <Phone className="h-4 w-4 text-gray-500" />
                                  <span>{user.phone}</span>
                                </div>
                              )}

                              {user.gender && (
                                <div className="flex items-center space-x-2">
                                  <Users className="h-4 w-4 text-gray-500" />
                                  <span>Gender: {user.gender}</span>
                                </div>
                              )}

                              {user.years_of_experience && (
                                <div className="flex items-center space-x-2">
                                  <UserCheck className="h-4 w-4 text-gray-500" />
                                  <span>Experience: {user.years_of_experience} years</span>
                                </div>
                              )}
                            </div>

                            <div className="flex justify-between text-xs text-gray-500 mt-3">
                              <span>ID: {user.id}</span>
                              <span>Role: {user.role}</span>
                              <span>Added: {new Date(user.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}

                        {users.length === 0 && (
                          <div className="text-center py-8 text-gray-500">No users found for the selected filters.</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
