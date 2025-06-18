-- Reset Training Data Script (Corrected)
-- This script cleans all training-related tables and creates fresh test data

-- ====================================================
-- 1. CLEAN EXISTING DATA
-- ====================================================

-- Clear training-related tables in correct order (respecting foreign keys)
DELETE FROM tbl_tarl_qr_usage_log;
DELETE FROM tbl_tarl_training_feedback;
DELETE FROM tbl_tarl_training_attendance;
DELETE FROM tbl_tarl_training_participants;
DELETE FROM tbl_tarl_training_registrations;
DELETE FROM tbl_tarl_qr_codes;
DELETE FROM tbl_tarl_training_sessions;
DELETE FROM tbl_tarl_training_programs;
DELETE FROM tbl_tarl_master_participants;

-- Reset sequences
SELECT setval('tbl_tarl_training_programs_id_seq', 1, false);
SELECT setval('tbl_tarl_training_sessions_id_seq', 1, false);
SELECT setval('tbl_tarl_training_registrations_id_seq', 1, false);
SELECT setval('tbl_tarl_qr_codes_id_seq', 1, false);
SELECT setval('tbl_tarl_master_participants_id_seq', 1, false);

-- ====================================================
-- 2. CREATE FRESH TEST DATA
-- ====================================================

-- Create 2 Training Programs
INSERT INTO tbl_tarl_training_programs (
    program_name, 
    description, 
    program_type,
    duration_hours, 
    created_by, 
    is_active,
    created_at,
    updated_at
) VALUES 
(
    'Basic TaRL Methodology Training',
    'Comprehensive training on Teaching at the Right Level methodology for primary school teachers',
    'standard',
    16,
    1,
    true,
    NOW(),
    NOW()
),
(
    'Advanced TaRL Implementation',
    'Advanced training focused on implementing TaRL strategies in diverse classroom environments',
    'advanced',
    24,
    1,
    true,
    NOW(),
    NOW()
);

-- Create 2 Training Sessions (1 per program)
INSERT INTO tbl_tarl_training_sessions (
    program_id,
    session_title,
    session_date,
    session_time,
    location,
    venue_address,
    max_participants,
    registration_deadline,
    session_status,
    created_by,
    is_active,
    created_at,
    updated_at,
    agenda,
    notes
) VALUES 
(
    1,
    'TaRL Basic Training - Session 1',
    '2024-12-30',
    '09:00:00',
    'Community Center Hall A',
    '123 Main Street, Phnom Penh',
    30,
    '2024-12-29',
    'scheduled',
    1,
    true,
    NOW(),
    NOW(),
    'Introduction to TaRL methodology, hands-on activities, group exercises',
    'First session of basic training program'
),
(
    2,
    'TaRL Advanced Training - Session 1',
    '2025-01-05',
    '08:30:00',
    'Teacher Training Institute',
    '456 Education Blvd, Siem Reap',
    25,
    '2025-01-04',
    'scheduled',
    1,
    true,
    NOW(),
    NOW(),
    'Advanced implementation strategies, assessment techniques',
    'Advanced training for experienced teachers'
);

-- Create Master Participants (for linking registrations)
INSERT INTO tbl_tarl_master_participants (
    email,
    full_name,
    phone,
    role,
    organization,
    district,
    province,
    created_at,
    updated_at
) VALUES 
(
    'john.teacher@school.edu',
    'John Doe',
    '+855123456789',
    'Teacher',
    'Sunrise Primary School',
    'Daun Penh',
    'Phnom Penh',
    NOW(),
    NOW()
),
(
    'mary.educator@school.edu', 
    'Mary Smith',
    '+855987654321',
    'Coordinator',
    'Golden Star Elementary',
    'Chamkar Mon',
    'Phnom Penh',
    NOW(),
    NOW()
),
(
    'peter.wilson@school.edu',
    'Peter Wilson',
    '+855555666777',
    'Teacher',
    'Angkor Primary School',
    'Siem Reap',
    'Siem Reap',
    NOW(),
    NOW()
),
(
    'sarah.jones@school.edu',
    'Sarah Jones',
    '+855111222333',
    'Teacher',
    'Bayon Elementary School',
    'Siem Reap',
    'Siem Reap',
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
    is_active,
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
    true,
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
    true,
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
    true,
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
    true,
    NOW(),
    NOW()
);

-- Create 2 QR Codes per Session (4 total)
INSERT INTO tbl_tarl_qr_codes (
    code_type,
    session_id,
    qr_data,
    usage_count,
    max_usage,
    is_active,
    created_by,
    created_at
) VALUES 
-- Session 1 QR codes
(
    'attendance',
    1,
    '{"session_id": 1, "registration_id": 1, "email": "john.teacher@school.edu", "name": "John Doe", "type": "attendance"}',
    0,
    1,
    true,
    1,
    NOW()
),
(
    'attendance',
    1,
    '{"session_id": 1, "registration_id": 2, "email": "mary.educator@school.edu", "name": "Mary Smith", "type": "attendance"}',
    0,
    1,
    true,
    1,
    NOW()
),
-- Session 2 QR codes
(
    'attendance',
    2,
    '{"session_id": 2, "registration_id": 3, "email": "peter.wilson@school.edu", "name": "Peter Wilson", "type": "attendance"}',
    0,
    1,
    true,
    1,
    NOW()
),
(
    'attendance',
    2,
    '{"session_id": 2, "registration_id": 4, "email": "sarah.jones@school.edu", "name": "Sarah Jones", "type": "attendance"}',
    0,
    1,
    true,
    1,
    NOW()
);

-- ====================================================
-- 3. VERIFY DATA CREATION
-- ====================================================

-- Show summary of created data
SELECT 
    'SUMMARY - TRAINING DATA RESET COMPLETE' as info,
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
FROM tbl_tarl_qr_codes;

-- Show session details with registration counts
SELECT 
    'SESSION DETAILS' as section,
    s.id::text as session_id,
    s.session_title,
    s.location,
    s.session_date::text,
    s.max_participants::text as capacity,
    COUNT(r.id)::text as registrations,
    s.session_status
FROM tbl_tarl_training_sessions s
LEFT JOIN tbl_tarl_training_registrations r ON s.id = r.session_id AND r.is_active = true
GROUP BY s.id, s.session_title, s.location, s.session_date, s.max_participants, s.session_status
ORDER BY s.id;