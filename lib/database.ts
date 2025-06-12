import { staticData } from "./static-data"
import type { ResultSetHeader } from "./mysql"

let mysql: typeof import("./mysql") | null = null
async function getMysql() {
  if (!mysql) {
    mysql = await import("./mysql")
  }
  return mysql
}

export class DatabaseService {
  // =====================================================
  // PROVINCES
  // =====================================================
  static async getProvinces() {
    try {
      if (process.env.MYSQL_HOST) {
        const { query } = await getMysql()
        return await query<{ id: number; name: string }>(
          "SELECT id, name FROM provinces"
        )
      }
      // Fallback static province data
      return [
        { id: 1, name: "Western Cape" },
        { id: 2, name: "Gauteng" },
        { id: 3, name: "KwaZulu-Natal" },
        { id: 4, name: "Eastern Cape" },
        { id: 5, name: "Free State" },
        { id: 6, name: "Limpopo" },
        { id: 7, name: "Mpumalanga" },
        { id: 8, name: "North West" },
        { id: 9, name: "Northern Cape" },
      ]
    } catch (error) {
      console.error("Error fetching provinces:", error)
      return []
    }
  }

  // =====================================================
  // DISTRICTS
  // =====================================================
  static async getDistricts() {
    try {
      if (process.env.MYSQL_HOST) {
        const { query } = await getMysql()
        return await query<{ id: number; name: string; province_id: number }>(
          "SELECT id, name, province_id FROM districts"
        )
      }
      return [
        { id: 1, name: "Cape Town Metro", province_id: 1 },
        { id: 2, name: "West Coast", province_id: 1 },
        { id: 3, name: "Johannesburg", province_id: 2 },
        { id: 4, name: "Pretoria", province_id: 2 },
        { id: 5, name: "Durban", province_id: 3 },
        { id: 6, name: "Pietermaritzburg", province_id: 3 },
        { id: 7, name: "Port Elizabeth", province_id: 4 },
        { id: 8, name: "East London", province_id: 4 },
        { id: 9, name: "Bloemfontein", province_id: 5 },
        { id: 10, name: "Welkom", province_id: 5 },
      ]
    } catch (error) {
      console.error("Error fetching districts:", error)
      return []
    }
  }

  static async getDistrictsByProvince(provinceId: number | string) {
    try {
      const id = typeof provinceId === "string" ? Number.parseInt(provinceId) : provinceId
      const allDistricts = await this.getDistricts()
      return allDistricts.filter((district) => district.province_id === id)
    } catch (error) {
      console.error("Error fetching districts by province:", error)
      return []
    }
  }

  // =====================================================
  // SCHOOLS
  // =====================================================
  static async getSchools() {
    try {
      if (process.env.MYSQL_HOST) {
        const { query } = await getMysql()
        return await query<{
          id: number
          name: string
          district_id: number
          province_id: number
          is_active: boolean
          students: number
          teachers: number
        }>(
          "SELECT id, name, district_id, province_id, is_active, students, teachers FROM schools"
        )
      }
      return staticData.schools.map((school) => ({
        id: school.id,
        name: school.name,
        district: school.district,
        province: school.province,
        province_id: (school.id % 5) + 1, // Mock province mapping
        district_id: (school.id % 10) + 1, // Mock district mapping
        is_active: school.status === "Active",
        students: school.students,
        teachers: school.teachers,
      }))
    } catch (error) {
      console.error("Error fetching schools:", error)
      return []
    }
  }

  static async getSchoolsByProvince(provinceId: number | string) {
    try {
      const schools = await this.getSchools()
      const id = typeof provinceId === "string" ? Number.parseInt(provinceId) : provinceId
      return schools.filter((school) => school.province_id === id)
    } catch (error) {
      console.error("Error fetching schools by province:", error)
      return []
    }
  }

