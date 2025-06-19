-- Create a demo participant account for testing
-- This script creates a training program, session, and participant registration

-- Check if we need to create a demo training program first
INSERT INTO tbl_tarl_training_programs (
    program_name,
    description,
    program_type,
    duration_hours,
    is_active,
    created_by,
    created_at,
    updated_at
) 
SELECT 
    'Demo Training Program',
    'A demo training program for participant portal testing',
    'workshop',
    8,
    true,
    1, -- Assuming admin user ID is 1
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM tbl_tarl_training_programs WHERE program_name = 'Demo Training Program'
);

-- Get the program ID and create sessions and registrations
DO $$
DECLARE
    demo_program_id INTEGER;
    demo_session_id INTEGER;
    admin_user_id INTEGER;
BEGIN
    -- Get the demo program ID
    SELECT id INTO demo_program_id 
    FROM tbl_tarl_training_programs 
    WHERE program_name = 'Demo Training Program';
    
    -- Get an admin user ID (fallback to 1 if none found)
    SELECT id INTO admin_user_id 
    FROM tbl_tarl_users 
    WHERE role = 'Admin' 
    LIMIT 1;
    
    IF admin_user_id IS NULL THEN
        admin_user_id := 1;
    END IF;
    
    -- Create a demo training session if it doesn't exist
    INSERT INTO tbl_tarl_training_sessions (
        program_id,
        session_title,
        session_date,
        session_time,
        location,
        venue_address,
        max_participants,
        session_status,
        trainer_id,
        coordinator_id,
        agenda,
        notes,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        demo_program_id,
        'Introduction to TaRL Methodology',
        CURRENT_DATE - INTERVAL '7 days', -- Session was 7 days ago
        '09:00:00',
        'Training Center',
        '123 Education Street, Learning District',
        20,
        'completed',
        admin_user_id,
        admin_user_id,
        '<p>Day 1: Introduction to TaRL principles</p><p>Day 2: Practical implementation</p>',
        'Excellent participation from all attendees',
        admin_user_id,
        NOW() - INTERVAL '7 days',
        NOW()
    );
    
    -- Get the session ID
    SELECT id INTO demo_session_id 
    FROM tbl_tarl_training_sessions 
    WHERE program_id = demo_program_id 
    AND session_title = 'Introduction to TaRL Methodology';
    
    -- If session already exists, get its ID
    IF demo_session_id IS NULL THEN
        SELECT id INTO demo_session_id 
        FROM tbl_tarl_training_sessions 
        WHERE program_id = demo_program_id 
        AND session_title = 'Introduction to TaRL Methodology';
    END IF;
    
    -- Create demo participant registration
    INSERT INTO tbl_tarl_training_registrations (
        session_id,
        participant_name,
        participant_email,
        participant_phone,
        participant_role,
        school_name,
        district,
        province,
        attendance_status,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        demo_session_id,
        'Demo Participant',
        'demo.participant@education.gov',
        '012345678',
        'Teacher',
        'Sunrise Primary School',
        'Central District',
        'Phnom Penh',
        'attended',
        true,
        NOW() - INTERVAL '7 days',
        NOW()
    ) ON CONFLICT (session_id, participant_email) DO NOTHING;
    
    -- Create a second session for more demo data
    INSERT INTO tbl_tarl_training_sessions (
        program_id,
        session_title,
        session_date,
        session_time,
        location,
        venue_address,
        max_participants,
        session_status,
        trainer_id,
        coordinator_id,
        agenda,
        notes,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        demo_program_id,
        'Advanced TaRL Techniques',
        CURRENT_DATE + INTERVAL '3 days', -- Future session
        '09:00:00',
        'Training Center',
        '123 Education Street, Learning District',
        20,
        'scheduled',
        admin_user_id,
        admin_user_id,
        '<p>Advanced assessment techniques</p><p>Classroom management for TaRL</p>',
        'Building on previous session knowledge',
        admin_user_id,
        NOW(),
        NOW()
    );
    
    -- Get the second session ID
    SELECT id INTO demo_session_id 
    FROM tbl_tarl_training_sessions 
    WHERE program_id = demo_program_id 
    AND session_title = 'Advanced TaRL Techniques';
    
    -- If second session already exists, get its ID
    IF demo_session_id IS NULL THEN
        SELECT id INTO demo_session_id 
        FROM tbl_tarl_training_sessions 
        WHERE program_id = demo_program_id 
        AND session_title = 'Advanced TaRL Techniques';
    END IF;
    
    -- Register demo participant for upcoming session
    INSERT INTO tbl_tarl_training_registrations (
        session_id,
        participant_name,
        participant_email,
        participant_phone,
        participant_role,
        school_name,
        district,
        province,
        attendance_status,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        demo_session_id,
        'Demo Participant',
        'demo.participant2@education.gov', -- Different email to avoid conflict
        '012345678',
        'Teacher',
        'Sunrise Primary School',
        'Central District',
        'Phnom Penh',
        'registered', -- Not attended yet (future session)
        true,
        NOW(),
        NOW()
    ) ON CONFLICT (session_id, participant_email) DO NOTHING;
    
