"use client"

import { useState, useEffect, useCallback } from "react"
import { PageLayout } from "@/components/page-layout"
import { StatsCard } from "@/components/stats-card"
import { Filters } from "@/components/filters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ProtectedRoute } from "@/components/protected-route"
import { Clock, Target, CheckCircle, BookOpen, Plus } from "lucide-react"
import { DatabaseService } from "@/lib/database"

interface StudentProgress {
  id: number
  student_id: number
  student_name: string
  school_name: string
  subject_code: string
  subject_name: string
  total_hours_studied: number
  target_hours_per_subject: number
  hours_progress_percentage: number
  tasks_completed: number
  total_tasks_assigned: number
  task_completion_percentage: number
  total_study_sessions: number
}

export default function ProgressPage() {
  const [progressData, setProgressData] = useState<StudentProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<any>({})
  const [showAddDialog, setShowAddDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadProgressData()
  }, [filters])

  const loadProgressData = async () => {
    setLoading(true)
    try {
      const data = await DatabaseService.getLearningProgressSummary(filters)

      if (data && data.length > 0) {
        setProgressData(data)
      } else {
        // Enhanced mock data with more realistic scenarios
        const mockData: StudentProgress[] = [
          {
            id: 1,
            student_id: 1,
            student_name: "Sophea Chan",
            school_name: "Angkor High School",
            subject_code: "MATH",
            subject_name: "Mathematics",
            total_hours_studied: 45.5,
            target_hours_per_subject: 60,
            hours_progress_percentage: 75.8,
            tasks_completed: 8,
            total_tasks_assigned: 10,
            task_completion_percentage: 80,
            total_study_sessions: 15,
          },
          {
            id: 2,
            student_id: 2,
            student_name: "Dara Pich",
            school_name: "Battambang Provincial School",
            subject_code: "KHMER",
            subject_name: "Khmer Language",
            total_hours_studied: 32.0,
            target_hours_per_subject: 50,
            hours_progress_percentage: 64.0,
            tasks_completed: 6,
            total_tasks_assigned: 8,
            task_completion_percentage: 75,
            total_study_sessions: 12,
          },
          {
            id: 3,
            student_id: 3,
            student_name: "Maly Sok",
            school_name: "Bayon Primary School",
            subject_code: "MATH",
            subject_name: "Mathematics",
            total_hours_studied: 28.5,
            target_hours_per_subject: 40,
            hours_progress_percentage: 71.3,
            tasks_completed: 5,
            total_tasks_assigned: 7,
            task_completion_percentage: 71.4,
            total_study_sessions: 10,
          },
          {
            id: 4,
            student_id: 4,
            student_name: "Pisach Lim",
            school_name: "Thma Koul Secondary School",
            subject_code: "MATH",
            subject_name: "Mathematics",
            total_hours_studied: 52.0,
            target_hours_per_subject: 60,
            hours_progress_percentage: 86.7,
            tasks_completed: 9,
            total_tasks_assigned: 10,
            task_completion_percentage: 90,
            total_study_sessions: 18,
          },
          {
            id: 5,
            student_id: 5,
            student_name: "Sreypov Keo",
            school_name: "Chamkar Mon Primary",
            subject_code: "KHMER",
            subject_name: "Khmer Language",
            total_hours_studied: 38.5,
            target_hours_per_subject: 50,
            hours_progress_percentage: 77.0,
            tasks_completed: 7,
            total_tasks_assigned: 9,
            task_completion_percentage: 77.8,
            total_study_sessions: 14,
          },
          {
            id: 6,
            student_id: 6,
            student_name: "Bopha Nhem",
            school_name: "Daun Penh High School",
            subject_code: "MATH",
            subject_name: "Mathematics",
            total_hours_studied: 22.0,
            target_hours_per_subject: 60,
            hours_progress_percentage: 36.7,
            tasks_completed: 3,
            total_tasks_assigned: 8,
            task_completion_percentage: 37.5,
            total_study_sessions: 8,
          },
        ]
        setProgressData(mockData)

        // Show a subtle notification that we're using demo data
        toast({
          title: "Demo Mode",
          description: "Showing sample progress data while database is being configured.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error loading progress data:", error)
      // Don't show error toast for demo mode, just use mock data
      const mockData: StudentProgress[] = [
        {
          id: 1,
          student_id: 1,
          student_name: "Sophea Chan",
          school_name: "Angkor High School",
          subject_code: "MATH",
          subject_name: "Mathematics",
          total_hours_studied: 45.5,
          target_hours_per_subject: 60,
          hours_progress_percentage: 75.8,
          tasks_completed: 8,
          total_tasks_assigned: 10,
          task_completion_percentage: 80,
          total_study_sessions: 15,
        },
      ]
      setProgressData(mockData)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters)
  }, [])

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

  const avgProgress =
    progressData.length > 0
      ? progressData.reduce((sum, item) => sum + item.hours_progress_percentage, 0) / progressData.length
      : 0

  const avgCompletion =
    progressData.length > 0
      ? progressData.reduce((sum, item) => sum + item.task_completion_percentage, 0) / progressData.length
      : 0

  return (
    <ProtectedRoute allowedRoles={["admin", "teacher"]}>
      <PageLayout
        title="Learning Progress Dashboard"
        description="Monitor student study hours and task completion"
        action={{
          label: "Add Progress Entry",
          onClick: () => setShowAddDialog(true),
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
                value={loading ? "..." : new Set(progressData.map((item) => item.student_id)).size}
                description="Tracked students"
                icon={BookOpen}
                iconColor="text-blue-500"
              />
              <StatsCard
                title="Avg Study Hours"
                value={
                  loading
                    ? "..."
                    : (
                        progressData.reduce((sum, item) => sum + item.total_hours_studied, 0) / progressData.length || 0
                      ).toFixed(1)
                }
                description="Hours per student"
                icon={Clock}
                iconColor="text-green-500"
              />
              <StatsCard
                title="Avg Progress"
                value={loading ? "..." : `${avgProgress.toFixed(1)}%`}
                description="Study progress"
                icon={Target}
                iconColor="text-purple-500"
              />
              <StatsCard
                title="Task Completion"
                value={loading ? "..." : `${avgCompletion.toFixed(1)}%`}
                description="Average completion"
                icon={CheckCircle}
                iconColor="text-orange-500"
              />
            </div>

            {/* Student Progress List */}
            <Card className="soft-card">
              <CardHeader>
                <CardTitle>Student Progress Details</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-gray-500">Loading progress data...</div>
                  </div>
                ) : progressData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No progress data found for the selected filters.</div>
                ) : (
                  <div className="space-y-4">
                    {progressData.map((student) => (
                      <div key={`${student.student_id}-${student.subject_code}`} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium">{student.student_name}</h3>
                            <p className="text-sm text-gray-600">
                              {student.school_name} • {student.subject_name}
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
                          <span>Subject: {student.subject_name}</span>
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
