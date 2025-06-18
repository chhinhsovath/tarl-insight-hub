-- Reset Training Data Script
-- This script cleans all training-related tables and creates fresh test data

-- ====================================================
-- 1. CLEAN EXISTING DATA
-- ====================================================

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Clear training-related tables in correct order (respecting foreign keys)
DELETE FROM tbl_tarl_training_registrations;
DELETE FROM tbl_tarl_training_qr_codes;
DELETE FROM tbl_tarl_training_sessions;
DELETE FROM tbl_tarl_training_programs;
DELETE FROM tbl_tarl_master_participants;

-- Reset sequences
ALTER SEQUENCE tbl_tarl_training_programs_id_seq RESTART WITH 1;
ALTER SEQUENCE tbl_tarl_training_sessions_id_seq RESTART WITH 1;
ALTER SEQUENCE tbl_tarl_training_registrations_id_seq RESTART WITH 1;
ALTER SEQUENCE tbl_tarl_training_qr_codes_id_seq RESTART WITH 1;
ALTER SEQUENCE tbl_tarl_master_participants_id_seq RESTART WITH 1;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- ====================================================
-- 2. CREATE FRESH TEST DATA
-- ====================================================

-- Create 2 Training Programs
INSERT INTO tbl_tarl_training_programs (
    program_name, 
    description, 
    duration_days, 
    max_participants, 
    created_by, 
    status,
    created_at,
    updated_at
) VALUES 
(
    'Basic TaRL Methodology Training',
    'Comprehensive training on Teaching at the Right Level methodology for primary school teachers',
    5,
    30,
    1,
    'active',
    NOW(),
    NOW()
),
(
    'Advanced TaRL Implementation',
    'Advanced training focused on implementing TaRL strategies in diverse classroom environments',
    3,
    25,
    1,
    'active',
    NOW(),
    NOW()
);

-- Create 2 Training Sessions (1 per program)
INSERT INTO tbl_tarl_training_sessions (
    program_id,
    session_title,
    description,
    session_date,
    start_time,
    end_time,
    location,
    venue_address,
    max_participants,
    registration_deadline,
    session_status,
    created_by,
    created_at,
    updated_at
) VALUES 
(
    1,
    'TaRL Basic Training - Session 1',
    'Introduction to TaRL methodology with hands-on activities and group exercises',
    '2024-12-30',
    '09:00:00',
    '16:00:00',
    'Community Center Hall A',
    '123 Main Street, Phnom Penh',
    30,
    '2024-12-29 23:59:59',
    'upcoming',
    1,
    NOW(),
    NOW()
),
(
    2,
    'TaRL Advanced Training - Session 1',
    'Advanced implementation strategies and assessment techniques for experienced teachers',
    '2025-01-05',
    '08:30:00',
    '15:30:00',
    'Teacher Training Institute',
    '456 Education Blvd, Siem Reap',
    25,
    '2025-01-04 23:59:59',
    'upcoming',
    1,
    NOW(),
    NOW()
);

-- Create Master Participants (for linking registrations)
INSERT INTO tbl_tarl_master_participants (
    email,
    name,
    phone,
    created_at,
    updated_at
) VALUES 
(
    'john.teacher@school.edu',
    'John Doe',
    '+855123456789',
    NOW(),
    NOW()
),
(
    'mary.educator@school.edu', 
    'Mary Smith',
    '+855987654321',
    NOW(),
    NOW()
),
(
    'peter.wilson@school.edu',
    'Peter Wilson',
    '+855555666777',
    NOW(),
    NOW()
),
(
    'sarah.jones@school.edu',
    'Sarah Jones',
    '+855111222333',
    NOW(),
    NOW()
);

