-- Implement Returning Participants Support for Training System
-- This script adds the necessary infrastructure to track participants across multiple training sessions

-- 1. Create Master Participants Table
CREATE TABLE IF NOT EXISTS tbl_tarl_master_participants (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(100),
    organization VARCHAR(255),
    district VARCHAR(100),
    province VARCHAR(100),
    first_training_date DATE,
    last_training_date DATE,
    total_sessions_attended INTEGER DEFAULT 0,
    total_sessions_registered INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    preferred_language VARCHAR(10) DEFAULT 'en',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Add master_participant_id to existing participants table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_participants' 
                   AND column_name = 'master_participant_id') THEN
        ALTER TABLE tbl_tarl_training_participants 
        ADD COLUMN master_participant_id INTEGER REFERENCES tbl_tarl_master_participants(id);
    END IF;
END $$;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_master_participants_email ON tbl_tarl_master_participants(email);
CREATE INDEX IF NOT EXISTS idx_training_participants_master_id ON tbl_tarl_training_participants(master_participant_id);

-- 4. Migrate existing participants to master table
DO $$
DECLARE
    participant_record RECORD;
    master_id INTEGER;
BEGIN
    -- Loop through all unique participants by email
    FOR participant_record IN 
        SELECT DISTINCT ON (participant_email) 
            participant_email,
            participant_name,
            participant_phone,
            participant_role,
            school_name,
            district,
            province,
            MIN(created_at) as first_registration
        FROM tbl_tarl_training_participants
        WHERE participant_email IS NOT NULL AND participant_email != ''
        GROUP BY participant_email, participant_name, participant_phone, 
                 participant_role, school_name, district, province
    LOOP
        -- Check if master record already exists
        SELECT id INTO master_id FROM tbl_tarl_master_participants 
        WHERE email = participant_record.participant_email;
        
        IF master_id IS NULL THEN
            -- Create new master participant
            INSERT INTO tbl_tarl_master_participants (
                email, full_name, phone, role, organization, 
                district, province, first_training_date
            ) VALUES (
                participant_record.participant_email,
                participant_record.participant_name,
                participant_record.participant_phone,
                participant_record.participant_role,
                participant_record.school_name,
                participant_record.district,
                participant_record.province,
                participant_record.first_registration::DATE
            ) RETURNING id INTO master_id;
        END IF;
        
        -- Update all participant records with this email to link to master
        UPDATE tbl_tarl_training_participants 
        SET master_participant_id = master_id
        WHERE participant_email = participant_record.participant_email;
    END LOOP;
END $$;

-- 5. Create view for participant training history
CREATE OR REPLACE VIEW vw_participant_training_history AS
SELECT 
    mp.id as master_participant_id,
    mp.email,
    mp.full_name,
    mp.phone,
    mp.role,
    mp.organization,
    tp.id as participation_id,
    tp.session_id,
    ts.session_title,
    ts.session_date,
    ts.session_time,
    ts.location,
    tprog.program_name,
    tp.registration_status,
    tp.attendance_confirmed,
    tp.attendance_time,
    tp.created_at as registration_date,
    CASE 
        WHEN tp.attendance_confirmed = true THEN 'Attended'
        WHEN tp.registration_status = 'cancelled' THEN 'Cancelled'
        WHEN ts.session_date < CURRENT_DATE THEN 'No Show'
        ELSE 'Registered'
    END as participation_status
FROM tbl_tarl_master_participants mp
JOIN tbl_tarl_training_participants tp ON mp.id = tp.master_participant_id
JOIN tbl_tarl_training_sessions ts ON tp.session_id = ts.id
LEFT JOIN tbl_tarl_training_programs tprog ON ts.program_id = tprog.id
ORDER BY mp.email, ts.session_date DESC;

-- 6. Create summary view for participant statistics
CREATE OR REPLACE VIEW vw_participant_training_summary AS
SELECT 
    mp.id as master_participant_id,
    mp.email,
    mp.full_name,
    mp.organization,
    COUNT(DISTINCT tp.session_id) as total_sessions_registered,
    COUNT(DISTINCT CASE WHEN tp.attendance_confirmed = true THEN tp.session_id END) as total_sessions_attended,
    MIN(ts.session_date) as first_session_date,
    MAX(ts.session_date) as last_session_date,
    COUNT(DISTINCT tprog.id) as unique_programs_attended,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN tp.attendance_confirmed = true THEN tp.session_id END) / 
          NULLIF(COUNT(DISTINCT tp.session_id), 0), 2) as attendance_rate,
    MAX(CASE WHEN ts.session_date > CURRENT_DATE THEN 1 ELSE 0 END) as has_upcoming_sessions
FROM tbl_tarl_master_participants mp
LEFT JOIN tbl_tarl_training_participants tp ON mp.id = tp.master_participant_id
LEFT JOIN tbl_tarl_training_sessions ts ON tp.session_id = ts.id
LEFT JOIN tbl_tarl_training_programs tprog ON ts.program_id = tprog.id
GROUP BY mp.id, mp.email, mp.full_name, mp.organization;

