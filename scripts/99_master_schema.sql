-- =====================================================
-- MASTER DATABASE SCHEMA (ULTIMATE FIX - REVISED)
-- This script defines the complete and consolidated schema for the database.
-- It addresses all known issues with primary key and foreign key creation
-- on existing tables, ensuring idempotency and correct relationships.
-- =====================================================

-- =====================================================
-- GEOGRAPHICAL HIERARCHY TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS tbl_tarl_zones (
    zone_id SERIAL,
    zone_name_kh VARCHAR(255),
    zone_name_en VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Ensure PRIMARY KEY for tbl_tarl_zones
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tbl_tarl_zones_pkey' AND conrelid = 'tbl_tarl_zones'::regclass) THEN
        ALTER TABLE tbl_tarl_zones ADD PRIMARY KEY (zone_id);
    END IF;
END $$;


CREATE TABLE IF NOT EXISTS tbl_tarl_province (
    "prvAutoID" SERIAL,
    "prvProvinceID" INTEGER,
    "prvNameKH" VARCHAR(255),
    "prvNameEN" VARCHAR(255),
    "prvNameJP" VARCHAR(255),
    zone_id INTEGER, -- Ensure this column exists
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Ensure PRIMARY KEY for tbl_tarl_province
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tbl_tarl_province_pkey' AND conrelid = 'tbl_tarl_province'::regclass) THEN
        ALTER TABLE tbl_tarl_province ADD PRIMARY KEY ("prvAutoID");
    END IF;
    -- Add zone_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tbl_tarl_province' AND column_name = 'zone_id') THEN
        ALTER TABLE tbl_tarl_province ADD COLUMN zone_id INTEGER;
    END IF;
END $$;
-- Add FOREIGN KEY for tbl_tarl_province to tbl_tarl_zones
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_province_zone' AND conrelid = 'tbl_tarl_province'::regclass) THEN
        ALTER TABLE tbl_tarl_province ADD CONSTRAINT fk_province_zone FOREIGN KEY (zone_id) REFERENCES tbl_tarl_zones(zone_id);
    END IF;
END $$;


CREATE TABLE IF NOT EXISTS tbl_tarl_district (
    id SERIAL, -- Actual PK
    name VARCHAR(255),
    name_en VARCHAR(255),
    province_id INTEGER,
    "dstAutoID" INTEGER, -- Keep this for data compatibility if exists
    "dstDistrictID" INTEGER,
    "dstNameKH" VARCHAR(255),
    "dstNameEN" VARCHAR(255),
    "dstNameJP" VARCHAR(255),
    "prvAutoID" INTEGER, -- Ensure this column exists for FK
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Ensure PRIMARY KEY for tbl_tarl_district
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tbl_tarl_district_pkey' AND conrelid = 'tbl_tarl_district'::regclass) THEN
        ALTER TABLE tbl_tarl_district ADD PRIMARY KEY (id);
    END IF;
    -- Add prvAutoID column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tbl_tarl_district' AND column_name = 'prvAutoID') THEN
        ALTER TABLE tbl_tarl_district ADD COLUMN "prvAutoID" INTEGER;
    END IF;
END $$;
-- Add FOREIGN KEY for tbl_tarl_district to tbl_tarl_province
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_district_province' AND conrelid = 'tbl_tarl_district'::regclass) THEN
        ALTER TABLE tbl_tarl_district ADD CONSTRAINT fk_district_province FOREIGN KEY ("prvAutoID") REFERENCES tbl_tarl_province("prvAutoID");
    END IF;
END $$;


CREATE TABLE IF NOT EXISTS tbl_tarl_commune (
    id SERIAL, -- Actual PK
    name VARCHAR(255),
    district_id INTEGER,
    "cmnAutoID" INTEGER, -- Keep this for data compatibility if exists
    "cmnCommuneID" INTEGER,
    "cmnNameKH" VARCHAR(255),
    "cmnNameEN" VARCHAR(255),
    "cmnNameJP" VARCHAR(255),
    "dstAutoID" INTEGER, -- Ensure this column exists for FK
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Ensure PRIMARY KEY for tbl_tarl_commune
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tbl_tarl_commune_pkey' AND conrelid = 'tbl_tarl_commune'::regclass) THEN
        ALTER TABLE tbl_tarl_commune ADD PRIMARY KEY (id);
    END IF;
    -- Add dstAutoID column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tbl_tarl_commune' AND column_name = 'dstAutoID') THEN
        ALTER TABLE tbl_tarl_commune ADD COLUMN "dstAutoID" INTEGER;
    END IF;
END $$;
-- Add FOREIGN KEY for tbl_tarl_commune to tbl_tarl_district
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_commune_district' AND conrelid = 'tbl_tarl_commune'::regclass) THEN
        ALTER TABLE tbl_tarl_commune ADD CONSTRAINT fk_commune_district FOREIGN KEY ("dstAutoID") REFERENCES tbl_tarl_district(id); -- Reference 'id' as PK of district
    END IF;
END $$;


CREATE TABLE IF NOT EXISTS tbl_tarl_villages (
    id SERIAL, -- Actual PK
    name VARCHAR(255),
    commune_id INTEGER,
    "vlgAutoID" INTEGER, -- Keep this for data compatibility if exists
    "vlgVillageID" INTEGER,
    "vlgNameKH" VARCHAR(255),
    "vlgNameEN" VARCHAR(255),
    "vlgNameJP" VARCHAR(255),
    "cmnAutoID" INTEGER, -- Ensure this column exists for FK
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Ensure PRIMARY KEY for tbl_tarl_villages
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tbl_tarl_villages_pkey' AND conrelid = 'tbl_tarl_villages'::regclass) THEN
        ALTER TABLE tbl_tarl_villages ADD PRIMARY KEY (id);
    END IF;
    -- Add cmnAutoID column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tbl_tarl_villages' AND column_name = 'cmnAutoID') THEN
        ALTER TABLE tbl_tarl_villages ADD COLUMN "cmnAutoID" INTEGER;
    END IF;
END $$;
-- Add FOREIGN KEY for tbl_tarl_villages to tbl_tarl_commune
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_village_commune' AND conrelid = 'tbl_tarl_villages'::regclass) THEN
        ALTER TABLE tbl_tarl_villages ADD CONSTRAINT fk_village_commune FOREIGN KEY ("cmnAutoID") REFERENCES tbl_tarl_commune(id); -- Reference 'id' as PK of commune
    END IF;
END $$;


-- =====================================================
-- SCHOOLS AND USERS TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS tbl_tarl_school_list (
    "sclAutoID" SERIAL,
    "sclName" VARCHAR(255),
    "sclCode" VARCHAR(255),
    "sclCluster" VARCHAR(255),
    "sclCommune" VARCHAR(255),
    "sclDistrict" VARCHAR(255),
    "sclProvince" VARCHAR(255),
    "sclZone" VARCHAR(255),
    "sclOrder" INTEGER,
    "sclStatus" INTEGER DEFAULT 1,
    "sclImage" VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Ensure PRIMARY KEY for tbl_tarl_school_list
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tbl_tarl_school_list_pkey' AND conrelid = 'tbl_tarl_school_list'::regclass) THEN
        ALTER TABLE tbl_tarl_school_list ADD PRIMARY KEY ("sclAutoID");
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS tbl_tarl_users (
    id SERIAL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(50) CHECK (role IN ('admin', 'coordinator', 'teacher', 'collector')),
    is_active BOOLEAN DEFAULT TRUE,
    school_id INTEGER,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_token VARCHAR(255),
    session_expires TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP
);
-- Ensure PRIMARY KEY for tbl_tarl_users
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tbl_tarl_users_pkey' AND conrelid = 'tbl_tarl_users'::regclass) THEN
        ALTER TABLE tbl_tarl_users ADD PRIMARY KEY (id);
    END IF;
    -- Add columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tbl_tarl_users' AND column_name = 'is_active') THEN ALTER TABLE tbl_tarl_users ADD COLUMN is_active BOOLEAN DEFAULT TRUE; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tbl_tarl_users' AND column_name = 'last_login') THEN ALTER TABLE tbl_tarl_users ADD COLUMN last_login TIMESTAMP; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tbl_tarl_users' AND column_name = 'session_token') THEN ALTER TABLE tbl_tarl_users ADD COLUMN session_token VARCHAR(255); END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tbl_tarl_users' AND column_name = 'session_expires') THEN ALTER TABLE tbl_tarl_users ADD COLUMN session_expires TIMESTAMP; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tbl_tarl_users' AND column_name = 'password_reset_token') THEN ALTER TABLE tbl_tarl_users ADD COLUMN password_reset_token VARCHAR(255); END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tbl_tarl_users' AND column_name = 'password_reset_expires') THEN ALTER TABLE tbl_tarl_users ADD COLUMN password_reset_expires TIMESTAMP; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tbl_tarl_users' AND column_name = 'failed_login_attempts') THEN ALTER TABLE tbl_tarl_users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tbl_tarl_users' AND column_name = 'account_locked_until') THEN ALTER TABLE tbl_tarl_users ADD COLUMN account_locked_until TIMESTAMP; END IF;
END $$;
-- Add FOREIGN KEY for tbl_tarl_users to tbl_tarl_school_list
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tbl_tarl_users_school_id_fkey' AND conrelid = 'tbl_tarl_users'::regclass) THEN
        ALTER TABLE tbl_tarl_users ADD CONSTRAINT tbl_tarl_users_school_id_fkey FOREIGN KEY (school_id) REFERENCES tbl_tarl_school_list("sclAutoID");
    END IF;
END $$;


-- =====================================================
-- LEARNING AND ASSESSMENT TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS tbl_tarl_subjects (
    id SERIAL, -- Actual PK
    subject_code VARCHAR(10) UNIQUE NOT NULL,
    subject_name_en VARCHAR(100) NOT NULL,
    subject_name_kh VARCHAR(100) NOT NULL,
    description TEXT,
    target_hours_per_subject INTEGER DEFAULT 50,
    status VARCHAR(20) CHECK (status IN ('Active', 'Inactive')) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Ensure PRIMARY KEY for tbl_tarl_subjects
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tbl_tarl_subjects_pkey' AND conrelid = 'tbl_tarl_subjects'::regclass) THEN
        ALTER TABLE tbl_tarl_subjects ADD PRIMARY KEY (id);
    END IF;
END $$;


CREATE TABLE IF NOT EXISTS tbl_tarl_students (
    id SERIAL, -- Actual PK
    student_name VARCHAR(250) NOT NULL,
    student_code VARCHAR(50) UNIQUE,
    gender VARCHAR(10),
    date_of_birth DATE,
    grade VARCHAR(10),
    class VARCHAR(10),
    status INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Ensure PRIMARY KEY for tbl_tarl_students
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tbl_tarl_students_pkey' AND conrelid = 'tbl_tarl_students'::regclass) THEN
        ALTER TABLE tbl_tarl_students ADD PRIMARY KEY (id);
    END IF;
END $$;


CREATE TABLE IF NOT EXISTS tbl_tarl_learning_tasks (
    task_id SERIAL PRIMARY KEY,
    teacher_id INTEGER,
    student_id INTEGER,
    subject_id INTEGER,
    task_title VARCHAR(200) NOT NULL,
    task_description TEXT,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced')) DEFAULT 'Beginner',
    estimated_duration_minutes INTEGER,
    assigned_date DATE NOT NULL,
    due_date DATE,
    completion_status VARCHAR(20) CHECK (completion_status IN ('Assigned', 'In Progress', 'Completed', 'Overdue')) DEFAULT 'Assigned',
    completion_date DATE,
    teacher_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
DO $$ BEGIN
    -- Add columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tbl_tarl_learning_tasks' AND column_name = 'teacher_id') THEN ALTER TABLE tbl_tarl_learning_tasks ADD COLUMN teacher_id INTEGER; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tbl_tarl_learning_tasks' AND column_name = 'student_id') THEN ALTER TABLE tbl_tarl_learning_tasks ADD COLUMN student_id INTEGER; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tbl_tarl_learning_tasks' AND column_name = 'subject_id') THEN ALTER TABLE tbl_tarl_learning_tasks ADD COLUMN subject_id INTEGER; END IF;

    -- Add FOREIGN KEYs
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_learning_task_teacher' AND conrelid = 'tbl_tarl_learning_tasks'::regclass) THEN
        ALTER TABLE tbl_tarl_learning_tasks ADD CONSTRAINT fk_learning_task_teacher FOREIGN KEY (teacher_id) REFERENCES tbl_tarl_users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_learning_task_student' AND conrelid = 'tbl_tarl_learning_tasks'::regclass) THEN
        ALTER TABLE tbl_tarl_learning_tasks ADD CONSTRAINT fk_learning_task_student FOREIGN KEY (student_id) REFERENCES tbl_tarl_students(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_learning_task_subject' AND conrelid = 'tbl_tarl_learning_tasks'::regclass) THEN
        ALTER TABLE tbl_tarl_learning_tasks ADD CONSTRAINT fk_learning_task_subject FOREIGN KEY (subject_id) REFERENCES tbl_tarl_subjects(id);
    END IF;
END $$;


CREATE TABLE IF NOT EXISTS tbl_tarl_formative_assessments (
    assessment_id SERIAL PRIMARY KEY,
    student_id INTEGER,
    teacher_id INTEGER,
    subject_id INTEGER,
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
DO $$ BEGIN
    -- Add columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tbl_tarl_formative_assessments' AND column_name = 'student_id') THEN ALTER TABLE tbl_tarl_formative_assessments ADD COLUMN student_id INTEGER; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tbl_tarl_formative_assessments' AND column_name = 'teacher_id') THEN ALTER TABLE tbl_tarl_formative_assessments ADD COLUMN teacher_id INTEGER; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tbl_tarl_formative_assessments' AND column_name = 'subject_id') THEN ALTER TABLE tbl_tarl_formative_assessments ADD COLUMN subject_id INTEGER; END IF;

    -- Add FOREIGN KEYs
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_assessment_student' AND conrelid = 'tbl_tarl_formative_assessments'::regclass) THEN
        ALTER TABLE tbl_tarl_formative_assessments ADD CONSTRAINT fk_assessment_student FOREIGN KEY (student_id) REFERENCES tbl_tarl_students(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_assessment_teacher' AND conrelid = 'tbl_tarl_formative_assessments'::regclass) THEN
        ALTER TABLE tbl_tarl_formative_assessments ADD CONSTRAINT fk_assessment_teacher FOREIGN KEY (teacher_id) REFERENCES tbl_tarl_users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_assessment_subject' AND conrelid = 'tbl_tarl_formative_assessments'::regclass) THEN
        ALTER TABLE tbl_tarl_formative_assessments ADD CONSTRAINT fk_assessment_subject FOREIGN KEY (subject_id) REFERENCES tbl_tarl_subjects(id);
    END IF;
END $$;


CREATE TABLE IF NOT EXISTS tbl_tarl_study_hours_tracking (
    tracking_id SERIAL PRIMARY KEY,
    student_id INTEGER,
    teacher_id INTEGER,
    subject_id INTEGER,
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER NOT NULL,
    activity_type VARCHAR(20) CHECK (activity_type IN ('Practice', 'Assessment', 'Instruction', 'Review')) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
DO $$ BEGIN
    -- Add columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tbl_tarl_study_hours_tracking' AND column_name = 'student_id') THEN ALTER TABLE tbl_tarl_study_hours_tracking ADD COLUMN student_id INTEGER; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tbl_tarl_study_hours_tracking' AND column_name = 'teacher_id') THEN ALTER TABLE tbl_tarl_study_hours_tracking ADD COLUMN teacher_id INTEGER; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tbl_tarl_study_hours_tracking' AND column_name = 'subject_id') THEN ALTER TABLE tbl_tarl_study_hours_tracking ADD COLUMN subject_id INTEGER; END IF;

    -- Add FOREIGN KEYs
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_study_hours_student' AND conrelid = 'tbl_tarl_study_hours_tracking'::regclass) THEN
        ALTER TABLE tbl_tarl_study_hours_tracking ADD CONSTRAINT fk_study_hours_student FOREIGN KEY (student_id) REFERENCES tbl_tarl_students(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_study_hours_teacher' AND conrelid = 'tbl_tarl_study_hours_tracking'::regclass) THEN
        ALTER TABLE tbl_tarl_study_hours_tracking ADD CONSTRAINT fk_study_hours_teacher FOREIGN KEY (teacher_id) REFERENCES tbl_tarl_users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_study_hours_subject' AND conrelid = 'tbl_tarl_study_hours_tracking'::regclass) THEN
        ALTER TABLE tbl_tarl_study_hours_tracking ADD CONSTRAINT fk_study_hours_subject FOREIGN KEY (subject_id) REFERENCES tbl_tarl_subjects(id);
    END IF;
END $$;


-- =====================================================
-- USER ACTIVITIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS tbl_tarl_user_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
DO $$ BEGIN
    -- Add user_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tbl_tarl_user_activities' AND column_name = 'user_id') THEN
        ALTER TABLE tbl_tarl_user_activities ADD COLUMN user_id INTEGER;
    END IF;
    -- Add FOREIGN KEY
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_activities_user' AND conrelid = 'tbl_tarl_user_activities'::regclass) THEN
        ALTER TABLE tbl_tarl_user_activities ADD CONSTRAINT fk_user_activities_user FOREIGN KEY (user_id) REFERENCES tbl_tarl_users(id);
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON tbl_tarl_user_activities (user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON tbl_tarl_user_activities (created_at);

-- =====================================================
-- UPDATE TRIGGER FUNCTION AND TRIGGERS
-- =====================================================

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update updated_at timestamp
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_commune_updated_at' AND tgrelid = 'tbl_tarl_commune'::regclass) THEN
        CREATE TRIGGER set_commune_updated_at
        BEFORE UPDATE ON tbl_tarl_commune
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_district_updated_at' AND tgrelid = 'tbl_tarl_district'::regclass) THEN
        CREATE TRIGGER set_district_updated_at
        BEFORE UPDATE ON tbl_tarl_district
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_province_updated_at' AND tgrelid = 'tbl_tarl_province'::regclass) THEN
        CREATE TRIGGER set_province_updated_at
        BEFORE UPDATE ON tbl_tarl_province
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_school_list_updated_at' AND tgrelid = 'tbl_tarl_school_list'::regclass) THEN
        CREATE TRIGGER set_school_list_updated_at
        BEFORE UPDATE ON tbl_tarl_school_list
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_students_updated_at' AND tgrelid = 'tbl_tarl_students'::regclass) THEN
        CREATE TRIGGER set_students_updated_at
        BEFORE UPDATE ON tbl_tarl_students
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_subjects_updated_at' AND tgrelid = 'tbl_tarl_subjects'::regclass) THEN
        CREATE TRIGGER set_subjects_updated_at
        BEFORE UPDATE ON tbl_tarl_subjects
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_users_updated_at' AND tgrelid = 'tbl_tarl_users'::regclass) THEN
        CREATE TRIGGER set_users_updated_at
        BEFORE UPDATE ON tbl_tarl_users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_villages_updated_at' AND tgrelid = 'tbl_tarl_villages'::regclass) THEN
        CREATE TRIGGER set_villages_updated_at
        BEFORE UPDATE ON tbl_tarl_villages
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_zones_updated_at' AND tgrelid = 'tbl_tarl_zones'::regclass) THEN
        CREATE TRIGGER set_zones_updated_at
        BEFORE UPDATE ON tbl_tarl_zones
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_learning_tasks_updated_at' AND tgrelid = 'tbl_tarl_learning_tasks'::regclass) THEN
        CREATE TRIGGER set_learning_tasks_updated_at
        BEFORE UPDATE ON tbl_tarl_learning_tasks
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_formative_assessments_updated_at' AND tgrelid = 'tbl_tarl_formative_assessments'::regclass) THEN
        CREATE TRIGGER set_formative_assessments_updated_at
        BEFORE UPDATE ON tbl_tarl_formative_assessments
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_study_hours_tracking_updated_at' AND tgrelid = 'tbl_tarl_study_hours_tracking'::regclass) THEN
        CREATE TRIGGER set_study_hours_tracking_updated_at
        BEFORE UPDATE ON tbl_tarl_study_hours_tracking
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_user_activities_updated_at' AND tgrelid = 'tbl_tarl_user_activities'::regclass) THEN
        CREATE TRIGGER set_user_activities_updated_at
        BEFORE UPDATE ON tbl_tarl_user_activities
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Geographical indexes
CREATE INDEX IF NOT EXISTS idx_province_zone ON tbl_tarl_province(zone_id);
CREATE INDEX IF NOT EXISTS idx_district_province ON tbl_tarl_district("prvAutoID");
CREATE INDEX IF NOT EXISTS idx_commune_district ON tbl_tarl_commune("dstAutoID");
CREATE INDEX IF NOT EXISTS idx_village_commune ON tbl_tarl_villages("cmnAutoID");

-- School indexes
CREATE INDEX IF NOT EXISTS idx_school_province ON tbl_tarl_school_list("sclProvince");
CREATE INDEX IF NOT EXISTS idx_school_district ON tbl_tarl_school_list("sclDistrict");
CREATE INDEX IF NOT EXISTS idx_school_commune ON tbl_tarl_school_list("sclCommune");
CREATE INDEX IF NOT EXISTS idx_school_cluster ON tbl_tarl_school_list("sclCluster");

-- User indexes
CREATE INDEX IF NOT EXISTS idx_user_school ON tbl_tarl_users(school_id);
CREATE INDEX IF NOT EXISTS idx_user_role ON tbl_tarl_users(role);
CREATE INDEX IF NOT EXISTS idx_user_is_active ON tbl_tarl_users(is_active);

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