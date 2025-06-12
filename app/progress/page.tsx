"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { Filters } from "@/components/filters"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import type { LearningProgressSummary } from "@/lib/types"
import { Clock, Target, CheckCircle, BookOpen } from "lucide-react"

export default function LearningProgressPage() {
  const [progressData, setProgressData] = useState<LearningProgressSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<any>({})

  useEffect(() => {
    loadProgressData()
  }, [filters])

  const loadProgressData = async () => {
    setLoading(true)
    try {
      let query = supabase.from("learning_progress_summary").select("*")

      if (filters.provinceId) {
        query = query.eq("province_id", filters.provinceId)
      }
      if (filters.districtId) {
        query = query.eq("district_id", filters.districtId)
      }
      if (filters.clusterId) {
        query = query.eq("cluster_id", filters.clusterId)
      }
      if (filters.schoolId) {
        query = query.eq("school_id", filters.schoolId)
      }
      if (filters.subject) {
        query = query.eq("subject", filters.subject)
      }

      const { data, error } = await query.order("student_name")

      if (error) {
        console.error("Error loading progress data:", error)
        return
      }

      setProgressData(data || [])
    } catch (error) {
      console.error("Error loading progress data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500"
    if (percentage >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getTaskCompletionBadge = (percentage: number) => {
    if (percentage >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (percentage >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
    if (percentage >= 50) return <Badge className="bg-orange-100 text-orange-800">Fair</Badge>
    return <Badge className="bg-red-100 text-red-800">Needs Attention</Badge>
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
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Learning Progress Dashboard</h2>
          <p className="text-sm text-gray-600">Monitor student study hours and task completion</p>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters */}
            <div className="lg:col-span-1">
              <Filters onFilterChange={handleFilterChange} />
            </div>

            {/* Progress Data */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg">Loading progress data...</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {new Set(progressData.map((item) => item.student_id)).size}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Study Hours</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {progressData.length > 0
                            ? (
                                progressData.reduce((sum, item) => sum + item.total_hours_studied, 0) /
                                progressData.length
                              ).toFixed(1)
                            : "0"}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {progressData.length > 0
                            ? `${(progressData.reduce((sum, item) => sum + item.hours_progress_percentage, 0) / progressData.length).toFixed(1)}%`
                            : "0%"}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {progressData.length > 0
                            ? `${(progressData.reduce((sum, item) => sum + item.task_completion_percentage, 0) / progressData.length).toFixed(1)}%`
                            : "0%"}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Student Progress List */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Student Progress Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {progressData.map((student) => (
                          <div key={`${student.student_id}-${student.subject}`} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-medium">{student.student_name}</h3>
                                <p className="text-sm text-gray-600">
                                  {student.school_name} • {student.subject}
                                </p>
                              </div>
                              {getTaskCompletionBadge(student.task_completion_percentage)}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Study Hours Progress */}
                              <div>
                                <div className="flex justify-between text-sm mb-2">
                                  <span>Study Hours Progress</span>
                                  <span>
                                    {student.total_hours_studied.toFixed(1)} / {student.target_hours_per_subject} hrs
                                  </span>
                                </div>
                                <Progress value={student.hours_progress_percentage} className="h-2" />
                                <p className="text-xs text-gray-600 mt-1">
                                  {student.hours_progress_percentage.toFixed(1)}% complete
                                </p>
                              </div>

                              {/* Task Completion */}
                              <div>
                                <div className="flex justify-between text-sm mb-2">
                                  <span>Task Completion</span>
                                  <span>
                                    {student.tasks_completed} / {student.total_tasks_assigned} tasks
                                  </span>
                                </div>
                                <Progress value={student.task_completion_percentage} className="h-2" />
                                <p className="text-xs text-gray-600 mt-1">
                                  {student.task_completion_percentage.toFixed(1)}% complete
                                </p>
                              </div>
                            </div>

                            <div className="flex justify-between text-xs text-gray-500 mt-3">
                              <span>Study Sessions: {student.total_study_sessions}</span>
                              <span>Subject: {student.subject}</span>
                            </div>
                          </div>
                        ))}

                        {progressData.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No progress data found for the selected filters.
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