  static async getSchoolsByDistrict(districtId: number | string) {
    try {
      const schools = await this.getSchools()
      const id = typeof districtId === "string" ? Number.parseInt(districtId) : districtId
      return schools.filter((school) => school.district_id === id)
    } catch (error) {
      console.error("Error fetching schools by district:", error)
      return []
    }
  }

  static async createSchool(school: any) {
    try {
      if (process.env.MYSQL_HOST) {
        const { query } = await getMysql()
        const result = await query<ResultSetHeader>(
          "INSERT INTO schools (name, district_id, province_id, is_active, students, teachers) VALUES (?, ?, ?, ?, ?, ?)",
          [
            school.name,
            school.district_id,
            school.province_id,
            school.is_active ?? true,
            school.students ?? 0,
            school.teachers ?? 0,
          ]
        )
        return { ...school, id: result.insertId }
      }
      // Mock creation - just return the school with an ID
      return { ...school, id: Date.now(), created_at: new Date().toISOString() }
    } catch (error) {
      console.error("Error creating school:", error)
      return null
    }
  }

  // =====================================================
  // USERS
  // =====================================================
  static async getUsers() {
    try {
      if (process.env.MYSQL_HOST) {
        const { query } = await getMysql()
        return await query<{
          id: number
          full_name: string
          email: string | null
          phone: string | null
          role: string
          school_id: number | null
          is_active: number | boolean
          created_at: string
          updated_at: string
        }>(
          "SELECT id, full_name, email, phone, role, school_id, is_active, created_at, updated_at FROM tbl_tarl_users",
        )
      }
      return staticData.users.map((user) => ({
        id: user.id,
        full_name: user.name,
        email: user.email,
        role: user.role,
        school_id: user.role === "teacher" ? user.id : null,
        is_active: user.status === "Active",
        last_login: user.lastLogin,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      }))
    } catch (error) {
      console.error("Error fetching users:", error)
      return []
    }
  }

  static async getUsersBySchool(schoolId: number) {
    try {
      if (process.env.MYSQL_HOST) {
        const { query } = await getMysql()
        return await query<{
          id: number
          full_name: string
          email: string | null
          phone: string | null
          role: string
          school_id: number | null
          is_active: number | boolean
          created_at: string
          updated_at: string
        }>(
          "SELECT id, full_name, email, phone, role, school_id, is_active, created_at, updated_at FROM tbl_tarl_users WHERE school_id = ?",
          [schoolId],
        )
      }
      const users = await this.getUsers()
      return users.filter((user) => user.school_id === schoolId)
    } catch (error) {
      console.error("Error fetching users by school:", error)
      return []
    }
  }

