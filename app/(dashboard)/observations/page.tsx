"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Filters } from "@/components/filters"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DatabaseService } from "@/lib/database"
import { FileText, Users, CheckCircle, Clock, MapPin, Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import type { SurveyAnalytics } from "@/lib/types"
import Link from "next/link"

export default function ObservationsPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<SurveyAnalytics[]>([])
  const [observations, setObservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<any>({})
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Try to load real data first
      let analyticsData: SurveyAnalytics[] = []
      let observationsData: any[] = []

      try {
        analyticsData = await DatabaseService.getSurveyAnalytics()
      } catch (e) {
        console.log("Failed to load analytics data, using mock data")
      }

      try {
        observationsData = await DatabaseService.getObservations(user?.role.toLowerCase() !== "admin" ? user?.id : undefined)
      } catch (e) {
        console.log("Failed to load observations data, using mock data")
      }

      // If no real data, use mock data
      if (observationsData.length === 0) {
        console.log("Using mock observation data")
        setIsDemoMode(true)
        setObservations(getMockObservations())
      } else {
        setObservations(observationsData)
        setIsDemoMode(false)
      }

      // Always set analytics data (real or mock)
      setAnalytics(analyticsData)
    } catch (error: any) {
      console.error("Error loading observation data:", error)
      // Use mock data as fallback
      setIsDemoMode(true)
      setAnalytics([])
      setObservations(getMockObservations())
    } finally {
      setLoading(false)
    }
  }

  const getMockObservations = () => [
    {
      id: 1,
      school_name: "Angkor High School",
      visit_date: "2024-01-15",
      mentor_name: "Dr. Sophea Chann",
      teacher_name: "Ms. Maly Sok",
      province: "Siem Reap",
      district: "Siem Reap City",
      subject_observed: "Mathematics",
      tarl_class_taking_place: "Yes",
      total_students_present: 28,
      students_at_level: 22,
      created_at: "2024-01-15T10:00:00Z",
    },
    {
      id: 2,
      school_name: "Bayon Primary School",
      visit_date: "2024-01-12",
      mentor_name: "Prof. Dara Pich",
      teacher_name: "Mr. Pisach Lim",
      province: "Siem Reap",
      district: "Angkor Chum",
      subject_observed: "Khmer Language",
      tarl_class_taking_place: "Yes",
      total_students_present: 35,
      students_at_level: 28,
      created_at: "2024-01-12T09:30:00Z",
    },
    {
      id: 3,
      school_name: "Battambang Provincial School",
      visit_date: "2024-01-10",
      mentor_name: "Ms. Bopha Nhem",
      teacher_name: "Ms. Sreypov Keo",
      province: "Battambang",
      district: "Battambang City",
      subject_observed: "Mathematics",
      tarl_class_taking_place: "No",
      total_students_present: 0,
      students_at_level: 0,
      created_at: "2024-01-10T14:00:00Z",
    },
    {
      id: 4,
      school_name: "Chamkar Mon Primary",
      visit_date: "2024-01-08",
      mentor_name: "Dr. Sophea Chann",
      teacher_name: "Mr. Virak Chann",
      province: "Phnom Penh",
      district: "Chamkar Mon",
      subject_observed: "Science",
      tarl_class_taking_place: "Yes",
      total_students_present: 42,
      students_at_level: 35,
      created_at: "2024-01-08T11:15:00Z",
    },
    {
      id: 5,
      school_name: "Daun Penh High School",
      visit_date: "2024-01-05",
      mentor_name: "Prof. Dara Pich",
      teacher_name: "Ms. Channary Lim",
      province: "Phnom Penh",
      district: "Daun Penh",
      subject_observed: "English",
      tarl_class_taking_place: "Yes",
      total_students_present: 38,
      students_at_level: 30,
      created_at: "2024-01-05T13:45:00Z",
    },
  ]

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
      <Badge className={statusColors[status.toLowerCase() as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Observations</h1>
          {isDemoMode && <p className="text-sm text-gray-600 mt-1">Demo mode - showing sample observation data</p>}
        </div>
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
        {(user?.role.toLowerCase() === "admin" || user?.role.toLowerCase() === "teacher") && (
          <div className="lg:col-span-1">
            <Filters onFilterChange={handleFilterChange} />
          </div>
        )}

        {/* Analytics Content */}
        <div className={user?.role.toLowerCase() === "collector" ? "lg:col-span-4" : "lg:col-span-3"}>
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
                    <p className="text-xs text-muted-foreground">+2 from last month</p>
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
                    <p className="text-xs text-muted-foreground">
                      {observations.length > 0
                        ? Math.round(
                            (observations.filter((obs) => obs.tarl_class_taking_place === "Yes").length /
                              observations.length) *
                              100,
                          )
                        : 0}
                      % success rate
                    </p>
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
                    <p className="text-xs text-muted-foreground">
                      Across {new Set(observations.map((obs) => obs.province)).size} provinces
                    </p>
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
                    <p className="text-xs text-muted-foreground">Recent activity</p>
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

                        {observation.total_students_present > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center justify-between text-sm">
                              <span>Students Present: {observation.total_students_present}</span>
                              <span>At Level: {observation.students_at_level}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{
                                  width: `${(observation.students_at_level / observation.total_students_present) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {observations.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium mb-2">No observations found</p>
                        <p className="text-sm">Create your first observation to get started.</p>
                        <Link href="/observations/new">
                          <Button className="mt-4 soft-button soft-gradient">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Observation
                          </Button>
                        </Link>
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
