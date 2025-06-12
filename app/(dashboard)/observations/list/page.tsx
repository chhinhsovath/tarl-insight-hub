"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Search, Eye, Edit, Calendar, MapPin, User, GraduationCap, Plus } from "lucide-react"
import Link from "next/link"

export default function ObservationsListPage() {
  const { user } = useAuth()
  const [observations, setObservations] = useState<any[]>([]) // Using any[] to avoid type errors
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSubject, setFilterSubject] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadObservations()
  }, [])

  const loadObservations = async () => {
    setLoading(true)
    setError(null)
    try {
      // Check if the view exists first
      const { data: viewCheck, error: viewError } = await supabase
        .from("information_schema.views")
        .select("table_name")
        .eq("table_name", "vw_tarl_observation_complete")
        .single()

      if (viewError || !viewCheck) {
        console.warn("View doesn't exist yet, using main table instead")
        // Fallback to the main table if view doesn't exist
        let query = supabase
          .from("tbl_tarl_observation_responses")
          .select("*")
          .order("visit_date", { ascending: false })

        // If user is not admin, only show their own observations
        if (user?.role !== "admin") {
          query = query.eq("created_by", user?.id)
        }

        const { data, error } = await query
        if (error) throw error
        setObservations(data || [])
      } else {
        // Use the view if it exists
        let query = supabase.from("vw_tarl_observation_complete").select("*").order("visit_date", { ascending: false })

        // If user is not admin, only show their own observations
        if (user?.role !== "admin") {
          query = query.eq("created_by", user?.id)
        }

        const { data, error } = await query
        if (error) throw error
        setObservations(data || [])
      }
    } catch (error: any) {
      console.error("Error loading observations:", error)
      setError(error.message || "Failed to load observations")
    } finally {
      setLoading(false)
    }
  }

  const filteredObservations = useMemo(() => {
    return observations.filter((obs) => {
      const matchesSearch =
        (obs.school_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (obs.teacher_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (obs.mentor_name?.toLowerCase() || "").includes(searchTerm.toLowerCase())

      const matchesSubject = filterSubject === "all" || obs.subject_observed === filterSubject
      const matchesStatus = filterStatus === "all" || obs.tarl_class_taking_place === filterStatus

      return matchesSearch && matchesSubject && matchesStatus
    })
  }, [observations, searchTerm, filterSubject, filterStatus])

  const getStatusBadge = useCallback((status: string) => {
    return status === "Yes" ? (
      <Badge className="bg-green-100 text-green-800">Class Conducted</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Class Not Conducted</Badge>
    )
  }, [])

  const getSubjectBadge = useCallback((subject: string) => {
    return subject === "Language" ? (
      <Badge className="bg-blue-100 text-blue-800">Language</Badge>
    ) : subject === "Numeracy" ? (
      <Badge className="bg-purple-100 text-purple-800">Numeracy</Badge>
    ) : null
  }, [])

  return (
    <ProtectedRoute allowedRoles={["admin", "teacher", "collector"]}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Observation Records</h1>
          <Link href="/observations/new">
            <Button className="soft-button soft-gradient">
              <Plus className="h-4 w-4 mr-2" />
              New Observation
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="soft-card">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search schools, teachers, mentors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="Language">Language</SelectItem>
                  <SelectItem value="Numeracy">Numeracy</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Yes">Class Conducted</SelectItem>
                  <SelectItem value="No">Class Not Conducted</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setFilterSubject("all")
                  setFilterStatus("all")
                }}
                className="soft-button"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="soft-card bg-red-50">
            <CardContent className="text-center py-6">
              <p className="text-red-600">{error}</p>
              <Button onClick={loadObservations} className="mt-4">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Observations List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredObservations.length === 0 ? (
              <Card className="soft-card">
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">No observations found matching your criteria.</p>
                </CardContent>
              </Card>
            ) : (
              filteredObservations.map((observation) => (
                <Card key={observation.id} className="soft-card hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">{observation.school_name || "Unknown School"}</h3>
                          {observation.tarl_class_taking_place && getStatusBadge(observation.tarl_class_taking_place)}
                          {observation.subject_observed && getSubjectBadge(observation.subject_observed)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {observation.visit_date
                                ? new Date(observation.visit_date).toLocaleDateString()
                                : "No date"}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4" />
                            <span>{observation.province || "Unknown location"}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>Mentor: {observation.mentor_name || "Unknown"}</span>
                          </div>

                          {observation.teacher_name && (
                            <div className="flex items-center space-x-2">
                              <GraduationCap className="h-4 w-4" />
                              <span>Teacher: {observation.teacher_name}</span>
                            </div>
                          )}
                        </div>

                        {observation.tarl_class_taking_place === "Yes" && (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Grade Group:</span> {observation.grade_group || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium">Students Present:</span> {observation.students_present || 0}
                              /{observation.total_class_strength || 0}
                            </div>
                            <div>
                              <span className="font-medium">Activities:</span> {observation.number_of_activities || "0"}
                            </div>
                          </div>
                        )}

                        {observation.tarl_class_taking_place === "No" &&
                          observation.tarl_class_not_taking_place_reason && (
                            <div className="mt-3 text-sm">
                              <span className="font-medium">Reason:</span>{" "}
                              {observation.tarl_class_not_taking_place_reason}
                              {observation.tarl_class_not_taking_place_other_reason && (
                                <span> - {observation.tarl_class_not_taking_place_other_reason}</span>
                              )}
                            </div>
                          )}
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <Link href={`/observations/${observation.id}`}>
                          <Button variant="outline" size="sm" className="soft-button">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {(user?.role === "admin" || observation.created_by === Number(user?.id || "0")) && (
                          <Link href={`/observations/${observation.id}/edit`}>
                            <Button variant="outline" size="sm" className="soft-button">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