  static async createUser(user: any) {
    try {
      if (process.env.MYSQL_HOST) {
        const { query } = await getMysql()
        const result = await query<ResultSetHeader>(
          "INSERT INTO tbl_tarl_users (full_name, email, phone, role, school_id, province_id, district_id, gender, date_of_birth, years_of_experience, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            user.full_name,
            user.email ?? null,
            user.phone ?? null,
            user.role,
            user.school_id ?? null,
            user.province_id ?? null,
            user.district_id ?? null,
            user.gender ?? null,
            user.date_of_birth ?? null,
            user.years_of_experience ?? null,
            user.is_active ?? true,
          ],
        )
        return { ...user, id: result.insertId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      }
      return { ...user, id: Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    } catch (error) {
      console.error("Error creating user:", error)
      return null
    }
  }

  // =====================================================
  // SURVEYS
  // =====================================================
  static async getSurveys() {
    try {
      return [
        {
          id: 1,
          title: "Teacher Training Effectiveness Survey",
          description: "Evaluate the effectiveness of recent teacher training sessions",
          status: "Active",
          created_at: "2024-01-01T00:00:00Z",
        },
        {
          id: 2,
          title: "School Infrastructure Assessment",
          description: "Assess the current state of school infrastructure",
          status: "Active",
          created_at: "2024-01-15T00:00:00Z",
        },
        {
          id: 3,
          title: "Student Learning Outcomes Survey",
          description: "Measure student learning outcomes and progress",
          status: "Draft",
          created_at: "2024-02-01T00:00:00Z",
        },
      ]
    } catch (error) {
      console.error("Error fetching surveys:", error)
      return []
    }
  }

  static async createSurvey(survey: any) {
    try {
      return { ...survey, id: Date.now(), created_at: new Date().toISOString() }
    } catch (error) {
      console.error("Error creating survey:", error)
      return null
    }
  }

  // =====================================================
  // OBSERVATIONS
  // =====================================================
  static async getObservations(userId?: string) {
    try {
      return staticData.observations.map((obs) => ({
        id: obs.id,
        school_name: obs.school,
        teacher_name: obs.teacher,
        grade: obs.grade,
        subject: obs.subject,
        visit_date: obs.date,
        status: obs.status,
        students_present: obs.studentsPresent,
        created_by_user_id: userId || "1",
        created_at: obs.date + "T10:00:00Z",
      }))
    } catch (error) {
      console.error("Error fetching observations:", error)
      return []
    }
  }

  static async getObservationById(id: number) {
    try {
      const observations = await this.getObservations()
      return observations.find((obs) => obs.id === id) || null
    } catch (error) {
      console.error("Error fetching observation by id:", error)
      return null
    }
  }

  static async getObservationActivities(observationId: number) {
    try {
      // Mock observation activities
      return [
        {
          id: 1,
          observation_id: observationId,
          activity_number: 1,
          activity_name: "Reading Assessment",
          students_assessed: 25,
          activity_notes: "Students showed good comprehension skills",
        },
        {
          id: 2,
          observation_id: observationId,
          activity_number: 2,
          activity_name: "Math Problem Solving",
          students_assessed: 23,
          activity_notes: "Need more practice with word problems",
        },
      ]
    } catch (error) {
      console.error("Error fetching observation activities:", error)
      return []
    }
  }

  static async getObservationStats(userId?: string) {
    try {
      return {
        total_observations: 45,
        observations_this_month: 12,
        unique_schools: 8,
        avg_students_per_class: 28,
      }
    } catch (error) {
      console.error("Error fetching observation stats:", error)
      return {
        total_observations: 0,
        observations_this_month: 0,
        unique_schools: 0,
        avg_students_per_class: 0,
      }
    }
  }

  // =====================================================
  // LEARNING PROGRESS
  // =====================================================
  static async getLearningProgressSummary(filters: any = {}) {
    try {
      return staticData.students.map((student) => ({
        id: student.id,
        student_name: student.name,
        grade: student.grade,
        school_name: student.school,
        math_level: student.mathLevel,
        reading_level: student.readingLevel,
        progress_percentage: student.progress,
        last_assessment: "2024-12-01",
        province_id: 1,
        district_id: 1,
        school_id: 1,
        subject_code: "MATH",
      }))
    } catch (error) {
      console.error("Error fetching learning progress summary:", error)
      return []
    }
  }

  static async getStudents() {
    try {
      return staticData.students.map((student) => ({
        id: student.id,
        student_name: student.name,
        grade: student.grade,
        school_id: 1,
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        tbl_tarl_schools: {
          name: student.school,
          province_id: 1,
          district_id: 1,
        },
      }))
    } catch (error) {
      console.error("Error fetching students:", error)
      return []
    }
  }

  static async createStudent(student: any) {
    try {
      return { ...student, id: Date.now(), created_at: new Date().toISOString() }
    } catch (error) {
      console.error("Error creating student:", error)
      return null
    }
  }

  static async getSubjects() {
    try {
      return [
        { id: 1, subject_code: "MATH", subject_name_en: "Mathematics", is_active: true },
        { id: 2, subject_code: "READ", subject_name_en: "Reading", is_active: true },
        { id: 3, subject_code: "WRITE", subject_name_en: "Writing", is_active: true },
      ]
    } catch (error) {
      console.error("Error fetching subjects:", error)
      return []
    }
  }

  // =====================================================
  // TRAINING
  // =====================================================
  static async getTrainingFeedback() {
    try {
      return [
        {
          id: 1,
          training_title: "TaRL Methodology Workshop",
          trainer_name: "Dr. Sarah Johnson",
          feedback_rating: 4.5,
          feedback_comments: "Very informative and practical",
          training_date: "2024-11-15",
          created_at: "2024-11-16T00:00:00Z",
        },
        {
          id: 2,
          training_title: "Assessment Techniques",
          trainer_name: "Prof. Michael Chen",
          feedback_rating: 4.2,
          feedback_comments: "Good examples and hands-on practice",
          training_date: "2024-11-20",
          created_at: "2024-11-21T00:00:00Z",
        },
      ]
    } catch (error) {
      console.error("Error fetching training feedback:", error)
      return []
    }
  }

  static async createTrainingFeedback(feedback: any) {
    try {
      return { ...feedback, id: Date.now(), created_at: new Date().toISOString() }
    } catch (error) {
      console.error("Error creating training feedback:", error)
      return null
    }
  }

  // =====================================================
  // ANALYTICS
  // =====================================================
  static async getSurveyAnalytics() {
    try {
      return [
        {
          survey_id: 1,
          survey_title: "Teacher Training Effectiveness Survey",
          survey_type: "Training",
          status: "Active",
          total_responses: 45,
          completed_responses: 38,
          survey_created_at: "2024-01-01T00:00:00Z",
          avg_completion_time_minutes: 12,
        },
        {
          survey_id: 2,
          survey_title: "School Infrastructure Assessment",
          survey_type: "Infrastructure",
          status: "Active",
          total_responses: 28,
          completed_responses: 25,
          survey_created_at: "2024-01-15T00:00:00Z",
          avg_completion_time_minutes: 18,
        },
      ]
    } catch (error) {
      console.error("Error fetching survey analytics:", error)
      return []
    }
  }

  static async getDashboardStats(filters: any = {}) {
    try {
      return {
        total_schools: 1247,
        total_teachers: 8934,
        total_students: 156789,
        active_observations: 342,
        completed_surveys: 1205,
        training_sessions: 89,
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      return {
        total_schools: 0,
        total_teachers: 0,
        total_students: 0,
        active_observations: 0,
        completed_surveys: 0,
        training_sessions: 0,
      }
    }
  }

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================
  static async getSchoolsWithDetails() {
    try {
      return await this.getSchools()
    } catch (error) {
      console.error("Error fetching schools with details:", error)
      return []
    }
  }

  static async getUsersWithDetails() {
    try {
      return await this.getUsers()
    } catch (error) {
      console.error("Error fetching users with details:", error)
      return []
    }
  }

  static async checkTablesExist(tableNames?: string[]) {
    try {
      // Always return true for static data
      return true
    } catch (error) {
      console.log("Using static data mode")
      return true
    }
  }

  // =====================================================
  // SURVEY RESPONSES
  // =====================================================
  static async getSurveyResponses(surveyId?: number) {
    try {
      return [
        {
          id: 1,
          survey_id: surveyId || 1,
          respondent_name: "John Doe",
          respondent_email: "john@example.com",
          responses: { q1: "Excellent", q2: "Good", q3: "Very satisfied" },
          is_complete: true,
          started_at: "2024-12-01T10:00:00Z",
          completed_at: "2024-12-01T10:15:00Z",
          created_at: "2024-12-01T10:00:00Z",
        },
      ]
    } catch (error) {
      console.error("Error fetching survey responses:", error)
      return []
    }
  }

  static async createSurveyResponse(response: any) {
    try {
      return {
        ...response,
        id: Date.now(),
        started_at: new Date().toISOString(),
        completed_at: response.is_complete ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
      }
    } catch (error) {
      console.error("Error creating survey response:", error)
      return null
    }
  }
}
