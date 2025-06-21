-- =====================================================
-- DEPLOY COMPREHENSIVE AUDIT SYSTEM TO PRODUCTION
-- Compatible with existing tbl_tarl_user_activities table
-- =====================================================

-- =====================================================
-- 1. UPDATE EXISTING USER ACTIVITIES TABLE
-- =====================================================

-- Add missing columns to existing table
DO $$
BEGIN
    -- Add username column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_user_activities' AND column_name = 'username') THEN
        ALTER TABLE tbl_tarl_user_activities ADD COLUMN username VARCHAR(255);
    END IF;
    
    -- Add user_role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_user_activities' AND column_name = 'user_role') THEN
        ALTER TABLE tbl_tarl_user_activities ADD COLUMN user_role VARCHAR(50);
    END IF;
    
    -- Add action_type column if it doesn't exist (rename action to action_type)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_user_activities' AND column_name = 'action_type') THEN
        ALTER TABLE tbl_tarl_user_activities ADD COLUMN action_type VARCHAR(50);
        -- Copy data from action to action_type
        UPDATE tbl_tarl_user_activities SET action_type = action WHERE action IS NOT NULL;
    END IF;
    
    -- Add table_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_user_activities' AND column_name = 'table_name') THEN
        ALTER TABLE tbl_tarl_user_activities ADD COLUMN table_name VARCHAR(100);
    END IF;
    
    -- Add record_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_user_activities' AND column_name = 'record_id') THEN
        ALTER TABLE tbl_tarl_user_activities ADD COLUMN record_id INTEGER;
    END IF;
    
    -- Add old_data column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_user_activities' AND column_name = 'old_data') THEN
        ALTER TABLE tbl_tarl_user_activities ADD COLUMN old_data JSONB;
    END IF;
    
    -- Add new_data column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_user_activities' AND column_name = 'new_data') THEN
        ALTER TABLE tbl_tarl_user_activities ADD COLUMN new_data JSONB;
    END IF;
    
    -- Add changes_summary column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_user_activities' AND column_name = 'changes_summary') THEN
        ALTER TABLE tbl_tarl_user_activities ADD COLUMN changes_summary TEXT;
    END IF;
    
    -- Add ip_address column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_user_activities' AND column_name = 'ip_address') THEN
        ALTER TABLE tbl_tarl_user_activities ADD COLUMN ip_address INET;
    END IF;
    
    -- Add user_agent column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_user_activities' AND column_name = 'user_agent') THEN
        ALTER TABLE tbl_tarl_user_activities ADD COLUMN user_agent TEXT;
    END IF;
    
    -- Add session_token column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_user_activities' AND column_name = 'session_token') THEN
        ALTER TABLE tbl_tarl_user_activities ADD COLUMN session_token VARCHAR(255);
    END IF;
    
    -- Add is_soft_delete column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_user_activities' AND column_name = 'is_soft_delete') THEN
        ALTER TABLE tbl_tarl_user_activities ADD COLUMN is_soft_delete BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activities_action_type ON tbl_tarl_user_activities (action_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_table_name ON tbl_tarl_user_activities (table_name);
CREATE INDEX IF NOT EXISTS idx_user_activities_record_id ON tbl_tarl_user_activities (record_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_is_soft_delete ON tbl_tarl_user_activities (is_soft_delete);

-- =====================================================
-- 2. SOFT DELETE MANAGEMENT SYSTEM
-- =====================================================

-- Table to track all soft-deleted records for easy restoration
CREATE TABLE IF NOT EXISTS tbl_tarl_deleted_records (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER NOT NULL,
    original_data JSONB NOT NULL,
    deleted_by INTEGER REFERENCES tbl_tarl_users(id),
    deleted_by_username VARCHAR(255),
    delete_reason TEXT,
    deleted_at TIMESTAMP DEFAULT NOW(),
    restored_at TIMESTAMP,
    restored_by INTEGER REFERENCES tbl_tarl_users(id),
    restored_by_username VARCHAR(255),
    is_restored BOOLEAN DEFAULT false,
    can_be_restored BOOLEAN DEFAULT true,
    retention_period_days INTEGER DEFAULT 365,
    UNIQUE(table_name, record_id)
);

-- Indexes for deleted records
CREATE INDEX IF NOT EXISTS idx_deleted_records_table_name ON tbl_tarl_deleted_records (table_name);
CREATE INDEX IF NOT EXISTS idx_deleted_records_record_id ON tbl_tarl_deleted_records (record_id);
CREATE INDEX IF NOT EXISTS idx_deleted_records_deleted_by ON tbl_tarl_deleted_records (deleted_by);
CREATE INDEX IF NOT EXISTS idx_deleted_records_deleted_at ON tbl_tarl_deleted_records (deleted_at);
CREATE INDEX IF NOT EXISTS idx_deleted_records_is_restored ON tbl_tarl_deleted_records (is_restored);

-- =====================================================
-- 3. ADD SOFT DELETE COLUMNS TO ALL MAIN TABLES
-- =====================================================

-- Add soft delete columns to all important tables
DO $$
DECLARE
    table_name_var TEXT;
    tables_to_update TEXT[] := ARRAY[
        'tbl_tarl_users',
        'tbl_tarl_school_list',
        'tbl_tarl_students',
        'tbl_tarl_training_programs',
        'tbl_tarl_training_sessions',
        'tbl_tarl_training_participants',
        'tbl_tarl_training_materials',
        'tbl_tarl_training_feedback',
        'tbl_tarl_training_flow',
        'tbl_tarl_qr_codes',
        'tbl_tarl_training_registrations',
        'page_permissions',
        'role_page_permissions',
        'page_action_permissions'
    ];
BEGIN
    FOREACH table_name_var IN ARRAY tables_to_update
    LOOP
        -- Add deleted_at column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = table_name_var AND column_name = 'deleted_at') THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN deleted_at TIMESTAMP', table_name_var);
        END IF;
        
        -- Add deleted_by column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = table_name_var AND column_name = 'deleted_by') THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN deleted_by INTEGER', table_name_var);
        END IF;
        
        -- Add is_deleted column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = table_name_var AND column_name = 'is_deleted') THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN is_deleted BOOLEAN DEFAULT false', table_name_var);
        END IF;
        
        -- Create index for soft delete columns
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_deleted_at ON %I (deleted_at)', 
                      table_name_var, table_name_var);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_is_deleted ON %I (is_deleted)', 
                      table_name_var, table_name_var);
    END LOOP;
