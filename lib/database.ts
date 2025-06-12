import { supabase } from "./supabase"
import type {
  Province,
  District,
  School,
  User,
  Survey,
  SurveyResponse,
  TrainingFeedback,
  SurveyAnalytics,
  DashboardStats,
  SurveyResponseForm,
  TrainingFeedbackForm,
  ObservationResponse,
  ObservationActivity,
} from "./types"

export class DatabaseService {
  // =====================================================
  // PROVINCES
  // =====================================================
  static async getProvinces(): Promise<Province[]> {
    try {
      const { data, error } = await supabase.from("tbl_tarl_provinces").select("*").order("name")

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching provinces:", error)
      return []
    }
  }

  // =====================================================
  // DISTRICTS
  // =====================================================
  static async getDistricts(): Promise<District[]> {
    try {
      const { data, error } = await supabase.from("tbl_tarl_districts").select("*").order("name")

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching districts:", error)
      return []
    }
  }

  static async getDistrictsByProvince(provinceId: number | string): Promise<District[]> {
    try {
      const id = typeof provinceId === "string" ? Number.parseInt(provinceId) : provinceId
      const { data, error } = await supabase.from("tbl_tarl_districts").select("*").eq("province_id", id).order("name")

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching districts by province:", error)
      return []
    }
  }

  // =====================================================
  // SCHOOLS
  // =====================================================
  static async getSchools(): Promise<School[]> {
    try {
      const { data, error } = await supabase.from("tbl_tarl_schools").select("*").eq("is_active", true).order("name")

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching schools:", error)
      return []
    }
  }

  static async getSchoolsByProvince(provinceId: number | string): Promise<School[]> {
    try {
      const id = typeof provinceId === "string" ? Number.parseInt(provinceId) : provinceId
      const { data, error } = await supabase
        .from("tbl_tarl_schools")
        .select("*")
        .eq("province_id", id)
        .eq("is_active", true)
        .order("name")

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching schools by province:", error)
      return []
    }
  }

  static async getSchoolsByDistrict(districtId: number | string): Promise<School[]> {
    try {
      const id = typeof districtId === "string" ? Number.parseInt(districtId) : districtId
      const { data, error } = await supabase
        .from("tbl_tarl_schools")
        .select("*")
        .eq("district_id", id)
        .eq("is_active", true)
        .order("name")

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching schools by district:", error)
      return []
    }
  }

  static async createSchool(school: Omit<School, "id" | "created_at" | "updated_at">): Promise<School | null> {
    try {
      const { data, error } = await supabase.from("tbl_tarl_schools").insert([school]).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error creating school:", error)
      return null
    }
  }

