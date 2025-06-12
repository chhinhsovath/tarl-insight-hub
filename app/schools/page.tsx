"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { Filters } from "@/components/filters"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DatabaseService } from "@/lib/database"
import { School, MapPin, Phone, Mail, Users, Plus } from "lucide-react"
import type { School as SchoolType } from "@/lib/types"

export default function SchoolsPage() {
  const [schools, setSchools] = useState<SchoolType[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<any>({})

  useEffect(() => {
    loadSchools()
  }, [filters])

  const loadSchools = async () => {
    setLoading(true)
    try {
      let data = await DatabaseService.getSchools()

      // Apply filters
      if (filters.provinceId) {
        data = data.filter((school) => school.province_id === filters.provinceId)
      }
      if (filters.districtId) {
        data = data.filter((school) => school.district_id === filters.districtId)
      }
      if (filters.schoolId) {
        data = data.filter((school) => school.id === filters.schoolId)
      }

      setSchools(data)
    } catch (error) {
      console.error("Error loading schools:", error)
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
            <h2 className="text-xl font-semibold text-gray-900">Schools Management</h2>
            <p className="text-sm text-gray-600">Manage participating schools and their information</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add School
          </Button>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters */}
            <div className="lg:col-span-1">
              <Filters onFilterChange={handleFilterChange} />
            </div>

            {/* Schools Content */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg">Loading schools...</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
                        <School className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{schools.length}</div>
                        <p className="text-xs text-muted-foreground">Active schools</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {schools.reduce((sum, school) => sum + (school.total_students || 0), 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Enrolled students</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {schools.reduce((sum, school) => sum + (school.total_teachers || 0), 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Teaching staff</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Schools List */}
                  <Card>
                    <CardHeader>
                      <CardTitle>School Directory</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {schools.map((school) => (
                          <div key={school.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-medium text-lg">{school.name}</h3>
                                <p className="text-sm text-gray-600">
                                  {school.code ? `Code: ${school.code}` : "No code assigned"}
                                </p>
                              </div>
                              {getStatusBadge(school.is_active)}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              {school.contact_person && (
                                <div className="flex items-center space-x-2">
                                  <Users className="h-4 w-4 text-gray-500" />
                                  <span>{school.contact_person}</span>
                                </div>
                              )}

                              {school.phone && (
                                <div className="flex items-center space-x-2">
                                  <Phone className="h-4 w-4 text-gray-500" />
                                  <span>{school.phone}</span>
                                </div>
                              )}

                              {school.email && (
                                <div className="flex items-center space-x-2">
                                  <Mail className="h-4 w-4 text-gray-500" />
                                  <span>{school.email}</span>
                                </div>
                              )}
                            </div>

                            {school.address && (
                              <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                                <div className="flex items-start space-x-2">
                                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                                  <span className="text-gray-700">{school.address}</span>
                                </div>
                              </div>
                            )}

                            <div className="flex justify-between text-xs text-gray-500 mt-3">
                              <span>Students: {school.total_students?.toLocaleString() || "N/A"}</span>
                              <span>Teachers: {school.total_teachers?.toLocaleString() || "N/A"}</span>
                              <span>Added: {new Date(school.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}

                        {schools.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No schools found for the selected filters.
                          </div>
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
