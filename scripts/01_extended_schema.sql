-- =====================================================
-- EXTENDED MENTORING TOOL DATABASE SCHEMA
-- Integrates Reference Tables + Teacher Inputs + Dashboards
-- =====================================================

-- =====================================================
-- MISSING REFERENCE TABLES
-- =====================================================

-- Districts table (referenced by tbl_school_list but missing)
CREATE TABLE IF NOT EXISTS districts (
    district_id SERIAL PRIMARY KEY,
    district_code VARCHAR(10) UNIQUE,
    district_name_kh VARCHAR(250) NOT NULL,
    district_name_en VARCHAR(250) NOT NULL,
    province_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clusters table (referenced by tbl_school_list but missing)
CREATE TABLE IF NOT EXISTS clusters (
    cluster_id SERIAL PRIMARY KEY,
    cluster_code VARCHAR(10) UNIQUE,
    cluster_name_kh VARCHAR(250) NOT NULL,
    cluster_name_en VARCHAR(250) NOT NULL,
    district_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Provinces table (simplified for demo)
CREATE TABLE IF NOT EXISTS provinces (
    province_id SERIAL PRIMARY KEY,
    province_name_kh VARCHAR(250) NOT NULL,
    province_name_en VARCHAR(250) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schools table (simplified for demo)
CREATE TABLE IF NOT EXISTS schools (
    school_id SERIAL PRIMARY KEY,
    school_name VARCHAR(250) NOT NULL,
    school_code VARCHAR(50) UNIQUE,
    cluster_id INTEGER,
    district_id INTEGER,
    province_id INTEGER NOT NULL,
    status INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table (simplified for demo)
CREATE TABLE IF NOT EXISTS students (
    student_id SERIAL PRIMARY KEY,
    student_name VARCHAR(250) NOT NULL,
    student_code VARCHAR(50) UNIQUE,
    gender VARCHAR(10),
    date_of_birth DATE,
    grade VARCHAR(10),
    class VARCHAR(10),
    status INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teachers table (simplified for demo)
CREATE TABLE IF NOT EXISTS teachers (
    teacher_id SERIAL PRIMARY KEY,
    teacher_name VARCHAR(250) NOT NULL,
    teacher_code VARCHAR(50) UNIQUE,
    gender VARCHAR(10),
    phone_number VARCHAR(20),
    email VARCHAR(100),
    status INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- NEW TEACHER INPUT TABLES
-- =====================================================

-- Student Enrollments (links students to teachers/classes for TaRL)
CREATE TABLE student_enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    school_id INTEGER NOT NULL,
    subject VARCHAR(20) CHECK (subject IN ('Math', 'Khmer')) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    class_section VARCHAR(10),
    tarl_level VARCHAR(50),
    enrollment_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(student_id, teacher_id, subject)
);

-- Learning Tasks (teacher-assigned tasks)
CREATE TABLE learning_tasks (
    task_id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    subject VARCHAR(20) CHECK (subject IN ('Math', 'Khmer')) NOT NULL,
    task_title VARCHAR(200) NOT NULL,
    task_description TEXT,
    lesson_id INTEGER,
    difficulty_level VARCHAR(20) DEFAULT 'Beginner' CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced')),
    estimated_duration_minutes INTEGER,
    assigned_date DATE NOT NULL,
    due_date DATE,
    completion_status VARCHAR(20) DEFAULT 'Assigned' CHECK (completion_status IN ('Assigned', 'In Progress', 'Completed', 'Overdue')),
    completion_date DATE,
    teacher_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Formative Assessments (teacher-entered assessment data)
CREATE TABLE formative_assessments (
    assessment_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    subject VARCHAR(20) CHECK (subject IN ('Math', 'Khmer')) NOT NULL,
    lesson_id INTEGER,
    lesson_title VARCHAR(200),
    assessment_type VARCHAR(20) CHECK (assessment_type IN ('Quiz', 'Observation', 'Assignment', 'Oral', 'Practical')) NOT NULL,
    assessment_date DATE NOT NULL,
    score DECIMAL(5,2),
    max_score DECIMAL(5,2) DEFAULT 100.00,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (CASE WHEN max_score > 0 THEN (score / max_score) * 100 ELSE NULL END) STORED,
    grade_level VARCHAR(10),
    strengths TEXT,
    areas_for_improvement TEXT,
    teacher_remarks TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Study Hours Tracking (for dashboard metrics)
CREATE TABLE study_hours_tracking (
    tracking_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    subject VARCHAR(20) CHECK (subject IN ('Math', 'Khmer')) NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER NOT NULL,
    activity_type VARCHAR(20) CHECK (activity_type IN ('Practice', 'Assessment', 'Instruction', 'Review')) NOT NULL,
    lesson_id INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE subjects (
    subject_id SERIAL PRIMARY KEY,
    subject_code VARCHAR(10) UNIQUE NOT NULL,
    subject_name_en VARCHAR(100) NOT NULL,
    subject_name_kh VARCHAR(100) NOT NULL,
    description TEXT,
    target_hours_per_subject INTEGER DEFAULT 50,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lessons table
CREATE TABLE lessons (
    lesson_id SERIAL PRIMARY KEY,
    subject_id INTEGER NOT NULL,
    lesson_code VARCHAR(20) NOT NULL,
    lesson_title_en VARCHAR(200) NOT NULL,
    lesson_title_kh VARCHAR(200) NOT NULL,
    lesson_order INTEGER NOT NULL,
    grade_level VARCHAR(10),
    difficulty_level VARCHAR(20) DEFAULT 'Beginner' CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced')),
    estimated_duration_minutes INTEGER DEFAULT 60,
    learning_objectives TEXT,
    description TEXT,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(subject_id, lesson_code)
);

-- Add foreign key constraints
ALTER TABLE districts ADD CONSTRAINT fk_district_province FOREIGN KEY (province_id) REFERENCES provinces(province_id);
ALTER TABLE clusters ADD CONSTRAINT fk_cluster_district FOREIGN KEY (district_id) REFERENCES districts(district_id);
ALTER TABLE schools ADD CONSTRAINT fk_school_province FOREIGN KEY (province_id) REFERENCES provinces(province_id);
ALTER TABLE schools ADD CONSTRAINT fk_school_district FOREIGN KEY (district_id) REFERENCES districts(district_id);
ALTER TABLE schools ADD CONSTRAINT fk_school_cluster FOREIGN KEY (cluster_id) REFERENCES clusters(cluster_id);

ALTER TABLE student_enrollments ADD CONSTRAINT fk_enrollment_student FOREIGN KEY (student_id) REFERENCES students(student_id);
ALTER TABLE student_enrollments ADD CONSTRAINT fk_enrollment_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id);
ALTER TABLE student_enrollments ADD CONSTRAINT fk_enrollment_school FOREIGN KEY (school_id) REFERENCES schools(school_id);

ALTER TABLE learning_tasks ADD CONSTRAINT fk_task_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id);
ALTER TABLE learning_tasks ADD CONSTRAINT fk_task_student FOREIGN KEY (student_id) REFERENCES students(student_id);
ALTER TABLE learning_tasks ADD CONSTRAINT fk_task_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id);

ALTER TABLE formative_assessments ADD CONSTRAINT fk_assessment_student FOREIGN KEY (student_id) REFERENCES students(student_id);
ALTER TABLE formative_assessments ADD CONSTRAINT fk_assessment_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id);
ALTER TABLE formative_assessments ADD CONSTRAINT fk_assessment_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id);

ALTER TABLE study_hours_tracking ADD CONSTRAINT fk_hours_student FOREIGN KEY (student_id) REFERENCES students(student_id);
ALTER TABLE study_hours_tracking ADD CONSTRAINT fk_hours_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id);
ALTER TABLE study_hours_tracking ADD CONSTRAINT fk_hours_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(lesson_id);

ALTER TABLE lessons ADD CONSTRAINT fk_lesson_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id);

-- Create indexes for better performance
CREATE INDEX idx_student_enrollment_student ON student_enrollments(student_id);
CREATE INDEX idx_student_enrollment_teacher ON student_enrollments(teacher_id);
CREATE INDEX idx_student_enrollment_school ON student_enrollments(school_id);
CREATE INDEX idx_student_enrollment_subject ON student_enrollments(subject);

CREATE INDEX idx_learning_tasks_teacher ON learning_tasks(teacher_id);
CREATE INDEX idx_learning_tasks_student ON learning_tasks(student_id);
CREATE INDEX idx_learning_tasks_subject ON learning_tasks(subject);
CREATE INDEX idx_learning_tasks_status ON learning_tasks(completion_status);

CREATE INDEX idx_formative_assessments_student ON formative_assessments(student_id);
CREATE INDEX idx_formative_assessments_teacher ON formative_assessments(teacher_id);
CREATE INDEX idx_formative_assessments_subject ON formative_assessments(subject);
CREATE INDEX idx_formative_assessments_date ON formative_assessments(assessment_date);

CREATE INDEX idx_study_hours_student ON study_hours_tracking(student_id);
CREATE INDEX idx_study_hours_teacher ON study_hours_tracking(teacher_id);
CREATE INDEX idx_study_hours_subject ON study_hours_tracking(subject);
CREATE INDEX idx_study_hours_date ON study_hours_tracking(session_date);
