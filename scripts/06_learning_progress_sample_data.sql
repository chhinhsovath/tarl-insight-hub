-- =====================================================
-- SAMPLE DATA FOR LEARNING PROGRESS TABLES
-- =====================================================

-- Insert sample students
INSERT INTO public.tbl_tarl_students (student_code, student_name, school_id, grade_level, gender) 
SELECT 
    'STU' || LPAD(s.i::text, 4, '0'),
    CASE (s.i % 10)
        WHEN 1 THEN 'Sophea Chan'
        WHEN 2 THEN 'Dara Pich'
        WHEN 3 THEN 'Maly Sok'
        WHEN 4 THEN 'Pisach Lim'
        WHEN 5 THEN 'Sreypov Keo'
        WHEN 6 THEN 'Bopha Nhem'
        WHEN 7 THEN 'Chanthy Ros'
        WHEN 8 THEN 'Davi Chea'
        WHEN 9 THEN 'Kosal Meng'
        ELSE 'Vicheka Sar'
    END || ' ' || s.i,
    (SELECT id FROM public.tbl_tarl_schools ORDER BY RANDOM() LIMIT 1),
    (s.i % 6) + 1, -- Grades 1-6
    CASE (s.i % 2) WHEN 0 THEN 'Male' ELSE 'Female' END
FROM generate_series(1, 50) as s(i)
ON CONFLICT (student_code) DO NOTHING;

-- Insert student enrollments
INSERT INTO public.tbl_tarl_student_enrollments (student_id, school_id, subject_code, status)
SELECT 
    s.id,
    s.school_id,
    subj.subject_code,
    'Active'
FROM public.tbl_tarl_students s
CROSS JOIN public.tbl_tarl_subjects subj
WHERE s.is_active = true AND subj.is_active = true
ON CONFLICT (student_id, subject_code) DO NOTHING;

-- Insert sample study hours tracking
INSERT INTO public.tbl_tarl_study_hours_tracking (student_id, subject_code, session_date, duration_minutes, activity_type, created_by_user_id)
SELECT 
    se.student_id,
    se.subject_code,
    CURRENT_DATE - (gs.i || ' days')::interval,
    (30 + (RANDOM() * 90)::int), -- 30-120 minutes
    CASE (gs.i % 4)
        WHEN 0 THEN 'Reading'
        WHEN 1 THEN 'Practice'
        WHEN 2 THEN 'Assessment'
        ELSE 'Review'
    END,
    (SELECT id FROM public.tbl_tarl_users WHERE role = 'Teacher' ORDER BY RANDOM() LIMIT 1)
FROM public.tbl_tarl_student_enrollments se,
     generate_series(1, 30) as gs(i)
WHERE se.status = 'Active'; -- 30 days of data per student per subject

-- Insert sample learning tasks
INSERT INTO public.tbl_tarl_learning_tasks (student_id, subject_code, task_title, task_description, assigned_date, due_date, completion_status, completion_date, score, max_score, created_by_user_id)
SELECT 
    se.student_id,
    se.subject_code,
    CASE se.subject_code
        WHEN 'MATH' THEN 'Math Exercise ' || gt.i
        WHEN 'KHMER' THEN 'Khmer Reading ' || gt.i
        ELSE 'Task ' || gt.i
    END,
    'Practice exercise for skill development',
    CURRENT_DATE - (gt.i * 3 || ' days')::interval,
    CURRENT_DATE - (gt.i * 3 || ' days')::interval + interval '7 days',
    CASE 
        WHEN gt.i <= 7 THEN 'Completed'
        WHEN gt.i = 8 THEN 'In Progress'
        ELSE 'Assigned'
    END,
    CASE 
        WHEN gt.i <= 7 THEN CURRENT_DATE - (gt.i * 2 || ' days')::interval
        ELSE NULL
    END,
    CASE 
        WHEN gt.i <= 7 THEN (70 + (RANDOM() * 30)::int)::decimal
        ELSE NULL
    END,
    100,
    (SELECT id FROM public.tbl_tarl_users WHERE role = 'Teacher' ORDER BY RANDOM() LIMIT 1)
FROM public.tbl_tarl_student_enrollments se,
     generate_series(1, 10) as gt(i)
WHERE se.status = 'Active'; -- 10 tasks per student per subject

-- Insert sample formative assessments
INSERT INTO public.tbl_tarl_formative_assessments (student_id, subject_code, assessment_type, assessment_date, score, max_score, lesson_title, created_by_user_id)
SELECT 
    se.student_id,
    se.subject_code,
    CASE (ga.i % 3)
        WHEN 0 THEN 'Quiz'
        WHEN 1 THEN 'Test'
        ELSE 'Assignment'
    END,
    CURRENT_DATE - (ga.i * 7 || ' days')::interval,
    (60 + (RANDOM() * 40)::int)::decimal, -- Score between 60-100
    100,
    CASE se.subject_code
        WHEN 'MATH' THEN 'Math Lesson ' || ga.i
        WHEN 'KHMER' THEN 'Khmer Lesson ' || ga.i
        ELSE 'Lesson ' || ga.i
    END,
    (SELECT id FROM public.tbl_tarl_users WHERE role = 'Teacher' ORDER BY RANDOM() LIMIT 1)
FROM public.tbl_tarl_student_enrollments se,
     generate_series(1, 5) as ga(i)
WHERE se.status = 'Active'; -- 5 assessments per student per subject