-- 7. Update master participant statistics (run periodically)
CREATE OR REPLACE FUNCTION update_master_participant_stats()
RETURNS void AS $$
BEGIN
    UPDATE tbl_tarl_master_participants mp
    SET 
        total_sessions_registered = stats.total_registered,
        total_sessions_attended = stats.total_attended,
        first_training_date = stats.first_date,
        last_training_date = stats.last_date,
        updated_at = NOW()
    FROM (
        SELECT 
            mp2.id,
            COUNT(DISTINCT tp.session_id) as total_registered,
            COUNT(DISTINCT CASE WHEN tp.attendance_confirmed = true THEN tp.session_id END) as total_attended,
            MIN(ts.session_date) as first_date,
            MAX(ts.session_date) as last_date
        FROM tbl_tarl_master_participants mp2
        LEFT JOIN tbl_tarl_training_participants tp ON mp2.id = tp.master_participant_id
        LEFT JOIN tbl_tarl_training_sessions ts ON tp.session_id = ts.id
        GROUP BY mp2.id
    ) stats
    WHERE mp.id = stats.id;
END;
$$ LANGUAGE plpgsql;

-- Run the update function
SELECT update_master_participant_stats();

-- 8. Create function to get participant history
CREATE OR REPLACE FUNCTION get_participant_history(p_email VARCHAR)
RETURNS TABLE (
    session_id INTEGER,
    session_title VARCHAR,
    session_date DATE,
    program_name VARCHAR,
    attendance_status VARCHAR,
    days_since_last_training INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.id as session_id,
        ts.session_title,
        ts.session_date,
        tprog.program_name,
        CASE 
            WHEN tp.attendance_confirmed = true THEN 'Attended'
            WHEN tp.registration_status = 'cancelled' THEN 'Cancelled'
            WHEN ts.session_date < CURRENT_DATE THEN 'No Show'
            ELSE 'Registered'
        END as attendance_status,
        CASE 
            WHEN LAG(ts.session_date) OVER (ORDER BY ts.session_date) IS NULL THEN NULL
            ELSE ts.session_date - LAG(ts.session_date) OVER (ORDER BY ts.session_date)
        END as days_since_last_training
    FROM tbl_tarl_master_participants mp
    JOIN tbl_tarl_training_participants tp ON mp.id = tp.master_participant_id
    JOIN tbl_tarl_training_sessions ts ON tp.session_id = ts.id
    LEFT JOIN tbl_tarl_training_programs tprog ON ts.program_id = tprog.id
    WHERE mp.email = p_email
    ORDER BY ts.session_date DESC;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger to update master participant on new registration
CREATE OR REPLACE FUNCTION update_master_participant_on_registration()
RETURNS TRIGGER AS $$
DECLARE
    v_master_id INTEGER;
BEGIN
    -- Only process if email is provided
    IF NEW.participant_email IS NOT NULL AND NEW.participant_email != '' THEN
        -- Check if master participant exists
        SELECT id INTO v_master_id FROM tbl_tarl_master_participants 
        WHERE email = NEW.participant_email;
        
        IF v_master_id IS NULL THEN
            -- Create new master participant
            INSERT INTO tbl_tarl_master_participants (
                email, full_name, phone, role, organization, district, province
            ) VALUES (
                NEW.participant_email,
                NEW.participant_name,
                NEW.participant_phone,
                NEW.participant_role,
                NEW.school_name,
                NEW.district,
                NEW.province
            ) RETURNING id INTO v_master_id;
        ELSE
            -- Update existing master participant with latest info
            UPDATE tbl_tarl_master_participants 
            SET 
                full_name = COALESCE(NEW.participant_name, full_name),
                phone = COALESCE(NEW.participant_phone, phone),
                role = COALESCE(NEW.participant_role, role),
                organization = COALESCE(NEW.school_name, organization),
                district = COALESCE(NEW.district, district),
                province = COALESCE(NEW.province, province),
                updated_at = NOW()
            WHERE id = v_master_id;
        END IF;
        
        -- Link the participant record to master
        NEW.master_participant_id = v_master_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_master_participant
BEFORE INSERT ON tbl_tarl_training_participants
FOR EACH ROW
EXECUTE FUNCTION update_master_participant_on_registration();

-- 10. Add helpful comments
COMMENT ON TABLE tbl_tarl_master_participants IS 'Master record for all training participants across sessions';
COMMENT ON COLUMN tbl_tarl_master_participants.total_sessions_attended IS 'Total number of sessions where attendance was confirmed';
COMMENT ON COLUMN tbl_tarl_master_participants.total_sessions_registered IS 'Total number of sessions registered for';
COMMENT ON VIEW vw_participant_training_history IS 'Complete training history for each participant';
COMMENT ON VIEW vw_participant_training_summary IS 'Summary statistics for each participant''s training journey';
COMMENT ON FUNCTION get_participant_history IS 'Get complete training history for a participant by email';

-- Sample query to check returning participants for a session
/*
SELECT 
    tp.participant_name,
    tp.participant_email,
    mp.total_sessions_attended as previous_sessions,
    mp.last_training_date,
    CASE 
        WHEN mp.total_sessions_attended > 0 THEN 'Returning Participant'
        ELSE 'New Participant'
    END as participant_type
FROM tbl_tarl_training_participants tp
LEFT JOIN tbl_tarl_master_participants mp ON tp.master_participant_id = mp.id
WHERE tp.session_id = ?;
*/