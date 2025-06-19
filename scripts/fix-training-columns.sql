-- Fix column naming inconsistencies in training tables
-- This script ensures all column names match what the API endpoints expect

-- 1. Check if columns exist and add/rename as needed
DO $$
BEGIN
    -- Fix tbl_tarl_training_sessions columns
    -- The schema uses 'max_participants' but some APIs expect 'capacity'
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tbl_tarl_training_sessions' AND column_name = 'max_participants')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'tbl_tarl_training_sessions' AND column_name = 'capacity') THEN
        ALTER TABLE tbl_tarl_training_sessions ADD COLUMN capacity INTEGER;
        UPDATE tbl_tarl_training_sessions SET capacity = max_participants;
    END IF;

    -- Add current_attendance if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_sessions' AND column_name = 'current_attendance') THEN
        ALTER TABLE tbl_tarl_training_sessions ADD COLUMN current_attendance INTEGER DEFAULT 0;
    END IF;

    -- Add current_registrations if missing  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_sessions' AND column_name = 'current_registrations') THEN
        ALTER TABLE tbl_tarl_training_sessions ADD COLUMN current_registrations INTEGER DEFAULT 0;
    END IF;

    -- Add agenda column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_sessions' AND column_name = 'agenda') THEN
        ALTER TABLE tbl_tarl_training_sessions ADD COLUMN agenda TEXT;
    END IF;

    -- Add notes column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_sessions' AND column_name = 'notes') THEN
        ALTER TABLE tbl_tarl_training_sessions ADD COLUMN notes TEXT;
    END IF;

    -- Add missing columns to tbl_tarl_training_registrations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_registrations' AND column_name = 'attendance_marked_at') THEN
        ALTER TABLE tbl_tarl_training_registrations ADD COLUMN attendance_marked_at TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_training_registrations' AND column_name = 'attendance_marked_by') THEN
        ALTER TABLE tbl_tarl_training_registrations ADD COLUMN attendance_marked_by VARCHAR(255);
    END IF;

    -- Fix tbl_tarl_master_participants columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_master_participants' AND column_name = 'attendance_marked_at') THEN
        ALTER TABLE tbl_tarl_master_participants ADD COLUMN attendance_marked_at TIMESTAMP;
    END IF;

    -- Update counts based on current data
    UPDATE tbl_tarl_training_sessions s
    SET current_registrations = (
        SELECT COUNT(*)
        FROM tbl_tarl_training_registrations r
        WHERE r.session_id = s.id AND r.is_active = true
    );

    UPDATE tbl_tarl_training_sessions s
    SET current_attendance = (
        SELECT COUNT(*)
        FROM tbl_tarl_training_registrations r
        WHERE r.session_id = s.id 
          AND r.is_active = true 
          AND r.attendance_status = 'attended'
    );

END $$;

-- Show column status
SELECT 
    'tbl_tarl_training_sessions' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'tbl_tarl_training_sessions'
  AND column_name IN ('max_participants', 'capacity', 'current_attendance', 'current_registrations', 'agenda', 'notes')
ORDER BY column_name;

-- Also check registrations table
SELECT 
    'tbl_tarl_training_registrations' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'tbl_tarl_training_registrations'
  AND column_name IN ('attendance_marked_at', 'attendance_marked_by', 'attendance_status')
ORDER BY column_name;