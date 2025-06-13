"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
// import { supabase } from "@/lib/supabase" // Removed for static demo
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { ArrowLeft, Edit, Calendar, MapPin, User, GraduationCap, Clock, CheckCircle, X } from "lucide-react"
import Link from "next/link"
import { DatabaseService } from "@/lib/database"

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
      const obsData = await DatabaseService.getObservationById(observationId)
      setObservation(obsData)

      // Load activities
      const activitiesData = await DatabaseService.getObservationActivities(observationId)
      setActivities(activitiesData || [])

      // Load materials
      const materialsData = await DatabaseService.getObservationMaterials(observationId)
      setMaterials(materialsData || [])

      // Load TaRL levels
      const levelsData = await DatabaseService.getObservationTarlLevels(observationId)
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
    <ProtectedRoute allowedRoles={["Admin", "Teacher", "Collector", "Coordinator"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Observation Details</h1>
          </div>
          {(user?.role === "Admin" || observation.created_by === Number(user?.id)) && (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                {getStatusIcon(observation.tarl_class_taking_place)}
                <div>
                  <p className="text-sm text-gray-600">TaRL Class Taking Place</p>
                  <p className="font-medium">{observation.tarl_class_taking_place}</p>
                </div>
              </div>

              {observation.class_started_on_time && (
                <div className="flex items-center space-x-3">
                  {getStatusIcon(observation.class_started_on_time)}
                  <div>
                    <p className="text-sm text-gray-600">Class Started On Time</p>
                    <p className="font-medium">{observation.class_started_on_time}</p>
                  </div>
                </div>
              )}

              {observation.children_grouped_appropriately && (
                <div className="flex items-center space-x-3">
                  {getStatusIcon(observation.children_grouped_appropriately)}
                  <div>
                    <p className="text-sm text-gray-600">Children Grouped Appropriately</p>
                    <p className="font-medium">{observation.children_grouped_appropriately}</p>
                  </div>
                </div>
              )}

              {observation.students_fully_involved && (
                <div className="flex items-center space-x-3">
                  {getStatusIcon(observation.students_fully_involved)}
                  <div>
                    <p className="text-sm text-gray-600">Students Fully Involved</p>
                    <p className="font-medium">{observation.students_fully_involved}</p>
                  </div>
                </div>
              )}

              {observation.teacher_had_session_plan && (
                <div className="flex items-center space-x-3">
                  {getStatusIcon(observation.teacher_had_session_plan)}
                  <div>
                    <p className="text-sm text-gray-600">Teacher Had Session Plan</p>
                    <p className="font-medium">{observation.teacher_had_session_plan}</p>
                  </div>
                </div>
              )}

              {observation.teacher_followed_session_plan && (
                <div className="flex items-center space-x-3">
                  {getStatusIcon(observation.teacher_followed_session_plan)}
                  <div>
                    <p className="text-sm text-gray-600">Teacher Followed Session Plan</p>
                    <p className="font-medium">{observation.teacher_followed_session_plan}</p>
                  </div>
                </div>
              )}
            </div>

            {observation.tarl_class_not_taking_place_reason && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 font-medium mb-2">Reason for No TaRL Class:</p>
                <p className="text-sm text-gray-800">{observation.tarl_class_not_taking_place_reason}</p>
                {observation.tarl_class_not_taking_place_other_reason && (
                  <p className="text-xs text-gray-500 mt-1">
                    Details: {observation.tarl_class_not_taking_place_other_reason}
                  </p>
                )}
              </div>
            )}

            {observation.class_not_on_time_reason && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 font-medium mb-2">Reason Class Not On Time:</p>
                <p className="text-sm text-gray-800">{observation.class_not_on_time_reason}</p>
                {observation.class_not_on_time_other_reason && (
                  <p className="text-xs text-gray-500 mt-1">
                    Details: {observation.class_not_on_time_other_reason}
                  </p>
                )}
              </div>
            )}

            {observation.teacher_no_session_plan_reason && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 font-medium mb-2">Reason Teacher Had No Session Plan:</p>
                <p className="text-sm text-gray-800">{observation.teacher_no_session_plan_reason}</p>
              </div>
            )}

            {observation.teacher_not_follow_plan_reason && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 font-medium mb-2">Reason Teacher Did Not Follow Plan:</p>
                <p className="text-sm text-gray-800">{observation.teacher_not_follow_plan_reason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Observation Details */}
        <Card className="soft-card">
          <CardHeader>
            <CardTitle>Observation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">Subject Observed</p>
                <p className="font-medium">{observation.subject_observed}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Grade Group</p>
                <p className="font-medium">{observation.grade_group}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Grades Observed</p>
                <p className="font-medium">{observation.grades_observed?.join(", ") || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Class Strength</p>
                <p className="font-medium">{observation.total_class_strength}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Students Present</p>
                <p className="font-medium">{observation.students_present}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Students Progressed Since Last Week</p>
                <p className="font-medium">{observation.students_progressed_since_last_week || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Transition Time (minutes)</p>
                <p className="font-medium">{observation.transition_time_between_subjects || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Number of Activities</p>
                <p className="font-medium">{observation.number_of_activities || "N/A"}</p>
              </div>
            </div>

            {observation.suggestions_to_teacher && (
              <div className="mt-6">
                <p className="text-sm text-gray-600 font-medium mb-2">Suggestions to Teacher:</p>
                <p className="text-sm text-gray-800">{observation.suggestions_to_teacher}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activities Observed */}
        {activities.length > 0 && (
          <Card className="soft-card">
            <CardHeader>
              <CardTitle>Activities Observed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={index} className="border p-4 rounded-lg bg-gray-50">
                    <h4 className="font-semibold mb-2">Activity {activity.activity_number}: {activity.language_activity?.activity_name || activity.numeracy_activity?.activity_name || "N/A"}</h4>
                    <p className="text-sm text-gray-600">Duration: {activity.duration_minutes || "N/A"} minutes</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="flex items-center gap-2">
                        {getStatusIcon(activity.teacher_gave_clear_instructions)}
                        Teacher gave clear instructions: {activity.teacher_gave_clear_instructions}
                      </p>
                      {activity.teacher_no_clear_instructions_reason && (
                        <p className="text-xs text-gray-500 ml-7">Reason: {activity.teacher_no_clear_instructions_reason}</p>
                      )}
                      <p className="flex items-center gap-2">
                        {getStatusIcon(activity.teacher_demonstrated_activity)}
                        Teacher demonstrated activity: {activity.teacher_demonstrated_activity}
                      </p>
                      <p className="flex items-center gap-2">
                        {getStatusIcon(activity.teacher_made_students_practice_in_front)}
                        Students practiced in front: {activity.teacher_made_students_practice_in_front}
                      </p>
                      <p className="flex items-center gap-2">
                        {getStatusIcon(activity.students_performed_in_small_groups)}
                        Students performed in small groups: {activity.students_performed_in_small_groups}
                      </p>
                      <p className="flex items-center gap-2">
                        {getStatusIcon(activity.students_performed_individually)}
                        Students performed individually: {activity.students_performed_individually}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Materials Used */}
        {materials.length > 0 && (
          <Card className="soft-card">
            <CardHeader>
              <CardTitle>Materials Used</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                {materials.map((mat, index) => (
                  <li key={index} className="text-gray-800">
                    <span className="font-medium">{mat.material?.material_name || "N/A"}</span> - {mat.material?.description || "No description"}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* TaRL Levels */}
        {tarlLevels.length > 0 && (
          <Card className="soft-card">
            <CardHeader>
              <CardTitle>TaRL Levels Observed</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                {tarlLevels.map((level, index) => (
                  <li key={index} className="text-gray-800">
                    <span className="font-medium">{level.tarl_level?.level_name || "N/A"}</span> (Subject: {level.tarl_level?.subject || "N/A"})
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Back Button */}
        <div className="mt-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Observations
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  )
}
