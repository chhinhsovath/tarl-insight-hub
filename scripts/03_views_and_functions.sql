-- =====================================================
-- VIEWS FOR ANALYTICS AND REPORTING
-- =====================================================

-- Survey Analytics View
CREATE OR REPLACE VIEW vw_survey_analytics AS
SELECT 
    s.id as survey_id,
    s.title as survey_title,
    s.status,
    s.survey_type,
    s.target_audience,
    COUNT(sr.id) as total_responses,
    COUNT(CASE WHEN sr.is_complete THEN 1 END) as completed_responses,
    COUNT(CASE WHEN sr.offline_collected THEN 1 END) as offline_responses,
    COUNT(DISTINCT sr.respondent_id) as unique_respondents,
    COUNT(DISTINCT sr.school_id) as schools_covered,
    COUNT(CASE WHEN sr.geolocation IS NOT NULL THEN 1 END) as responses_with_location,
    COUNT(CASE WHEN sr.photos IS NOT NULL THEN 1 END) as responses_with_photos,
    COALESCE(AVG(EXTRACT(EPOCH FROM (sr.completed_at - sr.started_at))/60), 0) as avg_completion_time_minutes,
    MAX(sr.created_at) as last_response_at,
    s.created_at as survey_created_at
FROM tbl_tarl_surveys s
LEFT JOIN tbl_tarl_survey_responses sr ON s.id = sr.survey_id
GROUP BY s.id, s.title, s.status, s.survey_type, s.target_audience, s.created_at;

-- Training Analytics View
CREATE OR REPLACE VIEW vw_training_analytics AS
SELECT 
    tf.training_title,
    tf.training_date,
    tf.training_location,
    COUNT(*) as total_participants,
    COUNT(*) as feedback_responses,
    ROUND(AVG(tf.overall_rating), 2) as avg_overall_rating,
    ROUND(AVG(tf.content_quality_rating), 2) as avg_content_rating,
    ROUND(AVG(tf.trainer_effectiveness_rating), 2) as avg_trainer_rating,
    ROUND(AVG(tf.venue_rating), 2) as avg_venue_rating,
    ROUND(AVG(tf.materials_rating), 2) as avg_materials_rating,
    ROUND((COUNT(CASE WHEN tf.will_recommend_training THEN 1 END)::DECIMAL / COUNT(*)) * 100, 1) as recommendation_rate,
    ROUND((COUNT(CASE WHEN tf.will_apply_learning THEN 1 END)::DECIMAL / COUNT(*)) * 100, 1) as will_apply_rate,
    ROUND((COUNT(CASE WHEN tf.objectives_met THEN 1 END)::DECIMAL / COUNT(*)) * 100, 1) as objectives_met_rate
FROM tbl_tarl_training_feedback tf
GROUP BY tf.training_title, tf.training_date, tf.training_location;

-- School Summary View
CREATE OR REPLACE VIEW vw_school_summary AS
SELECT 
    s.id,
    s.name,
    s.code,
    p.name as province_name,
    d.name as district_name,
    s.contact_person,
    s.phone,
    s.email,
    s.total_students,
    s.total_teachers,
    COUNT(DISTINCT u.id) as tarl_users_count,
    COUNT(DISTINCT sr.id) as survey_responses_count,
    COUNT(DISTINCT tf.id) as training_feedback_count,
    s.is_active,
    s.created_at
FROM tbl_tarl_schools s
LEFT JOIN tbl_tarl_provinces p ON s.province_id = p.id
LEFT JOIN tbl_tarl_districts d ON s.district_id = d.id
LEFT JOIN tbl_tarl_users u ON s.id = u.school_id
LEFT JOIN tbl_tarl_survey_responses sr ON s.id = sr.school_id
LEFT JOIN tbl_tarl_training_feedback tf ON s.id = tf.school_id
GROUP BY s.id, s.name, s.code, p.name, d.name, s.contact_person, s.phone, s.email, s.total_students, s.total_teachers, s.is_active, s.created_at;

-- User Summary View
CREATE OR REPLACE VIEW vw_user_summary AS
SELECT 
    u.id,
    u.full_name,
    u.email,
    u.phone,
    u.role,
    u.gender,
    u.years_of_experience,
    s.name as school_name,
    p.name as province_name,
    d.name as district_name,
    COUNT(DISTINCT sr.id) as survey_responses_count,
    COUNT(DISTINCT tf.id) as training_feedback_count,
    u.is_active,
    u.created_at
