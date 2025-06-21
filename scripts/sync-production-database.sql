-- =====================================================
-- PRODUCTION DATABASE SYNCHRONIZATION SCRIPT
-- This ensures all tables and structures match the latest local development
-- =====================================================

-- Enable error handling
\set ON_ERROR_STOP on

-- Start transaction for safety
BEGIN;

-- =====================================================
-- 1. MASTER SCHEMA APPLICATION
-- =====================================================
\echo '🔄 Applying Master Schema...'

-- Apply the complete master schema
\i scripts/99_master_schema.sql

-- =====================================================
-- 2. TRAINING MANAGEMENT SYSTEM
-- =====================================================
\echo '🔄 Applying Training Management Schema...'

-- Apply training system schema
\i scripts/training_management_schema.sql

-- =====================================================
-- 3. PERMISSIONS SYSTEM
-- =====================================================
\echo '🔄 Applying Permissions Schema...'

-- Permissions system tables
CREATE TABLE IF NOT EXISTS page_permissions (
    id SERIAL PRIMARY KEY,
    page_name VARCHAR(100) UNIQUE NOT NULL,
    page_title VARCHAR(200) NOT NULL,
    page_title_kh VARCHAR(200),
    page_name_kh VARCHAR(200),
    page_path VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    icon VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tbl_tarl_roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    role_description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_page_permissions (
    id SERIAL PRIMARY KEY,
    page_id INTEGER REFERENCES page_permissions(id) ON DELETE CASCADE,
    role_name VARCHAR(50) NOT NULL,
    is_allowed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(page_id, role_name)
);

CREATE TABLE IF NOT EXISTS page_action_permissions (
    id SERIAL PRIMARY KEY,
    page_id INTEGER REFERENCES page_permissions(id) ON DELETE CASCADE,
    role_name VARCHAR(50) NOT NULL,
    action_name VARCHAR(50) NOT NULL,
    is_allowed BOOLEAN DEFAULT false,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(page_id, role_name, action_name)
);

CREATE TABLE IF NOT EXISTS user_menu_order (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES tbl_tarl_users(id) ON DELETE CASCADE,
    page_id INTEGER REFERENCES page_permissions(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, page_id)
);

CREATE TABLE IF NOT EXISTS permission_audit_log (
    id SERIAL PRIMARY KEY,
    page_id INTEGER,
    role_name VARCHAR(50),
    action_name VARCHAR(50),
    old_value BOOLEAN,
    new_value BOOLEAN,
    changed_by INTEGER REFERENCES tbl_tarl_users(id),
    change_type VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 4. SESSION MANAGEMENT
-- =====================================================
\echo '🔄 Ensuring Session Management...'

CREATE TABLE IF NOT EXISTS tbl_tarl_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES tbl_tarl_users(id) ON DELETE CASCADE,
    username VARCHAR(255),
    role VARCHAR(50),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 5. TRAINING SYSTEM ENHANCEMENTS
-- =====================================================
\echo '🔄 Applying Training System Enhancements...'

-- Enhanced training feedback table
CREATE TABLE IF NOT EXISTS tbl_tarl_training_feedback (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES tbl_tarl_training_sessions(id),
    participant_id INTEGER REFERENCES tbl_tarl_training_participants(id),
    feedback_data JSONB,
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    trainer_rating INTEGER CHECK (trainer_rating >= 1 AND trainer_rating <= 5),
    content_rating INTEGER CHECK (content_rating >= 1 AND content_rating <= 5),
    venue_rating INTEGER CHECK (venue_rating >= 1 AND venue_rating <= 5),
    would_recommend BOOLEAN,
    comments TEXT,
    suggestions TEXT,
    submitted_via VARCHAR(20) DEFAULT 'manual',
    is_anonymous BOOLEAN DEFAULT false,
    submission_time TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Training registrations table (separate from participants)
CREATE TABLE IF NOT EXISTS tbl_tarl_training_registrations (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES tbl_tarl_training_sessions(id),
    participant_name VARCHAR(255) NOT NULL,
    participant_email VARCHAR(255) NOT NULL,
    participant_phone VARCHAR(20),
    participant_role VARCHAR(100),
    school_name VARCHAR(255),
    district VARCHAR(100),
    province VARCHAR(100),
    registration_method VARCHAR(20) DEFAULT 'qr_code',
    registration_data JSONB,
    attendance_status VARCHAR(20) DEFAULT 'registered',
    attendance_marked_at TIMESTAMP,
    qr_code_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(session_id, participant_email)
);

-- Training materials enhancements
DO $$
BEGIN
    -- Add missing columns to training materials
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_tarl_training_materials' AND column_name = 'program_id') THEN
        ALTER TABLE tbl_tarl_training_materials ADD COLUMN program_id INTEGER REFERENCES tbl_tarl_training_programs(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_tarl_training_materials' AND column_name = 'material_name') THEN
        ALTER TABLE tbl_tarl_training_materials ADD COLUMN material_name VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_tarl_training_materials' AND column_name = 'external_url') THEN
        ALTER TABLE tbl_tarl_training_materials ADD COLUMN external_url VARCHAR(500);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_tarl_training_materials' AND column_name = 'sort_order') THEN
        ALTER TABLE tbl_tarl_training_materials ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_tarl_training_materials' AND column_name = 'file_size') THEN
        ALTER TABLE tbl_tarl_training_materials ADD COLUMN file_size BIGINT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_tarl_training_materials' AND column_name = 'file_type') THEN
        ALTER TABLE tbl_tarl_training_materials ADD COLUMN file_type VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_tarl_training_materials' AND column_name = 'original_filename') THEN
        ALTER TABLE tbl_tarl_training_materials ADD COLUMN original_filename VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_tarl_training_materials' AND column_name = 'is_required') THEN
        ALTER TABLE tbl_tarl_training_materials ADD COLUMN is_required BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_tarl_training_materials' AND column_name = 'created_by') THEN
        ALTER TABLE tbl_tarl_training_materials ADD COLUMN created_by INTEGER REFERENCES tbl_tarl_users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_tarl_training_materials' AND column_name = 'is_active') THEN
        ALTER TABLE tbl_tarl_training_materials ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Fix training sessions table structure
DO $$
BEGIN
    -- Add missing columns to training sessions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_tarl_training_sessions' AND column_name = 'agenda') THEN
        ALTER TABLE tbl_tarl_training_sessions ADD COLUMN agenda TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_tarl_training_sessions' AND column_name = 'notes') THEN
        ALTER TABLE tbl_tarl_training_sessions ADD COLUMN notes TEXT;
    END IF;
END $$;

-- =====================================================
-- 6. SCHOOL TABLE ALIAS CREATION
-- =====================================================
\echo '🔄 Creating School Table Aliases...'

-- Create view/alias for school references in training system
CREATE OR REPLACE VIEW tbl_tarl_schools AS 
SELECT 
    "sclAutoID",
    "sclName",
    "sclCode",
    "sclCommune",
    "sclDistrict", 
    "sclProvince",
    "sclZone",
    "sclStatus",
    created_at,
    updated_at
FROM tbl_tarl_school_list;

-- =====================================================
-- 7. DEFAULT DATA INSERTION
-- =====================================================
\echo '🔄 Inserting Default Data...'

-- Insert default roles
INSERT INTO tbl_tarl_roles (role_name, role_description) VALUES
('admin', 'System Administrator'),
('director', 'Program Director'),
('partner', 'Partner Organization'),
('coordinator', 'Training Coordinator'),
('teacher', 'Teacher/Trainer'),
('collector', 'Data Collector')
ON CONFLICT (role_name) DO NOTHING;

-- Insert default page permissions
INSERT INTO page_permissions (page_name, page_title, page_title_kh, page_name_kh, page_path, category, icon, sort_order) VALUES
('dashboard', 'Dashboard', 'ផ្ទាំងគ្រប់គ្រង', 'ផ្ទាំងគ្រប់គ្រង', '/dashboard', 'overview', 'LayoutDashboard', 1),
('schools', 'Schools', 'សាលារៀន', 'សាលារៀន', '/schools', 'management', 'School', 2),
('users', 'Users', 'អ្នកប្រើប្រាស់', 'អ្នកប្រើប្រាស់', '/users', 'management', 'Users', 3),
('training', 'Training', 'បណ្តុះបណ្តាល', 'បណ្តុះបណ្តាល', '/training', 'training', 'GraduationCap', 4),
('training-programs', 'Training Programs', 'កម្មវិធីបណ្តុះបណ្តាល', 'កម្មវិធីបណ្តុះបណ្តាល', '/training/programs', 'training', 'BookOpen', 5),
('training-sessions', 'Training Sessions', 'វគ្គបណ្តុះបណ្តាល', 'វគ្គបណ្តុះបណ្តាល', '/training/sessions', 'training', 'Calendar', 6),
('training-participants', 'Participants', 'អ្នកចូលរួម', 'អ្នកចូលរួម', '/training/participants', 'training', 'Users', 7),
('training-feedback', 'Training Feedback', 'មតិយោបល់', 'មតិយោបល់', '/training/feedback', 'training', 'MessageSquare', 8),
('training-qr-codes', 'QR Codes', 'លេខកូដ QR', 'លេខកូដ QR', '/training/qr-codes', 'training', 'QrCode', 9)
ON CONFLICT (page_name) DO UPDATE SET
    page_title_kh = EXCLUDED.page_title_kh,
    page_name_kh = EXCLUDED.page_name_kh,
    updated_at = NOW();

-- =====================================================
-- 8. INDEXES AND PERFORMANCE OPTIMIZATION
-- =====================================================
\echo '🔄 Creating Performance Indexes...'

-- Training system indexes
CREATE INDEX IF NOT EXISTS idx_training_sessions_program ON tbl_tarl_training_sessions(program_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_trainer ON tbl_tarl_training_sessions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_coordinator ON tbl_tarl_training_sessions(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_training_participants_session ON tbl_tarl_training_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_training_participants_email ON tbl_tarl_training_participants(participant_email);
CREATE INDEX IF NOT EXISTS idx_training_materials_program ON tbl_tarl_training_materials(program_id);
CREATE INDEX IF NOT EXISTS idx_training_materials_session ON tbl_tarl_training_materials(session_id);
CREATE INDEX IF NOT EXISTS idx_training_feedback_session ON tbl_tarl_training_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_training_feedback_participant ON tbl_tarl_training_feedback(participant_id);
CREATE INDEX IF NOT EXISTS idx_training_registrations_session ON tbl_tarl_training_registrations(session_id);
CREATE INDEX IF NOT EXISTS idx_training_registrations_email ON tbl_tarl_training_registrations(participant_email);

-- Session management indexes
CREATE INDEX IF NOT EXISTS idx_sessions_token ON tbl_tarl_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON tbl_tarl_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON tbl_tarl_sessions(expires_at);

-- Permission system indexes
CREATE INDEX IF NOT EXISTS idx_role_page_permissions_role ON role_page_permissions(role_name);
CREATE INDEX IF NOT EXISTS idx_role_page_permissions_page ON role_page_permissions(page_id);
CREATE INDEX IF NOT EXISTS idx_page_action_permissions_role ON page_action_permissions(role_name);
CREATE INDEX IF NOT EXISTS idx_page_action_permissions_page ON page_action_permissions(page_id);
CREATE INDEX IF NOT EXISTS idx_user_menu_order_user ON user_menu_order(user_id);

-- =====================================================
-- 9. UPDATE EXISTING DATA
-- =====================================================
\echo '🔄 Updating Existing Data...'

-- Update any existing user roles to match our system
UPDATE tbl_tarl_users SET role = 'collector' WHERE role = 'data_collector';
UPDATE tbl_tarl_users SET role = 'coordinator' WHERE role = 'training_coordinator';

-- Ensure all users have proper role values
UPDATE tbl_tarl_users SET role = 'teacher' 
WHERE role NOT IN ('admin', 'director', 'partner', 'coordinator', 'teacher', 'collector');

-- =====================================================
-- 10. FINAL VALIDATION
-- =====================================================
\echo '🔄 Running Final Validation...'

-- Check that all critical tables exist
DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    table_name TEXT;
    required_tables TEXT[] := ARRAY[
        'tbl_tarl_users',
        'tbl_tarl_school_list', 
        'tbl_tarl_training_programs',
        'tbl_tarl_training_sessions',
        'tbl_tarl_training_participants',
        'tbl_tarl_training_materials',
        'tbl_tarl_training_feedback',
        'tbl_tarl_training_flow',
        'tbl_tarl_qr_codes',
        'tbl_tarl_qr_usage_log',
        'page_permissions',
        'tbl_tarl_roles',
        'role_page_permissions',
        'page_action_permissions',
        'tbl_tarl_sessions'
    ];
BEGIN
    FOREACH table_name IN ARRAY required_tables
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name) THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Missing required tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '✅ All required tables are present';
    END IF;
END $$;

-- Commit all changes
COMMIT;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
\echo ''
\echo '✅ Production Database Synchronization Complete!'
\echo '=============================================='
\echo '✅ Master schema applied'
\echo '✅ Training management system updated'
\echo '✅ Permissions system configured'
\echo '✅ Session management tables ready'
\echo '✅ Performance indexes created'
\echo '✅ Default data inserted'
\echo '✅ All validations passed'
\echo ''
\echo '🎉 Your production database is now fully synchronized!'
\echo ''