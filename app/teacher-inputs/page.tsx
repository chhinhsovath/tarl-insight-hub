"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { PlusCircle, Clock, FileText } from "lucide-react"

interface Student {
  student_id: number
  student_name: string
}

interface Teacher {
  teacher_id: number
  teacher_name: string
}

export default function TeacherInputsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Form states
  const [assessmentForm, setAssessmentForm] = useState({
    student_id: "",
    teacher_id: "",
    subject: "",
    lesson_title: "",
    assessment_type: "",
    assessment_date: "",
    score: "",
    max_score: "100",
    strengths: "",
    areas_for_improvement: "",
    teacher_remarks: "",
  })

  const [taskForm, setTaskForm] = useState({
    student_id: "",
    teacher_id: "",
    subject: "",
    task_title: "",
    task_description: "",
    difficulty_level: "Beginner",
    estimated_duration_minutes: "",
    assigned_date: "",
    due_date: "",
  })

  const [studyHoursForm, setStudyHoursForm] = useState({
    student_id: "",
    teacher_id: "",
    subject: "",
    session_date: "",
    duration_minutes: "",
    activity_type: "",
    notes: "",
  })

  useEffect(() => {
    loadStudents()
    loadTeachers()
  }, [])

  const loadStudents = async () => {
    const { data, error } = await supabase
      .from("students")
      .select("student_id, student_name")
      .eq("status", 1)
      .order("student_name")

    if (error) {
      console.error("Error loading students:", error)
      return
    }

    setStudents(data || [])
  }

  const loadTeachers = async () => {
    const { data, error } = await supabase
      .from("teachers")
      .select("teacher_id, teacher_name")
      .eq("status", 1)
      .order("teacher_name")

    if (error) {
      console.error("Error loading teachers:", error)
      return
    }

    setTeachers(data || [])
  }

  const handleAssessmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("formative_assessments").insert([
        {
          student_id: Number.parseInt(assessmentForm.student_id),
          teacher_id: Number.parseInt(assessmentForm.teacher_id),
          subject: assessmentForm.subject,
          lesson_title: assessmentForm.lesson_title,
          assessment_type: assessmentForm.assessment_type,
          assessment_date: assessmentForm.assessment_date,
          score: Number.parseFloat(assessmentForm.score),
          max_score: Number.parseFloat(assessmentForm.max_score),
          strengths: assessmentForm.strengths,
          areas_for_improvement: assessmentForm.areas_for_improvement,
          teacher_remarks: assessmentForm.teacher_remarks,
        },
      ])

      if (error) throw error

      toast({
        title: "Assessment Added",
        description: "Formative assessment has been recorded successfully.",
      })

      // Reset form
      setAssessmentForm({
        student_id: "",
        teacher_id: "",
        subject: "",
        lesson_title: "",
        assessment_type: "",
        assessment_date: "",
        score: "",
        max_score: "100",
        strengths: "",
        areas_for_improvement: "",
        teacher_remarks: "",
      })
    } catch (error) {
      console.error("Error adding assessment:", error)
      toast({
        title: "Error",
        description: "Failed to add assessment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("learning_tasks").insert([
        {
          student_id: Number.parseInt(taskForm.student_id),
          teacher_id: Number.parseInt(taskForm.teacher_id),
          subject: taskForm.subject,
          task_title: taskForm.task_title,
          task_description: taskForm.task_description,
          difficulty_level: taskForm.difficulty_level,
          estimated_duration_minutes: taskForm.estimated_duration_minutes
            ? Number.parseInt(taskForm.estimated_duration_minutes)
            : null,
          assigned_date: taskForm.assigned_date,
          due_date: taskForm.due_date || null,
        },
      ])

      if (error) throw error

      toast({
        title: "Task Assigned",
        description: "Learning task has been assigned successfully.",
      })

      // Reset form
      setTaskForm({
        student_id: "",
        teacher_id: "",
        subject: "",
        task_title: "",
        task_description: "",
        difficulty_level: "Beginner",
        estimated_duration_minutes: "",
        assigned_date: "",
        due_date: "",
      })
    } catch (error) {
      console.error("Error adding task:", error)
      toast({
        title: "Error",
        description: "Failed to assign task. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStudyHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("study_hours_tracking").insert([
        {
          student_id: Number.parseInt(studyHoursForm.student_id),
          teacher_id: Number.parseInt(studyHoursForm.teacher_id),
          subject: studyHoursForm.subject,
          session_date: studyHoursForm.session_date,
          duration_minutes: Number.parseInt(studyHoursForm.duration_minutes),
          activity_type: studyHoursForm.activity_type,
          notes: studyHoursForm.notes,
        },
      ])

      if (error) throw error

      toast({
        title: "Study Hours Recorded",
        description: "Study session has been recorded successfully.",
      })

      // Reset form
      setStudyHoursForm({
        student_id: "",
        teacher_id: "",
        subject: "",
        session_date: "",
        duration_minutes: "",
        activity_type: "",
        notes: "",
      })
    } catch (error) {
      console.error("Error recording study hours:", error)
      toast({
        title: "Error",
        description: "Failed to record study hours. Please try again.",
        variant: "destructive",
      })
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
          <h2 className="text-xl font-semibold text-gray-900">Teacher Inputs</h2>
          <p className="text-sm text-gray-600">Record assessments, assign tasks, and track study hours</p>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="assessment" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="assessment" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Assessment</span>
              </TabsTrigger>
              <TabsTrigger value="task" className="flex items-center space-x-2">
                <PlusCircle className="h-4 w-4" />
                <span>Learning Task</span>
              </TabsTrigger>
              <TabsTrigger value="hours" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Study Hours</span>
              </TabsTrigger>
            </TabsList>

            {/* Assessment Form */}
            <TabsContent value="assessment">
              <Card>
                <CardHeader>
                  <CardTitle>Record Formative Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAssessmentSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="student">Student</Label>
                        <Select
                          value={assessmentForm.student_id}
                          onValueChange={(value) => setAssessmentForm({ ...assessmentForm, student_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Student" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((student) => (
                              <SelectItem key={student.student_id} value={student.student_id.toString()}>
                                {student.student_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="teacher">Teacher</Label>
                        <Select
                          value={assessmentForm.teacher_id}
                          onValueChange={(value) => setAssessmentForm({ ...assessmentForm, teacher_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.teacher_id} value={teacher.teacher_id.toString()}>
                                {teacher.teacher_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Select
                          value={assessmentForm.subject}
                          onValueChange={(value) => setAssessmentForm({ ...assessmentForm, subject: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Subject" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Math">TaRL Math</SelectItem>
                            <SelectItem value="Khmer">TaRL Khmer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="assessment_type">Assessment Type</Label>
                        <Select
                          value={assessmentForm.assessment_type}
                          onValueChange={(value) => setAssessmentForm({ ...assessmentForm, assessment_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Quiz">Quiz</SelectItem>
                            <SelectItem value="Observation">Observation</SelectItem>
                            <SelectItem value="Assignment">Assignment</SelectItem>
                            <SelectItem value="Oral">Oral</SelectItem>
                            <SelectItem value="Practical">Practical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="lesson_title">Lesson Title</Label>
                        <Input
                          id="lesson_title"
                          value={assessmentForm.lesson_title}
                          onChange={(e) => setAssessmentForm({ ...assessmentForm, lesson_title: e.target.value })}
                          placeholder="Enter lesson title"
                        />
                      </div>

                      <div>
                        <Label htmlFor="assessment_date">Assessment Date</Label>
                        <Input
                          id="assessment_date"
                          type="date"
                          value={assessmentForm.assessment_date}
                          onChange={(e) => setAssessmentForm({ ...assessmentForm, assessment_date: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="score">Score</Label>
                        <Input
                          id="score"
                          type="number"
                          step="0.01"
                          value={assessmentForm.score}
                          onChange={(e) => setAssessmentForm({ ...assessmentForm, score: e.target.value })}
                          placeholder="Enter score"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="max_score">Max Score</Label>
                        <Input
                          id="max_score"
                          type="number"
                          step="0.01"
                          value={assessmentForm.max_score}
                          onChange={(e) => setAssessmentForm({ ...assessmentForm, max_score: e.target.value })}
                          placeholder="Enter max score"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="strengths">Strengths</Label>
                      <Textarea
                        id="strengths"
                        value={assessmentForm.strengths}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, strengths: e.target.value })}
                        placeholder="What did the student do well?"
                      />
                    </div>

                    <div>
                      <Label htmlFor="areas_for_improvement">Areas for Improvement</Label>
                      <Textarea
                        id="areas_for_improvement"
                        value={assessmentForm.areas_for_improvement}
                        onChange={(e) =>
                          setAssessmentForm({ ...assessmentForm, areas_for_improvement: e.target.value })
                        }
                        placeholder="What areas need more work?"
                      />
                    </div>

                    <div>
                      <Label htmlFor="teacher_remarks">Teacher Remarks</Label>
                      <Textarea
                        id="teacher_remarks"
                        value={assessmentForm.teacher_remarks}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, teacher_remarks: e.target.value })}
                        placeholder="Additional comments or observations"
                      />
                    </div>

                    <Button type="submit" disabled={loading}>
                      {loading ? "Recording..." : "Record Assessment"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Task Form */}
            <TabsContent value="task">
              <Card>
                <CardHeader>
                  <CardTitle>Assign Learning Task</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleTaskSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="student">Student</Label>
                        <Select
                          value={taskForm.student_id}
                          onValueChange={(value) => setTaskForm({ ...taskForm, student_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Student" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((student) => (
                              <SelectItem key={student.student_id} value={student.student_id.toString()}>
                                {student.student_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="teacher">Teacher</Label>
                        <Select
                          value={taskForm.teacher_id}
                          onValueChange={(value) => setTaskForm({ ...taskForm, teacher_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.teacher_id} value={teacher.teacher_id.toString()}>
                                {teacher.teacher_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Select
                          value={taskForm.subject}
                          onValueChange={(value) => setTaskForm({ ...taskForm, subject: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Subject" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Math">TaRL Math</SelectItem>
                            <SelectItem value="Khmer">TaRL Khmer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="difficulty_level">Difficulty Level</Label>
                        <Select
                          value={taskForm.difficulty_level}
                          onValueChange={(value) => setTaskForm({ ...taskForm, difficulty_level: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="assigned_date">Assigned Date</Label>
                        <Input
                          id="assigned_date"
                          type="date"
                          value={taskForm.assigned_date}
                          onChange={(e) => setTaskForm({ ...taskForm, assigned_date: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="due_date">Due Date</Label>
                        <Input
                          id="due_date"
                          type="date"
                          value={taskForm.due_date}
                          onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="estimated_duration">Estimated Duration (minutes)</Label>
                        <Input
                          id="estimated_duration"
                          type="number"
                          value={taskForm.estimated_duration_minutes}
                          onChange={(e) => setTaskForm({ ...taskForm, estimated_duration_minutes: e.target.value })}
                          placeholder="Enter duration in minutes"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="task_title">Task Title</Label>
                      <Input
                        id="task_title"
                        value={taskForm.task_title}
                        onChange={(e) => setTaskForm({ ...taskForm, task_title: e.target.value })}
                        placeholder="Enter task title"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="task_description">Task Description</Label>
                      <Textarea
                        id="task_description"
                        value={taskForm.task_description}
                        onChange={(e) => setTaskForm({ ...taskForm, task_description: e.target.value })}
                        placeholder="Describe the learning task in detail"
                      />
                    </div>

                    <Button type="submit" disabled={loading}>
                      {loading ? "Assigning..." : "Assign Task"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Study Hours Form */}
            <TabsContent value="hours">
              <Card>
                <CardHeader>
                  <CardTitle>Record Study Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleStudyHoursSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="student">Student</Label>
                        <Select
                          value={studyHoursForm.student_id}
                          onValueChange={(value) => setStudyHoursForm({ ...studyHoursForm, student_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Student" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((student) => (
                              <SelectItem key={student.student_id} value={student.student_id.toString()}>
                                {student.student_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="teacher">Teacher</Label>
                        <Select
                          value={studyHoursForm.teacher_id}
                          onValueChange={(value) => setStudyHoursForm({ ...studyHoursForm, teacher_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.teacher_id} value={teacher.teacher_id.toString()}>
                                {teacher.teacher_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Select
                          value={studyHoursForm.subject}
                          onValueChange={(value) => setStudyHoursForm({ ...studyHoursForm, subject: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Subject" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Math">TaRL Math</SelectItem>
                            <SelectItem value="Khmer">TaRL Khmer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="activity_type">Activity Type</Label>
                        <Select
                          value={studyHoursForm.activity_type}
                          onValueChange={(value) => setStudyHoursForm({ ...studyHoursForm, activity_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Activity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Practice">Practice</SelectItem>
                            <SelectItem value="Assessment">Assessment</SelectItem>
                            <SelectItem value="Instruction">Instruction</SelectItem>
                            <SelectItem value="Review">Review</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="session_date">Session Date</Label>
                        <Input
                          id="session_date"
                          type="date"
                          value={studyHoursForm.session_date}
                          onChange={(e) => setStudyHoursForm({ ...studyHoursForm, session_date: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                        <Input
                          id="duration_minutes"
                          type="number"
                          value={studyHoursForm.duration_minutes}
                          onChange={(e) => setStudyHoursForm({ ...studyHoursForm, duration_minutes: e.target.value })}
                          placeholder="Enter duration in minutes"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={studyHoursForm.notes}
                        onChange={(e) => setStudyHoursForm({ ...studyHoursForm, notes: e.target.value })}
                        placeholder="Additional notes about the study session"
                      />
                    </div>

                    <Button type="submit" disabled={loading}>
                      {loading ? "Recording..." : "Record Study Hours"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