FROM tbl_tarl_users u
LEFT JOIN tbl_tarl_schools s ON u.school_id = s.id
LEFT JOIN tbl_tarl_provinces p ON u.province_id = p.id
LEFT JOIN tbl_tarl_districts d ON u.district_id = d.id
LEFT JOIN tbl_tarl_survey_responses sr ON u.id = sr.respondent_id
LEFT JOIN tbl_tarl_training_feedback tf ON u.id = tf.respondent_id
GROUP BY u.id, u.full_name, u.email, u.phone, u.role, u.gender, u.years_of_experience, s.name, p.name, d.name, u.is_active, u.created_at;

-- =====================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- =====================================================

-- Function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats(
    p_province_id INTEGER DEFAULT NULL,
    p_district_id INTEGER DEFAULT NULL,
    p_school_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
    total_schools INTEGER,
    total_users INTEGER,
    total_surveys INTEGER,
    total_responses INTEGER,
    completed_responses INTEGER,
    completion_rate DECIMAL,
    total_feedback INTEGER,
    avg_rating DECIMAL,
    unique_respondents INTEGER,
    offline_responses INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM tbl_tarl_schools 
         WHERE is_active = true 
         AND (p_province_id IS NULL OR province_id = p_province_id)
         AND (p_district_id IS NULL OR district_id = p_district_id)
         AND (p_school_id IS NULL OR id = p_school_id)) as total_schools,
        
        (SELECT COUNT(*)::INTEGER FROM tbl_tarl_users 
         WHERE is_active = true 
         AND (p_province_id IS NULL OR province_id = p_province_id)
         AND (p_district_id IS NULL OR district_id = p_district_id)
         AND (p_school_id IS NULL OR school_id = p_school_id)) as total_users,
        
        (SELECT COUNT(*)::INTEGER FROM tbl_tarl_surveys) as total_surveys,
        
        (SELECT COUNT(*)::INTEGER FROM tbl_tarl_survey_responses sr
         WHERE (p_school_id IS NULL OR sr.school_id = p_school_id)
         AND (p_province_id IS NULL OR sr.school_id IN (
             SELECT id FROM tbl_tarl_schools WHERE province_id = p_province_id
         ))
         AND (p_district_id IS NULL OR sr.school_id IN (
             SELECT id FROM tbl_tarl_schools WHERE district_id = p_district_id
         ))) as total_responses,
        
        (SELECT COUNT(*)::INTEGER FROM tbl_tarl_survey_responses sr
         WHERE is_complete = true
         AND (p_school_id IS NULL OR sr.school_id = p_school_id)
         AND (p_province_id IS NULL OR sr.school_id IN (
             SELECT id FROM tbl_tarl_schools WHERE province_id = p_province_id
         ))
         AND (p_district_id IS NULL OR sr.school_id IN (
             SELECT id FROM tbl_tarl_schools WHERE district_id = p_district_id
         ))) as completed_responses,
        
        CASE 
            WHEN (SELECT COUNT(*) FROM tbl_tarl_survey_responses sr
                  WHERE (p_school_id IS NULL OR sr.school_id = p_school_id)) > 0
            THEN ROUND(
                (SELECT COUNT(*)::DECIMAL FROM tbl_tarl_survey_responses sr
                 WHERE is_complete = true
                 AND (p_school_id IS NULL OR sr.school_id = p_school_id)) /
                (SELECT COUNT(*)::DECIMAL FROM tbl_tarl_survey_responses sr
                 WHERE (p_school_id IS NULL OR sr.school_id = p_school_id)) * 100, 2)
            ELSE 0
        END as completion_rate,
        
        (SELECT COUNT(*)::INTEGER FROM tbl_tarl_training_feedback tf
         WHERE (p_school_id IS NULL OR tf.school_id = p_school_id)
         AND (p_province_id IS NULL OR tf.school_id IN (
             SELECT id FROM tbl_tarl_schools WHERE province_id = p_province_id
         ))
         AND (p_district_id IS NULL OR tf.school_id IN (
             SELECT id FROM tbl_tarl_schools WHERE district_id = p_district_id
         ))) as total_feedback,
        
        COALESCE((SELECT ROUND(AVG(overall_rating), 2) FROM tbl_tarl_training_feedback tf
                  WHERE overall_rating IS NOT NULL
                  AND (p_school_id IS NULL OR tf.school_id = p_school_id)), 0) as avg_rating,
        
        (SELECT COUNT(DISTINCT respondent_id)::INTEGER FROM tbl_tarl_survey_responses sr
         WHERE respondent_id IS NOT NULL
         AND (p_school_id IS NULL OR sr.school_id = p_school_id)) as unique_respondents,
        
        (SELECT COUNT(*)::INTEGER FROM tbl_tarl_survey_responses sr
         WHERE offline_collected = true
         AND (p_school_id IS NULL OR sr.school_id = p_school_id)) as offline_responses;
END;
$$ LANGUAGE plpgsql;
