-- TARL Insight Hub Database Schema for Supabase
-- Compatible with PostgreSQL and Supabase
-- Generated for Vercel deployment

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core Geographic Tables
CREATE TABLE tbl_tarl_countries (
    id SERIAL PRIMARY KEY,
    country_name VARCHAR(100) NOT NULL,
    country_code VARCHAR(3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tbl_tarl_zones (
    id SERIAL PRIMARY KEY,
    zone_name VARCHAR(100) NOT NULL,
    country_id INTEGER REFERENCES tbl_tarl_countries(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tbl_tarl_provinces (
    id SERIAL PRIMARY KEY,
    province_name VARCHAR(100) NOT NULL,
    zone_id INTEGER REFERENCES tbl_tarl_zones(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tbl_tarl_districts (
    id SERIAL PRIMARY KEY,
    district_name VARCHAR(100) NOT NULL,
    province_id INTEGER REFERENCES tbl_tarl_provinces(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tbl_tarl_communes (
    id SERIAL PRIMARY KEY,
    commune_name VARCHAR(100) NOT NULL,
    district_id INTEGER REFERENCES tbl_tarl_districts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tbl_tarl_villages (
    id SERIAL PRIMARY KEY,
    village_name VARCHAR(100) NOT NULL,
    commune_id INTEGER REFERENCES tbl_tarl_communes(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles and Users
CREATE TABLE tbl_tarl_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    hierarchy_level INTEGER DEFAULT 3,
    can_manage_hierarchy BOOLEAN DEFAULT false,
    max_hierarchy_depth INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tbl_tarl_schools (
    id SERIAL PRIMARY KEY,
    school_name VARCHAR(200) NOT NULL,
    school_code VARCHAR(50),
    school_type VARCHAR(50),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    principal_name VARCHAR(100),
    total_students INTEGER DEFAULT 0,
    total_teachers INTEGER DEFAULT 0,
    village_id INTEGER REFERENCES tbl_tarl_villages(id),
    commune_id INTEGER REFERENCES tbl_tarl_communes(id),
    district_id INTEGER REFERENCES tbl_tarl_districts(id),
    province_id INTEGER REFERENCES tbl_tarl_provinces(id),
    zone_id INTEGER REFERENCES tbl_tarl_zones(id),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tbl_tarl_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL,
    school_id INTEGER REFERENCES tbl_tarl_schools(id),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role) REFERENCES tbl_tarl_roles(name)
);

-- Permission System
CREATE TABLE page_permissions (
    id SERIAL PRIMARY KEY,
    page_name VARCHAR(100) NOT NULL,
    page_path VARCHAR(200) NOT NULL,
    page_title VARCHAR(200),
    icon_name VARCHAR(50),
    category VARCHAR(100),
    parent_page_id INTEGER REFERENCES page_permissions(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_page_permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    page_id INTEGER NOT NULL REFERENCES page_permissions(id),
    is_allowed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role) REFERENCES tbl_tarl_roles(name),
    UNIQUE(role, page_id)
);

CREATE TABLE page_action_permissions (
    id SERIAL PRIMARY KEY,
    page_id INTEGER NOT NULL REFERENCES page_permissions(id),
    role VARCHAR(50) NOT NULL,
    action_name VARCHAR(50) NOT NULL,
    is_allowed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role) REFERENCES tbl_tarl_roles(name),
    UNIQUE(page_id, role, action_name)
);

-- User Sessions
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES tbl_tarl_users(id),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Education Structure
CREATE TABLE tbl_tarl_subjects (
    id SERIAL PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(20),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tbl_tarl_classes (
    id SERIAL PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL,
    grade_level INTEGER,
    school_id INTEGER NOT NULL REFERENCES tbl_tarl_schools(id),
    teacher_id INTEGER REFERENCES tbl_tarl_users(id),
    academic_year VARCHAR(20),
    total_students INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tbl_tarl_students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    school_id INTEGER NOT NULL REFERENCES tbl_tarl_schools(id),
    class_id INTEGER REFERENCES tbl_tarl_classes(id),
    enrollment_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Training System
CREATE TABLE tbl_tarl_training_programs (
    id SERIAL PRIMARY KEY,
    program_name VARCHAR(200) NOT NULL,
    description TEXT,
    program_type VARCHAR(50) DEFAULT 'standard',
    duration_hours INTEGER DEFAULT 0,
    max_participants INTEGER,
    objectives TEXT,
    prerequisites TEXT,
    materials_required TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES tbl_tarl_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tbl_tarl_training_sessions (
    id SERIAL PRIMARY KEY,
    session_title VARCHAR(200) NOT NULL,
    program_id INTEGER NOT NULL REFERENCES tbl_tarl_training_programs(id),
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    duration_hours DECIMAL(4,2) DEFAULT 0,
    location VARCHAR(200),
    venue_address TEXT,
    max_participants INTEGER,
    registration_deadline DATE,
    session_status VARCHAR(20) DEFAULT 'scheduled',
    before_status VARCHAR(20) DEFAULT 'pending',
    during_status VARCHAR(20) DEFAULT 'pending',
    after_status VARCHAR(20) DEFAULT 'pending',
    trainer_id INTEGER REFERENCES tbl_tarl_users(id),
    coordinator_id INTEGER REFERENCES tbl_tarl_users(id),
    description TEXT,
    materials_needed TEXT,
    notes TEXT,
    created_by INTEGER REFERENCES tbl_tarl_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tbl_tarl_training_participants (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES tbl_tarl_training_sessions(id),
    participant_name VARCHAR(100) NOT NULL,
    participant_email VARCHAR(100) NOT NULL,
    participant_phone VARCHAR(20),
    participant_role VARCHAR(50),
    school_id INTEGER REFERENCES tbl_tarl_schools(id),
    registration_method VARCHAR(20) DEFAULT 'manual',
    registration_status VARCHAR(20) DEFAULT 'registered',
    attendance_confirmed BOOLEAN DEFAULT false,
    attendance_time TIMESTAMP,
    confirmed_by INTEGER REFERENCES tbl_tarl_users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tbl_tarl_qr_codes (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES tbl_tarl_training_sessions(id),
    code_type VARCHAR(50) NOT NULL,
    qr_data TEXT NOT NULL,
    qr_code_image TEXT,
    expires_at TIMESTAMP,
    max_usage INTEGER,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES tbl_tarl_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tbl_tarl_training_feedback (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES tbl_tarl_training_sessions(id),
    participant_id INTEGER REFERENCES tbl_tarl_training_participants(id),
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    trainer_rating INTEGER CHECK (trainer_rating >= 1 AND trainer_rating <= 5),
    content_rating INTEGER CHECK (content_rating >= 1 AND content_rating <= 5),
    venue_rating INTEGER CHECK (venue_rating >= 1 AND venue_rating <= 5),
    would_recommend BOOLEAN,
    comments TEXT,
    suggestions TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    submission_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Menu Customization
CREATE TABLE user_menu_order (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES tbl_tarl_users(id),
    page_id INTEGER NOT NULL REFERENCES page_permissions(id),
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, page_id)
);

-- Hierarchical Assignments
CREATE TABLE user_zone_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES tbl_tarl_users(id),
    zone_id INTEGER NOT NULL REFERENCES tbl_tarl_zones(id),
    assigned_by INTEGER REFERENCES tbl_tarl_users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, zone_id)
);

CREATE TABLE user_province_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES tbl_tarl_users(id),
    province_id INTEGER NOT NULL REFERENCES tbl_tarl_provinces(id),
    assigned_by INTEGER REFERENCES tbl_tarl_users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, province_id)
);

CREATE TABLE user_district_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES tbl_tarl_users(id),
    district_id INTEGER NOT NULL REFERENCES tbl_tarl_districts(id),
    assigned_by INTEGER REFERENCES tbl_tarl_users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, district_id)
);

CREATE TABLE user_school_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES tbl_tarl_users(id),
    school_id INTEGER NOT NULL REFERENCES tbl_tarl_schools(id),
    assigned_by INTEGER REFERENCES tbl_tarl_users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, school_id)
);

CREATE TABLE teacher_class_assignments (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES tbl_tarl_users(id),
    class_id INTEGER NOT NULL REFERENCES tbl_tarl_classes(id),
    subject_id INTEGER REFERENCES tbl_tarl_subjects(id),
    assigned_by INTEGER REFERENCES tbl_tarl_users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, class_id, subject_id)
);

-- Data scope permissions for hierarchical access
CREATE TABLE role_data_scope (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    scope_level VARCHAR(50) NOT NULL,
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_update BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_export BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_name) REFERENCES tbl_tarl_roles(name),
    UNIQUE(role_name, data_type, scope_level)
);

-- Indexes for performance
CREATE INDEX idx_users_role ON tbl_tarl_users(role);
CREATE INDEX idx_users_school ON tbl_tarl_users(school_id);
CREATE INDEX idx_users_email ON tbl_tarl_users(email);
CREATE INDEX idx_users_username ON tbl_tarl_users(username);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_role_page_perms ON role_page_permissions(role, page_id);
CREATE INDEX idx_action_perms ON page_action_permissions(page_id, role, action_name);
CREATE INDEX idx_training_session_date ON tbl_tarl_training_sessions(session_date);
CREATE INDEX idx_training_participants_session ON tbl_tarl_training_participants(session_id);
CREATE INDEX idx_training_feedback_session ON tbl_tarl_training_feedback(session_id);
CREATE INDEX idx_qr_codes_session ON tbl_tarl_qr_codes(session_id);
CREATE INDEX idx_schools_location ON tbl_tarl_schools(province_id, district_id);