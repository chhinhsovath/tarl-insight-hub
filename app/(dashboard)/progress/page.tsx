"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/page-layout"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { TrendingUp, Users, Target, Clock, Award, BarChart3, Plus, Filter, Download } from "lucide-react"

interface StudentProgress {
  id: number
  student_name: string
  grade: string
  school_name: string
  math_progress: number
  reading_progress: number
  overall_progress: number
  sessions_completed: number
  last_assessment: string
  status: "On Track" | "Needs Support" | "Excelling"
}

export default function ProgressPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [progressData, setProgressData] = useState<StudentProgress[]>([])
  const [selectedTab, setSelectedTab] = useState("overview")

  useEffect(() => {
    loadProgressData()
  }, [])

  const loadProgressData = async () => {
    setLoading(true)
    try {
      // Mock data based on user role
      const mockData: StudentProgress[] = [
        {
          id: 1,
          student_name: "Sophea Meng",
          grade: "Grade 3",
          school_name: "Angkor Primary School",
          math_progress: 85,
          reading_progress: 78,
          overall_progress: 82,
          sessions_completed: 24,
          last_assessment: "2024-12-01",
          status: "On Track",
        },
        {
          id: 2,
          student_name: "Dara Pich",
          grade: "Grade 4",
          school_name: "Bayon Elementary",
          math_progress: 92,
          reading_progress: 88,
          overall_progress: 90,
          sessions_completed: 28,
          last_assessment: "2024-12-02",
          status: "Excelling",
        },
        {
          id: 3,
          student_name: "Maly Sok",
          grade: "Grade 2",
          school_name: "Preah Vihear School",
          math_progress: 65,
          reading_progress: 58,
          overall_progress: 62,
          sessions_completed: 18,
          last_assessment: "2024-11-28",
          status: "Needs Support",
        },
        {
          id: 4,
          student_name: "Pisach Lim",
          grade: "Grade 5",
          school_name: "Tonle Sap Academy",
          math_progress: 88,
          reading_progress: 85,
          overall_progress: 87,
          sessions_completed: 32,
          last_assessment: "2024-12-03",
          status: "On Track",
        },
        {
          id: 5,
          student_name: "Sreypov Keo",
          grade: "Grade 3",
          school_name: "Mekong Primary",
          math_progress: 76,
          reading_progress: 82,
          overall_progress: 79,
          sessions_completed: 22,
          last_assessment: "2024-11-30",
          status: "On Track",
        },
      ]

      // Filter data based on user role
      if (user?.role === "Teacher" && user?.school_id) {
        // Teachers see only their school's students
        setProgressData(mockData.slice(0, 3))
      } else {
        // Admins and Coordinators see all students
        setProgressData(mockData)
      }
    } catch (error) {
      console.error("Error loading progress data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Excelling":
        return "bg-green-100 text-green-800"
      case "On Track":
        return "bg-blue-100 text-blue-800"
      case "Needs Support":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 85) return "bg-green-500"
    if (progress >= 70) return "bg-blue-500"
    if (progress >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const avgProgress =
    progressData.length > 0
      ? progressData.reduce((sum, item) => sum + item.overall_progress, 0) / progressData.length
      : 0
  const studentsOnTrack = progressData.filter((s) => s.status === "On Track" || s.status === "Excelling").length
  const totalSessions = progressData.reduce((sum, item) => sum + item.sessions_completed, 0)

  return (
    <ProtectedRoute allowedRoles={["Admin", "Teacher", "Coordinator"]}>
      <PageLayout
        title="Learning Progress Dashboard"
        description={`Monitor student progress and learning outcomes${user?.role === "Teacher" ? " for your students" : ""}`}
        action={{
          label: "Export Report",
          onClick: () => console.log("Export progress report"),
          icon: Download,
        }}
      >
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatsCard
              title="Total Students"
              value={loading ? "..." : progressData.length}
              description="Being tracked"
              icon={Users}
              iconColor="text-blue-500"
            />
            <StatsCard
              title="Average Progress"
              value={loading ? "..." : `${avgProgress.toFixed(1)}%`}
              description="Overall completion"
              icon={Target}
              iconColor="text-green-500"
            />
            <StatsCard
              title="Students On Track"
              value={loading ? "..." : studentsOnTrack}
              description={`${progressData.length > 0 ? ((studentsOnTrack / progressData.length) * 100).toFixed(0) : 0}% success rate`}
              icon={Award}
              iconColor="text-purple-500"
            />
            <StatsCard
              title="Total Sessions"
              value={loading ? "..." : totalSessions}
              description="Learning sessions completed"
              icon={Clock}
              iconColor="text-orange-500"
            />
          </div>

          {/* Progress Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="detailed">Detailed View</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Progress Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Progress Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Mathematics</span>
                          <span>
                            {progressData.length > 0
                              ? (
                                  progressData.reduce((sum, s) => sum + s.math_progress, 0) / progressData.length
                                ).toFixed(1)
                              : 0}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            progressData.length > 0
                              ? progressData.reduce((sum, s) => sum + s.math_progress, 0) / progressData.length
                              : 0
                          }
                          className="h-3"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Reading</span>
                          <span>
                            {progressData.length > 0
                              ? (
                                  progressData.reduce((sum, s) => sum + s.reading_progress, 0) / progressData.length
                                ).toFixed(1)
                              : 0}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            progressData.length > 0
                              ? progressData.reduce((sum, s) => sum + s.reading_progress, 0) / progressData.length
                              : 0
                          }
                          className="h-3"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Overall Progress</span>
                          <span>{avgProgress.toFixed(1)}%</span>
                        </div>
                        <Progress value={avgProgress} className="h-3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Student Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {["Excelling", "On Track", "Needs Support"].map((status) => {
                        const count = progressData.filter((s) => s.status === status).length
                        const percentage = progressData.length > 0 ? (count / progressData.length) * 100 : 0
                        return (
                          <div key={status} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge className={getStatusColor(status)}>{status}</Badge>
                              <span className="text-sm text-gray-600">{count} students</span>
                            </div>
                            <span className="text-sm font-medium">{percentage.toFixed(0)}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Detailed View Tab */}
            <TabsContent value="detailed" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Student Progress Details</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Student
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-gray-500">Loading student data...</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {progressData.map((student) => (
                        <div key={student.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">{student.student_name}</h3>
                              <p className="text-sm text-gray-600">
                                {student.grade} • {student.school_name}
                              </p>
                            </div>
                            <Badge className={getStatusColor(student.status)}>{student.status}</Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Mathematics</span>
                                <span>{student.math_progress}%</span>
                              </div>
                              <Progress value={student.math_progress} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Reading</span>
                                <span>{student.reading_progress}%</span>
                              </div>
                              <Progress value={student.reading_progress} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Overall</span>
                                <span>{student.overall_progress}%</span>
                              </div>
                              <Progress value={student.overall_progress} className="h-2" />
                            </div>
                          </div>

                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Sessions: {student.sessions_completed}</span>
                            <span>Last Assessment: {student.last_assessment}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Grade Level Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {["Grade 2", "Grade 3", "Grade 4", "Grade 5"].map((grade) => {
                        const gradeStudents = progressData.filter((s) => s.grade === grade)
                        const avgGradeProgress =
                          gradeStudents.length > 0
                            ? gradeStudents.reduce((sum, s) => sum + s.overall_progress, 0) / gradeStudents.length
                            : 0
                        return (
                          <div key={grade}>
                            <div className="flex justify-between text-sm mb-2">
                              <span>
                                {grade} ({gradeStudents.length} students)
                              </span>
                              <span>{avgGradeProgress.toFixed(1)}%</span>
                            </div>
                            <Progress value={avgGradeProgress} className="h-2" />
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Subject Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Mathematics Average</span>
                          <span>
                            {progressData.length > 0
                              ? (
                                  progressData.reduce((sum, s) => sum + s.math_progress, 0) / progressData.length
                                ).toFixed(1)
                              : 0}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            progressData.length > 0
                              ? progressData.reduce((sum, s) => sum + s.math_progress, 0) / progressData.length
                              : 0
                          }
                          className="h-3"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Reading Average</span>
                          <span>
                            {progressData.length > 0
                              ? (
                                  progressData.reduce((sum, s) => sum + s.reading_progress, 0) / progressData.length
                                ).toFixed(1)
                              : 0}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            progressData.length > 0
                              ? progressData.reduce((sum, s) => sum + s.reading_progress, 0) / progressData.length
                              : 0
                          }
                          className="h-3"
                        />
                      </div>
                      <div className="pt-4 border-t">
                        <p className="text-sm text-gray-600">
                          {progressData.reduce((sum, s) => sum + s.math_progress, 0) / progressData.length >
                          progressData.reduce((sum, s) => sum + s.reading_progress, 0) / progressData.length
                            ? "Mathematics is performing better than Reading"
                            : "Reading is performing better than Mathematics"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </PageLayout>
    </ProtectedRoute>
  )
}
