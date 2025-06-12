"use client"

import { useState, useEffect, useCallback } from "react"
import { PageLayout } from "@/components/page-layout"
import { StatsCard } from "@/components/stats-card"
import { Filters } from "@/components/filters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/protected-route"
import { GraduationCap, Users, BookOpen, TrendingUp, Plus } from "lucide-react"

interface Student {
  id: number
  name: string
  school_name: string
  grade: string
  age?: number
  gender?: string
  enrollment_date: string
  status: "active" | "inactive"
  subjects: string[]
  performance_level?: string
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<any>({})

  useEffect(() => {
    loadStudents()
  }, [filters])

  const loadStudents = async () => {
    setLoading(true)
    try {
      // Mock data for demonstration
      const mockStudents: Student[] = [
        {
          id: 1,
          name: "Sophea Chan",
          school_name: "Angkor High School",
          grade: "Grade 5",
          age: 11,
          gender: "Female",
          enrollment_date: "2024-01-15",
          status: "active",
          subjects: ["Math", "Khmer"],
          performance_level: "Above Average",
        },
        {
          id: 2,
          name: "Dara Pich",
          school_name: "Battambang Provincial School",
          grade: "Grade 4",
          age: 10,
          gender: "Male",
          enrollment_date: "2024-02-01",
          status: "active",
          subjects: ["Math", "Science"],
          performance_level: "Average",
        },
        {
          id: 3,
          name: "Maly Sok",
          school_name: "Bayon Primary School",
          grade: "Grade 3",
          age: 9,
          gender: "Female",
          enrollment_date: "2024-01-20",
          status: "active",
          subjects: ["Khmer", "Math"],
          performance_level: "Below Average",
        },
      ]

      // Apply filters
      let filteredData = mockStudents
      if (filters.schoolId) {
        // In real app, filter by school ID
      }
      if (filters.grade) {
        filteredData = filteredData.filter((student) => student.grade === filters.grade)
      }

      setStudents(filteredData)
    } catch (error) {
      console.error("Error loading students:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters)
  }, [])

  const getPerformanceBadge = (level?: string) => {
    if (!level) return null
    const colors = {
      "Above Average": "bg-green-100 text-green-800",
      Average: "bg-blue-100 text-blue-800",
      "Below Average": "bg-yellow-100 text-yellow-800",
      "Needs Support": "bg-red-100 text-red-800",
    }
    return <Badge className={colors[level as keyof typeof colors] || "bg-gray-100 text-gray-800"}>{level}</Badge>
  }

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const avgAge =
    students.length > 0
      ? students.filter((s) => s.age).reduce((sum, s) => sum + (s.age || 0), 0) / students.filter((s) => s.age).length
      : 0

  return (
    <ProtectedRoute allowedRoles={["admin", "teacher"]}>
      <PageLayout
        title="Student Management"
        description="Monitor and manage student information and progress"
        action={{
          label: "Add Student",
          onClick: () => console.log("Add student"),
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatsCard
                title="Total Students"
                value={loading ? "..." : students.length}
                description="Enrolled students"
                icon={GraduationCap}
                iconColor="text-blue-500"
              />
              <StatsCard
                title="Active Students"
                value={loading ? "..." : students.filter((s) => s.status === "active").length}
                description="Currently active"
                icon={Users}
                iconColor="text-green-500"
              />
              <StatsCard
                title="Average Age"
                value={loading ? "..." : avgAge.toFixed(1)}
                description="Years old"
                icon={BookOpen}
                iconColor="text-purple-500"
              />
              <StatsCard
                title="Schools"
                value={loading ? "..." : new Set(students.map((s) => s.school_name)).size}
                description="Participating schools"
                icon={TrendingUp}
                iconColor="text-orange-500"
              />
            </div>

            {/* Students List */}
            <Card className="soft-card">
              <CardHeader>
                <CardTitle>Student Directory</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-gray-500">Loading students...</div>
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No students found for the selected filters.</div>
                ) : (
                  <div className="space-y-4">
                    {students.map((student) => (
                      <div key={student.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium">{student.name}</h3>
                            <p className="text-sm text-gray-600">
                              {student.school_name} • {student.grade}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getPerformanceBadge(student.performance_level)}
                            {getStatusBadge(student.status)}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          {student.age && (
                            <div>
                              <span className="font-medium">Age:</span>
                              <p className="text-gray-600">{student.age} years</p>
                            </div>
                          )}
                          {student.gender && (
                            <div>
                              <span className="font-medium">Gender:</span>
                              <p className="text-gray-600">{student.gender}</p>
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Subjects:</span>
                            <p className="text-gray-600">{student.subjects.join(", ")}</p>
                          </div>
                          <div>
                            <span className="font-medium">Enrolled:</span>
                            <p className="text-gray-600">{new Date(student.enrollment_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageLayout>
    </ProtectedRoute>
  )
}
