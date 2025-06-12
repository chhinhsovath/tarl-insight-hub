-- =====================================================
-- SIMPLIFIED TARL DATABASE SCHEMA
-- All tables prefixed with tbl_tarl_
-- =====================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS tbl_tarl_survey_responses CASCADE;
DROP TABLE IF EXISTS tbl_tarl_training_feedback CASCADE;
DROP TABLE IF EXISTS tbl_tarl_surveys CASCADE;
DROP TABLE IF EXISTS tbl_tarl_users CASCADE;
DROP TABLE IF EXISTS tbl_tarl_schools CASCADE;
DROP TABLE IF EXISTS tbl_tarl_provinces CASCADE;
DROP TABLE IF EXISTS tbl_tarl_districts CASCADE;

-- =====================================================
-- CORE REFERENCE TABLES
-- =====================================================

-- Provinces
CREATE TABLE tbl_tarl_provinces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    name_kh VARCHAR(100),
    code VARCHAR(10) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Districts
CREATE TABLE tbl_tarl_districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_kh VARCHAR(100),
    code VARCHAR(10),
    province_id INTEGER NOT NULL REFERENCES tbl_tarl_provinces(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schools
CREATE TABLE tbl_tarl_schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(250) NOT NULL,
    name_kh VARCHAR(250),
    code VARCHAR(50) UNIQUE,
    province_id INTEGER NOT NULL REFERENCES tbl_tarl_provinces(id),
    district_id INTEGER NOT NULL REFERENCES tbl_tarl_districts(id),
    address TEXT,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    director_name VARCHAR(100),
    total_students INTEGER DEFAULT 0,
    total_teachers INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- USER MANAGEMENT
-- =====================================================

-- Users (Teachers, Coordinators, Staff)
CREATE TABLE tbl_tarl_users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(250) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL CHECK (role IN ('Teacher', 'Coordinator', 'Admin', 'Staff')),
    school_id INTEGER REFERENCES tbl_tarl_schools(id),
    province_id INTEGER REFERENCES tbl_tarl_provinces(id),
    district_id INTEGER REFERENCES tbl_tarl_districts(id),
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    date_of_birth DATE,
    years_of_experience INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SURVEY SYSTEM
-- =====================================================

-- Surveys
CREATE TABLE tbl_tarl_surveys (
    id SERIAL PRIMARY KEY,
    title VARCHAR(250) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Completed', 'Archived')),
    survey_type VARCHAR(50) DEFAULT 'General' CHECK (survey_type IN ('General', 'Pre-Training', 'Post-Training', 'Follow-up')),
    target_audience VARCHAR(50) CHECK (target_audience IN ('Teachers', 'Students', 'Parents', 'Coordinators', 'All')),
    created_by INTEGER REFERENCES tbl_tarl_users(id),
    start_date DATE,
    end_date DATE,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Survey Responses
CREATE TABLE tbl_tarl_survey_responses (
    id SERIAL PRIMARY KEY,
    survey_id INTEGER NOT NULL REFERENCES tbl_tarl_surveys(id),
    respondent_id INTEGER REFERENCES tbl_tarl_users(id),
    school_id INTEGER REFERENCES tbl_tarl_schools(id),
    respondent_name VARCHAR(250),
    respondent_role VARCHAR(50),
    responses JSONB NOT NULL,
    metadata JSONB,
    geolocation JSONB,
    photos JSONB,
    device_info JSONB,
    is_complete BOOLEAN DEFAULT false,
    offline_collected BOOLEAN DEFAULT false,
    sync_status VARCHAR(20) DEFAULT 'Synced' CHECK (sync_status IN ('Pending', 'Synced', 'Failed')),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TRAINING SYSTEM
-- =====================================================

-- Training Feedback
CREATE TABLE tbl_tarl_training_feedback (
    id SERIAL PRIMARY KEY,
    training_title VARCHAR(250),
    training_date DATE,
    training_location VARCHAR(250),
    respondent_id INTEGER REFERENCES tbl_tarl_users(id),
    respondent_name VARCHAR(250),
    respondent_role VARCHAR(50),
    school_id INTEGER REFERENCES tbl_tarl_schools(id),
    
    -- Ratings (1-5 scale)
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    content_quality_rating INTEGER CHECK (content_quality_rating BETWEEN 1 AND 5),
    trainer_effectiveness_rating INTEGER CHECK (trainer_effectiveness_rating BETWEEN 1 AND 5),
    venue_rating INTEGER CHECK (venue_rating BETWEEN 1 AND 5),
    materials_rating INTEGER CHECK (materials_rating BETWEEN 1 AND 5),
    
    -- Yes/No Questions
    objectives_met BOOLEAN,
    will_apply_learning BOOLEAN,
    will_recommend_training BOOLEAN,
    would_attend_future_training BOOLEAN,
    training_duration_appropriate BOOLEAN,
    materials_helpful BOOLEAN,
    pace_appropriate BOOLEAN,
    previous_tarl_training BOOLEAN,
    
    -- Open-ended responses
    most_valuable_aspect TEXT,
    least_valuable_aspect TEXT,
    additional_topics_needed TEXT,
    suggestions_for_improvement TEXT,
    challenges_implementing TEXT,
    additional_comments TEXT,
    
    -- Participant info
    years_of_experience INTEGER,
    subjects_taught VARCHAR(250),
    grade_levels_taught VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_tbl_tarl_districts_province ON tbl_tarl_districts(province_id);
CREATE INDEX idx_tbl_tarl_schools_province ON tbl_tarl_schools(province_id);
CREATE INDEX idx_tbl_tarl_schools_district ON tbl_tarl_schools(district_id);
CREATE INDEX idx_tbl_tarl_users_school ON tbl_tarl_users(school_id);
CREATE INDEX idx_tbl_tarl_users_role ON tbl_tarl_users(role);
CREATE INDEX idx_tbl_tarl_survey_responses_survey ON tbl_tarl_survey_responses(survey_id);
CREATE INDEX idx_tbl_tarl_survey_responses_school ON tbl_tarl_survey_responses(school_id);
CREATE INDEX idx_tbl_tarl_training_feedback_school ON tbl_tarl_training_feedback(school_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tbl_tarl_provinces_updated_at BEFORE UPDATE ON tbl_tarl_provinces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tbl_tarl_districts_updated_at BEFORE UPDATE ON tbl_tarl_districts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tbl_tarl_schools_updated_at BEFORE UPDATE ON tbl_tarl_schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tbl_tarl_users_updated_at BEFORE UPDATE ON tbl_tarl_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tbl_tarl_surveys_updated_at BEFORE UPDATE ON tbl_tarl_surveys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tbl_tarl_survey_responses_updated_at BEFORE UPDATE ON tbl_tarl_survey_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tbl_tarl_training_feedback_updated_at BEFORE UPDATE ON tbl_tarl_training_feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
