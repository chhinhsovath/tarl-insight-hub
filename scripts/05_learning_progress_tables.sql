-- =====================================================
-- LEARNING PROGRESS TABLES
-- Create actual tables instead of views for better performance
-- =====================================================

-- 1. Create subjects lookup table
CREATE TABLE IF NOT EXISTS public.tbl_tarl_subjects (
    id SERIAL PRIMARY KEY,
    subject_code VARCHAR(10) UNIQUE NOT NULL,
    subject_name_en VARCHAR(100) NOT NULL,
    subject_name_kh VARCHAR(100),
    target_hours_per_subject INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subjects
INSERT INTO public.tbl_tarl_subjects (subject_code, subject_name_en, subject_name_kh, target_hours_per_subject) 
VALUES 
    ('MATH', 'Mathematics', 'គណិតវិទ្យា', 60),
    ('KHMER', 'Khmer Language', 'ភាសាខ្មែរ', 50)
ON CONFLICT (subject_code) DO NOTHING;

-- 2. Create students table
CREATE TABLE IF NOT EXISTS public.tbl_tarl_students (
    id SERIAL PRIMARY KEY,
    student_code VARCHAR(20) UNIQUE,
    student_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    school_id INTEGER REFERENCES public.tbl_tarl_schools(id),
    grade_level INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create student enrollments table
CREATE TABLE IF NOT EXISTS public.tbl_tarl_student_enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES public.tbl_tarl_students(id),
    school_id INTEGER REFERENCES public.tbl_tarl_schools(id),
    subject_code VARCHAR(10) REFERENCES public.tbl_tarl_subjects(subject_code),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, subject_code)
);

