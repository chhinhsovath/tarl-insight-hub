"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { Filters } from "@/components/filters"
import { DatabaseService } from "@/lib/database"
import { BarChart3, Users, BookOpen, TrendingUp, FileText, Star } from "lucide-react"
import type { DashboardStats } from "@/lib/types"

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total_schools: 0,
    total_users: 0,
    total_surveys: 0,
    total_responses: 0,
    completed_responses: 0,
    completion_rate: 0,
    total_feedback: 0,
    avg_rating: 0,
    unique_respondents: 0,
    offline_responses: 0,
  })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<any>({})

  // Use useCallback to prevent infinite re-renders
  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters)
  }, [])

  useEffect(() => {
    loadDashboardStats()
  }, [filters])

  const loadDashboardStats = async () => {
    setLoading(true)
    try {
      const data = await DatabaseService.getDashboardStats(filters)
      setStats(data)
    } catch (error) {
      console.error("Error loading dashboard stats:", error)
    } finally {
      setLoading(false)
    }
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
          <h2 className="text-xl font-semibold text-gray-900">Dashboard Overview</h2>
          <p className="text-sm text-gray-600">Monitor TaRL program surveys and training feedback</p>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters */}
            <div className="lg:col-span-1">
              <Filters onFilterChange={handleFilterChange} />
            </div>

            {/* Stats Cards */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{loading ? "..." : stats.total_schools}</div>
                    <p className="text-xs text-muted-foreground">Active schools</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Survey Responses</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{loading ? "..." : stats.total_responses}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.completed_responses} completed ({stats.completion_rate.toFixed(1)}%)
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unique Respondents</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{loading ? "..." : stats.unique_respondents}</div>
                    <p className="text-xs text-muted-foreground">Individual participants</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Training Feedback</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{loading ? "..." : stats.total_feedback}</div>
                    <p className="text-xs text-muted-foreground">Avg rating: {stats.avg_rating.toFixed(1)}/5</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Offline Responses</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{loading ? "..." : stats.offline_responses}</div>
                    <p className="text-xs text-muted-foreground">Collected offline</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{loading ? "..." : `${stats.completion_rate.toFixed(1)}%`}</div>
                    <p className="text-xs text-muted-foreground">Survey completion</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <h3 className="font-medium">View Survey Analytics</h3>
                      <p className="text-sm text-gray-600">Analyze survey responses and completion rates</p>
                    </div>
                    <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <h3 className="font-medium">Training Feedback</h3>
                      <p className="text-sm text-gray-600">Review training effectiveness and ratings</p>
                    </div>
                    <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <h3 className="font-medium">School Management</h3>
                      <p className="text-sm text-gray-600">Manage schools and participants</p>
                    </div>
                    <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <h3 className="font-medium">Export Data</h3>
                      <p className="text-sm text-gray-600">Download reports and analytics</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
