-- Create training feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS tbl_tarl_training_feedback (
    id SERIAL PRIMARY KEY,
    -- Basic training information
    training_title VARCHAR(255),
    training_date DATE,
    training_location VARCHAR(255),
    
    -- Respondent information
    respondent_id INTEGER REFERENCES tbl_tarl_users(id),
    respondent_name VARCHAR(255),
    respondent_role VARCHAR(100),
    respondent_email VARCHAR(255),
    school_id INTEGER REFERENCES tbl_tarl_schools("sclAutoID"),
    
    -- Ratings (1-5 scale)
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    content_quality_rating INTEGER CHECK (content_quality_rating >= 1 AND content_quality_rating <= 5),
    trainer_effectiveness_rating INTEGER CHECK (trainer_effectiveness_rating >= 1 AND trainer_effectiveness_rating <= 5),
    venue_rating INTEGER CHECK (venue_rating >= 1 AND venue_rating <= 5),
    materials_rating INTEGER CHECK (materials_rating >= 1 AND materials_rating <= 5),
    
    -- Yes/No questions
    objectives_met BOOLEAN,
    will_apply_learning BOOLEAN,
    will_recommend_training BOOLEAN,
    would_attend_future_training BOOLEAN,
    training_duration_appropriate BOOLEAN,
    materials_helpful BOOLEAN,
    pace_appropriate BOOLEAN,
    previous_tarl_training BOOLEAN,
    
    -- Text feedback
    most_valuable_aspect TEXT,
    least_valuable_aspect TEXT,
    additional_topics_needed TEXT,
    suggestions_for_improvement TEXT,
    challenges_implementing TEXT,
    additional_comments TEXT,
    
    -- Experience and teaching details
    years_of_experience VARCHAR(20),
    subjects_taught VARCHAR(255),
    grade_levels_taught VARCHAR(255),
    
    -- Metadata
    feedback_data JSONB,
    would_recommend BOOLEAN,
    comments TEXT,
    suggestions TEXT,
    submission_time TIMESTAMP,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add columns that might be missing from existing table
DO $$
BEGIN
    -- Add session_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_feedback' AND column_name = 'session_id') THEN
        ALTER TABLE tbl_tarl_training_feedback ADD COLUMN session_id INTEGER REFERENCES tbl_tarl_training_sessions(id);
    END IF;
    
    -- Add participant_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_feedback' AND column_name = 'participant_id') THEN
        ALTER TABLE tbl_tarl_training_feedback ADD COLUMN participant_id INTEGER REFERENCES tbl_tarl_training_participants(id);
    END IF;
    
    -- Add submitted_via column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_feedback' AND column_name = 'submitted_via') THEN
        ALTER TABLE tbl_tarl_training_feedback ADD COLUMN submitted_via VARCHAR(20) DEFAULT 'manual';
    END IF;
    
    -- Add qr_code_used column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_feedback' AND column_name = 'qr_code_used') THEN
        ALTER TABLE tbl_tarl_training_feedback ADD COLUMN qr_code_used BOOLEAN DEFAULT false;
    END IF;

    -- Add feedback_data column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_feedback' AND column_name = 'feedback_data') THEN
        ALTER TABLE tbl_tarl_training_feedback ADD COLUMN feedback_data JSONB;
    END IF;

    -- Add is_anonymous column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_feedback' AND column_name = 'is_anonymous') THEN
        ALTER TABLE tbl_tarl_training_feedback ADD COLUMN is_anonymous BOOLEAN DEFAULT false;
    END IF;

    -- Add submission_time column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_feedback' AND column_name = 'submission_time') THEN
        ALTER TABLE tbl_tarl_training_feedback ADD COLUMN submission_time TIMESTAMP;
    END IF;

    -- Add would_recommend column if it doesn't exist (duplicate of will_recommend_training for new API)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_feedback' AND column_name = 'would_recommend') THEN
        ALTER TABLE tbl_tarl_training_feedback ADD COLUMN would_recommend BOOLEAN;
    END IF;

    -- Add comments column if it doesn't exist (duplicate of additional_comments for new API)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_feedback' AND column_name = 'comments') THEN
        ALTER TABLE tbl_tarl_training_feedback ADD COLUMN comments TEXT;
    END IF;

    -- Add suggestions column if it doesn't exist (duplicate of suggestions_for_improvement for new API)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_feedback' AND column_name = 'suggestions') THEN
        ALTER TABLE tbl_tarl_training_feedback ADD COLUMN suggestions TEXT;
    END IF;

    -- Add trainer_rating column if it doesn't exist (duplicate of trainer_effectiveness_rating for new API)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_feedback' AND column_name = 'trainer_rating') THEN
        ALTER TABLE tbl_tarl_training_feedback ADD COLUMN trainer_rating INTEGER CHECK (trainer_rating >= 1 AND trainer_rating <= 5);
    END IF;

    -- Add content_rating column if it doesn't exist (duplicate of content_quality_rating for new API)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_feedback' AND column_name = 'content_rating') THEN
        ALTER TABLE tbl_tarl_training_feedback ADD COLUMN content_rating INTEGER CHECK (content_rating >= 1 AND content_rating <= 5);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_feedback_session ON tbl_tarl_training_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_training_feedback_respondent ON tbl_tarl_training_feedback(respondent_id);
CREATE INDEX IF NOT EXISTS idx_training_feedback_training_date ON tbl_tarl_training_feedback(training_date);
CREATE INDEX IF NOT EXISTS idx_training_feedback_submitted_via ON tbl_tarl_training_feedback(submitted_via);

-- Add comment to table
COMMENT ON TABLE tbl_tarl_training_feedback IS 'Comprehensive feedback from training participants';