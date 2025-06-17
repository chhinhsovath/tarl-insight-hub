-- Create Master Participants System for Training
-- This system tracks participants across all training sessions to avoid repeated registration

-- 1. Create master participants table to store unique participant records
CREATE TABLE IF NOT EXISTS tbl_tarl_master_participants (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(100),
  organization VARCHAR(255),
  district VARCHAR(100),
  province VARCHAR(100),
  total_sessions_registered INTEGER DEFAULT 0,
  total_sessions_attended INTEGER DEFAULT 0,
  first_training_date DATE,
  last_training_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_master_participants_email ON tbl_tarl_master_participants(email);
CREATE INDEX IF NOT EXISTS idx_master_participants_phone ON tbl_tarl_master_participants(phone);

-- 2. Add master_participant_id to existing tables
ALTER TABLE tbl_tarl_training_participants 
ADD COLUMN IF NOT EXISTS master_participant_id INTEGER REFERENCES tbl_tarl_master_participants(id);

ALTER TABLE tbl_tarl_training_registrations
ADD COLUMN IF NOT EXISTS master_participant_id INTEGER REFERENCES tbl_tarl_master_participants(id);

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_training_participants_master_id ON tbl_tarl_training_participants(master_participant_id);
CREATE INDEX IF NOT EXISTS idx_training_registrations_master_id ON tbl_tarl_training_registrations(master_participant_id);

-- 3. Add attendance_marked_at column to registrations for quick attendance
ALTER TABLE tbl_tarl_training_registrations
ADD COLUMN IF NOT EXISTS attendance_marked_at TIMESTAMP;

-- 4. Migrate existing data to master participants table
INSERT INTO tbl_tarl_master_participants (email, full_name, phone, role, organization, district, province, first_training_date)
SELECT DISTINCT ON (LOWER(participant_email))
  LOWER(participant_email) as email,
  participant_name as full_name,
  participant_phone as phone,
  participant_role as role,
  school_name as organization,
  district,
  province,
  MIN(created_at::date) as first_training_date
FROM tbl_tarl_training_participants
WHERE participant_email IS NOT NULL AND participant_email != ''
GROUP BY LOWER(participant_email), participant_name, participant_phone, participant_role, school_name, district, province
ON CONFLICT (email) DO NOTHING;

-- Also migrate from registrations table
INSERT INTO tbl_tarl_master_participants (email, full_name, phone, role, organization, district, province, first_training_date)
SELECT DISTINCT ON (LOWER(participant_email))
  LOWER(participant_email) as email,
  participant_name as full_name,
  participant_phone as phone,
  participant_role as role,
  school_name as organization,
  district,
  province,
  MIN(created_at::date) as first_training_date
FROM tbl_tarl_training_registrations
WHERE participant_email IS NOT NULL AND participant_email != ''
  AND LOWER(participant_email) NOT IN (SELECT email FROM tbl_tarl_master_participants)
GROUP BY LOWER(participant_email), participant_name, participant_phone, participant_role, school_name, district, province
ON CONFLICT (email) DO NOTHING;

-- 5. Update existing records with master_participant_id
UPDATE tbl_tarl_training_participants tp
SET master_participant_id = mp.id
FROM tbl_tarl_master_participants mp
WHERE LOWER(tp.participant_email) = mp.email
  AND tp.master_participant_id IS NULL;

UPDATE tbl_tarl_training_registrations tr
SET master_participant_id = mp.id
FROM tbl_tarl_master_participants mp
WHERE LOWER(tr.participant_email) = mp.email
  AND tr.master_participant_id IS NULL;

-- 6. Update statistics in master participants
UPDATE tbl_tarl_master_participants mp
SET 
  total_sessions_registered = (
    SELECT COUNT(DISTINCT session_id)
    FROM tbl_tarl_training_participants
    WHERE master_participant_id = mp.id
  ) + (
    SELECT COUNT(DISTINCT session_id)
    FROM tbl_tarl_training_registrations
    WHERE master_participant_id = mp.id
  ),
  total_sessions_attended = (
    SELECT COUNT(DISTINCT session_id)
    FROM tbl_tarl_training_participants
    WHERE master_participant_id = mp.id
      AND attendance_confirmed = true
  ) + (
    SELECT COUNT(DISTINCT session_id)
    FROM tbl_tarl_training_registrations
    WHERE master_participant_id = mp.id
      AND attendance_status = 'attended'
  ),
  last_training_date = (
    SELECT MAX(ts.session_date)
    FROM tbl_tarl_training_sessions ts
    JOIN tbl_tarl_training_participants tp ON ts.id = tp.session_id
    WHERE tp.master_participant_id = mp.id
  );

-- 7. Create function to automatically link new registrations to master participants
CREATE OR REPLACE FUNCTION link_to_master_participant()
RETURNS TRIGGER AS $$
DECLARE
  v_master_id INTEGER;
BEGIN
  -- Try to find existing master participant by email
  SELECT id INTO v_master_id
  FROM tbl_tarl_master_participants
  WHERE email = LOWER(NEW.participant_email);
  
  -- If not found, create new master participant
  IF v_master_id IS NULL AND NEW.participant_email IS NOT NULL AND NEW.participant_email != '' THEN
    INSERT INTO tbl_tarl_master_participants (
      email, full_name, phone, role, organization, district, province, first_training_date
    ) VALUES (
      LOWER(NEW.participant_email),
      NEW.participant_name,
      NEW.participant_phone,
      NEW.participant_role,
      NEW.school_name,
      NEW.district,
      NEW.province,
      CURRENT_DATE
    )
    RETURNING id INTO v_master_id;
  END IF;
  
  -- Set the master_participant_id
  NEW.master_participant_id := v_master_id;
  
  -- Update master participant info if more recent
  IF v_master_id IS NOT NULL THEN
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create triggers for automatic linking
DROP TRIGGER IF EXISTS link_participant_to_master ON tbl_tarl_training_participants;
CREATE TRIGGER link_participant_to_master
BEFORE INSERT ON tbl_tarl_training_participants
FOR EACH ROW
EXECUTE FUNCTION link_to_master_participant();

DROP TRIGGER IF EXISTS link_registration_to_master ON tbl_tarl_training_registrations;
CREATE TRIGGER link_registration_to_master
BEFORE INSERT ON tbl_tarl_training_registrations
FOR EACH ROW
EXECUTE FUNCTION link_to_master_participant();

-- 9. Create function to update master participant statistics
CREATE OR REPLACE FUNCTION update_master_participant_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.master_participant_id IS NOT NULL THEN
    UPDATE tbl_tarl_master_participants
    SET 
      total_sessions_registered = total_sessions_registered + 1,
      updated_at = NOW()
    WHERE id = NEW.master_participant_id;
    
    -- Update attendance count if marking attendance
    IF TG_TABLE_NAME = 'tbl_tarl_training_participants' AND NEW.attendance_confirmed = true THEN
      UPDATE tbl_tarl_master_participants
      SET 
        total_sessions_attended = total_sessions_attended + 1,
        last_training_date = CURRENT_DATE
      WHERE id = NEW.master_participant_id;
    END IF;
    
    IF TG_TABLE_NAME = 'tbl_tarl_training_registrations' AND NEW.attendance_status = 'attended' THEN
      UPDATE tbl_tarl_master_participants
      SET 
        total_sessions_attended = total_sessions_attended + 1,
        last_training_date = CURRENT_DATE,
        attendance_marked_at = NOW()
      WHERE id = NEW.master_participant_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create triggers for statistics update
DROP TRIGGER IF EXISTS update_master_stats_on_participant ON tbl_tarl_training_participants;
CREATE TRIGGER update_master_stats_on_participant
AFTER INSERT ON tbl_tarl_training_participants
FOR EACH ROW
EXECUTE FUNCTION update_master_participant_stats();

DROP TRIGGER IF EXISTS update_master_stats_on_registration ON tbl_tarl_training_registrations;
CREATE TRIGGER update_master_stats_on_registration
AFTER INSERT ON tbl_tarl_training_registrations
FOR EACH ROW
EXECUTE FUNCTION update_master_participant_stats();

-- 11. Create view for quick participant lookup with full history
CREATE OR REPLACE VIEW v_participant_training_history AS
SELECT 
  mp.id as master_participant_id,
  mp.email,
  mp.full_name,
  mp.phone,
  mp.role,
  mp.organization,
  mp.district,
  mp.province,
  mp.total_sessions_registered,
  mp.total_sessions_attended,
  CASE 
    WHEN mp.total_sessions_registered > 0 THEN 
      ROUND((mp.total_sessions_attended::NUMERIC / mp.total_sessions_registered) * 100, 2)
    ELSE 0 
  END as attendance_rate,
  mp.first_training_date,
  mp.last_training_date,
  CASE 
    WHEN mp.last_training_date IS NOT NULL THEN 
      CURRENT_DATE - mp.last_training_date
    ELSE NULL 
  END as days_since_last_training
FROM tbl_tarl_master_participants mp;

-- 12. Create function for quick registration + attendance
CREATE OR REPLACE FUNCTION quick_register_and_attend(
  p_session_id INTEGER,
  p_email VARCHAR,
  p_name VARCHAR,
  p_phone VARCHAR DEFAULT NULL,
  p_role VARCHAR DEFAULT NULL,
  p_organization VARCHAR DEFAULT NULL,
  p_district VARCHAR DEFAULT NULL,
  p_province VARCHAR DEFAULT NULL
) RETURNS TABLE (
  registration_id INTEGER,
  master_participant_id INTEGER,
  is_new_participant BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_registration_id INTEGER;
  v_master_id INTEGER;
  v_is_new BOOLEAN := FALSE;
BEGIN
  -- Check if already registered for this session
  SELECT id INTO v_registration_id
  FROM tbl_tarl_training_registrations
  WHERE session_id = p_session_id 
    AND LOWER(participant_email) = LOWER(p_email);
  
  IF v_registration_id IS NOT NULL THEN
    -- Already registered, just mark attendance
    UPDATE tbl_tarl_training_registrations
    SET 
      attendance_status = 'attended',
      attendance_marked_at = NOW(),
      updated_at = NOW()
    WHERE id = v_registration_id;
    
    -- Get master participant id
    SELECT master_participant_id INTO v_master_id
    FROM tbl_tarl_training_registrations
    WHERE id = v_registration_id;
    
    RETURN QUERY
    SELECT v_registration_id, v_master_id, FALSE, 'Already registered - attendance marked successfully';
    RETURN;
  END IF;
  
  -- Check if participant exists in master table
  SELECT id INTO v_master_id
  FROM tbl_tarl_master_participants
  WHERE email = LOWER(p_email);
  
  IF v_master_id IS NULL THEN
    v_is_new := TRUE;
  END IF;
  
  -- Create new registration (trigger will handle master participant creation/linking)
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
    attendance_marked_at,
    registration_method
  ) VALUES (
    p_session_id,
    LOWER(p_email),
    p_name,
    p_phone,
    p_role,
    p_organization,
    p_district,
    p_province,
    'attended',
    NOW(),
    'on-site'
  )
  RETURNING id, master_participant_id INTO v_registration_id, v_master_id;
  
  RETURN QUERY
  SELECT v_registration_id, v_master_id, v_is_new, 
    CASE 
      WHEN v_is_new THEN 'New participant registered and attendance marked'
      ELSE 'Returning participant registered and attendance marked'
    END;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON TABLE tbl_tarl_master_participants IS 'Master table tracking unique participants across all training sessions';
COMMENT ON FUNCTION quick_register_and_attend IS 'Quick function to register and mark attendance in one step for walk-in participants';
COMMENT ON VIEW v_participant_training_history IS 'Complete view of participant training history and statistics';