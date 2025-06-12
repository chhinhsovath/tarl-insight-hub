"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/page-layout"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { MapPin, Calendar, Clock, CheckCircle, AlertCircle, Plus, Navigation, Users, FileText } from "lucide-react"

interface Visit {
  id: number
  school_name: string
  school_address: string
  visit_date: string
  visit_time: string
  status: "Scheduled" | "In Progress" | "Completed" | "Cancelled"
  purpose: string
  duration_minutes: number
  observations_count: number
  notes?: string
  distance_km: number
  collector_name: string
}

export default function VisitsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [visits, setVisits] = useState<Visit[]>([])
  const [selectedTab, setSelectedTab] = useState("upcoming")

  useEffect(() => {
    loadVisitsData()
  }, [])

  const loadVisitsData = async () => {
    setLoading(true)
    try {
      // Mock visits data
      const mockVisits: Visit[] = [
        {
          id: 1,
          school_name: "Angkor Primary School",
          school_address: "Siem Reap Province, Angkor District",
          visit_date: "2024-12-15",
          visit_time: "09:00",
          status: "Scheduled",
          purpose: "Classroom Observation",
          duration_minutes: 120,
          observations_count: 0,
          distance_km: 15.2,
          collector_name: "Ms. Bopha Keo",
        },
        {
          id: 2,
          school_name: "Bayon Elementary",
          school_address: "Siem Reap Province, Bayon District",
          visit_date: "2024-12-12",
          visit_time: "10:30",
          status: "Completed",
          purpose: "Teacher Training Follow-up",
          duration_minutes: 180,
          observations_count: 3,
          notes: "Excellent progress in TaRL implementation",
          distance_km: 22.8,
          collector_name: "Ms. Bopha Keo",
        },
        {
          id: 3,
          school_name: "Preah Vihear School",
          school_address: "Preah Vihear Province, Central District",
          visit_date: "2024-12-18",
          visit_time: "08:00",
          status: "Scheduled",
          purpose: "Assessment Review",
          duration_minutes: 90,
          observations_count: 0,
          distance_km: 45.6,
          collector_name: "Mr. Visal Tep",
        },
        {
          id: 4,
          school_name: "Tonle Sap Academy",
          school_address: "Battambang Province, Tonle Sap District",
          visit_date: "2024-12-10",
          visit_time: "14:00",
          status: "In Progress",
          purpose: "Data Collection",
          duration_minutes: 150,
          observations_count: 2,
          distance_km: 38.4,
          collector_name: "Ms. Mealea Ros",
        },
        {
          id: 5,
          school_name: "Mekong Primary",
          school_address: "Kandal Province, Mekong District",
          visit_date: "2024-12-08",
          visit_time: "11:00",
          status: "Completed",
          purpose: "Infrastructure Assessment",
          duration_minutes: 240,
          observations_count: 4,
          notes: "Need to follow up on facility improvements",
          distance_km: 28.9,
          collector_name: "Ms. Bopha Keo",
        },
      ]

      // Filter based on user role
      if (user?.role === "Coordinator") {
        // Coordinators see visits in their province
        setVisits(mockVisits.filter((v) => v.collector_name.includes("Bopha") || v.collector_name.includes("Visal")))
      } else {
        setVisits(mockVisits)
      }
    } catch (error) {
      console.error("Error loading visits data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Scheduled":
        return "bg-yellow-100 text-yellow-800"
      case "Cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return CheckCircle
      case "In Progress":
        return Clock
      case "Scheduled":
        return Calendar
      case "Cancelled":
        return AlertCircle
      default:
        return Calendar
    }
  }

  const filterVisitsByStatus = (status: string) => {
    switch (status) {
      case "upcoming":
        return visits.filter((v) => v.status === "Scheduled")
      case "active":
        return visits.filter((v) => v.status === "In Progress")
      case "completed":
        return visits.filter((v) => v.status === "Completed")
      default:
        return visits
    }
  }

  const completedVisits = visits.filter((v) => v.status === "Completed").length
  const totalObservations = visits.reduce((sum, v) => sum + v.observations_count, 0)
  const totalDistance = visits.reduce((sum, v) => sum + v.distance_km, 0)
  const avgDuration = visits.length > 0 ? visits.reduce((sum, v) => sum + v.duration_minutes, 0) / visits.length : 0

  return (
    <ProtectedRoute allowedRoles={["Admin", "Coordinator"]}>
      <PageLayout
        title="School Visits Management"
        description="Track and manage school visits and data collection activities"
        action={{
          label: "Schedule Visit",
          onClick: () => console.log("Schedule new visit"),
          icon: Plus,
        }}
      >
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatsCard
              title="Total Visits"
              value={loading ? "..." : visits.length}
              description="All scheduled visits"
              icon={MapPin}
              iconColor="text-blue-500"
            />
            <StatsCard
              title="Completed"
              value={loading ? "..." : completedVisits}
              description={`${visits.length > 0 ? ((completedVisits / visits.length) * 100).toFixed(0) : 0}% completion rate`}
              icon={CheckCircle}
              iconColor="text-green-500"
            />
            <StatsCard
              title="Observations"
              value={loading ? "..." : totalObservations}
              description="Data points collected"
              icon={FileText}
              iconColor="text-purple-500"
            />
            <StatsCard
              title="Distance Covered"
              value={loading ? "..." : `${totalDistance.toFixed(1)} km`}
              description="Total travel distance"
              icon={Navigation}
              iconColor="text-orange-500"
            />
          </div>

          {/* Visits Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="active">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="all">All Visits</TabsTrigger>
            </TabsList>

            {/* Upcoming Visits */}
            <TabsContent value="upcoming" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Scheduled Visits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-gray-500">Loading visits...</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filterVisitsByStatus("upcoming").map((visit) => {
                        const StatusIcon = getStatusIcon(visit.status)
                        return (
                          <div key={visit.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{visit.school_name}</h3>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {visit.school_address}
                                </p>
                              </div>
                              <Badge className={getStatusColor(visit.status)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {visit.status}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span>{visit.visit_date}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span>{visit.visit_time}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Navigation className="h-4 w-4 text-gray-500" />
                                <span>{visit.distance_km} km</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="h-4 w-4 text-gray-500" />
                                <span>{visit.collector_name}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">{visit.purpose}</p>
                                <p className="text-xs text-gray-500">Duration: {visit.duration_minutes} minutes</p>
                              </div>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Active Visits */}
            <TabsContent value="active" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Visits In Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filterVisitsByStatus("active").map((visit) => {
                      const StatusIcon = getStatusIcon(visit.status)
                      return (
                        <div key={visit.id} className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{visit.school_name}</h3>
                              <p className="text-sm text-gray-600">{visit.school_address}</p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800">
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {visit.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                            <div className="text-sm">
                              <span className="text-gray-500">Purpose:</span>
                              <p className="font-medium">{visit.purpose}</p>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-500">Observations:</span>
                              <p className="font-medium">{visit.observations_count} collected</p>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-500">Collector:</span>
                              <p className="font-medium">{visit.collector_name}</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm">Update Progress</Button>
                            <Button variant="outline" size="sm">
                              Contact Collector
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Completed Visits */}
            <TabsContent value="completed" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Completed Visits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filterVisitsByStatus("completed").map((visit) => (
                      <div key={visit.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{visit.school_name}</h3>
                            <p className="text-sm text-gray-600">{visit.school_address}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div className="text-sm">
                            <span className="text-gray-500">Date:</span>
                            <p className="font-medium">{visit.visit_date}</p>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">Duration:</span>
                            <p className="font-medium">{visit.duration_minutes} min</p>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">Observations:</span>
                            <p className="font-medium">{visit.observations_count}</p>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">Distance:</span>
                            <p className="font-medium">{visit.distance_km} km</p>
                          </div>
                        </div>

                        {visit.notes && (
                          <div className="mb-3">
                            <span className="text-sm text-gray-500">Notes:</span>
                            <p className="text-sm mt-1 p-2 bg-white rounded border">{visit.notes}</p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View Report
                          </Button>
                          <Button variant="outline" size="sm">
                            Download Data
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* All Visits */}
            <TabsContent value="all" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Visits Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {visits.map((visit) => {
                      const StatusIcon = getStatusIcon(visit.status)
                      return (
                        <div key={visit.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold">{visit.school_name}</h3>
                              <p className="text-sm text-gray-600">
                                {visit.visit_date} • {visit.purpose}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right text-sm">
                                <p className="font-medium">{visit.observations_count} observations</p>
                                <p className="text-gray-500">{visit.collector_name}</p>
                              </div>
                              <Badge className={getStatusColor(visit.status)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {visit.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageLayout>
    </ProtectedRoute>
  )
}
