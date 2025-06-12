"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Filters } from "@/components/filters"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DatabaseService } from "@/lib/database"
import { FileText, Users, CheckCircle, Clock, MapPin, Plus, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { SurveyAnalytics } from "@/lib/types"
import Link from "next/link"

export default function ObservationsPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<SurveyAnalytics[]>([])
  const [observations, setObservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<any>({})

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Check if required tables exist
      const tablesExist = await DatabaseService.checkTablesExist([
        "tbl_tarl_observation_responses",
        "tbl_tarl_observation_activities",
      ])

      if (!tablesExist) {
        setError("Observation tables don't exist yet. Please run the database setup script.")
        setLoading(false)
        return
      }

      const [analyticsData, observationsData] = await Promise.all([
        DatabaseService.getSurveyAnalytics().catch(() => []),
        DatabaseService.getObservations(user?.role !== "admin" ? Number(user?.id) : undefined).catch(() => []),
      ])

      setAnalytics(analyticsData)
      setObservations(observationsData)
    } catch (error: any) {
      console.error("Error loading observation data:", error)
      setError(error.message || "Failed to load observation data")
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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Observations</h1>
          <Link href="/observations/new">
            <Button className="soft-button soft-gradient">
              <Plus className="h-4 w-4 mr-2" />
              New Observation
            </Button>
          </Link>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Database Setup Required</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-4">
              <Button onClick={loadData}>Retry</Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Observations</h1>
        <div className="flex space-x-2">
          <Link href="/observations/list">
            <Button variant="outline" className="soft-button">
              <FileText className="h-4 w-4 mr-2" />
              View All
            </Button>
          </Link>
          <Link href="/observations/new">
            <Button className="soft-button soft-gradient">
              <Plus className="h-4 w-4 mr-2" />
              New Observation
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters - Only visible for admin and teacher */}
        {(user?.role === "admin" || user?.role === "teacher") && (
          <div className="lg:col-span-1">
            <Filters onFilterChange={handleFilterChange} />
          </div>
        )}

        {/* Analytics Content */}
        <div className={user?.role === "collector" ? "lg:col-span-4" : "lg:col-span-3"}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="soft-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Observations</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{observations.length}</div>
                  </CardContent>
                </Card>

                <Card className="soft-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Classes Conducted</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {observations.filter((obs) => obs.tarl_class_taking_place === "Yes").length}
                    </div>
                  </CardContent>
                </Card>

                <Card className="soft-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Schools Visited</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-purple-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{new Set(observations.map((obs) => obs.school_name)).size}</div>
                  </CardContent>
                </Card>

                <Card className="soft-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">This Month</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-yellow-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {
                        observations.filter((obs) => {
                          const obsDate = new Date(obs.visit_date)
                          const now = new Date()
                          return obsDate.getMonth() === now.getMonth() && obsDate.getFullYear() === now.getFullYear()
                        }).length
                      }
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Observations */}
              <Card className="soft-card">
                <CardHeader>
                  <CardTitle>Recent Observations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {observations.slice(0, 5).map((observation) => (
                      <div key={observation.id} className="border rounded-xl p-4 hover:bg-blue-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium">{observation.school_name}</h3>
                            <p className="text-sm text-gray-600">
                              {observation.visit_date
                                ? new Date(observation.visit_date).toLocaleDateString()
                                : "No date"}
                            </p>
                          </div>
                          <Badge
                            className={
                              observation.tarl_class_taking_place === "Yes"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {observation.tarl_class_taking_place === "Yes" ? "Conducted" : "Not Conducted"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span>Mentor: {observation.mentor_name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span>{observation.province || "Unknown"}</span>
                          </div>
                          {observation.teacher_name && (
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span>Teacher: {observation.teacher_name}</span>
                            </div>
                          )}
                          {observation.subject_observed && (
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span>{observation.subject_observed}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {observations.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No observations found. Create your first observation to get started.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
