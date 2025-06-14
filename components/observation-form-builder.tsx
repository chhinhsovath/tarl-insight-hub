"use client"

import React from "react"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { CalendarIcon, Save, Eye, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DatabaseService } from "@/lib/database"

interface ObservationFormData {
  // Visit Details
  visit_date: string
  region: string
  province: string
  mentor_name: string
  school_name: string
  program_type_id: number | null

  // TaRL Class Status
  tarl_class_taking_place: string
  tarl_class_not_taking_place_reason?: string
  tarl_class_not_taking_place_other_reason?: string

  // Teacher and Observation Details
  teacher_name: string
  observed_full_session: string
  grade_group: string
  grades_observed: string[]
  subject_observed: string

  // Class Statistics
  total_class_strength: number | null
  students_present: number | null
  students_progressed_since_last_week: number | null

  // Delivery Questions
  class_started_on_time: string
  class_not_on_time_reason?: string
  class_not_on_time_other_reason?: string
  transition_time_between_subjects: number | null

  // Classroom Questions
  children_grouped_appropriately: string
  students_fully_involved: string

  // Teacher Questions
  teacher_had_session_plan: string
  teacher_no_session_plan_reason?: string
  teacher_followed_session_plan: string
  teacher_not_follow_plan_reason?: string
  session_plan_appropriate_for_level: string

  // Activity Count
  number_of_activities: string

  // Materials and Levels
  selected_materials: number[]
  selected_tarl_levels: number[]

  // Activities
  activities: ActivityData[]

  // Miscellaneous
  suggestions_to_teacher: string
}

interface ActivityData {
  activity_number: string
  activity_type_id_language: number | null
  activity_type_id_numeracy: number | null
  duration_minutes: number | null
  teacher_gave_clear_instructions: string
  teacher_no_clear_instructions_reason?: string
  teacher_demonstrated_activity: string
  teacher_made_students_practice_in_front: string
  students_performed_in_small_groups: string
  students_performed_individually: string
}

interface LookupData {
  programTypes: Array<{ id: number; program_type: string }>
  materials: Array<{ id: number; material_name: string; description: string }>
  tarlLevels: Array<{ id: number; level_name: string; subject: string; level_order: number }>
  activityTypes: Array<{ id: number; activity_name: string; subject: string; description: string }>
  provinces: Array<{ id: number; name: string; name_kh: string; code: string }>
}