  // =====================================================
  // USERS
  // =====================================================
  static async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase.from("tbl_tarl_users").select("*").eq("is_active", true).order("full_name")

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching users:", error)
      return []
    }
  }

  static async getUsersBySchool(schoolId: number): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from("tbl_tarl_users")
        .select("*")
        .eq("school_id", schoolId)
        .eq("is_active", true)
        .order("full_name")

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching users by school:", error)
      return []
    }
  }

  static async createUser(user: Omit<User, "id" | "created_at" | "updated_at">): Promise<User | null> {
    try {
      const { data, error } = await supabase.from("tbl_tarl_users").insert([user]).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error creating user:", error)
      return null
    }
  }

  // =====================================================
  // SURVEYS
  // =====================================================
  static async getSurveys(): Promise<Survey[]> {
    try {
      const { data, error } = await supabase
        .from("tbl_tarl_surveys")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching surveys:", error)
      return []
    }
  }

  static async createSurvey(survey: Omit<Survey, "id" | "created_at" | "updated_at">): Promise<Survey | null> {
    try {
      const { data, error } = await supabase.from("tbl_tarl_surveys").insert([survey]).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error creating survey:", error)
      return null
    }
  }

  // =====================================================
  // SURVEY RESPONSES
  // =====================================================
  static async getSurveyResponses(surveyId?: number): Promise<SurveyResponse[]> {
    try {
      let query = supabase.from("tbl_tarl_survey_responses").select("*").order("created_at", { ascending: false })

      if (surveyId) {
        query = query.eq("survey_id", surveyId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching survey responses:", error)
      return []
    }
  }

  static async createSurveyResponse(response: SurveyResponseForm): Promise<SurveyResponse | null> {
    try {
      const { data, error } = await supabase
        .from("tbl_tarl_survey_responses")
        .insert([
          {
            ...response,
            started_at: new Date().toISOString(),
            completed_at: response.is_complete ? new Date().toISOString() : null,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error creating survey response:", error)
      return null
    }
  }

  // =====================================================
  // TRAINING FEEDBACK
  // =====================================================
  static async getTrainingFeedback(): Promise<TrainingFeedback[]> {
    try {
      const { data, error } = await supabase
        .from("tbl_tarl_training_feedback")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching training feedback:", error)
      return []
    }
  }

  static async createTrainingFeedback(feedback: TrainingFeedbackForm): Promise<TrainingFeedback | null> {
    try {
      const { data, error } = await supabase.from("tbl_tarl_training_feedback").insert([feedback]).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error creating training feedback:", error)
      return null
    }
  }

  // =====================================================
  // LEARNING PROGRESS
  // =====================================================
  static async getLearningProgressSummary(
    filters: {
      provinceId?: number
      districtId?: number
      schoolId?: number
      subjectCode?: string
    } = [],
  ): Promise<any[]> {
    try {
      let query = supabase.from("tbl_tarl_learning_progress_summary").select(`
          *,
          tbl_tarl_schools!inner(name, province_id, district_id),
          tbl_tarl_subjects!inner(subject_name_en, subject_name_kh)
        `)

      if (filters.provinceId) {
        query = query.eq("province_id", filters.provinceId)
      }
      if (filters.districtId) {
        query = query.eq("district_id", filters.districtId)
      }
      if (filters.schoolId) {
        query = query.eq("school_id", filters.schoolId)
      }
      if (filters.subjectCode) {
        query = query.eq("subject_code", filters.subjectCode)
      }

      const { data, error } = await query.order("student_name")

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching learning progress summary:", error)
      return []
    }
  }

  static async getStudents(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("tbl_tarl_students")
        .select(`
          *,
          tbl_tarl_schools!inner(name, province_id, district_id)
        `)
        .eq("is_active", true)
        .order("student_name")

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching students:", error)
      return []
    }
  }

  static async createStudent(student: any): Promise<any | null> {
    try {
      const { data, error } = await supabase.from("tbl_tarl_students").insert([student]).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error creating student:", error)
      return null
    }
  }

  static async getSubjects(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("tbl_tarl_subjects")
        .select("*")
        .eq("is_active", true)
        .order("subject_name_en")

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching subjects:", error)
      return []
    }
  }

  // =====================================================
  // ANALYTICS
  // =====================================================
  static async getSurveyAnalytics(): Promise<SurveyAnalytics[]> {
    try {
      const { data, error } = await supabase
        .from("vw_survey_analytics")
        .select("*")
        .order("survey_created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching survey analytics:", error)
      return []
    }
  }

  static async getDashboardStats(
    filters: {
      provinceId?: number
      districtId?: number
      schoolId?: number
    } = {},
  ): Promise<DashboardStats> {
    try {
      const { data, error } = await supabase.rpc("get_dashboard_stats", {
        p_province_id: filters.provinceId || null,
        p_district_id: filters.districtId || null,
        p_school_id: filters.schoolId || null,
      })

      if (error) throw error

      return (
        data?.[0] || {
          total_schools: 0,
          total_users: 0,
          total_surveys: 0,
          total_responses: 0,
          completed_responses: 0,
          completion_rate: 0,
          total_feedback: 0,
          avg_rating: 0,
          unique_respondents: 0,
          offline_responses: 0,
        }
      )
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      return {
        total_schools: 0,
        total_users: 0,
        total_surveys: 0,
        total_responses: 0,
        completed_responses: 0,
        completion_rate: 0,
        total_feedback: 0,
        avg_rating: 0,
        unique_respondents: 0,
        offline_responses: 0,
      }
    }
  }

  // =====================================================
  // OBSERVATIONS
  // =====================================================
  static async getObservations(userId?: string): Promise<ObservationResponse[]> {
    try {
      let query = supabase.from("tbl_tarl_observation_responses").select("*").order("visit_date", { ascending: false })

      if (userId) {
        query = query.eq("created_by_user_id", userId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching observations:", error)
      return []
    }
  }

  static async getObservationById(id: number): Promise<ObservationResponse | null> {
    try {
      const { data, error } = await supabase.from("tbl_tarl_observation_responses").select("*").eq("id", id).single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error fetching observation by id:", error)
      return null
    }
  }

  static async getObservationActivities(observationId: number): Promise<ObservationActivity[]> {
    try {
      const { data, error } = await supabase
        .from("tbl_tarl_observation_activities")
        .select("*")
        .eq("observation_id", observationId)
        .order("activity_number")

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching observation activities:", error)
      return []
    }
  }

  static async getObservationStats(userId?: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc("get_observation_stats", {
        user_id: userId || null,
      })

      if (error) throw error
      return (
        data?.[0] || {
          total_observations: 0,
          observations_this_month: 0,
          unique_schools: 0,
          avg_students_per_class: 0,
        }
      )
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
  // UTILITY FUNCTIONS
  // =====================================================
  static async getSchoolsWithDetails(): Promise<any[]> {
    try {
      const { data, error } = await supabase.from("vw_school_summary").select("*").order("name")

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching schools with details:", error)
      return []
    }
  }

  static async getUsersWithDetails(): Promise<any[]> {
    try {
      const { data, error } = await supabase.from("vw_user_summary").select("*").order("full_name")

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error fetching users with details:", error)
      return []
    }
  }

  // Check if database tables exist
  static async checkTablesExist(tableNames: string[]): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .in("table_name", tableNames)

      if (error) throw error
      return data && data.length === tableNames.length
    } catch (error) {
      console.error("Error checking if tables exist:", error)
      return false
    }
  }
}
