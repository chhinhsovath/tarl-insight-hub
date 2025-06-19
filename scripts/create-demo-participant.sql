-- Create a demo participant account for testing
-- This script creates a training program, session, and participant registration

-- Check if we need to create a demo training program first
INSERT INTO tbl_tarl_training_programs (
    program_name,
    description,
    program_type,
    duration_hours,
    session_count,
    total_participants,
    materials_count,
    is_active,
    created_by,
    created_at,
    updated_at
) VALUES (
    'Demo Training Program',
    'A demo training program for participant portal testing',
    'workshop',
    8,
    2,
    1,
    3,
    true,
    1, -- Assuming admin user ID is 1
    NOW(),
    NOW()
) ON CONFLICT (program_name) DO NOTHING;

-- Get the program ID
DO $$
DECLARE
    demo_program_id INTEGER;
    demo_session_id INTEGER;
BEGIN
    -- Get the demo program ID
    SELECT id INTO demo_program_id 
    FROM tbl_tarl_training_programs 
    WHERE program_name = 'Demo Training Program';
    
    -- Create a demo training session if it doesn't exist
    INSERT INTO tbl_tarl_training_sessions (
        program_id,
        session_title,
        session_date,
        session_time,
        end_time,
        location,
        venue_address,
        max_participants,
        session_status,
        trainer_name,
        coordinator_name,
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
        '17:00:00',
        'Training Center',
        '123 Education Street, Learning District',
        20,
        'completed',
        'Dr. Sarah Wilson',
        'Training Coordinator',
        '<p>Day 1: Introduction to TaRL principles</p><p>Day 2: Practical implementation</p>',
        'Excellent participation from all attendees',
        1, -- Assuming admin user ID is 1
        NOW() - INTERVAL '7 days',
        NOW()
    ) ON CONFLICT DO NOTHING
    RETURNING id INTO demo_session_id;
    
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
        registration_status,
        attendance_status,
        feedback_rating,
        feedback_comments,
        registered_by,
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
        'confirmed',
        'attended',
        5,
        'Excellent training! Very helpful for my teaching practice.',
        1, -- Assuming admin user ID is 1
        true,
        NOW() - INTERVAL '7 days',
        NOW()
    ) ON CONFLICT DO NOTHING;
    
    -- Create a second session for more demo data
    INSERT INTO tbl_tarl_training_sessions (
        program_id,
        session_title,
        session_date,
        session_time,
        end_time,
        location,
        venue_address,
        max_participants,
        session_status,
        trainer_name,
        coordinator_name,
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
        '17:00:00',
        'Training Center',
        '123 Education Street, Learning District',
        20,
        'scheduled',
        'Dr. Sarah Wilson',
        'Training Coordinator',
        '<p>Advanced assessment techniques</p><p>Classroom management for TaRL</p>',
        'Building on previous session knowledge',
        1,
        NOW(),
        NOW()
    ) ON CONFLICT DO NOTHING
    RETURNING id INTO demo_session_id;
    
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
        registration_status,
        attendance_status,
        registered_by,
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
        'confirmed',
        'registered', -- Not attended yet (future session)
        1,
        true,
        NOW(),
        NOW()
    ) ON CONFLICT DO NOTHING;
    
END $$;

-- Create some demo training materials for the sessions
INSERT INTO tbl_tarl_engage_materials (
    session_id,
    program_name,
    material_name,
    material_description,
    material_type,
    file_name,
    file_path,
    file_size,
    is_public,
    timing_phase,
    sort_order,
    uploaded_by,
    created_at,
    updated_at
) 
SELECT 
    s.id as session_id,
    'Demo Training Program',
    material_name,
    material_description,
    material_type,
    file_name,
    file_path,
    file_size,
    is_public,
    timing_phase,
    sort_order,
    1 as uploaded_by,
    NOW() as created_at,
    NOW() as updated_at
FROM tbl_tarl_training_sessions s,
(VALUES 
    ('TaRL Introduction Guide', 'Comprehensive guide to Teaching at the Right Level methodology', 'Guide', 'tarl_intro_guide.pdf', '/uploads/training/guides/tarl_intro_guide.pdf', 2048000, true, 'before', 1),
    ('Assessment Toolkit', 'Tools and templates for student assessment in TaRL approach', 'Toolkit', 'assessment_toolkit.pdf', '/uploads/training/toolkits/assessment_toolkit.pdf', 1536000, true, 'during', 2),
    ('Implementation Checklist', 'Step-by-step checklist for implementing TaRL in your classroom', 'Checklist', 'implementation_checklist.pdf', '/uploads/training/checklists/implementation_checklist.pdf', 512000, true, 'after', 3)
) AS demo_materials(material_name, material_description, material_type, file_name, file_path, file_size, is_public, timing_phase, sort_order)
WHERE s.session_title IN ('Introduction to TaRL Methodology', 'Advanced TaRL Techniques')
ON CONFLICT DO NOTHING;

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
    r.feedback_rating,
    CASE 
        WHEN r.feedback_comments IS NOT NULL THEN 'Has feedback'
        ELSE 'No feedback yet'
    END as feedback_status
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
    m.timing_phase,
    s.session_title,
    'Available for download' as access_status
FROM tbl_tarl_engage_materials m
JOIN tbl_tarl_training_sessions s ON m.session_id = s.id
JOIN tbl_tarl_training_programs p ON s.program_id = p.id
WHERE p.program_name = 'Demo Training Program'
    AND m.is_public = true
ORDER BY s.session_date, m.sort_order;