"use client"

import { useState, useEffect, useCallback } from "react"
import { PageLayout } from "@/components/page-layout"
import { StatsCard } from "@/components/stats-card"
import { Filters } from "@/components/filters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SchoolForm } from "@/components/school-form"
import { DatabaseService } from "@/lib/database"
import { ProtectedRoute } from "@/components/protected-route"
import { School, MapPin, Phone, Mail, Users, Plus } from "lucide-react"
import type { School as SchoolType } from "@/lib/types"

export default function SchoolsPage() {
  const [schools, setSchools] = useState<SchoolType[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<any>({})
  const [showAddDialog, setShowAddDialog] = useState(false)

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
      // Use mock data as fallback
      setSchools([
        {
          id: 1,
          name: "Angkor High School",
          name_kh: "វិទ្យាល័យអង្គរ",
          code: "AHS001",
          province_id: 1,
          district_id: 1,
          address: "Siem Reap City Center",
          contact_person: "Mr. Sopheak Mao",
          phone: "012-345-678",
          email: "angkor.hs@edu.gov.kh",
          total_students: 450,
          total_teachers: 25,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          name: "Bayon Primary School",
          name_kh: "សាលាបឋមសិក្សាបាយ័ន",
          code: "BPS001",
          province_id: 1,
          district_id: 2,
          address: "Angkor Chum District",
          contact_person: "Ms. Channary Lim",
          phone: "012-456-789",
          email: "bayon.ps@edu.gov.kh",
          total_students: 320,
          total_teachers: 18,
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters)
  }, [])

  const handleAddSchool = () => {
    setShowAddDialog(true)
  }

  const handleSchoolAdded = () => {
    setShowAddDialog(false)
    loadSchools()
  }

  const totalStudents = schools.reduce((sum, school) => sum + (school.total_students || 0), 0)
  const totalTeachers = schools.reduce((sum, school) => sum + (school.total_teachers || 0), 0)

  return (
    <ProtectedRoute allowedRoles={["Admin", "Coordinator"]}>
      <PageLayout
        title="Schools Management"
        description="Manage participating schools and their information"
        action={{
          label: "Add School",
          onClick: handleAddSchool,
          icon: Plus,
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="lg:col-span-1">
            <Filters onFilterChange={handleFilterChange} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard
                title="Total Schools"
                value={loading ? "..." : schools.length}
                description="Active schools"
                icon={School}
                iconColor="text-blue-500"
              />
              <StatsCard
                title="Total Students"
                value={loading ? "..." : totalStudents.toLocaleString()}
                description="Enrolled students"
                icon={Users}
                iconColor="text-green-500"
              />
              <StatsCard
                title="Total Teachers"
                value={loading ? "..." : totalTeachers.toLocaleString()}
                description="Teaching staff"
                icon={Users}
                iconColor="text-purple-500"
              />
            </div>

            {/* Schools Directory */}
            <Card className="soft-card">
              <CardHeader>
                <CardTitle>School Directory</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-gray-500">Loading schools...</div>
                  </div>
                ) : schools.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No schools found for the selected filters.</div>
                ) : (
                  <div className="space-y-4">
                    {schools.map((school) => (
                      <div
                        key={school.id}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{school.name}</h3>
                            <p className="text-sm text-gray-600">
                              {school.code ? `Code: ${school.code}` : "No code assigned"}
                            </p>
                          </div>
                          <Badge
                            variant={school.is_active ? "default" : "secondary"}
                            className={school.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                          >
                            {school.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          {school.contact_person && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Users className="h-4 w-4" />
                              <span>{school.contact_person}</span>
                            </div>
                          )}
                          {school.phone && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4" />
                              <span>{school.phone}</span>
                            </div>
                          )}
                          {school.email && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4" />
                              <span>{school.email}</span>
                            </div>
                          )}
                        </div>

                        {school.address && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-start space-x-2 text-sm text-gray-700">
                              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>{school.address}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-gray-100">
                          <span>Students: {school.total_students?.toLocaleString() || "N/A"}</span>
                          <span>Teachers: {school.total_teachers?.toLocaleString() || "N/A"}</span>
                          <span>Added: {new Date(school.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add School Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New School</DialogTitle>
            </DialogHeader>
            <SchoolForm onSuccess={handleSchoolAdded} onCancel={() => setShowAddDialog(false)} />
          </DialogContent>
        </Dialog>
      </PageLayout>
    </ProtectedRoute>
  )
}