-- 4. Create study hours tracking table
CREATE TABLE IF NOT EXISTS public.tbl_tarl_study_hours_tracking (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES public.tbl_tarl_students(id),
    subject_code VARCHAR(10) REFERENCES public.tbl_tarl_subjects(subject_code),
    session_date DATE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    activity_type VARCHAR(50),
    notes TEXT,
    created_by_user_id INTEGER REFERENCES public.tbl_tarl_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create learning tasks table
CREATE TABLE IF NOT EXISTS public.tbl_tarl_learning_tasks (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES public.tbl_tarl_students(id),
    subject_code VARCHAR(10) REFERENCES public.tbl_tarl_subjects(subject_code),
    task_title VARCHAR(255) NOT NULL,
    task_description TEXT,
    assigned_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    completion_status VARCHAR(20) DEFAULT 'Assigned',
    completion_date DATE,
    score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    created_by_user_id INTEGER REFERENCES public.tbl_tarl_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create formative assessments table
CREATE TABLE IF NOT EXISTS public.tbl_tarl_formative_assessments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES public.tbl_tarl_students(id),
    subject_code VARCHAR(10) REFERENCES public.tbl_tarl_subjects(subject_code),
    assessment_type VARCHAR(50) NOT NULL,
    assessment_date DATE DEFAULT CURRENT_DATE,
    score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) NOT NULL,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (ROUND((score / max_score) * 100, 2)) STORED,
    lesson_id INTEGER,
    lesson_title VARCHAR(255),
    created_by_user_id INTEGER REFERENCES public.tbl_tarl_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create the main learning progress summary table
CREATE TABLE IF NOT EXISTS public.tbl_tarl_learning_progress_summary (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES public.tbl_tarl_students(id),
    student_name VARCHAR(255),
    school_id INTEGER REFERENCES public.tbl_tarl_schools(id),
    school_name VARCHAR(255),
    province_id INTEGER REFERENCES public.tbl_tarl_provinces(id),
    district_id INTEGER REFERENCES public.tbl_tarl_districts(id),
    subject_code VARCHAR(10) REFERENCES public.tbl_tarl_subjects(subject_code),
    subject_name VARCHAR(100),
    total_hours_studied DECIMAL(8,2) DEFAULT 0,
    target_hours_per_subject INTEGER DEFAULT 60,
    hours_progress_percentage DECIMAL(5,2) DEFAULT 0,
    total_study_sessions INTEGER DEFAULT 0,
    total_tasks_assigned INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    task_completion_percentage DECIMAL(5,2) DEFAULT 0,
    avg_assessment_score DECIMAL(5,2),
    latest_assessment_date DATE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, subject_code)
);

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_learning_progress_student ON public.tbl_tarl_learning_progress_summary(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_school ON public.tbl_tarl_learning_progress_summary(school_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_subject ON public.tbl_tarl_learning_progress_summary(subject_code);
CREATE INDEX IF NOT EXISTS idx_study_hours_student_subject ON public.tbl_tarl_study_hours_tracking(student_id, subject_code);
CREATE INDEX IF NOT EXISTS idx_learning_tasks_student_subject ON public.tbl_tarl_learning_tasks(student_id, subject_code);

-- 9. Create function to update learning progress summary
CREATE OR REPLACE FUNCTION update_learning_progress_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert learning progress summary
    INSERT INTO public.tbl_tarl_learning_progress_summary (
        student_id,
        student_name,
        school_id,
        school_name,
        province_id,
        district_id,
        subject_code,
        subject_name,
        total_hours_studied,
        target_hours_per_subject,
        hours_progress_percentage,
        total_study_sessions,
        total_tasks_assigned,
        tasks_completed,
        task_completion_percentage,
        avg_assessment_score,
        latest_assessment_date,
        last_updated
    )
    SELECT 
        s.id as student_id,
        s.student_name,
        s.school_id,
        sch.name as school_name,
        sch.province_id,
        sch.district_id,
        subj.subject_code,
        subj.subject_name_en as subject_name,
        COALESCE(hours_data.total_hours, 0) as total_hours_studied,
        subj.target_hours_per_subject,
        CASE 
            WHEN subj.target_hours_per_subject > 0 
            THEN ROUND((COALESCE(hours_data.total_hours, 0) / subj.target_hours_per_subject) * 100, 2)
            ELSE 0 
        END as hours_progress_percentage,
        COALESCE(hours_data.total_sessions, 0) as total_study_sessions,
        COALESCE(tasks_data.total_assigned, 0) as total_tasks_assigned,
        COALESCE(tasks_data.total_completed, 0) as tasks_completed,
        CASE 
            WHEN COALESCE(tasks_data.total_assigned, 0) > 0 
            THEN ROUND((COALESCE(tasks_data.total_completed, 0)::DECIMAL / tasks_data.total_assigned) * 100, 2)
            ELSE 0 
        END as task_completion_percentage,
        assessment_data.avg_score as avg_assessment_score,
        assessment_data.latest_date as latest_assessment_date,
        NOW() as last_updated
    FROM public.tbl_tarl_students s
    JOIN public.tbl_tarl_schools sch ON s.school_id = sch.id
    JOIN public.tbl_tarl_student_enrollments se ON s.id = se.student_id
    JOIN public.tbl_tarl_subjects subj ON se.subject_code = subj.subject_code
    LEFT JOIN (
        SELECT 
            student_id,
            subject_code,
            SUM(duration_minutes) / 60.0 as total_hours,
            COUNT(DISTINCT session_date) as total_sessions
        FROM public.tbl_tarl_study_hours_tracking
        GROUP BY student_id, subject_code
    ) hours_data ON s.id = hours_data.student_id AND subj.subject_code = hours_data.subject_code
    LEFT JOIN (
        SELECT 
            student_id,
            subject_code,
            COUNT(*) as total_assigned,
            SUM(CASE WHEN completion_status = 'Completed' THEN 1 ELSE 0 END) as total_completed
        FROM public.tbl_tarl_learning_tasks
        GROUP BY student_id, subject_code
    ) tasks_data ON s.id = tasks_data.student_id AND subj.subject_code = tasks_data.subject_code
    LEFT JOIN (
        SELECT 
            student_id,
            subject_code,
            AVG(score) as avg_score,
            MAX(assessment_date) as latest_date
        FROM public.tbl_tarl_formative_assessments
        GROUP BY student_id, subject_code
    ) assessment_data ON s.id = assessment_data.student_id AND subj.subject_code = assessment_data.subject_code
    WHERE se.status = 'Active' AND s.is_active = true
    ON CONFLICT (student_id, subject_code) 
    DO UPDATE SET
        student_name = EXCLUDED.student_name,
        school_name = EXCLUDED.school_name,
        total_hours_studied = EXCLUDED.total_hours_studied,
        hours_progress_percentage = EXCLUDED.hours_progress_percentage,
        total_study_sessions = EXCLUDED.total_study_sessions,
        total_tasks_assigned = EXCLUDED.total_tasks_assigned,
        tasks_completed = EXCLUDED.tasks_completed,
        task_completion_percentage = EXCLUDED.task_completion_percentage,
        avg_assessment_score = EXCLUDED.avg_assessment_score,
        latest_assessment_date = EXCLUDED.latest_assessment_date,
        last_updated = NOW(),
        updated_at = NOW();

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 10. Create triggers to automatically update the summary table
CREATE OR REPLACE TRIGGER trigger_update_progress_on_study_hours
    AFTER INSERT OR UPDATE OR DELETE ON public.tbl_tarl_study_hours_tracking
    FOR EACH ROW EXECUTE FUNCTION update_learning_progress_summary();

CREATE OR REPLACE TRIGGER trigger_update_progress_on_tasks
    AFTER INSERT OR UPDATE OR DELETE ON public.tbl_tarl_learning_tasks
    FOR EACH ROW EXECUTE FUNCTION update_learning_progress_summary();

CREATE OR REPLACE TRIGGER trigger_update_progress_on_assessments
    AFTER INSERT OR UPDATE OR DELETE ON public.tbl_tarl_formative_assessments
    FOR EACH ROW EXECUTE FUNCTION update_learning_progress_summary();
