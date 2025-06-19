-- Complete Training System Setup Script
-- This script ensures all training functionality is properly set up

-- ====================================================
-- 1. CREATE/FIX ADMIN USER
-- ====================================================

-- First check if admin role exists
INSERT INTO tbl_tarl_roles (name, description, created_at, updated_at)
SELECT 'admin', 'System Administrator', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM tbl_tarl_roles WHERE name = 'admin');

-- Create admin1 user if not exists
-- Password: admin123 (bcrypt hash)
INSERT INTO tbl_tarl_users (
    full_name, 
    email, 
    username, 
    password, 
    role, 
    role_id,
    is_active,
    created_at,
    updated_at
) VALUES (
    'Admin User',
    'admin@tarl.edu.kh',
    'admin1',
    '$2b$10$kXGM3e2aNkcWHxE5LmLDYORQkK5AQ5GGLt5hVs6hZ/6kxQH8hxJl.',
    'admin',
    (SELECT id FROM tbl_tarl_roles WHERE name = 'admin'),
    true,
    NOW(),
    NOW()
) ON CONFLICT (username) DO UPDATE SET
    password = '$2b$10$kXGM3e2aNkcWHxE5LmLDYORQkK5AQ5GGLt5hVs6hZ/6kxQH8hxJl.',
    is_active = true,
    role = 'admin',
    role_id = (SELECT id FROM tbl_tarl_roles WHERE name = 'admin');

-- ====================================================
-- 2. FIX COLUMN INCONSISTENCIES
-- ====================================================

