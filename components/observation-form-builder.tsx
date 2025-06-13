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
import { supabase } from "@/lib/supabase"
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
    mentor_name: user?.name || "",
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
      const [programTypes, materials, tarlLevels, activityTypes, provinces] = await Promise.all([
        supabase.from("program_types").select("*").order("program_type"),
        supabase.from("materials").select("*").order("material_name"),
        supabase.from("tarl_levels").select("*").order("subject, level_order"),
        supabase.from("activity_types").select("*").order("subject, activity_name"),
        DatabaseService.getProvinces(),
      ])

      // Check if any queries failed
      const errors = [
        programTypes.error,
        materials.error,
        tarlLevels.error,
        activityTypes.error,
      ].filter(Boolean)

      if (errors.length > 0) {
        throw new Error("Some lookup tables are missing. Please run the database setup script first.")
      }

      setLookupData({
        programTypes: programTypes.data || [],
        materials: materials.data || [],
        tarlLevels: tarlLevels.data || [],
        activityTypes: activityTypes.data || [],
        provinces: provinces || [],
      })
    } catch (error: any) {
      console.error("Error loading lookup data:", error)
      setLookupError(error.message || "Failed to load form data")
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
      // Check if required tables exist
      const { data: tablesData, error: tablesError } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .in("table_name", [
          "tbl_tarl_observation_responses",
          "tbl_tarl_observation_activities",
          "tbl_tarl_observation_materials",
          "tbl_tarl_observation_tarl_levels",
        ])

      if (tablesError) {
        throw new Error("Could not check if tables exist")
      }

      if (!tablesData || tablesData.length < 4) {
        throw new Error("Required tables are missing. Please run the database setup script first.")
      }

      // Insert main observation record
      const { data: observationData, error: observationError } = await supabase
        .from("tbl_tarl_observation_responses")
        .insert([
          {
            ...formData,
            created_by_user_id: user?.id, // Use the auth user ID
            created_by_name: user?.name || formData.mentor_name,
            grades_observed: formData.grades_observed,
          },
        ])
        .select()
        .single()

      if (observationError) throw observationError

      const observationId = observationData.id

      // Insert materials
      if (formData.selected_materials.length > 0) {
        const materialInserts = formData.selected_materials.map((materialId) => ({
          observation_id: observationId,
          material_id: materialId,
        }))

        const { error: materialsError } = await supabase.from("tbl_tarl_observation_materials").insert(materialInserts)

        if (materialsError) throw materialsError
      }

      // Insert TaRL levels
      if (formData.selected_tarl_levels.length > 0) {
        const levelInserts = formData.selected_tarl_levels.map((levelId) => ({
          observation_id: observationId,
          tarl_level_id: levelId,
        }))

        const { error: levelsError } = await supabase.from("tbl_tarl_observation_tarl_levels").insert(levelInserts)

        if (levelsError) throw levelsError
      }

      // Insert activities
      const activityInserts = formData.activities.map((activity) => ({
        observation_id: observationId,
        ...activity,
      }))

      const { error: activitiesError } = await supabase.from("tbl_tarl_observation_activities").insert(activityInserts)

      if (activitiesError) throw activitiesError

      toast({
        title: "Success",
        description: "Observation form submitted successfully!",
      })

      // Reset form or redirect
      // resetForm()
    } catch (error: any) {
      console.error("Error submitting observation:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit observation. Please try again.",
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
            {loading ? "Saving..." : "Save Observation"}
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
                <CardTitle>Teacher & Observation Details</CardTitle>
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
                    />
                  </div>

                  <div>
                    <Label>Observed full session?</Label>
                    <RadioGroup
                      value={formData.observed_full_session}
                      onValueChange={(value) => updateFormData("observed_full_session", value)}
                      className="flex space-x-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Yes" id="full-yes" />
                        <Label htmlFor="full-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="full-no" />
                        <Label htmlFor="full-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Grade Group</Label>
                    <Select
                      value={formData.grade_group}
                      onValueChange={(value) => updateFormData("grade_group", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Std. 1-2">Std. 1-2</SelectItem>
                        <SelectItem value="Std. 3-6">Std. 3-6</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Subject Observed</Label>
                    <Select
                      value={formData.subject_observed}
                      onValueChange={(value) => updateFormData("subject_observed", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Language">Language</SelectItem>
                        <SelectItem value="Numeracy">Numeracy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.grade_group === "Std. 3-6" && (
                  <div>
                    <Label>Specific Grades Observed</Label>
                    <div className="flex space-x-4 mt-2">
                      {["3", "4", "5", "6"].map((grade) => (
                        <div key={grade} className="flex items-center space-x-2">
                          <Checkbox
                            id={`grade-${grade}`}
                            checked={formData.grades_observed.includes(grade)}
                            onCheckedChange={() => toggleGrade(grade)}
                          />
                          <Label htmlFor={`grade-${grade}`}>Grade {grade}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="soft-card">
              <CardHeader>
                <CardTitle>Class Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="total_class_strength">Total Class Strength</Label>
                    <Input
                      id="total_class_strength"
                      type="number"
                      value={formData.total_class_strength || ""}
                      onChange={(e) =>
                        updateFormData("total_class_strength", e.target.value ? Number.parseInt(e.target.value) : null)
                      }
                      placeholder="Enter total students"
                    />
                  </div>

                  <div>
                    <Label htmlFor="students_present">Students Present</Label>
                    <Input
                      id="students_present"
                      type="number"
                      value={formData.students_present || ""}
                      onChange={(e) =>
                        updateFormData("students_present", e.target.value ? Number.parseInt(e.target.value) : null)
                      }
                      placeholder="Enter present students"
                    />
                  </div>

                  <div>
                    <Label htmlFor="students_progressed">Students Progressed Since Last Week</Label>
                    <Input
                      id="students_progressed"
                      type="number"
                      value={formData.students_progressed_since_last_week || ""}
                      onChange={(e) =>
                        updateFormData(
                          "students_progressed_since_last_week",
                          e.target.value ? Number.parseInt(e.target.value) : null,
                        )
                      }
                      placeholder="Enter progressed students"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="soft-card">
              <CardHeader>
                <CardTitle>Materials Present</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {lookupData.materials.map((material) => (
                    <div key={material.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`material-${material.id}`}
                        checked={formData.selected_materials.includes(material.id)}
                        onCheckedChange={() => toggleMaterial(material.id)}
                      />
                      <Label htmlFor={`material-${material.id}`} className="text-sm">
                        {material.material_name}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="soft-card">
              <CardHeader>
                <CardTitle>TaRL Levels Observed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["Language", "Numeracy"].map((subject) => (
                    <div key={subject}>
                      <h4 className="font-medium mb-2">{subject}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {lookupData.tarlLevels
                          .filter((level) => level.subject === subject)
                          .map((level) => (
                            <div key={level.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`level-${level.id}`}
                                checked={formData.selected_tarl_levels.includes(level.id)}
                                onCheckedChange={() => toggleTarlLevel(level.id)}
                              />
                              <Label htmlFor={`level-${level.id}`} className="text-sm">
                                {level.level_name}
                              </Label>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teacher Performance Tab */}
          <TabsContent value="teacher" className="space-y-6">
            <Card className="soft-card">
              <CardHeader>
                <CardTitle>Class Delivery</CardTitle>
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
                      <RadioGroupItem value="Yes" id="ontime-yes" />
                      <Label htmlFor="ontime-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="No" id="ontime-no" />
                      <Label htmlFor="ontime-no">No</Label>
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
                          <SelectItem value="Teacher came late">Teacher came late</SelectItem>
                          <SelectItem value="Pupils came late">Pupils came late</SelectItem>
                          <SelectItem value="Others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.class_not_on_time_reason === "Others" && (
                      <div>
                        <Label htmlFor="ontime_other_reason">Please specify</Label>
                        <Textarea
                          id="ontime_other_reason"
                          value={formData.class_not_on_time_other_reason || ""}
                          onChange={(e) => updateFormData("class_not_on_time_other_reason", e.target.value)}
                          placeholder="Please specify the reason"
                        />
                      </div>
                    )}
                </div>

                <div>
                  <Label htmlFor="transition_time">Transition time between subjects (minutes)</Label>
                  <Input
                    id="transition_time"
                    type="number"
                    value={formData.transition_time_between_subjects || ""}
                    onChange={(e) =>
                      updateFormData(
                        "transition_time_between_subjects",
                        e.target.value ? Number.parseInt(e.target.value) : null,
                      )
                    }
                    placeholder="Enter transition time in minutes"
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
                  <Label>Were children grouped appropriately?</Label>
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
                  <Label>Were students fully involved?</Label>
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
                <CardTitle>Session Planning</CardTitle>
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
                    <Label htmlFor="no_plan_reason">Reason for not having session plan</Label>
                    <Textarea
                      id="no_plan_reason"
                      value={formData.teacher_no_session_plan_reason || ""}
                      onChange={(e) => updateFormData("teacher_no_session_plan_reason", e.target.value)}
                      placeholder="Please specify the reason"
                    />
                  </div>
                )}

                {formData.teacher_had_session_plan === "Yes" && (
                  <>
                    <div>
                      <Label>Did the teacher follow the session plan?</Label>
                      <RadioGroup
                        value={formData.teacher_followed_session_plan}
                        onValueChange={(value) => updateFormData("teacher_followed_session_plan", value)}
                        className="flex space-x-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Yes" id="follow-yes" />
                          <Label htmlFor="follow-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="No" id="follow-no" />
                          <Label htmlFor="follow-no">No</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {formData.teacher_followed_session_plan === "No" && (
                      <div>
                        <Label htmlFor="not_follow_reason">Reason for not following session plan</Label>
                        <Textarea
                          id="not_follow_reason"
                          value={formData.teacher_not_follow_plan_reason || ""}
                          onChange={(e) => updateFormData("teacher_not_follow_plan_reason", e.target.value)}
                          placeholder="Please specify the reason"
                        />
                      </div>
                    )}

                    <div>
                      <Label>Was the session plan appropriate for the level?</Label>
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
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-6">
            <Card className="soft-card">
              <CardHeader>
                <CardTitle>Number of Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.number_of_activities}
                  onValueChange={(value) => updateFormData("number_of_activities", value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select number of activities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Activity</SelectItem>
                    <SelectItem value="2">2 Activities</SelectItem>
                    <SelectItem value="3">3 Activities</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {formData.activities.map((activity, index) => (
              <Card key={index} className="soft-card">
                <CardHeader>
                  <CardTitle>Activity {index + 1}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Language Activity Type</Label>
                      <Select
                        value={activity.activity_type_id_language?.toString() || ""}
                        onValueChange={(value) =>
                          updateActivityData(index, "activity_type_id_language", value ? Number.parseInt(value) : null)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language activity" />
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
                      <Label>Numeracy Activity Type</Label>
                      <Select
                        value={activity.activity_type_id_numeracy?.toString() || ""}
                        onValueChange={(value) =>
                          updateActivityData(index, "activity_type_id_numeracy", value ? Number.parseInt(value) : null)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select numeracy activity" />
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
                      <Label htmlFor={`duration-${index}`}>Duration (minutes)</Label>
                      <Input
                        id={`duration-${index}`}
                        type="number"
                        value={activity.duration_minutes || ""}
                        onChange={(e) =>
                          updateActivityData(
                            index,
                            "duration_minutes",
                            e.target.value ? Number.parseInt(e.target.value) : null,
                          )
                        }
                        placeholder="Enter duration"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Did the teacher give clear instructions?</Label>
                      <RadioGroup
                        value={activity.teacher_gave_clear_instructions}
                        onValueChange={(value) => updateActivityData(index, "teacher_gave_clear_instructions", value)}
                        className="flex space-x-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Yes" id={`clear-${index}-yes`} />
                          <Label htmlFor={`clear-${index}-yes`}>Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="No" id={`clear-${index}-no`} />
                          <Label htmlFor={`clear-${index}-no`}>No</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {activity.teacher_gave_clear_instructions === "No" && (
                      <div>
                        <Label htmlFor={`clear-reason-${index}`}>Reason for not giving clear instructions</Label>
                        <Textarea
                          id={`clear-reason-${index}`}
                          value={activity.teacher_no_clear_instructions_reason || ""}
                          onChange={(e) =>
                            updateActivityData(index, "teacher_no_clear_instructions_reason", e.target.value)
                          }
                          placeholder="Please specify the reason"
                        />
                      </div>
                    )}

                    <div>
                      <Label>Did the teacher demonstrate the activity?</Label>
                      <RadioGroup
                        value={activity.teacher_demonstrated_activity}
                        onValueChange={(value) => updateActivityData(index, "teacher_demonstrated_activity", value)}
                        className="flex space-x-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Yes" id={`demo-${index}-yes`} />
                          <Label htmlFor={`demo-${index}-yes`}>Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="No" id={`demo-${index}-no`} />
                          <Label htmlFor={`demo-${index}-no`}>No</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label>Did the teacher make students practice in front?</Label>
                      <RadioGroup
                        value={activity.teacher_made_students_practice_in_front}
                        onValueChange={(value) =>
                          updateActivityData(index, "teacher_made_students_practice_in_front", value)
                        }
                        className="flex space-x-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Yes" id={`practice-${index}-yes`} />
                          <Label htmlFor={`practice-${index}-yes`}>Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="No" id={`practice-${index}-no`} />
                          <Label htmlFor={`practice-${index}-no`}>No</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Not Applicable" id={`practice-${index}-na`} />
                          <Label htmlFor={`practice-${index}-na`}>Not Applicable</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label>Did students perform in small groups?</Label>
                      <RadioGroup
                        value={activity.students_performed_in_small_groups}
                        onValueChange={(value) =>
                          updateActivityData(index, "students_performed_in_small_groups", value)
                        }
                        className="flex space-x-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Yes" id={`groups-${index}-yes`} />
                          <Label htmlFor={`groups-${index}-yes`}>Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="No" id={`groups-${index}-no`} />
                          <Label htmlFor={`groups-${index}-no`}>No</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Not Applicable" id={`groups-${index}-na`} />
                          <Label htmlFor={`groups-${index}-na`}>Not Applicable</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label>Did students perform individually?</Label>
                      <RadioGroup
                        value={activity.students_performed_individually}
                        onValueChange={(value) => updateActivityData(index, "students_performed_individually", value)}
                        className="flex space-x-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Yes" id={`individual-${index}-yes`} />
                          <Label htmlFor={`individual-${index}-yes`}>Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="No" id={`individual-${index}-no`} />
                          <Label htmlFor={`individual-${index}-no`}>No</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Not Applicable" id={`individual-${index}-na`} />
                          <Label htmlFor={`individual-${index}-na`}>Not Applicable</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-6">
            <Card className="soft-card">
              <CardHeader>
                <CardTitle>Suggestions to Teacher</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.suggestions_to_teacher}
                  onChange={(e) => updateFormData("suggestions_to_teacher", e.target.value)}
                  placeholder="Enter suggestions and recommendations for the teacher"
                  rows={6}
                />
              </CardContent>
            </Card>

            <Card className="soft-card">
              <CardHeader>
                <CardTitle>Form Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Visit Details</h4>
                    <p className="text-sm text-gray-600">Date: {formData.visit_date}</p>
                    <p className="text-sm text-gray-600">School: {formData.school_name}</p>
                    <p className="text-sm text-gray-600">Teacher: {formData.teacher_name}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Class Information</h4>
                    <p className="text-sm text-gray-600">Subject: {formData.subject_observed}</p>
                    <p className="text-sm text-gray-600">Grade Group: {formData.grade_group}</p>
                    <p className="text-sm text-gray-600">Students Present: {formData.students_present}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium">Selected Materials</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.selected_materials.map((materialId) => {
                      const material = lookupData.materials.find((m) => m.id === materialId)
                      return (
                        <Badge key={materialId} variant="secondary">
                          {material?.material_name}
                        </Badge>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium">TaRL Levels Observed</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.selected_tarl_levels.map((levelId) => {
                      const level = lookupData.tarlLevels.find((l) => l.id === levelId)
                      return (
                        <Badge key={levelId} variant="outline">
                          {level?.subject}: {level?.level_name}
                        </Badge>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium">Activities</h4>
                  <p className="text-sm text-gray-600">Number of activities: {formData.number_of_activities}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  )
})