-- Create 2 Registrations per Session (4 total)
INSERT INTO tbl_tarl_training_registrations (
    session_id,
    participant_email,
    participant_name,
    participant_phone,
    participant_role,
    school_name,
    district,
    province,
    attendance_status,
    registration_method,
    master_participant_id,
    created_at,
    updated_at
) VALUES 
-- Session 1 registrations
(
    1,
    'john.teacher@school.edu',
    'John Doe',
    '+855123456789',
    'Teacher',
    'Sunrise Primary School',
    'Daun Penh',
    'Phnom Penh',
    'registered',
    'online',
    1,
    NOW(),
    NOW()
),
(
    1,
    'mary.educator@school.edu',
    'Mary Smith',
    '+855987654321',
    'Coordinator',
    'Golden Star Elementary',
    'Chamkar Mon',
    'Phnom Penh',
    'attended',
    'online',
    2,
    NOW(),
    NOW()
),
-- Session 2 registrations  
(
    2,
    'peter.wilson@school.edu',
    'Peter Wilson',
    '+855555666777',
    'Teacher',
    'Angkor Primary School',
    'Siem Reap',
    'Siem Reap',
    'registered',
    'online',
    3,
    NOW(),
    NOW()
),
(
    2,
    'sarah.jones@school.edu',
    'Sarah Jones',
    '+855111222333',
    'Teacher',
    'Bayon Elementary School',
    'Siem Reap',
    'Siem Reap',
    'registered',
    'online',
    4,
    NOW(),
    NOW()
);

-- Create 2 QR Codes per Session (4 total)
INSERT INTO tbl_tarl_training_qr_codes (
    session_id,
    qr_code,
    qr_data,
    registration_id,
    participant_email,
    is_used,
    created_at,
    updated_at
) VALUES 
-- Session 1 QR codes
(
    1,
    'QR_SESSION1_JOHN_001',
    '{"session_id": 1, "registration_id": 1, "email": "john.teacher@school.edu", "name": "John Doe"}',
    1,
    'john.teacher@school.edu',
    false,
    NOW(),
    NOW()
),
(
    1,
    'QR_SESSION1_MARY_002',
    '{"session_id": 1, "registration_id": 2, "email": "mary.educator@school.edu", "name": "Mary Smith"}',
    2,
    'mary.educator@school.edu',
    false,
    NOW(),
    NOW()
),
-- Session 2 QR codes
(
    2,
    'QR_SESSION2_PETER_003',
    '{"session_id": 2, "registration_id": 3, "email": "peter.wilson@school.edu", "name": "Peter Wilson"}',
    3,
    'peter.wilson@school.edu',
    false,
    NOW(),
    NOW()
),
(
    2,
    'QR_SESSION2_SARAH_004',
    '{"session_id": 2, "registration_id": 4, "email": "sarah.jones@school.edu", "name": "Sarah Jones"}',
    4,
    'sarah.jones@school.edu',
    false,
    NOW(),
    NOW()
);

-- ====================================================
-- 3. VERIFY DATA CREATION
-- ====================================================

-- Show summary of created data
SELECT 
    'SUMMARY OF TRAINING DATA RESET' as info,
    '' as details
UNION ALL
SELECT 
    'Programs Created:', 
    COUNT(*)::text 
FROM tbl_tarl_training_programs
UNION ALL
SELECT 
    'Sessions Created:', 
    COUNT(*)::text 
FROM tbl_tarl_training_sessions
UNION ALL
SELECT 
    'Master Participants Created:', 
    COUNT(*)::text 
FROM tbl_tarl_master_participants
UNION ALL
SELECT 
    'Registrations Created:', 
    COUNT(*)::text 
FROM tbl_tarl_training_registrations
UNION ALL
SELECT 
    'QR Codes Created:', 
    COUNT(*)::text 
FROM tbl_tarl_training_qr_codes;

-- Show detailed breakdown
SELECT 
    'PROGRAM DETAILS' as section,
    program_name as name,
    description,
    max_participants::text as capacity,
    status
FROM tbl_tarl_training_programs
UNION ALL
SELECT 
    'SESSION DETAILS' as section,
    session_title as name,
    location as description,
    max_participants::text as capacity,
    session_status as status
FROM tbl_tarl_training_sessions
ORDER BY section, name;