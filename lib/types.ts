// =====================================================
// SIMPLIFIED TARL TYPES
// =====================================================

export interface Province {
  id: number
  name: string
  name_kh?: string
  code?: string
  country_id: number
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
  code?: string
  status?: number
  image?: string
  createdAt: string
  updatedAt: string
  zoneName?: string
  provinceName?: string
  districtName?: string
  totalStudents?: number
  totalTeachers?: number
  totalTeachersFemale?: number
  totalStudentsFemale?: number
}

export interface User {
  id: number
  full_name: string
  email?: string
  phone?: string | null
  role: "Admin" | "Teacher" | "Coordinator" | "Staff" // Updated to match auth context
  school_id?: number | null // Added null to allow null values
  province_id?: number
  district_id?: number
  gender?: "Male" | "Female" | "Other"
  date_of_birth?: string
  years_of_experience?: number
  is_active: boolean
  position?: string
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
  training_id: string
  training_title?: string
  training_date?: string
  training_location?: string
  respondent_id?: number
  respondent_name?: string
  respondent_role?: string
  respondent_type: string
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

// Observation Types
export interface ObservationResponse {
  id: number
  visit_date: string
  region: string
  province: string
  mentor_name: string
  school_name: string
  program_type_id: number | null
  tarl_class_taking_place: string
  tarl_class_not_taking_place_reason?: string
  tarl_class_not_taking_place_other_reason?: string
  teacher_name: string
  observed_full_session: string
  grade_group: string
  grades_observed: string[]
  subject_observed: string
  total_class_strength: number | null
  students_present: number | null
  students_progressed_since_last_week: number | null
  class_started_on_time: string
  class_not_on_time_reason?: string
  class_not_on_time_other_reason?: string
  transition_time_between_subjects: number | null
  children_grouped_appropriately: string
  students_fully_involved: string
  teacher_had_session_plan: string
  teacher_no_session_plan_reason?: string
  teacher_followed_session_plan: string
  teacher_not_follow_plan_reason?: string
  session_plan_appropriate_for_level: string
  number_of_activities: string
  suggestions_to_teacher: string
  created_by: number
  created_at: string
  updated_at: string
}

export interface ObservationActivity {
  id: number
  observation_id: number
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
  created_at: string
  updated_at: string
}

export interface ProgramType {
  id: number
  program_type: string
  created_at: string
}

export interface TarlLevel {
  id: number
  level_name: string
  subject: string
  level_order: number
  created_at: string
}

export interface ActivityType {
  id: number
  activity_name: string
  subject: string
  description: string
  created_at: string
}

export interface Material {
  id: number
  material_name: string
  description: string
  created_at: string
}

// Remove the TarlSurveyResponse interface if it exists and replace with ObservationResponse
export type TarlSurveyResponse = ObservationResponse

// New interfaces for Country, Commune, Village
export interface Country {
  id: number;
  code: string;
  name_kh: string;
  name_en: string;
  created_at: string;
  updated_at: string;
}

export interface Commune {
  id: number;
  code?: string;
  name_kh: string;
  name_en: string;
  district_id: number;
  created_at: string;
  updated_at: string;
}

export interface Village {
  id: number;
  code?: string;
  name_kh: string;
  name_en: string;
  commune_id: number;
  created_at: string;
  updated_at: string;
}

// =====================================================
// PERMISSION SYSTEM TYPES
// =====================================================

export interface Role {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface Page {
  id: number;
  name: string;
  path: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: number;
  role_id: number;
  page_id: number;
  can_access: boolean;
  created_at: string;
  updated_at: string;
  role?: Role;
  page?: Page;
}

export interface PermissionAudit {
  id: number;
  role_id: number;
  page_id: number;
  action: 'granted' | 'revoked' | 'created' | 'deleted';
  previous_value?: boolean;
  new_value?: boolean;
  changed_by: number;
  created_at: string;
  role?: Role;
  page?: Page;
  changed_by_user?: User;
}

export interface PermissionMatrix {
  roleId: number;
  roleName: string;
  permissions: {
    [pageId: number]: {
      pageId: number;
      pageName: string;
      pagePath: string;
      canAccess: boolean;
    };
  };
}

export interface BulkPermissionUpdate {
  roleId: number;
  permissions: {
    pageId: number;
    canAccess: boolean;
  }[];
}