END $$;

-- =====================================================
-- 4. AUDIT TRIGGER FUNCTIONS
-- =====================================================

-- Function to log all table changes
CREATE OR REPLACE FUNCTION log_table_changes()
RETURNS TRIGGER AS $$
DECLARE
    action_type VARCHAR(10);
    old_data JSONB := NULL;
    new_data JSONB := NULL;
    changes_summary TEXT := '';
    current_user_id INTEGER;
    current_username VARCHAR(255);
    current_user_role VARCHAR(50);
BEGIN
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        action_type := 'CREATE';
        new_data := to_jsonb(NEW);
        changes_summary := format('Created new %s record with ID %s', TG_TABLE_NAME, NEW.id);
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'UPDATE';
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        
        -- Check if this is a soft delete
        IF (NEW.is_deleted = true AND OLD.is_deleted = false) OR 
           (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL) THEN
            action_type := 'DELETE';
            changes_summary := format('Soft deleted %s record with ID %s', TG_TABLE_NAME, NEW.id);
        ELSE
            changes_summary := format('Updated %s record with ID %s', TG_TABLE_NAME, NEW.id);
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'DELETE';
        old_data := to_jsonb(OLD);
        changes_summary := format('Hard deleted %s record with ID %s', TG_TABLE_NAME, OLD.id);
    END IF;
    
    -- Get current user info from session (if available)
    BEGIN
        SELECT current_setting('app.current_user_id', true)::INTEGER INTO current_user_id;
        SELECT current_setting('app.current_username', true) INTO current_username;
        SELECT current_setting('app.current_user_role', true) INTO current_user_role;
    EXCEPTION WHEN OTHERS THEN
        current_user_id := NULL;
        current_username := NULL;
        current_user_role := NULL;
    END;
    
    -- Insert audit log
    INSERT INTO tbl_tarl_user_activities (
        user_id, username, user_role, action_type, table_name, record_id,
        old_data, new_data, changes_summary, is_soft_delete
    ) VALUES (
        current_user_id, current_username, current_user_role, action_type, TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id), old_data, new_data, changes_summary,
        (action_type = 'DELETE' AND TG_OP = 'UPDATE')
    );
    
    -- If this is a soft delete, also log in deleted_records table
    IF action_type = 'DELETE' AND TG_OP = 'UPDATE' THEN
        INSERT INTO tbl_tarl_deleted_records (
            table_name, record_id, original_data, deleted_by, deleted_by_username, deleted_at
        ) VALUES (
            TG_TABLE_NAME, NEW.id, old_data, current_user_id, current_username, NOW()
        ) ON CONFLICT (table_name, record_id) DO UPDATE SET
            deleted_at = NOW(),
            deleted_by = EXCLUDED.deleted_by,
            deleted_by_username = EXCLUDED.deleted_by_username,
            is_restored = false;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. CREATE AUDIT TRIGGERS FOR ALL TABLES
