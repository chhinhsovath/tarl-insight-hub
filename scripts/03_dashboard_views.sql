-- =====================================================
-- DASHBOARD VIEWS AND SUPPORTING QUERIES
-- For Learning Progress and Learning Results Dashboards
-- =====================================================

-- =====================================================
-- LEARNING PROGRESS DASHBOARD VIEWS
-- =====================================================

-- 1. Total Studied Hours by Subject (with filters)
CREATE OR REPLACE VIEW learning_progress_hours AS
SELECT 
    s.student_id,
    s.student_name,
    sch.school_id,
    sch.school_name,
    sch.cluster_id,
    sch.district_id,
    sch.province_id,
    sht.subject,
    SUM(sht.duration_minutes) / 60.0 as total_hours_studied,
    subj.target_hours_per_subject,
    ROUND((SUM(sht.duration_minutes) / 60.0 / subj.target_hours_per_subject) * 100, 2) as progress_percentage,
    COUNT(DISTINCT sht.session_date) as total_study_sessions,
    MIN(sht.session_date) as first_study_date,
    MAX(sht.session_date) as last_study_date
FROM study_hours_tracking sht
JOIN students s ON sht.student_id = s.student_id
JOIN student_enrollments se ON s.student_id = se.student_id AND sht.subject = se.subject
JOIN schools sch ON se.school_id = sch.school_id
JOIN subjects subj ON (
    (sht.subject = 'Math' AND subj.subject_code = 'MATH') OR 
    (sht.subject = 'Khmer' AND subj.subject_code = 'KHMER')
)
WHERE se.status = 'Active'
GROUP BY s.student_id, sht.subject, sch.school_id, sch.cluster_id, sch.district_id, sch.province_id, subj.target_hours_per_subject;

-- 2. Number of Learning Tasks (with completion status)
CREATE OR REPLACE VIEW learning_progress_tasks AS
SELECT 
    s.student_id,
    s.student_name,
    sch.school_id,
    sch.school_name,
    sch.cluster_id,
    sch.district_id,
    sch.province_id,
    lt.subject,
    COUNT(*) as total_tasks_assigned,
    SUM(CASE WHEN lt.completion_status = 'Completed' THEN 1 ELSE 0 END) as tasks_completed,
    SUM(CASE WHEN lt.completion_status = 'In Progress' THEN 1 ELSE 0 END) as tasks_in_progress,
    SUM(CASE WHEN lt.completion_status = 'Overdue' THEN 1 ELSE 0 END) as tasks_overdue,
    ROUND((SUM(CASE WHEN lt.completion_status = 'Completed' THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 2) as completion_percentage
FROM learning_tasks lt
JOIN students s ON lt.student_id = s.student_id
JOIN student_enrollments se ON s.student_id = se.student_id AND lt.subject = se.subject
JOIN schools sch ON se.school_id = sch.school_id
WHERE se.status = 'Active'
GROUP BY s.student_id, lt.subject, sch.school_id, sch.cluster_id, sch.district_id, sch.province_id;

-- 3. Combined Learning Progress Summary
CREATE OR REPLACE VIEW learning_progress_summary AS
SELECT 
    COALESCE(lph.student_id, lpt.student_id) as student_id,
    COALESCE(lph.student_name, lpt.student_name) as student_name,
    COALESCE(lph.school_id, lpt.school_id) as school_id,
    COALESCE(lph.school_name, lpt.school_name) as school_name,
    COALESCE(lph.cluster_id, lpt.cluster_id) as cluster_id,
    COALESCE(lph.district_id, lpt.district_id) as district_id,
    COALESCE(lph.province_id, lpt.province_id) as province_id,
    COALESCE(lph.subject, lpt.subject) as subject,
    COALESCE(lph.total_hours_studied, 0) as total_hours_studied,
    lph.target_hours_per_subject,
    COALESCE(lph.progress_percentage, 0) as hours_progress_percentage,
    COALESCE(lph.total_study_sessions, 0) as total_study_sessions,
    COALESCE(lpt.total_tasks_assigned, 0) as total_tasks_assigned,
    COALESCE(lpt.tasks_completed, 0) as tasks_completed,
    COALESCE(lpt.completion_percentage, 0) as task_completion_percentage
FROM learning_progress_hours lph
FULL OUTER JOIN learning_progress_tasks lpt ON 
    lph.student_id = lpt.student_id AND lph.subject = lpt.subject;

-- =====================================================
-- LEARNING RESULTS DASHBOARD VIEWS
-- =====================================================

-- 1. Formative Assessment Results
CREATE OR REPLACE VIEW formative_assessment_results AS
SELECT 
    s.student_id,
    s.student_name,
    sch.school_id,
    sch.school_name,
    sch.cluster_id,
    sch.district_id,
    sch.province_id,
    fa.subject,
    l.lesson_id,
    l.lesson_title_en,
    l.lesson_order,
    fa.assessment_type,
    COUNT(*) as total_assessments,
    AVG(fa.percentage) as avg_percentage,
    MAX(fa.percentage) as max_percentage,
    MIN(fa.percentage) as min_percentage,
    AVG(fa.score) as avg_score,
    MAX(fa.score) as max_score,
    MAX(fa.assessment_date) as latest_assessment_date
FROM formative_assessments fa
JOIN students s ON fa.student_id = s.student_id
JOIN student_enrollments se ON s.student_id = se.student_id AND fa.subject = se.subject
JOIN schools sch ON se.school_id = sch.school_id
LEFT JOIN lessons l ON fa.lesson_id = l.lesson_id
WHERE se.status = 'Active'
GROUP BY s.student_id, sch.school_id, sch.cluster_id, sch.district_id, sch.province_id, 
         fa.subject, l.lesson_id, fa.assessment_type;

-- 2. Geographic hierarchy for filters
CREATE OR REPLACE VIEW geographic_hierarchy AS
SELECT 
    p.province_id,
    p.province_name_en,
    p.province_name_kh,
    d.district_id,
    d.district_name_en,
    d.district_name_kh,
    c.cluster_id,
    c.cluster_name_en,
    c.cluster_name_kh,
    sch.school_id,
    sch.school_name,
    sch.school_code
FROM provinces p
LEFT JOIN districts d ON p.province_id = d.province_id
LEFT JOIN clusters c ON d.district_id = c.district_id
LEFT JOIN schools sch ON (c.cluster_id = sch.cluster_id OR d.district_id = sch.district_id)
WHERE sch.status = 1
ORDER BY p.province_name_en, d.district_name_en, c.cluster_name_en, sch.school_name;

-- 3. School-level summary for dashboard
CREATE OR REPLACE VIEW school_dashboard_summary AS
SELECT 
    school_id,
    school_name,
    province_id,
    district_id,
    cluster_id,
    COUNT(DISTINCT student_id) as total_students,
    AVG(total_hours_studied) as avg_hours_per_student,
    AVG(task_completion_percentage) as avg_task_completion,
    COUNT(DISTINCT CASE WHEN subject = 'Math' THEN student_id END) as math_students,
    COUNT(DISTINCT CASE WHEN subject = 'Khmer' THEN student_id END) as khmer_students,
    AVG(CASE WHEN subject = 'Math' THEN total_hours_studied END) as avg_math_hours,
    AVG(CASE WHEN subject = 'Khmer' THEN total_hours_studied END) as avg_khmer_hours
FROM learning_progress_summary
GROUP BY school_id, school_name, province_id, district_id, cluster_id;
