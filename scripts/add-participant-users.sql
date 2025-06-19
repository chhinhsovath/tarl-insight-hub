-- Add Participant Role Users to Database
-- This script adds demo participant users for training portal access

-- First, add 'Training Portal' page to permissions if not exists
INSERT INTO page_permissions (page_name, page_path, description, icon_name, created_at, updated_at, sort_order, parent_page_id, is_parent_menu, menu_level)
SELECT 'Training Portal', '/training/participant', 'Participant Portal', 'User', NOW(), NOW(), 30, null, false, 0
WHERE NOT EXISTS (
    SELECT 1 FROM page_permissions WHERE page_path = '/training/participant'
);

-- Add role page permissions for participants
INSERT INTO role_page_permissions (role, page_id, is_allowed, created_at, updated_at)
SELECT 'participant', pp.id, true, NOW(), NOW()
FROM page_permissions pp 
WHERE pp.page_path = '/training/participant'
AND NOT EXISTS (
    SELECT 1 FROM role_page_permissions rpp 
    WHERE rpp.role = 'participant' AND rpp.page_id = pp.id
);

-- Add participants access to training-related pages
INSERT INTO role_page_permissions (role, page_id, is_allowed, created_at, updated_at)
SELECT 'participant', pp.id, true, NOW(), NOW()
FROM page_permissions pp 
WHERE pp.page_path IN ('/training', '/training/feedback')
AND NOT EXISTS (
    SELECT 1 FROM role_page_permissions rpp 
    WHERE rpp.role = 'participant' AND rpp.page_id = pp.id
);

-- Insert participant users with simple password (will be updated to proper hash)
INSERT INTO tbl_tarl_users (
    full_name, 
    email, 
    phone, 
    role, 
    username,
    password,
    is_active,
    created_at, 
    updated_at
) VALUES 
(
    'Ms. Sophea Demo (Participant)',
    'participant1@tarl.edu.kh',
    '+855-12-345-678',
    'participant',
    'participant1',
    'temp_password_123',  -- This will be updated by admin
    true,
    NOW(),
    NOW()
),
(
    'Mr. Pisach Demo (Participant)', 
    'participant2@tarl.edu.kh',
    '+855-12-345-679',
    'participant',
    'participant2',
    'temp_password_123',  -- This will be updated by admin
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    username = EXCLUDED.username,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Create corresponding training participants entries
-- First, get a session ID for demo purposes (create one if needed)
WITH demo_session AS (
    SELECT id FROM tbl_tarl_training_sessions LIMIT 1
),
user_data AS (
    SELECT u.id as user_id, u.full_name, u.email, u.phone, ds.id as session_id 
    FROM tbl_tarl_users u, demo_session ds
    WHERE u.username IN ('participant1', 'participant2')
)
INSERT INTO tbl_tarl_training_participants (
    session_id,
    participant_name,
    participant_email,
    participant_phone,
    participant_role,
    school_name,
    district,
    province,
    registration_method,
    registration_status,
    attendance_confirmed,
    created_at,
    updated_at
)
SELECT 
    ud.session_id,
    ud.full_name,
    ud.email,
    ud.phone,
    'Teacher',
    'Demo Training School',
    'Phnom Penh',
    'Phnom Penh',
    'admin',
    'registered',
    true,
    NOW(),
    NOW()
FROM user_data ud
ON CONFLICT DO NOTHING;

-- Create master participant entries for participant tracking
INSERT INTO tbl_tarl_master_participants (
    full_name,
    email,
    phone,
    organization,
    role,
    total_sessions_attended,
    first_training_date,
    last_training_date,
    created_at,
    updated_at
)
SELECT 
    u.full_name,
    u.email,
    u.phone,
    'Demo Training School',
    'Teacher',
    1,
    NOW(),
    NOW(),
    NOW(),
    NOW()
FROM tbl_tarl_users u
WHERE u.username IN ('participant1', 'participant2')
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    organization = EXCLUDED.organization,
    updated_at = NOW();

-- Output success message
SELECT 
    'Participant users created successfully!' as message,
    COUNT(*) as users_created
FROM tbl_tarl_users 
WHERE username IN ('participant1', 'participant2');