DO $$
BEGIN
    -- Fix tbl_tarl_training_sessions columns
    -- Add capacity column if only max_participants exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tbl_tarl_training_sessions' AND column_name = 'max_participants')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'tbl_tarl_training_sessions' AND column_name = 'capacity') THEN
        ALTER TABLE tbl_tarl_training_sessions ADD COLUMN capacity INTEGER;
        UPDATE tbl_tarl_training_sessions SET capacity = max_participants;
    END IF;

    -- Add missing columns to sessions table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_sessions' AND column_name = 'agenda') THEN
        ALTER TABLE tbl_tarl_training_sessions ADD COLUMN agenda TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_sessions' AND column_name = 'notes') THEN
        ALTER TABLE tbl_tarl_training_sessions ADD COLUMN notes TEXT;
    END IF;

    -- Add missing columns to registrations table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_registrations' AND column_name = 'attendance_marked_at') THEN
        ALTER TABLE tbl_tarl_training_registrations ADD COLUMN attendance_marked_at TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_registrations' AND column_name = 'attendance_marked_by') THEN
        ALTER TABLE tbl_tarl_training_registrations ADD COLUMN attendance_marked_by VARCHAR(255);
    END IF;

    -- Add missing columns to master participants
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_master_participants' AND column_name = 'attendance_marked_at') THEN
        ALTER TABLE tbl_tarl_master_participants ADD COLUMN attendance_marked_at TIMESTAMP;
    END IF;

    -- Create QR usage log table if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'tbl_tarl_qr_usage_log') THEN
        CREATE TABLE tbl_tarl_qr_usage_log (
            id SERIAL PRIMARY KEY,
            qr_code_id INTEGER,
            session_id INTEGER,
            participant_id VARCHAR(255),
            action_type VARCHAR(50),
            scan_result VARCHAR(50),
            user_agent TEXT,
            ip_address VARCHAR(45),
            scan_data JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_qr_usage_session ON tbl_tarl_qr_usage_log(session_id);
        CREATE INDEX idx_qr_usage_qr_code ON tbl_tarl_qr_usage_log(qr_code_id);
    END IF;

    -- Create user activities table if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'tbl_tarl_user_activities') THEN
        CREATE TABLE tbl_tarl_user_activities (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES tbl_tarl_users(id),
            action VARCHAR(100),
            details JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_user_activities_user ON tbl_tarl_user_activities(user_id);
        CREATE INDEX idx_user_activities_action ON tbl_tarl_user_activities(action);
    END IF;

END $$;

-- ====================================================
-- 3. CREATE SAMPLE TRAINING DATA
-- ====================================================

-- Create sample training program if none exist
INSERT INTO tbl_tarl_training_programs (
    program_name, 
    description, 
    program_type,
    duration_hours, 
    created_by, 
    is_active
)
SELECT 
    'TaRL Basic Training Program',
    'Comprehensive training on Teaching at the Right Level methodology',
    'standard',
    16,
    (SELECT id FROM tbl_tarl_users WHERE username = 'admin1'),
    true
WHERE NOT EXISTS (SELECT 1 FROM tbl_tarl_training_programs);

-- Create sample training session if none exist
INSERT INTO tbl_tarl_training_sessions (
    program_id,
    session_title,
    session_date,
    session_time,
    location,
    venue_address,
    max_participants,
    capacity,
    registration_deadline,
    session_status,
    created_by,
    is_active,
    agenda,
    notes
)
SELECT 
    (SELECT id FROM tbl_tarl_training_programs LIMIT 1),
    'TaRL Training Session - January 2025',
    '2025-01-15',
    '09:00:00',
    'Education Center - Room A',
    '123 Main Street, City Center',
    30,
    30,
    '2025-01-14',
    'scheduled',
    (SELECT id FROM tbl_tarl_users WHERE username = 'admin1'),
    true,
    '1. Introduction to TaRL (9:00-10:30)
2. Break (10:30-10:45)
3. Hands-on Activities (10:45-12:00)
4. Lunch Break (12:00-13:00)
5. Group Work (13:00-15:00)
6. Q&A Session (15:00-16:00)',
    'Please bring your teaching materials for the hands-on session.'
WHERE NOT EXISTS (SELECT 1 FROM tbl_tarl_training_sessions);

-- ====================================================
-- 4. GRANT PERMISSIONS FOR TRAINING PAGES
-- ====================================================

-- Ensure training pages exist in page_permissions
INSERT INTO page_permissions (page_name, display_name, category, icon_name, route_path, sort_order, is_active)
VALUES 
    ('training-dashboard', 'Training Dashboard', 'Training', 'Award', '/training', 50, true),
    ('training-sessions', 'Training Sessions', 'Training', 'Calendar', '/training/sessions', 51, true),
    ('training-participants', 'Participants', 'Training', 'Users', '/training/participants', 52, true),
    ('training-programs', 'Programs', 'Training', 'BookOpen', '/training/programs', 53, true),
    ('training-qr-codes', 'QR Codes', 'Training', 'QrCode', '/training/qr-codes', 54, true),
    ('training-feedback', 'Feedback', 'Training', 'MessageSquare', '/training/feedback', 55, true)
ON CONFLICT (page_name) DO UPDATE SET
    is_active = true,
    category = 'Training';

-- Grant admin role access to all training pages
INSERT INTO role_page_permissions (role_id, page_id, can_access)
SELECT 
    (SELECT id FROM tbl_tarl_roles WHERE name = 'admin'),
    p.id,
    true
FROM page_permissions p
WHERE p.category = 'Training'
ON CONFLICT (role_id, page_id) DO UPDATE SET can_access = true;

-- Grant action permissions for training pages
INSERT INTO page_action_permissions (page_id, role_id, action_name, is_allowed)
SELECT 
    p.id,
    (SELECT id FROM tbl_tarl_roles WHERE name = 'admin'),
    a.action_name,
    true
FROM page_permissions p
CROSS JOIN (VALUES ('view'), ('create'), ('update'), ('delete'), ('export')) AS a(action_name)
WHERE p.category = 'Training'
ON CONFLICT (page_id, role_id, action_name) DO UPDATE SET is_allowed = true;

-- ====================================================
-- 5. VERIFY SETUP
-- ====================================================

-- Show setup summary
SELECT 'TRAINING SYSTEM SETUP COMPLETE' as status, '' as details
UNION ALL
SELECT 'Admin User:', CASE WHEN EXISTS (SELECT 1 FROM tbl_tarl_users WHERE username = 'admin1' AND is_active = true) THEN '✓ Created/Updated' ELSE '✗ Missing' END
UNION ALL
SELECT 'Training Programs:', COUNT(*)::text || ' programs' FROM tbl_tarl_training_programs WHERE is_active = true
UNION ALL
SELECT 'Training Sessions:', COUNT(*)::text || ' sessions' FROM tbl_tarl_training_sessions WHERE is_active = true
UNION ALL
SELECT 'Training Pages:', COUNT(*)::text || ' pages accessible' FROM page_permissions WHERE category = 'Training' AND is_active = true
UNION ALL
SELECT 'Column Status:', 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_tarl_training_sessions' AND column_name = 'capacity')
        THEN '✓ Fixed' 
        ELSE '✗ Need to fix' 
    END;

-- Show admin login credentials
SELECT 
    'LOGIN CREDENTIALS' as info,
    'Username: admin1' as credentials,
    'Password: admin123' as password;