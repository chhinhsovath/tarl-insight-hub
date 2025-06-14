-- =====================================================
-- REFACTORED SCHEMA TO MATCH EXISTING TABLES
-- This script refactors the schema to match existing tables
-- while preserving data and relationships
-- =====================================================

-- =====================================================
-- GEOGRAPHICAL HIERARCHY
-- =====================================================

-- Zones table (already exists as tbl_tarl_zones)
CREATE TABLE IF NOT EXISTS tbl_tarl_zones (
    zone_id SERIAL PRIMARY KEY,
    zone_name_kh VARCHAR(255),
    zone_name_en VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Provinces table (already exists as tbl_tarl_province)
CREATE TABLE IF NOT EXISTS tbl_tarl_province (
    prvAutoID SERIAL PRIMARY KEY,
    prvProvinceID INTEGER,
    prvNameKH VARCHAR(255),
    prvNameEN VARCHAR(255),
    prvNameJP VARCHAR(255),
    zone_id INTEGER REFERENCES tbl_tarl_zones(zone_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Districts table (already exists as tbl_tarl_district)
CREATE TABLE IF NOT EXISTS tbl_tarl_district (
    dstAutoID SERIAL PRIMARY KEY,
    dstDistrictID INTEGER,
    dstNameKH VARCHAR(255),
    dstNameEN VARCHAR(255),
    dstNameJP VARCHAR(255),
    prvAutoID INTEGER REFERENCES tbl_tarl_province(prvAutoID),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Communes table (already exists as tbl_tarl_commune)
CREATE TABLE IF NOT EXISTS tbl_tarl_commune (
    cmnAutoID SERIAL PRIMARY KEY,
    cmnCommuneID INTEGER,
    cmnNameKH VARCHAR(255),
    cmnNameEN VARCHAR(255),
    cmnNameJP VARCHAR(255),
    dstAutoID INTEGER REFERENCES tbl_tarl_district(dstAutoID),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Villages table (already exists as tbl_tarl_villages)
CREATE TABLE IF NOT EXISTS tbl_tarl_villages (
    vlgAutoID SERIAL PRIMARY KEY,
    vlgVillageID INTEGER,
    vlgNameKH VARCHAR(255),
    vlgNameEN VARCHAR(255),
    vlgNameJP VARCHAR(255),
    cmnAutoID INTEGER REFERENCES tbl_tarl_commune(cmnAutoID),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SCHOOLS AND USERS
-- =====================================================

-- Schools table (already exists as tbl_tarl_school_list)
CREATE TABLE IF NOT EXISTS tbl_tarl_school_list (
    sclAutoID SERIAL PRIMARY KEY,
    sclName VARCHAR(255),
    sclCode VARCHAR(255),
    sclCluster VARCHAR(255),
    sclCommune VARCHAR(255),
    sclDistrict VARCHAR(255),
    sclProvince VARCHAR(255),
    sclZone VARCHAR(255),
    sclOrder INTEGER,
    sclStatus INTEGER DEFAULT 1,
    sclImage VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table (already exists as tbl_tarl_users)
CREATE TABLE IF NOT EXISTS tbl_tarl_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(50) CHECK (role IN ('admin', 'coordinator', 'teacher', 'collector')),
    school_id INTEGER REFERENCES tbl_tarl_school_list(sclAutoID),
    status INTEGER DEFAULT 1,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- LEARNING AND ASSESSMENT
-- =====================================================

-- Subjects table (already exists as tbl_tarl_subjects)
CREATE TABLE IF NOT EXISTS tbl_tarl_subjects (
    subject_id SERIAL PRIMARY KEY,
    subject_code VARCHAR(10) UNIQUE NOT NULL,
    subject_name_en VARCHAR(100) NOT NULL,
    subject_name_kh VARCHAR(100) NOT NULL,
    description TEXT,
    target_hours_per_subject INTEGER DEFAULT 50,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learning Tasks table (already exists as tbl_tarl_learning_tasks)
CREATE TABLE IF NOT EXISTS tbl_tarl_learning_tasks (
    task_id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES tbl_tarl_users(id),
    student_id INTEGER REFERENCES tbl_tarl_students(student_id),
    subject_id INTEGER REFERENCES tbl_tarl_subjects(subject_id),
    task_title VARCHAR(200) NOT NULL,
    task_description TEXT,
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

-- Formative Assessments table (already exists as tbl_tarl_formative_assessments)
CREATE TABLE IF NOT EXISTS tbl_tarl_formative_assessments (
    assessment_id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES tbl_tarl_students(student_id),
    teacher_id INTEGER REFERENCES tbl_tarl_users(id),
    subject_id INTEGER REFERENCES tbl_tarl_subjects(subject_id),
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

-- Study Hours Tracking table (already exists as tbl_tarl_study_hours_tracking)
CREATE TABLE IF NOT EXISTS tbl_tarl_study_hours_tracking (
    tracking_id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES tbl_tarl_students(student_id),
    teacher_id INTEGER REFERENCES tbl_tarl_users(id),
    subject_id INTEGER REFERENCES tbl_tarl_subjects(subject_id),
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER NOT NULL,
    activity_type VARCHAR(20) CHECK (activity_type IN ('Practice', 'Assessment', 'Instruction', 'Review')) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- School indexes
CREATE INDEX IF NOT EXISTS idx_school_province ON tbl_tarl_school_list(sclProvince);
CREATE INDEX IF NOT EXISTS idx_school_district ON tbl_tarl_school_list(sclDistrict);
CREATE INDEX IF NOT EXISTS idx_school_commune ON tbl_tarl_school_list(sclCommune);
CREATE INDEX IF NOT EXISTS idx_school_cluster ON tbl_tarl_school_list(sclCluster);

-- User indexes
CREATE INDEX IF NOT EXISTS idx_user_school ON tbl_tarl_users(school_id);
CREATE INDEX IF NOT EXISTS idx_user_role ON tbl_tarl_users(role);
CREATE INDEX IF NOT EXISTS idx_user_status ON tbl_tarl_users(status);

-- Learning task indexes
CREATE INDEX IF NOT EXISTS idx_learning_task_teacher ON tbl_tarl_learning_tasks(teacher_id);
CREATE INDEX IF NOT EXISTS idx_learning_task_student ON tbl_tarl_learning_tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_task_subject ON tbl_tarl_learning_tasks(subject_id);
CREATE INDEX IF NOT EXISTS idx_learning_task_status ON tbl_tarl_learning_tasks(completion_status);

-- Assessment indexes
CREATE INDEX IF NOT EXISTS idx_assessment_student ON tbl_tarl_formative_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_teacher ON tbl_tarl_formative_assessments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assessment_subject ON tbl_tarl_formative_assessments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assessment_date ON tbl_tarl_formative_assessments(assessment_date);

-- Study hours indexes
CREATE INDEX IF NOT EXISTS idx_study_hours_student ON tbl_tarl_study_hours_tracking(student_id);
CREATE INDEX IF NOT EXISTS idx_study_hours_teacher ON tbl_tarl_study_hours_tracking(teacher_id);
CREATE INDEX IF NOT EXISTS idx_study_hours_subject ON tbl_tarl_study_hours_tracking(subject_id);
CREATE INDEX IF NOT EXISTS idx_study_hours_date ON tbl_tarl_study_hours_tracking(session_date); 