-- =====================================================
-- NEON.TECH DATABASE SETUP FOR TARL INSIGHT HUB
-- Run this script in your Neon.tech database console
-- =====================================================

-- =====================================================
-- 1. CORE TABLES SETUP
-- =====================================================

-- Roles table
CREATE TABLE IF NOT EXISTS tbl_tarl_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS tbl_tarl_users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    role_id INTEGER,
    school_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP,
    last_login TIMESTAMP,
    session_token VARCHAR(255),
    session_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES tbl_tarl_roles(id)
);

-- Schools table
CREATE TABLE IF NOT EXISTS tbl_tarl_schools (
    id SERIAL PRIMARY KEY,
    school_id VARCHAR(50) UNIQUE,
    name_en VARCHAR(255),
    name_kh VARCHAR(255),
    province VARCHAR(100),
    district VARCHAR(100),
    commune VARCHAR(100),
    village VARCHAR(100),
    director_name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Page permissions
CREATE TABLE IF NOT EXISTS page_permissions (
    id SERIAL PRIMARY KEY,
    page_name VARCHAR(100) UNIQUE NOT NULL,
    display_name_en VARCHAR(255),
    display_name_kh VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    icon VARCHAR(100),
    url_path VARCHAR(255),
    sort_order INTEGER DEFAULT 999,
    is_active BOOLEAN DEFAULT true,
    parent_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role page permissions
CREATE TABLE IF NOT EXISTS role_page_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL,
    page_id INTEGER NOT NULL,
    can_access BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES tbl_tarl_roles(id),
    FOREIGN KEY (page_id) REFERENCES page_permissions(id),
    UNIQUE(role_id, page_id)
);

-- Training system tables
CREATE TABLE IF NOT EXISTS tbl_tarl_training_programs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_days INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tbl_tarl_training_sessions (
    id SERIAL PRIMARY KEY,
    program_id INTEGER,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    max_participants INTEGER DEFAULT 50,
    capacity INTEGER DEFAULT 50,
    agenda TEXT,
    notes TEXT,
    qr_code_data TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES tbl_tarl_training_programs(id),
    FOREIGN KEY (created_by) REFERENCES tbl_tarl_users(id)
);

CREATE TABLE IF NOT EXISTS tbl_tarl_master_participants (
    id SERIAL PRIMARY KEY,
    participant_id VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    organization VARCHAR(255),
    position VARCHAR(255),
    gender VARCHAR(10),
    age_group VARCHAR(20),
    province VARCHAR(100),
    district VARCHAR(100),
    education_level VARCHAR(100),
    teaching_experience VARCHAR(50),
    subject_specialization VARCHAR(255),
    first_session_id INTEGER,
    total_sessions_attended INTEGER DEFAULT 0,
    last_attendance_date DATE,
    attendance_rate DECIMAL(5,2) DEFAULT 0.00,
    attendance_marked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tbl_tarl_training_registrations (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    participant_id VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    organization VARCHAR(255),
    position VARCHAR(255),
    gender VARCHAR(10),
    age_group VARCHAR(20),
    province VARCHAR(100),
    district VARCHAR(100),
    education_level VARCHAR(100),
    teaching_experience VARCHAR(50),
    subject_specialization VARCHAR(255),
    registration_type VARCHAR(50) DEFAULT 'manual',
    attended BOOLEAN DEFAULT false,
    attendance_marked_at TIMESTAMP,
    attendance_marked_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES tbl_tarl_training_sessions(id)
);

-- =====================================================
-- 2. INSERT INITIAL DATA
-- =====================================================

-- Insert roles
INSERT INTO tbl_tarl_roles (name, description) VALUES
('admin', 'System Administrator'),
('teacher', 'Teacher'),
('coordinator', 'Training Coordinator'),
('participant', 'Training Participant')
ON CONFLICT (name) DO NOTHING;

-- Insert admin user (username: admin1, password: admin123)
INSERT INTO tbl_tarl_users (
    full_name, 
    email, 
    username, 
    password, 
    role, 
    role_id,
    is_active
) VALUES (
    'Admin User',
    'admin@tarl.edu.kh',
    'admin1',
    '$2b$10$kXGM3e2aNkcWHxE5LmLDYORQkK5AQ5GGLt5hVs6hZ/6kxQH8hxJl.',
    'admin',
    (SELECT id FROM tbl_tarl_roles WHERE name = 'admin'),
    true
) ON CONFLICT (username) DO UPDATE SET
    password = '$2b$10$kXGM3e2aNkcWHxE5LmLDYORQkK5AQ5GGLt5hVs6hZ/6kxQH8hxJl.',
    is_active = true,
    role = 'admin',
    role_id = (SELECT id FROM tbl_tarl_roles WHERE name = 'admin');

-- Insert basic page permissions
INSERT INTO page_permissions (page_name, display_name_en, display_name_kh, category, icon, url_path, sort_order) VALUES
('dashboard', 'Dashboard', 'ផ្ទាំងគ្រប់គ្រង', 'Overview', 'LayoutDashboard', '/dashboard', 1),
('schools', 'Schools', 'សាលារៀន', 'Management', 'School', '/schools', 2),
('users', 'Users', 'អ្នកប្រើប្រាស់', 'Management', 'Users', '/users', 3),
('training', 'Training', 'ការបណ្តុះបណ្តាល', 'Training', 'GraduationCap', '/training', 4),
('training-sessions', 'Training Sessions', 'សម័យបណ្តុះបណ្តាល', 'Training', 'Calendar', '/training/sessions', 5),
('training-participants', 'Participants', 'អ្នកចូលរួម', 'Training', 'Users', '/training/participants', 6),
('settings', 'Settings', 'ការកំណត់', 'System', 'Settings', '/settings', 10)
ON CONFLICT (page_name) DO NOTHING;

-- Grant admin access to all pages
INSERT INTO role_page_permissions (role_id, page_id, can_access)
SELECT 
    (SELECT id FROM tbl_tarl_roles WHERE name = 'admin'),
    id,
    true
FROM page_permissions
ON CONFLICT (role_id, page_id) DO UPDATE SET can_access = true;

-- Insert sample training program
INSERT INTO tbl_tarl_training_programs (name, description, duration_days) VALUES
('TaRL Methodology Training', 'Teaching at the Right Level methodology training for teachers', 3)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'Database setup completed successfully! You can now login with:' as message;
SELECT 'Username: admin1' as login_info;
SELECT 'Password: admin123' as login_info;