END $$;

-- Create some demo training materials for the sessions
INSERT INTO tbl_tarl_training_materials (
    session_id,
    material_name,
    material_title,
    description,
    material_type,
    file_path,
    file_size,
    is_downloadable,
    uploaded_by,
    created_at,
    updated_at
) 
SELECT 
    s.id as session_id,
    material_name,
    material_name as material_title,
    material_description as description,
    material_type,
    file_path,
    file_size,
    true as is_downloadable,
    1 as uploaded_by,
    NOW() as created_at,
    NOW() as updated_at
FROM tbl_tarl_training_sessions s,
(VALUES 
    ('TaRL Introduction Guide', 'Comprehensive guide to Teaching at the Right Level methodology', 'Guide', '/uploads/training/guides/tarl_intro_guide.pdf', 2048000),
    ('Assessment Toolkit', 'Tools and templates for student assessment in TaRL approach', 'Toolkit', '/uploads/training/toolkits/assessment_toolkit.pdf', 1536000),
    ('Implementation Checklist', 'Step-by-step checklist for implementing TaRL in your classroom', 'Checklist', '/uploads/training/checklists/implementation_checklist.pdf', 512000)
) AS demo_materials(material_name, material_description, material_type, file_path, file_size)
WHERE s.session_title IN ('Introduction to TaRL Methodology', 'Advanced TaRL Techniques')
AND s.program_id IN (SELECT id FROM tbl_tarl_training_programs WHERE program_name = 'Demo Training Program');

-- Display the demo participant information
SELECT 
    'Demo participant created successfully!' as status,
    'Name: Demo Participant' as login_name,
    'Phone: 012345678' as login_phone,
    'Login URL: http://localhost:3000/participant' as portal_url;

-- Show participant's training history
SELECT 
    p.program_name,
    s.session_title,
    s.session_date,
    s.session_status,
    r.attendance_status,
    CASE 
        WHEN r.participant_email IS NOT NULL THEN 'Registered'
        ELSE 'No registration'
    END as registration_status
FROM tbl_tarl_training_registrations r
JOIN tbl_tarl_training_sessions s ON r.session_id = s.id
JOIN tbl_tarl_training_programs p ON s.program_id = p.id
WHERE r.participant_name = 'Demo Participant'
    AND r.participant_phone = '012345678'
ORDER BY s.session_date;

-- Show available materials
SELECT 
    m.material_name,
    m.material_type,
    s.session_title,
    'Available for download' as access_status
FROM tbl_tarl_training_materials m
JOIN tbl_tarl_training_sessions s ON m.session_id = s.id
JOIN tbl_tarl_training_programs p ON s.program_id = p.id
WHERE p.program_name = 'Demo Training Program'
    AND m.is_downloadable = true
ORDER BY s.session_date, m.material_name;