"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { Filters } from "@/components/filters"
import { Badge } from "@/components/ui/badge"
import { DatabaseService } from "@/lib/database"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { FileText, Users, CheckCircle, Clock, MapPin, Camera } from "lucide-react"
import type { SurveyAnalytics, TarlSurveyResponse } from "@/lib/types"

export default function SurveysPage() {
  const [analytics, setAnalytics] = useState<SurveyAnalytics[]>([])
  const [responses, setResponses] = useState<TarlSurveyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<any>({})

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    setLoading(true)
    try {
      const [analyticsData, responsesData] = await Promise.all([
        DatabaseService.getSurveyAnalytics(),
        DatabaseService.getSurveyResponses(),
      ])

      setAnalytics(analyticsData)
      setResponses(responsesData)
    } catch (error) {
      console.error("Error loading survey data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Use useCallback to prevent infinite re-renders
  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters)
  }, [])

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: "bg-green-100 text-green-800",
      draft: "bg-yellow-100 text-yellow-800",
      completed: "bg-blue-100 text-blue-800",
      archived: "bg-gray-100 text-gray-800",
    }
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    )
  }

  const chartData = analytics.map((item) => ({
    name: item.survey_title.substring(0, 20) + (item.survey_title.length > 20 ? "..." : ""),
    responses: item.total_responses,
    completed: item.completed_responses,
  }))

  const statusData = analytics.reduce(
    (acc, item) => {
      const existing = acc.find((a) => a.name === item.status)
      if (existing) {
        existing.value += 1
      } else {
        acc.push({ name: item.status, value: 1 })
      }
      return acc
    },
    [] as Array<{ name: string; value: number }>,
  )

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

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
          <h2 className="text-xl font-semibold text-gray-900">Survey Analytics</h2>
          <p className="text-sm text-gray-600">Monitor survey responses and completion rates</p>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters */}
            <div className="lg:col-span-1">
              <Filters onFilterChange={handleFilterChange} />
            </div>

            {/* Analytics Content */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg">Loading survey analytics...</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Surveys</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{analytics.length}</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {analytics.reduce((sum, item) => sum + item.total_responses, 0)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {analytics.reduce((sum, item) => sum + item.completed_responses, 0)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Completion Time</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {analytics.length > 0
                            ? `${(analytics.reduce((sum, item) => sum + item.avg_completion_time_minutes, 0) / analytics.length).toFixed(0)}m`
                            : "0m"}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Response Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Survey Responses</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="responses" fill="#3b82f6" name="Total" />
                            <Bar dataKey="completed" fill="#10b981" name="Completed" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Status Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Survey Status Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={statusData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Survey List */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Survey Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analytics.map((survey) => (
                          <div key={survey.survey_id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h3 className="font-medium">{survey.survey_title}</h3>
                                <p className="text-sm text-gray-600">
                                  Created: {new Date(survey.survey_created_at).toLocaleDateString()}
                                </p>
                              </div>
                              {getStatusBadge(survey.status)}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4 text-gray-500" />
                                <span>{survey.total_responses} responses</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>{survey.completed_responses} completed</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-blue-500" />
                                <span>{survey.responses_with_location} with location</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Camera className="h-4 w-4 text-purple-500" />
                                <span>{survey.responses_with_photos} with photos</span>
                              </div>
                            </div>

                            <div className="mt-3 flex justify-between text-xs text-gray-500">
                              <span>Schools covered: {survey.schools_covered}</span>
                              <span>Unique respondents: {survey.unique_respondents}</span>
                              <span>Avg completion: {survey.avg_completion_time_minutes.toFixed(0)} min</span>
                            </div>
                          </div>
                        ))}

                        {analytics.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No survey data found for the selected filters.
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
