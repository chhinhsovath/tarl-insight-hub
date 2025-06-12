-- =====================================================
-- TARL OBSERVATION DATABASE SCHEMA (PostgreSQL/Supabase)
-- Fixed version with proper auth handling
-- =====================================================

-- Drop existing tables if they exist (in reverse order due to foreign keys)
DROP TABLE IF EXISTS tbl_tarl_observation_activities CASCADE;
DROP TABLE IF EXISTS tbl_tarl_observation_materials CASCADE;
DROP TABLE IF EXISTS tbl_tarl_observation_tarl_levels CASCADE;
DROP TABLE IF EXISTS tbl_tarl_observation_responses CASCADE;
DROP TABLE IF EXISTS activity_types CASCADE;
DROP TABLE IF EXISTS tarl_levels CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS program_types CASCADE;

-- =====================================================
-- LOOKUP TABLES
-- =====================================================

-- Program Types lookup table
CREATE TABLE program_types (
    id SERIAL PRIMARY KEY,
    program_type VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TaRL Levels lookup table
CREATE TABLE tarl_levels (
    id SERIAL PRIMARY KEY,
    level_name VARCHAR(50) NOT NULL,
    subject VARCHAR(20) NOT NULL CHECK (subject IN ('Language', 'Numeracy')),
    level_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (level_name, subject)
);

-- Activity Types lookup table
CREATE TABLE activity_types (
    id SERIAL PRIMARY KEY,
    activity_name VARCHAR(100) NOT NULL,
    subject VARCHAR(20) NOT NULL CHECK (subject IN ('Language', 'Numeracy')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Materials lookup table
CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    material_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- MAIN OBSERVATION TABLES
-- =====================================================

-- Main observation responses table
CREATE TABLE tbl_tarl_observation_responses (
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
    
    -- User tracking - using string to store user ID or email
    created_by_user_id UUID REFERENCES auth.users(id),
    created_by_name VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create junction tables
CREATE TABLE tbl_tarl_observation_tarl_levels (
    id SERIAL PRIMARY KEY,
    observation_id INT NOT NULL REFERENCES tbl_tarl_observation_responses(id) ON DELETE CASCADE,
    tarl_level_id INT NOT NULL REFERENCES tarl_levels(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (observation_id, tarl_level_id)
);

CREATE TABLE tbl_tarl_observation_materials (
    id SERIAL PRIMARY KEY,
    observation_id INT NOT NULL REFERENCES tbl_tarl_observation_responses(id) ON DELETE CASCADE,
    material_id INT NOT NULL REFERENCES materials(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (observation_id, material_id)
);

CREATE TABLE tbl_tarl_observation_activities (
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

-- =====================================================
-- INSERT SAMPLE DATA
-- =====================================================

-- Insert program types
INSERT INTO program_types (program_type) VALUES 
('TaRL Program'),
('Remedial Education'),
('Regular Curriculum')
ON CONFLICT (program_type) DO NOTHING;

-- Insert TaRL levels
INSERT INTO tarl_levels (level_name, subject, level_order) VALUES 
('Beginner', 'Language', 1),
('Letter Recognition', 'Language', 2),
('Word Recognition', 'Language', 3),
('Sentence Reading', 'Language', 4),
('Story Reading', 'Language', 5),
('Numbers 1-9', 'Numeracy', 1),
('Numbers 10-99', 'Numeracy', 2),
('Addition/Subtraction', 'Numeracy', 3),
('Multiplication/Division', 'Numeracy', 4)
ON CONFLICT (level_name, subject) DO NOTHING;

-- Insert activity types
INSERT INTO activity_types (activity_name, subject, description) VALUES 
('Letter Recognition Game', 'Language', 'Students identify and match letters'),
('Word Building', 'Language', 'Students create words using letter cards'),
('Story Reading', 'Language', 'Students read short stories aloud'),
('Number Recognition', 'Numeracy', 'Students identify numbers 1-100'),
('Addition Practice', 'Numeracy', 'Students solve addition problems'),
('Counting Games', 'Numeracy', 'Interactive counting activities');

-- Insert materials
INSERT INTO materials (material_name, description) VALUES 
('Flashcards', 'Letter and number flashcards'),
('Worksheets', 'Practice worksheets for activities'),
('Story Books', 'Age-appropriate reading materials'),
('Number Charts', 'Visual number reference charts'),
('Letter Charts', 'Alphabet reference charts'),
('Manipulatives', 'Physical counting objects'),
('Whiteboard', 'Classroom whiteboard for demonstrations'),
('Markers/Chalk', 'Writing materials for board work')
ON CONFLICT (material_name) DO NOTHING;

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_observation_visit_date ON tbl_tarl_observation_responses(visit_date);
CREATE INDEX IF NOT EXISTS idx_observation_region ON tbl_tarl_observation_responses(region);
CREATE INDEX IF NOT EXISTS idx_observation_province ON tbl_tarl_observation_responses(province);
CREATE INDEX IF NOT EXISTS idx_observation_mentor ON tbl_tarl_observation_responses(mentor_name);
CREATE INDEX IF NOT EXISTS idx_observation_school ON tbl_tarl_observation_responses(school_name);
CREATE INDEX IF NOT EXISTS idx_observation_subject ON tbl_tarl_observation_responses(subject_observed);
CREATE INDEX IF NOT EXISTS idx_observation_created_by ON tbl_tarl_observation_responses(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_observation_id ON tbl_tarl_observation_activities(observation_id);

-- =====================================================
-- CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for complete observation data with lookups
CREATE OR REPLACE VIEW vw_tarl_observation_complete AS
SELECT 
    o.*,
    p.program_type,
    (SELECT array_agg(m.material_name) 
     FROM tbl_tarl_observation_materials om 
     JOIN materials m ON om.material_id = m.id 
     WHERE om.observation_id = o.id) AS materials,
    (SELECT array_agg(tl.level_name || ' (' || tl.subject || ')') 
     FROM tbl_tarl_observation_tarl_levels otl 
     JOIN tarl_levels tl ON otl.tarl_level_id = tl.id 
     WHERE otl.observation_id = o.id) AS tarl_levels,
    (SELECT count(*) 
     FROM tbl_tarl_observation_activities oa 
     WHERE oa.observation_id = o.id) AS activity_count
FROM tbl_tarl_observation_responses o
LEFT JOIN program_types p ON o.program_type_id = p.id;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE tbl_tarl_observation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_tarl_observation_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_tarl_observation_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_tarl_observation_tarl_levels ENABLE ROW LEVEL SECURITY;

-- Create policies for observations
CREATE POLICY "Users can view their own observations" ON tbl_tarl_observation_responses
    FOR SELECT USING (
        created_by_user_id = auth.uid()
    );

CREATE POLICY "Users can insert their own observations" ON tbl_tarl_observation_responses
    FOR INSERT WITH CHECK (
        created_by_user_id = auth.uid()
    );

CREATE POLICY "Users can update their own observations" ON tbl_tarl_observation_responses
    FOR UPDATE USING (
        created_by_user_id = auth.uid()
    );

-- Policies for related tables (activities, materials, levels)
CREATE POLICY "Users can view activities for their observations" ON tbl_tarl_observation_activities
    FOR SELECT USING (
        observation_id IN (
            SELECT id FROM tbl_tarl_observation_responses 
            WHERE created_by_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert activities for their observations" ON tbl_tarl_observation_activities
    FOR INSERT WITH CHECK (
        observation_id IN (
            SELECT id FROM tbl_tarl_observation_responses 
            WHERE created_by_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view materials for their observations" ON tbl_tarl_observation_materials
    FOR SELECT USING (
        observation_id IN (
            SELECT id FROM tbl_tarl_observation_responses 
            WHERE created_by_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert materials for their observations" ON tbl_tarl_observation_materials
    FOR INSERT WITH CHECK (
        observation_id IN (
            SELECT id FROM tbl_tarl_observation_responses 
            WHERE created_by_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view levels for their observations" ON tbl_tarl_observation_tarl_levels
    FOR SELECT USING (
        observation_id IN (
            SELECT id FROM tbl_tarl_observation_responses 
            WHERE created_by_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert levels for their observations" ON tbl_tarl_observation_tarl_levels
    FOR INSERT WITH CHECK (
        observation_id IN (
            SELECT id FROM tbl_tarl_observation_responses 
            WHERE created_by_user_id = auth.uid()
        )
    );

-- Allow public read access to lookup tables
ALTER TABLE program_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarl_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to program_types" ON program_types FOR SELECT USING (true);
CREATE POLICY "Allow public read access to tarl_levels" ON tarl_levels FOR SELECT USING (true);
CREATE POLICY "Allow public read access to activity_types" ON activity_types FOR SELECT USING (true);
CREATE POLICY "Allow public read access to materials" ON materials FOR SELECT USING (true);

-- =====================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- =====================================================

-- Function to get observation statistics
CREATE OR REPLACE FUNCTION get_observation_stats(user_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_observations BIGINT,
    observations_this_month BIGINT,
    unique_schools BIGINT,
    avg_students_per_class NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_observations,
        COUNT(*) FILTER (WHERE DATE_TRUNC('month', visit_date) = DATE_TRUNC('month', CURRENT_DATE)) as observations_this_month,
        COUNT(DISTINCT school_name) as unique_schools,
        AVG(students_present) as avg_students_per_class
    FROM tbl_tarl_observation_responses
    WHERE (user_id IS NULL OR created_by_user_id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_observation_stats TO authenticated;