-- =====================================================

DO $$
DECLARE
    table_name TEXT;
    tables_to_audit TEXT[] := ARRAY[
        'tbl_tarl_users',
        'tbl_tarl_school_list',
        'tbl_tarl_students',
        'tbl_tarl_training_programs',
        'tbl_tarl_training_sessions',
        'tbl_tarl_training_participants',
        'tbl_tarl_training_materials',
        'tbl_tarl_training_feedback',
        'tbl_tarl_training_flow',
        'tbl_tarl_qr_codes',
        'tbl_tarl_training_registrations'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_to_audit
    LOOP
        -- Drop existing trigger if it exists
        EXECUTE format('DROP TRIGGER IF EXISTS audit_trigger_%s ON %I', table_name, table_name);
        
        -- Create new audit trigger
        EXECUTE format('
            CREATE TRIGGER audit_trigger_%s
            AFTER INSERT OR UPDATE OR DELETE ON %I
            FOR EACH ROW EXECUTE FUNCTION log_table_changes()', table_name, table_name);
    END LOOP;
END $$;

-- =====================================================
-- 6. UTILITY FUNCTIONS FOR SOFT DELETE MANAGEMENT
-- =====================================================

-- Function to soft delete a record
CREATE OR REPLACE FUNCTION soft_delete_record(
    target_table TEXT,
    target_id INTEGER,
    user_id INTEGER,
    username TEXT,
    delete_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    query TEXT;
    record_exists BOOLEAN;
BEGIN
    -- Check if record exists and is not already deleted
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE id = %s AND (is_deleted = false OR is_deleted IS NULL))', 
                   target_table, target_id) INTO record_exists;
    
    IF NOT record_exists THEN
        RETURN false;
    END IF;
    
    -- Set session variables for audit logging
    PERFORM set_config('app.current_user_id', user_id::TEXT, true);
    PERFORM set_config('app.current_username', username, true);
    
    -- Perform soft delete
    EXECUTE format('UPDATE %I SET is_deleted = true, deleted_at = NOW(), deleted_by = %s WHERE id = %s', 
                   target_table, user_id, target_id);
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to restore a soft-deleted record
CREATE OR REPLACE FUNCTION restore_deleted_record(
    target_table TEXT,
    target_id INTEGER,
    user_id INTEGER,
    username TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    record_exists BOOLEAN;
BEGIN
    -- Check if record exists and is deleted
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE id = %s AND is_deleted = true)', 
                   target_table, target_id) INTO record_exists;
    
    IF NOT record_exists THEN
        RETURN false;
    END IF;
    
    -- Set session variables for audit logging
    PERFORM set_config('app.current_user_id', user_id::TEXT, true);
    PERFORM set_config('app.current_username', username, true);
    
    -- Restore the record
    EXECUTE format('UPDATE %I SET is_deleted = false, deleted_at = NULL, deleted_by = NULL WHERE id = %s', 
                   target_table, target_id);
    
    -- Update deleted_records table
    UPDATE tbl_tarl_deleted_records 
    SET is_restored = true, restored_at = NOW(), restored_by = user_id, restored_by_username = username
    WHERE table_name = target_table AND record_id = target_id;
    
    -- Log restoration activity
    INSERT INTO tbl_tarl_user_activities (
        user_id, username, action_type, table_name, record_id, changes_summary
    ) VALUES (
        user_id, username, 'RESTORE', target_table, target_id,
        format('Restored deleted %s record with ID %s', target_table, target_id)
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. VIEWS FOR EASY ACCESS TO AUDIT DATA
-- =====================================================

-- View for recent user activities
CREATE OR REPLACE VIEW v_recent_user_activities AS
SELECT 
    ua.id,
    ua.username,
    ua.user_role,
    ua.action_type,
    ua.table_name,
    ua.record_id,
    ua.changes_summary,
    ua.is_soft_delete,
    ua.created_at,
    CASE 
        WHEN ua.is_soft_delete THEN 'Soft Delete'
        WHEN ua.action_type = 'DELETE' THEN 'Hard Delete'
        ELSE ua.action_type
    END as action_display
FROM tbl_tarl_user_activities ua
ORDER BY ua.created_at DESC;

-- View for deleted records that can be restored
CREATE OR REPLACE VIEW v_restorable_records AS
SELECT 
    dr.id,
    dr.table_name,
    dr.record_id,
    dr.deleted_by_username,
    dr.delete_reason,
    dr.deleted_at,
    dr.can_be_restored,
    dr.retention_period_days,
    (dr.deleted_at + INTERVAL '1 day' * dr.retention_period_days) as expires_at,
    CASE 
        WHEN dr.deleted_at + INTERVAL '1 day' * dr.retention_period_days < NOW() THEN false
        ELSE dr.can_be_restored
    END as is_still_restorable
FROM tbl_tarl_deleted_records dr
WHERE dr.is_restored = false
ORDER BY dr.deleted_at DESC;

-- View for training system audit summary
CREATE OR REPLACE VIEW v_training_audit_summary AS
SELECT 
    DATE(ua.created_at) as activity_date,
    ua.table_name,
    ua.action_type,
    COUNT(*) as activity_count,
    COUNT(DISTINCT ua.user_id) as unique_users
FROM tbl_tarl_user_activities ua
WHERE ua.table_name LIKE 'tbl_tarl_training_%'
GROUP BY DATE(ua.created_at), ua.table_name, ua.action_type
ORDER BY activity_date DESC, ua.table_name, ua.action_type;

-- =====================================================
-- 8. CLEANUP FUNCTIONS
-- =====================================================

-- Function to permanently delete old soft-deleted records
CREATE OR REPLACE FUNCTION cleanup_old_deleted_records(
    older_than_days INTEGER DEFAULT 365
) RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER := 0;
    record RECORD;
BEGIN
    -- Get records older than specified days
    FOR record IN 
        SELECT table_name, record_id 
        FROM tbl_tarl_deleted_records 
        WHERE deleted_at < (NOW() - INTERVAL '1 day' * older_than_days)
          AND is_restored = false
    LOOP
        -- Permanently delete from original table
        EXECUTE format('DELETE FROM %I WHERE id = %s', record.table_name, record.record_id);
        
        -- Remove from deleted_records tracking
        DELETE FROM tbl_tarl_deleted_records 
        WHERE table_name = record.table_name AND record_id = record.record_id;
        
        cleanup_count := cleanup_count + 1;
    END LOOP;
    
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. SUCCESS MESSAGE
-- =====================================================

SELECT 'Comprehensive audit system with soft delete functionality has been successfully deployed to production!' as status;