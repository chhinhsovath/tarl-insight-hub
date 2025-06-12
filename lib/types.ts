// =====================================================
// SIMPLIFIED TARL TYPES
// =====================================================

export interface Province {
  id: number
  name: string
  name_kh?: string
  code?: string
  created_at: string
  updated_at: string
}

export interface District {
  id: number
  name: string
  name_kh?: string
  code?: string
  province_id: number
  created_at: string
  updated_at: string
}

export interface School {
  id: number
  name: string
  name_kh?: string
  code?: string
  province_id: number
  district_id: number
  address?: string
  contact_person?: string
  phone?: string
  email?: string
  director_name?: string
  total_students: number
  total_teachers: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: number
  full_name: string
  email?: string
  phone?: string
  role: "Teacher" | "Coordinator" | "Admin" | "Staff"
  school_id?: number
  province_id?: number
  district_id?: number
  gender?: "Male" | "Female" | "Other"
  date_of_birth?: string
  years_of_experience?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Survey {
  id: number
  title: string
  description?: string
  status: "Draft" | "Active" | "Completed" | "Archived"
  survey_type: "General" | "Pre-Training" | "Post-Training" | "Follow-up"
  target_audience: "Teachers" | "Students" | "Parents" | "Coordinators" | "All"
  created_by?: number
  start_date?: string
  end_date?: string
  is_anonymous: boolean
  created_at: string
  updated_at: string
}

export interface SurveyResponse {
  id: number
  survey_id: number
  respondent_id?: number
  school_id?: number
  respondent_name?: string
  respondent_role?: string
  responses: any
  metadata?: any
  geolocation?: any
  photos?: any
  device_info?: any
  is_complete: boolean
  offline_collected: boolean
  sync_status: "Pending" | "Synced" | "Failed"
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface TrainingFeedback {
  id: number
  training_title?: string
  training_date?: string
  training_location?: string
  respondent_id?: number
  respondent_name?: string
  respondent_role?: string
  school_id?: number
  overall_rating?: number
  content_quality_rating?: number
  trainer_effectiveness_rating?: number
  venue_rating?: number
  materials_rating?: number
  objectives_met?: boolean
  will_apply_learning?: boolean
  will_recommend_training?: boolean
  would_attend_future_training?: boolean
  training_duration_appropriate?: boolean
  materials_helpful?: boolean
  pace_appropriate?: boolean
  previous_tarl_training?: boolean
  most_valuable_aspect?: string
  least_valuable_aspect?: string
  additional_topics_needed?: string
  suggestions_for_improvement?: string
  challenges_implementing?: string
  additional_comments?: string
  years_of_experience?: number
  subjects_taught?: string
  grade_levels_taught?: string
  created_at: string
  updated_at: string
}

// Analytics Types
export interface SurveyAnalytics {
  survey_id: number
  survey_title: string
  status: string
  survey_type: string
  target_audience: string
  total_responses: number
  completed_responses: number
  offline_responses: number
  unique_respondents: number
  schools_covered: number
  responses_with_location: number
  responses_with_photos: number
  avg_completion_time_minutes: number
  last_response_at: string
  survey_created_at: string
}

export interface DashboardStats {
  total_schools: number
  total_users: number
  total_surveys: number
  total_responses: number
  completed_responses: number
  completion_rate: number
  total_feedback: number
  avg_rating: number
  unique_respondents: number
  offline_responses: number
}

// Form Types
export interface SurveyResponseForm {
  survey_id: number
  respondent_id?: number
  school_id?: number
  respondent_name: string
  respondent_role: string
  responses: Record<string, any>
  is_complete: boolean
  offline_collected?: boolean
}

export interface TrainingFeedbackForm {
  training_title: string
  training_date: string
  training_location: string
  respondent_id?: number
  respondent_name: string
  respondent_role: string
  school_id?: number
  overall_rating: number
  content_quality_rating: number
  trainer_effectiveness_rating: number
  venue_rating: number
  materials_rating: number
  objectives_met: boolean
  will_apply_learning: boolean
  will_recommend_training: boolean
  would_attend_future_training: boolean
  training_duration_appropriate: boolean
  materials_helpful: boolean
  pace_appropriate: boolean
  previous_tarl_training: boolean
  most_valuable_aspect?: string
  least_valuable_aspect?: string
  additional_topics_needed?: string
  suggestions_for_improvement?: string
  challenges_implementing?: string
  additional_comments?: string
  years_of_experience?: number
  subjects_taught?: string
  grade_levels_taught?: string
}
