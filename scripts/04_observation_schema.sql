-- Adapting MySQL schema for PostgreSQL (Supabase)

-- Create lookup tables
CREATE TABLE IF NOT EXISTS program_types (
    id SERIAL PRIMARY KEY,
    program_type VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tarl_levels (
    id SERIAL PRIMARY KEY,
    level_name VARCHAR(50) NOT NULL,
    subject VARCHAR(20) NOT NULL CHECK (subject IN ('Language', 'Numeracy')),
    level_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (level_name, subject)
);

CREATE TABLE IF NOT EXISTS activity_types (
    id SERIAL PRIMARY KEY,
    activity_name VARCHAR(100) NOT NULL,
    subject VARCHAR(20) NOT NULL CHECK (subject IN ('Language', 'Numeracy')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    material_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create main observation tables
CREATE TABLE IF NOT EXISTS tbl_tarl_observation_responses (
    id SERIAL PRIMARY KEY,
    
    -- Visit Details
    visit_date DATE NOT NULL,
    region VARCHAR(100),
    province VARCHAR(100),
    mentor_name VARCHAR(100) NOT NULL,
    school_name VARCHAR(200) NOT NULL,
    program_type_id INT REFERENCES program_types(id),
    
    -- TaRL Class Status
    tarl_class_taking_place VARCHAR(3) NOT NULL CHECK (tarl_class_taking_place IN ('Yes', 'No')),
    tarl_class_not_taking_place_reason VARCHAR(100),
    tarl_class_not_taking_place_other_reason TEXT,
    
    -- Teacher and Observation Details
    teacher_name VARCHAR(100),
    observed_full_session VARCHAR(3) NOT NULL CHECK (observed_full_session IN ('Yes', 'No')),
    grade_group VARCHAR(20),
    grades_observed TEXT[], -- PostgreSQL array type
    subject_observed VARCHAR(20) CHECK (subject_observed IN ('Language', 'Numeracy')),
    
    -- Class Statistics
    total_class_strength INT,
    students_present INT,
    students_progressed_since_last_week INT,
    
    -- Delivery Questions
    class_started_on_time VARCHAR(3) CHECK (class_started_on_time IN ('Yes', 'No')),
    class_not_on_time_reason VARCHAR(100),
    class_not_on_time_other_reason TEXT,
    transition_time_between_subjects INT,
    
    -- Classroom Questions
    children_grouped_appropriately VARCHAR(3) CHECK (children_grouped_appropriately IN ('Yes', 'No')),
    students_fully_involved VARCHAR(3) CHECK (students_fully_involved IN ('Yes', 'No')),
    
    -- Teacher Questions
    teacher_had_session_plan VARCHAR(3) CHECK (teacher_had_session_plan IN ('Yes', 'No')),
    teacher_no_session_plan_reason TEXT,
    teacher_followed_session_plan VARCHAR(3) CHECK (teacher_followed_session_plan IN ('Yes', 'No')),
    teacher_not_follow_plan_reason TEXT,
    session_plan_appropriate_for_level VARCHAR(3) CHECK (session_plan_appropriate_for_level IN ('Yes', 'No')),
    
    -- Activity Count
    number_of_activities VARCHAR(1) NOT NULL CHECK (number_of_activities IN ('1', '2', '3')),
    
    -- Miscellaneous
    suggestions_to_teacher TEXT,
    
    -- User tracking
    created_by INT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create junction tables
CREATE TABLE IF NOT EXISTS tbl_tarl_observation_tarl_levels (
    id SERIAL PRIMARY KEY,
    observation_id INT NOT NULL REFERENCES tbl_tarl_observation_responses(id) ON DELETE CASCADE,
    tarl_level_id INT NOT NULL REFERENCES tarl_levels(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (observation_id, tarl_level_id)
);

CREATE TABLE IF NOT EXISTS tbl_tarl_observation_materials (
    id SERIAL PRIMARY KEY,
    observation_id INT NOT NULL REFERENCES tbl_tarl_observation_responses(id) ON DELETE CASCADE,
    material_id INT NOT NULL REFERENCES materials(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (observation_id, material_id)
);

CREATE TABLE IF NOT EXISTS tbl_tarl_observation_activities (
    id SERIAL PRIMARY KEY,
    observation_id INT NOT NULL REFERENCES tbl_tarl_observation_responses(id) ON DELETE CASCADE,
    activity_number VARCHAR(1) NOT NULL CHECK (activity_number IN ('1', '2', '3')),
    
    -- Activity Details
    activity_type_id_language INT REFERENCES activity_types(id),
    activity_type_id_numeracy INT REFERENCES activity_types(id),
    duration_minutes INT,
    
    -- Teacher Performance
    teacher_gave_clear_instructions VARCHAR(3) CHECK (teacher_gave_clear_instructions IN ('Yes', 'No')),
    teacher_no_clear_instructions_reason TEXT,
    teacher_demonstrated_activity VARCHAR(3) CHECK (teacher_demonstrated_activity IN ('Yes', 'No')),
    teacher_made_students_practice_in_front VARCHAR(20) CHECK (teacher_made_students_practice_in_front IN ('Yes', 'No', 'Not Applicable')),
    
    -- Student Performance
    students_performed_in_small_groups VARCHAR(20) CHECK (students_performed_in_small_groups IN ('Yes', 'No', 'Not Applicable')),
    students_performed_individually VARCHAR(20) CHECK (students_performed_individually IN ('Yes', 'No', 'Not Applicable')),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (observation_id, activity_number)
);

-- Insert sample data
INSERT INTO program_types (program_type) VALUES 
('TaRL Program'),
('Remedial Education'),
('Regular Curriculum');

INSERT INTO tarl_levels (level_name, subject, level_order) VALUES 
('Beginner', 'Language', 1),
('Letter Recognition', 'Language', 2),
('Word Recognition', 'Language', 3),
('Sentence Reading', 'Language', 4),
('Story Reading', 'Language', 5),
('Numbers 1-9', 'Numeracy', 1),
('Numbers 10-99', 'Numeracy', 2),
('Addition/Subtraction', 'Numeracy', 3),
('Multiplication/Division', 'Numeracy', 4);

INSERT INTO activity_types (activity_name, subject, description) VALUES 
('Letter Recognition Game', 'Language', 'Students identify and match letters'),
('Word Building', 'Language', 'Students create words using letter cards'),
('Story Reading', 'Language', 'Students read short stories aloud'),
('Number Recognition', 'Numeracy', 'Students identify numbers 1-100'),
('Addition Practice', 'Numeracy', 'Students solve addition problems'),
('Counting Games', 'Numeracy', 'Interactive counting activities');

INSERT INTO materials (material_name, description) VALUES 
('Flashcards', 'Letter and number flashcards'),
('Worksheets', 'Practice worksheets for activities'),
('Story Books', 'Age-appropriate reading materials'),
('Number Charts', 'Visual number reference charts'),
('Letter Charts', 'Alphabet reference charts'),
('Manipulatives', 'Physical counting objects'),
('Whiteboard', 'Classroom whiteboard for demonstrations'),
('Markers/Chalk', 'Writing materials for board work');

-- Create view for complete observation data
CREATE OR REPLACE VIEW vw_tarl_observation_complete AS
SELECT 
    o.*,
    p.program_type,
    (SELECT array_agg(m.material_name) FROM tbl_tarl_observation_materials om 
     JOIN materials m ON om.material_id = m.id 
     WHERE om.observation_id = o.id) AS materials,
    (SELECT array_agg(tl.level_name) FROM tbl_tarl_observation_tarl_levels otl 
     JOIN tarl_levels tl ON otl.tarl_level_id = tl.id 
     WHERE otl.observation_id = o.id) AS tarl_levels
FROM tbl_tarl_observation_responses o
LEFT JOIN program_types p ON o.program_type_id = p.id;

-- Add RLS policies
ALTER TABLE tbl_tarl_observation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_tarl_observation_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_tarl_observation_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_tarl_observation_tarl_levels ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin can see all observations" ON tbl_tarl_observation_responses
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
    );

CREATE POLICY "Users can see their own observations" ON tbl_tarl_observation_responses
    FOR SELECT USING (
        created_by = auth.uid()
    );

CREATE POLICY "Admin can insert observations" ON tbl_tarl_observation_responses
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
    );

CREATE POLICY "Users can insert observations" ON tbl_tarl_observation_responses
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM users WHERE role IN ('teacher', 'collector'))
    );
