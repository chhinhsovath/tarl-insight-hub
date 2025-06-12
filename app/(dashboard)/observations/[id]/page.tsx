"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { ArrowLeft, Edit, Calendar, MapPin, User, GraduationCap, Clock, CheckCircle, X } from "lucide-react"
import Link from "next/link"

export default function ObservationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [observation, setObservation] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [tarlLevels, setTarlLevels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      loadObservationDetails()
    }
  }, [params.id])

  const loadObservationDetails = async () => {
    setLoading(true)
    setError(null)
    try {
      const observationId = Number(params.id)

      // Load main observation data
      const { data: obsData, error: obsError } = await supabase
        .from("tbl_tarl_observation_responses")
        .select("*")
        .eq("id", observationId)
        .single()

      if (obsError) throw obsError
      setObservation(obsData)

      // Load activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from("tbl_tarl_observation_activities")
        .select(`
          *,
          language_activity:activity_type_id_language(activity_name),
          numeracy_activity:activity_type_id_numeracy(activity_name)
        `)
        .eq("observation_id", observationId)
        .order("activity_number")

      if (activitiesError) throw activitiesError
      setActivities(activitiesData || [])

      // Load materials
      const { data: materialsData, error: materialsError } = await supabase
        .from("tbl_tarl_observation_materials")
        .select(`
          *,
          material:material_id(material_name, description)
        `)
        .eq("observation_id", observationId)

      if (materialsError) throw materialsError
      setMaterials(materialsData || [])

      // Load TaRL levels
      const { data: levelsData, error: levelsError } = await supabase
        .from("tbl_tarl_observation_tarl_levels")
        .select(`
          *,
          tarl_level:tarl_level_id(level_name, subject, level_order)
        `)
        .eq("observation_id", observationId)

      if (levelsError) throw levelsError
      setTarlLevels(levelsData || [])
    } catch (error: any) {
      console.error("Error loading observation details:", error)
      setError(error.message || "Failed to load observation details")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    return status === "Yes" ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <X className="h-5 w-5 text-red-500" />
    )
  }

  const getStatusBadge = (status: string) => {
    return status === "Yes" ? (
      <Badge className="bg-green-100 text-green-800">Yes</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">No</Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (error || !observation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Observation Not Found</h1>
        </div>
        <Card className="soft-card">
          <CardContent className="text-center py-12">
            <p className="text-gray-500">{error || "Observation not found"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "teacher", "collector"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Observation Details</h1>
          </div>
          {(user?.role === "admin" || observation.created_by === Number(user?.id)) && (
            <Link href={`/observations/${observation.id}/edit`}>
              <Button className="soft-button">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
        </div>

        {/* Basic Information */}
        <Card className="soft-card">
          <CardHeader>
            <CardTitle>Visit Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Visit Date</p>
                  <p className="font-medium">{new Date(observation.visit_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">{observation.province}</p>
                  {observation.region && <p className="text-sm text-gray-500">{observation.region}</p>}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Mentor</p>
                  <p className="font-medium">{observation.mentor_name}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <GraduationCap className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">School</p>
                  <p className="font-medium">{observation.school_name}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Class Status */}
        <Card className="soft-card">
          <CardHeader>
            <CardTitle>Class Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3 mb-4">
              {getStatusIcon(observation.tarl_class_taking_place)}
              <span className="font-medium">
                TaRL class {observation.tarl_class_taking_place === "Yes" ? "was conducted" : "was not conducted"}
              </span>
            </div>

            {observation.tarl_class_taking_place === "No" && observation.tarl_class_not_taking_place_reason && (
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="font-medium text-red-800">Reason:</p>
                <p className="text-red-700">{observation.tarl_class_not_taking_place_reason}</p>
                {observation.tarl_class_not_taking_place_other_reason && (
                  <p className="text-red-600 mt-2">{observation.tarl_class_not_taking_place_other_reason}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {observation.tarl_class_taking_place === "Yes" && (
          <>
            {/* Class Details */}
            <Card className="soft-card">
              <CardHeader>
                <CardTitle>Class Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Teacher</p>
                    <p className="font-medium">{observation.teacher_name || "Not specified"}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Subject Observed</p>
                    <Badge
                      className={
                        observation.subject_observed === "Language"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }
                    >
                      {observation.subject_observed}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Grade Group</p>
                    <p className="font-medium">{observation.grade_group}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Total Students</p>
                    <p className="font-medium">{observation.total_class_strength || "Not specified"}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Students Present</p>
                    <p className="font-medium">{observation.students_present || "Not specified"}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Students Progressed</p>
                    <p className="font-medium">{observation.students_progressed_since_last_week || "Not specified"}</p>
                  </div>
                </div>

                {observation.grades_observed && observation.grades_observed.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Specific Grades Observed</p>
                    <div className="flex space-x-2">
                      {observation.grades_observed.map((grade: string) => (
                        <Badge key={grade} variant="outline">
                          Grade {grade}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Teacher Performance */}
            <Card className="soft-card">
              <CardHeader>
                <CardTitle>Teacher Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between">
                      <span>Class started on time</span>
                      {getStatusBadge(observation.class_started_on_time)}
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Children grouped appropriately</span>
                      {getStatusBadge(observation.children_grouped_appropriately)}
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Students fully involved</span>
                      {getStatusBadge(observation.students_fully_involved)}
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Teacher had session plan</span>
                      {getStatusBadge(observation.teacher_had_session_plan)}
                    </div>

                    {observation.teacher_had_session_plan === "Yes" && (
                      <>
                        <div className="flex items-center justify-between">
                          <span>Followed session plan</span>
                          {getStatusBadge(observation.teacher_followed_session_plan)}
                        </div>

                        <div className="flex items-center justify-between">
                          <span>Plan appropriate for level</span>
                          {getStatusBadge(observation.session_plan_appropriate_for_level)}
                        </div>
                      </>
                    )}
                  </div>

                  {observation.transition_time_between_subjects && (
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-gray-500" />
                      <span>Transition time: {observation.transition_time_between_subjects} minutes</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Materials and Levels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="soft-card">
                <CardHeader>
                  <CardTitle>Materials Present</CardTitle>
                </CardHeader>
                <CardContent>
                  {materials.length > 0 ? (
                    <div className="space-y-2">
                      {materials.map((item) => (
                        <div key={item.id} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{item.material.material_name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No materials recorded</p>
                  )}
                </CardContent>
              </Card>

              <Card className="soft-card">
                <CardHeader>
                  <CardTitle>TaRL Levels Observed</CardTitle>
                </CardHeader>
                <CardContent>
                  {tarlLevels.length > 0 ? (
                    <div className="space-y-2">
                      {tarlLevels.map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <span>{item.tarl_level.level_name}</span>
                          <Badge variant="outline">{item.tarl_level.subject}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No TaRL levels recorded</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Activities */}
            {activities.length > 0 && (
              <Card className="soft-card">
                <CardHeader>
                  <CardTitle>Activities ({activities.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {activities.map((activity, index) => (
                      <div key={activity.id} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-4">Activity {activity.activity_number}</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {activity.language_activity && (
                            <div>
                              <p className="text-sm text-gray-600">Language Activity</p>
                              <p className="font-medium">{activity.language_activity.activity_name}</p>
                            </div>
                          )}

                          {activity.numeracy_activity && (
                            <div>
                              <p className="text-sm text-gray-600">Numeracy Activity</p>
                              <p className="font-medium">{activity.numeracy_activity.activity_name}</p>
                            </div>
                          )}

                          {activity.duration_minutes && (
                            <div>
                              <p className="text-sm text-gray-600">Duration</p>
                              <p className="font-medium">{activity.duration_minutes} minutes</p>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Clear instructions given</span>
                            {getStatusBadge(activity.teacher_gave_clear_instructions)}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm">Activity demonstrated</span>
                            {getStatusBadge(activity.teacher_demonstrated_activity)}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm">Students practiced in front</span>
                            <Badge variant="outline">{activity.teacher_made_students_practice_in_front}</Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm">Small group performance</span>
                            <Badge variant="outline">{activity.students_performed_in_small_groups}</Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm">Individual performance</span>
                            <Badge variant="outline">{activity.students_performed_individually}</Badge>
                          </div>
                        </div>

                        {activity.teacher_no_clear_instructions_reason && (
                          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                            <p className="text-sm font-medium text-yellow-800">Reason for unclear instructions:</p>
                            <p className="text-yellow-700">{activity.teacher_no_clear_instructions_reason}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Suggestions */}
            {observation.suggestions_to_teacher && (
              <Card className="soft-card">
                <CardHeader>
                  <CardTitle>Suggestions to Teacher</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{observation.suggestions_to_teacher}</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  )
}