export const ObservationFormBuilder = React.memo(function ObservationFormBuilder() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingLookups, setLoadingLookups] = useState(true)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [lookupData, setLookupData] = useState<LookupData>({
    programTypes: [],
    materials: [],
    tarlLevels: [],
    activityTypes: [],
    provinces: [],
  })

  const [formData, setFormData] = useState<ObservationFormData>({
    visit_date: format(new Date(), "yyyy-MM-dd"),
    region: "",
    province: "",
    mentor_name: user?.full_name || "",
    school_name: "",
    program_type_id: null,
    tarl_class_taking_place: "",
    teacher_name: "",
    observed_full_session: "",
    grade_group: "",
    grades_observed: [],
    subject_observed: "",
    total_class_strength: null,
    students_present: null,
    students_progressed_since_last_week: null,
    class_started_on_time: "",
    transition_time_between_subjects: null,
    children_grouped_appropriately: "",
    students_fully_involved: "",
    teacher_had_session_plan: "",
    teacher_no_session_plan_reason: "",
    teacher_followed_session_plan: "",
    session_plan_appropriate_for_level: "",
    number_of_activities: "1",
    selected_materials: [],
    selected_tarl_levels: [],
    activities: [
      {
        activity_number: "1",
        activity_type_id_language: null,
        activity_type_id_numeracy: null,
        duration_minutes: null,
        teacher_gave_clear_instructions: "",
        teacher_no_clear_instructions_reason: "",
        teacher_demonstrated_activity: "",
        teacher_made_students_practice_in_front: "",
        students_performed_in_small_groups: "",
        students_performed_individually: "",
      },
    ],
    suggestions_to_teacher: "",
  })

  useEffect(() => {
    loadLookupData()
  }, [])

  useEffect(() => {
    // Update activities array when number_of_activities changes
    const numActivities = Number.parseInt(formData.number_of_activities)
    const currentActivities = formData.activities.length

    if (numActivities > currentActivities) {
      // Add new activities
      const newActivities = [...formData.activities]
      for (let i = currentActivities; i < numActivities; i++) {
        newActivities.push({
          activity_number: (i + 1).toString(),
          activity_type_id_language: null,
          activity_type_id_numeracy: null,
          duration_minutes: null,
          teacher_gave_clear_instructions: "",
          teacher_no_clear_instructions_reason: "",
          teacher_demonstrated_activity: "",
          teacher_made_students_practice_in_front: "",
          students_performed_in_small_groups: "",
          students_performed_individually: "",
        })
      }
      setFormData({ ...formData, activities: newActivities })
    } else if (numActivities < currentActivities) {
      // Remove excess activities
      setFormData({ ...formData, activities: formData.activities.slice(0, numActivities) })
    }
  }, [formData.number_of_activities, formData.activities])

  const loadLookupData = async () => {
    setLoadingLookups(true)
    setLookupError(null)
    try {
      // Try to load data directly, handle errors gracefully
      const [programTypesResponse, materialsResponse, tarlLevelsResponse, activityTypesResponse, provincesResponse] = await Promise.all([
        fetch("/api/data/program-types"),
        fetch("/api/data/materials"),
        fetch("/api/data/tarl-levels"),
        fetch("/api/data/activity-types"),
        fetch("/api/data/provinces"),
      ])

      const programTypesData = programTypesResponse.ok ? await programTypesResponse.json() : []
      const materialsData = materialsResponse.ok ? await materialsResponse.json() : []
      const tarlLevelsData = tarlLevelsResponse.ok ? await tarlLevelsResponse.json() : []
      const activityTypesData = activityTypesResponse.ok ? await activityTypesResponse.json() : []
      const provincesData = provincesResponse.ok ? await provincesResponse.json() : []

      setLookupData({
        programTypes: programTypesData,
        materials: materialsData,
        tarlLevels: tarlLevelsData,
        activityTypes: activityTypesData,
        provinces: provincesData,
      })
    } catch (err: any) {
      console.error("Error loading lookup data:", err)
      setLookupError(err.message || "Failed to load form data")
      toast({
        title: "Error",
        description: "Failed to load form data. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoadingLookups(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/observations/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formData: {
            ...formData,
            created_by: user?.id,
          },
          activities: formData.activities,
          materials: formData.selected_materials,
          tarlLevels: formData.selected_tarl_levels,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit observation")
      }

      toast({
        title: "Success",
        description: "Observation submitted successfully",
      })

      // Reset form or redirect
      // You might want to redirect to the observations list or reset the form
    } catch (error: any) {
      console.error("Error submitting observation:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit observation",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const updateActivityData = useCallback((activityIndex: number, field: string, value: any) => {
    setFormData((prev) => {
      const updatedActivities = [...prev.activities]
      updatedActivities[activityIndex] = { ...updatedActivities[activityIndex], [field]: value }
      return { ...prev, activities: updatedActivities }
    })
  }, [])

  const toggleMaterial = useCallback((materialId: number) => {
    setFormData((prev) => {
      const currentMaterials = prev.selected_materials
      if (currentMaterials.includes(materialId)) {
        return {
          ...prev,
          selected_materials: currentMaterials.filter((id) => id !== materialId),
        }
      } else {
        return {
          ...prev,
          selected_materials: [...currentMaterials, materialId],
        }
      }
    })
  }, [])

  const toggleTarlLevel = useCallback((levelId: number) => {
    setFormData((prev) => {
      const currentLevels = prev.selected_tarl_levels
      if (currentLevels.includes(levelId)) {
        return {
          ...prev,
          selected_tarl_levels: currentLevels.filter((id) => id !== levelId),
        }
      } else {
        return {
          ...prev,
          selected_tarl_levels: [...currentLevels, levelId],
        }
      }
    })
  }, [])

  const toggleGrade = useCallback((grade: string) => {
    setFormData((prev) => {
      const currentGrades = prev.grades_observed
      if (currentGrades.includes(grade)) {
        return {
          ...prev,
          grades_observed: currentGrades.filter((g) => g !== grade),
        }
      } else {
        return {
          ...prev,
          grades_observed: [...currentGrades, grade],
        }
      }
    })
  }, [])

  if (loadingLookups) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (lookupError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {lookupError}
          <div className="mt-4">
            <Button onClick={loadLookupData}>Retry</Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">TaRL Classroom Observation Form</h1>
        <div className="flex space-x-2">
          <Button variant="outline" className="soft-button">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="soft-button soft-gradient">
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Submitting..." : "Submit Observation"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="class">Class Details</TabsTrigger>
            <TabsTrigger value="teacher">Teacher Performance</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card className="soft-card">
              <CardHeader>
                <CardTitle>Visit Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="visit_date">Visit Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.visit_date && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.visit_date ? format(new Date(formData.visit_date), "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.visit_date ? new Date(formData.visit_date) : undefined}
                          onSelect={(date) => updateFormData("visit_date", date ? format(date, "yyyy-MM-dd") : "")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="program_type">Program Type</Label>
                    <Select
                      value={formData.program_type_id?.toString() || ""}
                      onValueChange={(value) => updateFormData("program_type_id", Number.parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Program Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {lookupData.programTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.program_type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => updateFormData("region", e.target.value)}
                      placeholder="Enter region"
                    />
                  </div>

                  <div>
                    <Label htmlFor="province">Province</Label>
                    <Select
                      value={formData.province}
                      onValueChange={(value) => updateFormData("province", value)}
                    >
                      <SelectTrigger id="province">
                        <SelectValue placeholder="Select Province" />
                      </SelectTrigger>
                      <SelectContent>
                        {lookupData.provinces.map((province) => (
                          <SelectItem key={province.id} value={province.name}>
                            {province.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="mentor_name">Mentor Name</Label>
                    <Input
                      id="mentor_name"
                      value={formData.mentor_name}
                      onChange={(e) => updateFormData("mentor_name", e.target.value)}
                      placeholder="Enter mentor name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="school_name">School Name</Label>
                    <Input
                      id="school_name"
                      value={formData.school_name}
                      onChange={(e) => updateFormData("school_name", e.target.value)}
                      placeholder="Enter school name"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="soft-card">
              <CardHeader>
                <CardTitle>TaRL Class Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Is TaRL class taking place?</Label>
                  <RadioGroup
                    value={formData.tarl_class_taking_place}
                    onValueChange={(value) => updateFormData("tarl_class_taking_place", value)}
                    className="flex space-x-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Yes" id="class-yes" />
                      <Label htmlFor="class-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="No" id="class-no" />
                      <Label htmlFor="class-no">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.tarl_class_taking_place === "No" && (
                  <div className="space-y-4">
                    <div>
                      <Label>Reason for not taking place</Label>
                      <Select
                        value={formData.tarl_class_not_taking_place_reason || ""}
                        onValueChange={(value) => updateFormData("tarl_class_not_taking_place_reason", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Teacher is Absent">Teacher is Absent</SelectItem>
                          <SelectItem value="Most students are absent">Most students are absent</SelectItem>
                          <SelectItem value="The students have exams">The students have exams</SelectItem>
                          <SelectItem value="The school has declared a holiday">
                            The school has declared a holiday
                          </SelectItem>
                          <SelectItem value="Others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.tarl_class_not_taking_place_reason === "Others" && (
                      <div>
                        <Label htmlFor="other_reason">Please specify</Label>
                        <Textarea
                          id="other_reason"
                          value={formData.tarl_class_not_taking_place_other_reason || ""}
                          onChange={(e) => updateFormData("tarl_class_not_taking_place_other_reason", e.target.value)}
                          placeholder="Please specify the reason"
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

          </TabsContent>

          {/* Class Details Tab */}
          <TabsContent value="class" className="space-y-6">
            <Card className="soft-card">
              <CardHeader>
                <CardTitle>Class Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="teacher_name">Teacher Name</Label>
                    <Input
                      id="teacher_name"
                      value={formData.teacher_name}
                      onChange={(e) => updateFormData("teacher_name", e.target.value)}
                      placeholder="Enter teacher name"
                      required
                    />
                  </div>
                  <div>
                    <Label>Did you observe the full session?</Label>
                    <RadioGroup
                      value={formData.observed_full_session}
                      onValueChange={(value) => updateFormData("observed_full_session", value)}
                      className="flex space-x-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Yes" id="full-session-yes" />
                        <Label htmlFor="full-session-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="full-session-no" />
                        <Label htmlFor="full-session-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div>
                    <Label htmlFor="grade_group">Grade Group</Label>
                    <Select
                      value={formData.grade_group}
                      onValueChange={(value) => updateFormData("grade_group", value)}
                    >
                      <SelectTrigger id="grade_group">
                        <SelectValue placeholder="Select Grade Group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Grade 1-2">Grade 1-2</SelectItem>
                        <SelectItem value="Grade 3-5">Grade 3-5</SelectItem>
                        <SelectItem value="Combined">Combined</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Grades Observed</Label>
                    <div className="flex space-x-4 mt-2">
                      {["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"].map((grade) => (
                        <div key={grade} className="flex items-center space-x-2">
                          <Checkbox
                            id={grade}
                            checked={formData.grades_observed.includes(grade)}
                            onCheckedChange={(checked) => {
                              updateFormData(
                                "grades_observed",
                                checked
                                  ? [...formData.grades_observed, grade]
                                  : formData.grades_observed.filter((g) => g !== grade),
                              )
                            }}
                          />
                          <Label htmlFor={grade}>{grade}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="subject_observed">Subject Observed</Label>
                    <Select
                      value={formData.subject_observed}
                      onValueChange={(value) => updateFormData("subject_observed", value)}
                    >
                      <SelectTrigger id="subject_observed">
                        <SelectValue placeholder="Select Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Numeracy">Numeracy</SelectItem>
                        <SelectItem value="Language">Language</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="total_class_strength">Total Class Strength</Label>
                    <Input
                      id="total_class_strength"
                      type="number"
                      value={formData.total_class_strength || ""}
                      onChange={(e) => updateFormData("total_class_strength", Number.parseInt(e.target.value) || null)}
                      placeholder="Enter total class strength"
                    />
                  </div>
                  <div>
                    <Label htmlFor="students_present">Students Present</Label>
                    <Input
                      id="students_present"
                      type="number"
                      value={formData.students_present || ""}
                      onChange={(e) => updateFormData("students_present", Number.parseInt(e.target.value) || null)}
                      placeholder="Enter number of students present"
                    />
                  </div>
                  <div>
                    <Label htmlFor="students_progressed_since_last_week">Students Progressed Since Last Week</Label>
                    <Input
                      id="students_progressed_since_last_week"
                      type="number"
                      value={formData.students_progressed_since_last_week || ""}
                      onChange={(e) => updateFormData("students_progressed_since_last_week", Number.parseInt(e.target.value) || null)}
                      placeholder="Enter number of students progressed"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teacher Performance Tab */}
          <TabsContent value="teacher" className="space-y-6">
            <Card className="soft-card">
              <CardHeader>
                <CardTitle>Delivery</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Did the class start on time?</Label>
                  <RadioGroup
                    value={formData.class_started_on_time}
                    onValueChange={(value) => updateFormData("class_started_on_time", value)}
                    className="flex space-x-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Yes" id="class-start-yes" />
                      <Label htmlFor="class-start-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="No" id="class-start-no" />
                      <Label htmlFor="class-start-no">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.class_started_on_time === "No" && (
                  <div className="space-y-4">
                    <div>
                      <Label>Reason for not starting on time</Label>
                      <Select
                        value={formData.class_not_on_time_reason || ""}
                        onValueChange={(value) => updateFormData("class_not_on_time_reason", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Teacher is Absent">Teacher is Absent</SelectItem>
                          <SelectItem value="Students are late">Students are late</SelectItem>
                          <SelectItem value="Teacher is busy with another activity">
                            Teacher is busy with another activity
                          </SelectItem>
                          <SelectItem value="Others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.class_not_on_time_reason === "Others" && (
                      <div>
                        <Label htmlFor="class_not_on_time_other_reason">Please specify</Label>
                        <Textarea
                          id="class_not_on_time_other_reason"
                          value={formData.class_not_on_time_other_reason || ""}
                          onChange={(e) => updateFormData("class_not_on_time_other_reason", e.target.value)}
                          placeholder="Please specify the reason"
                        />
                      </div>
                    )}
                </div>
                )}

                <div>
                  <Label htmlFor="transition_time_between_subjects">Transition time between subjects (minutes)</Label>
                  <Input
                    id="transition_time_between_subjects"
                    type="number"
                    value={formData.transition_time_between_subjects || ""}
                    onChange={(e) =>
                      updateFormData("transition_time_between_subjects", Number.parseInt(e.target.value) || null)
                    }
                    placeholder="Enter minutes"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="soft-card">
              <CardHeader>
                <CardTitle>Classroom Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Were the children grouped appropriately?</Label>
                  <RadioGroup
                    value={formData.children_grouped_appropriately}
                    onValueChange={(value) => updateFormData("children_grouped_appropriately", value)}
                    className="flex space-x-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Yes" id="grouped-yes" />
                      <Label htmlFor="grouped-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="No" id="grouped-no" />
                      <Label htmlFor="grouped-no">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Were the students fully involved?</Label>
                  <RadioGroup
                    value={formData.students_fully_involved}
                    onValueChange={(value) => updateFormData("students_fully_involved", value)}
                    className="flex space-x-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Yes" id="involved-yes" />
                      <Label htmlFor="involved-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="No" id="involved-no" />
                      <Label htmlFor="involved-no">No</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            <Card className="soft-card">
              <CardHeader>
                <CardTitle>Teacher Preparedness</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Did the teacher have a session plan?</Label>
                  <RadioGroup
                    value={formData.teacher_had_session_plan}
                    onValueChange={(value) => updateFormData("teacher_had_session_plan", value)}
                    className="flex space-x-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Yes" id="plan-yes" />
                      <Label htmlFor="plan-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="No" id="plan-no" />
                      <Label htmlFor="plan-no">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.teacher_had_session_plan === "No" && (
                  <div>
                    <Label>Reason for not having a session plan</Label>
                    <Select
                      value={formData.teacher_no_session_plan_reason || ""}
                      onValueChange={(value) => updateFormData("teacher_no_session_plan_reason", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Teacher is new">Teacher is new</SelectItem>
                        <SelectItem value="No materials available">No materials available</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Did the teacher follow the session plan?</Label>
                  <RadioGroup
                    value={formData.teacher_followed_session_plan}
                    onValueChange={(value) => updateFormData("teacher_followed_session_plan", value)}
                    className="flex space-x-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Yes" id="follow-plan-yes" />
                      <Label htmlFor="follow-plan-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="No" id="follow-plan-no" />
                      <Label htmlFor="follow-plan-no">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.teacher_followed_session_plan === "No" && (
                  <div>
                    <Label htmlFor="teacher_not_follow_plan_reason">Reason for not following the plan</Label>
                    <Textarea
                      id="teacher_not_follow_plan_reason"
                      value={formData.teacher_not_follow_plan_reason || ""}
                      onChange={(e) => updateFormData("teacher_not_follow_plan_reason", e.target.value)}
                      placeholder="Please specify the reason"
                    />
                  </div>
                )}

                <div>
                  <Label>Was the session plan appropriate for the level of children?</Label>
                  <RadioGroup
                    value={formData.session_plan_appropriate_for_level}
                    onValueChange={(value) => updateFormData("session_plan_appropriate_for_level", value)}
                    className="flex space-x-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Yes" id="appropriate-yes" />
                      <Label htmlFor="appropriate-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="No" id="appropriate-no" />
                      <Label htmlFor="appropriate-no">No</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Activities Tab */}
            <TabsContent value="activities" className="space-y-6">
              <Card className="soft-card">
                <CardHeader>
                  <CardTitle>Activities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="number_of_activities">Number of Activities Observed</Label>
                    <Select
                      value={formData.number_of_activities}
                      onValueChange={(value) => updateFormData("number_of_activities", value)}
                    >
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  {formData.activities.map((activity, index) => (
                    <div key={index} className="space-y-4 border-b pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
                      <h3 className="text-lg font-semibold">Activity {activity.activity_number}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`activity_type_language_${index}`}>Activity Type (Language)</Label>
                          <Select
                            value={activity.activity_type_id_language?.toString() || ""}
                            onValueChange={(value) =>
                              updateActivityData(index, "activity_type_id_language", Number.parseInt(value))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Activity Type" />
                            </SelectTrigger>
                            <SelectContent>
                              {lookupData.activityTypes
                                .filter((type) => type.subject === "Language")
                                .map((type) => (
                                  <SelectItem key={type.id} value={type.id.toString()}>
                                    {type.activity_name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor={`activity_type_numeracy_${index}`}>Activity Type (Numeracy)</Label>
                          <Select
                            value={activity.activity_type_id_numeracy?.toString() || ""}
                            onValueChange={(value) =>
                              updateActivityData(index, "activity_type_id_numeracy", Number.parseInt(value))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Activity Type" />
                            </SelectTrigger>
                            <SelectContent>
                              {lookupData.activityTypes
                                .filter((type) => type.subject === "Numeracy")
                                .map((type) => (
                                  <SelectItem key={type.id} value={type.id.toString()}>
                                    {type.activity_name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor={`duration_minutes_${index}`}>Duration (minutes)</Label>
                          <Input
                            id={`duration_minutes_${index}`}
                            type="number"
                            value={activity.duration_minutes || ""}
                            onChange={(e) =>
                              updateActivityData(index, "duration_minutes", Number.parseInt(e.target.value) || null)
                            }
                            placeholder="Enter duration"
                          />
                        </div>
                      </div>

                      <Label>Did the teacher give clear instructions?</Label>
                      <RadioGroup
                        value={activity.teacher_gave_clear_instructions}
                        onValueChange={(value) => updateActivityData(index, "teacher_gave_clear_instructions", value)}
                        className="flex space-x-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Yes" id={`instructions-yes-${index}`} />
                          <Label htmlFor={`instructions-yes-${index}`}>Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="No" id={`instructions-no-${index}`} />
                          <Label htmlFor={`instructions-no-${index}`}>No</Label>
                        </div>
                      </RadioGroup>

                      {activity.teacher_gave_clear_instructions === "No" && (
                        <div>
                          <Label htmlFor={`no_clear_instructions_reason_${index}`}>Reason for not giving clear instructions</Label>
                          <Textarea
                            id={`no_clear_instructions_reason_${index}`}
                            value={activity.teacher_no_clear_instructions_reason || ""}
                            onChange={(e) => updateActivityData(index, "teacher_no_clear_instructions_reason", e.target.value)}
                            placeholder="Please specify the reason"
                          />
                        </div>
                      )}

                      <Label>Did the teacher demonstrate the activity?</Label>
                      <RadioGroup
                        value={activity.teacher_demonstrated_activity}
                        onValueChange={(value) => updateActivityData(index, "teacher_demonstrated_activity", value)}
                        className="flex space-x-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Yes" id={`demonstrated-yes-${index}`} />
                          <Label htmlFor={`demonstrated-yes-${index}`}>Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="No" id={`demonstrated-no-${index}`} />
                          <Label htmlFor={`demonstrated-no-${index}`}>No</Label>
                        </div>
                      </RadioGroup>

                      <Label>Did the teacher make students practice the activity in front of the class?</Label>
                      <RadioGroup
                        value={activity.teacher_made_students_practice_in_front}
                        onValueChange={(value) =>
                          updateActivityData(index, "teacher_made_students_practice_in_front", value)
                        }
                        className="flex space-x-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Yes" id={`practice-front-yes-${index}`} />
                          <Label htmlFor={`practice-front-yes-${index}`}>Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="No" id={`practice-front-no-${index}`} />
                          <Label htmlFor={`practice-front-no-${index}`}>No</Label>
                        </div>
                      </RadioGroup>

                      <Label>Did students perform the activity in small groups?</Label>
                      <RadioGroup
                        value={activity.students_performed_in_small_groups}
                        onValueChange={(value) => updateActivityData(index, "students_performed_in_small_groups", value)}
                        className="flex space-x-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Yes" id={`small-groups-yes-${index}`} />
                          <Label htmlFor={`small-groups-yes-${index}`}>Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="No" id={`small-groups-no-${index}`} />
                          <Label htmlFor={`small-groups-no-${index}`}>No</Label>
                        </div>
                      </RadioGroup>

                      <Label>Did students perform the activity individually?</Label>
                      <RadioGroup
                        value={activity.students_performed_individually}
                        onValueChange={(value) => updateActivityData(index, "students_performed_individually", value)}
                        className="flex space-x-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Yes" id={`individual-yes-${index}`} />
                          <Label htmlFor={`individual-yes-${index}`}>Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="No" id={`individual-no-${index}`} />
                          <Label htmlFor={`individual-no-${index}`}>No</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-6">
              <Card className="soft-card">
                <CardHeader>
                  <CardTitle>Summary & Suggestions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="selected_materials">Materials Used</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {lookupData.materials.map((material) => (
                        <div key={material.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`material-${material.id}`}
                            checked={formData.selected_materials.includes(material.id)}
                            onCheckedChange={(checked) => {
                              updateFormData(
                                "selected_materials",
                                checked
                                  ? [...formData.selected_materials, material.id]
                                  : formData.selected_materials.filter((id) => id !== material.id),
                              )
                            }}
                          />
                          <Label htmlFor={`material-${material.id}`}>{material.material_name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="selected_tarl_levels">TaRL Levels Observed</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {lookupData.tarlLevels.map((level) => (
                        <div key={level.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`level-${level.id}`}
                            checked={formData.selected_tarl_levels.includes(level.id)}
                            onCheckedChange={(checked) => {
                              updateFormData(
                                "selected_tarl_levels",
                                checked
                                  ? [...formData.selected_tarl_levels, level.id]
                                  : formData.selected_tarl_levels.filter((id) => id !== level.id),
                              )
                            }}
                          />
                          <Label htmlFor={`level-${level.id}`}>{level.level_name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="suggestions_to_teacher">Suggestions to Teacher</Label>
                    <Textarea
                      id="suggestions_to_teacher"
                      value={formData.suggestions_to_teacher}
                      onChange={(e) => updateFormData("suggestions_to_teacher", e.target.value)}
                      placeholder="Enter suggestions for the teacher (e.g., areas for improvement, positive feedback)"
                      rows={5}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="soft-gradient">
                  {loading ? "Submitting..." : "Submit Observation"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </div>
  )
})
