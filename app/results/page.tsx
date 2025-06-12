"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { Filters } from "@/components/filters"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, Award, FileText, Calendar } from "lucide-react"

interface AssessmentResult {
  assessment_id: number
  student_id: number
  student_name: string
  school_id: number
  school_name: string
  subject: string
  lesson_title: string
  assessment_type: string
  assessment_date: string
  percentage: number
  score: number
  max_score: number
  teacher_remarks: string
}

export default function LearningResultsPage() {
  const [assessmentData, setAssessmentData] = useState<AssessmentResult[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<any>({})

  useEffect(() => {
    loadAssessmentData()
  }, [filters])

  const loadAssessmentData = async () => {
    setLoading(true)
    try {
      let query = supabase.from("formative_assessments").select(`
          assessment_id,
          student_id,
          subject,
          lesson_title,
          assessment_type,
          assessment_date,
          percentage,
          score,
          max_score,
          teacher_remarks,
          students!inner(student_name),
          student_enrollments!inner(
            school_id,
            schools!inner(school_name, cluster_id, district_id, province_id)
          )
        `)

      if (filters.provinceId) {
        query = query.eq("student_enrollments.schools.province_id", filters.provinceId)
      }
      if (filters.districtId) {
        query = query.eq("student_enrollments.schools.district_id", filters.districtId)
      }
      if (filters.clusterId) {
        query = query.eq("student_enrollments.schools.cluster_id", filters.clusterId)
      }
      if (filters.schoolId) {
        query = query.eq("student_enrollments.school_id", filters.schoolId)
      }
      if (filters.subject) {
        query = query.eq("subject", filters.subject)
      }

      const { data, error } = await query.order("assessment_date", { ascending: false })

      if (error) {
        console.error("Error loading assessment data:", error)
        return
      }

      // Transform the data to flatten the nested structure
      const transformedData =
        data?.map((item: any) => ({
          assessment_id: item.assessment_id,
          student_id: item.student_id,
          student_name: item.students.student_name,
          school_id: item.student_enrollments.school_id,
          school_name: item.student_enrollments.schools.school_name,
          subject: item.subject,
          lesson_title: item.lesson_title || "General Assessment",
          assessment_type: item.assessment_type,
          assessment_date: item.assessment_date,
          percentage: item.percentage || 0,
          score: item.score || 0,
          max_score: item.max_score || 100,
          teacher_remarks: item.teacher_remarks || "",
        })) || []

      setAssessmentData(transformedData)
    } catch (error) {
      console.error("Error loading assessment data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters)
  }

  const getGradeBadge = (percentage: number) => {
    if (percentage >= 90) return <Badge className="bg-green-100 text-green-800">A</Badge>
    if (percentage >= 80) return <Badge className="bg-blue-100 text-blue-800">B</Badge>
    if (percentage >= 70) return <Badge className="bg-yellow-100 text-yellow-800">C</Badge>
    if (percentage >= 60) return <Badge className="bg-orange-100 text-orange-800">D</Badge>
    return <Badge className="bg-red-100 text-red-800">F</Badge>
  }

  const getMonthlyData = () => {
    const monthlyScores: { [key: string]: { total: number; count: number; month: string } } = {}

    assessmentData.forEach((assessment) => {
      const date = new Date(assessment.assessment_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const monthName = date.toLocaleDateString("en-US", { year: "numeric", month: "short" })

      if (!monthlyScores[monthKey]) {
        monthlyScores[monthKey] = { total: 0, count: 0, month: monthName }
      }

      monthlyScores[monthKey].total += assessment.percentage
      monthlyScores[monthKey].count += 1
    })

    return Object.values(monthlyScores)
      .map((data) => ({
        month: data.month,
        avgScore: data.count > 0 ? (data.total / data.count).toFixed(1) : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }

  const chartData = getMonthlyData()

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
          <h2 className="text-xl font-semibold text-gray-900">Learning Results Dashboard</h2>
          <p className="text-sm text-gray-600">Monitor assessment scores and student performance</p>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters */}
            <div className="lg:col-span-1">
              <Filters onFilterChange={handleFilterChange} />
            </div>

            {/* Results Data */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg">Loading assessment results...</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{assessmentData.length}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {assessmentData.length > 0
                            ? `${(assessmentData.reduce((sum, item) => sum + item.percentage, 0) / assessmentData.length).toFixed(1)}%`
                            : "0%"}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">High Performers</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {assessmentData.filter((item) => item.percentage >= 80).length}
                        </div>
                        <p className="text-xs text-muted-foreground">80%+ scores</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recent Assessments</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {
                            assessmentData.filter((item) => {
                              const assessmentDate = new Date(item.assessment_date)
                              const weekAgo = new Date()
                              weekAgo.setDate(weekAgo.getDate() - 7)
                              return assessmentDate >= weekAgo
                            }).length
                          }
                        </div>
                        <p className="text-xs text-muted-foreground">Last 7 days</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Monthly Scores Chart */}
                  {chartData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Monthly Average Scores</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip formatter={(value) => [`${value}%`, "Average Score"]} />
                            <Bar dataKey="avgScore" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* Assessment Results List */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Assessment Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {assessmentData.slice(0, 20).map((assessment) => (
                          <div key={assessment.assessment_id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-medium">{assessment.student_name}</h3>
                                <p className="text-sm text-gray-600">
                                  {assessment.school_name} • {assessment.subject}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {getGradeBadge(assessment.percentage)}
                                <span className="text-lg font-bold">{assessment.percentage.toFixed(1)}%</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Lesson:</span>
                                <p className="text-gray-600">{assessment.lesson_title}</p>
                              </div>
                              <div>
                                <span className="font-medium">Assessment Type:</span>
                                <p className="text-gray-600">{assessment.assessment_type}</p>
                              </div>
                              <div>
                                <span className="font-medium">Date:</span>
                                <p className="text-gray-600">
                                  {new Date(assessment.assessment_date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span>
                                  Score: {assessment.score} / {assessment.max_score}
                                </span>
                              </div>
                              {assessment.teacher_remarks && (
                                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                  <span className="font-medium">Teacher Notes:</span>
                                  <p className="text-gray-700 mt-1">{assessment.teacher_remarks}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {assessmentData.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No assessment results found for the selected filters.
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
