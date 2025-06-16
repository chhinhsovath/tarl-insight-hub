-- First, remove existing training pages if any
DELETE FROM page_permissions WHERE page_name LIKE 'training%';

-- Add Training Pages to Page Permissions
INSERT INTO page_permissions (page_name, page_path, sort_order, icon_name, created_at, updated_at)
VALUES 
    ('training', '/training', 800, 'BookOpen', NOW(), NOW()),
    ('training-programs', '/training/programs', 810, 'ClipboardList', NOW(), NOW()),
    ('training-sessions', '/training/sessions', 820, 'CalendarDays', NOW(), NOW()),
    ('training-participants', '/training/participants', 830, 'Users', NOW(), NOW()),
    ('training-qr-codes', '/training/qr-codes', 840, 'QrCode', NOW(), NOW());

-- Grant Training Access to Roles
-- Admin has full access
INSERT INTO role_page_permissions (role, page_id, is_allowed, created_at, updated_at)
SELECT 'admin', id, true, NOW(), NOW()
FROM page_permissions
WHERE page_name IN ('training', 'training-programs', 'training-sessions', 'training-participants', 'training-qr-codes');

-- Director has full access
INSERT INTO role_page_permissions (role, page_id, is_allowed, created_at, updated_at)
SELECT 'director', id, true, NOW(), NOW()
FROM page_permissions
WHERE page_name IN ('training', 'training-programs', 'training-sessions', 'training-participants', 'training-qr-codes');

-- Partner has full access
INSERT INTO role_page_permissions (role, page_id, is_allowed, created_at, updated_at)
SELECT 'partner', id, true, NOW(), NOW()
FROM page_permissions
WHERE page_name IN ('training', 'training-programs', 'training-sessions', 'training-participants', 'training-qr-codes');

-- Coordinator has access to all training pages
INSERT INTO role_page_permissions (role, page_id, is_allowed, created_at, updated_at)
SELECT 'coordinator', id, true, NOW(), NOW()
FROM page_permissions
WHERE page_name IN ('training', 'training-programs', 'training-sessions', 'training-participants', 'training-qr-codes');

-- Teacher has limited access (no QR codes page)
INSERT INTO role_page_permissions (role, page_id, is_allowed, created_at, updated_at)
SELECT 'teacher', id, true, NOW(), NOW()
FROM page_permissions
WHERE page_name IN ('training', 'training-programs', 'training-sessions', 'training-participants');

-- Teacher has no access to QR codes
INSERT INTO role_page_permissions (role, page_id, is_allowed, created_at, updated_at)
SELECT 'teacher', id, false, NOW(), NOW()
FROM page_permissions
WHERE page_name = 'training-qr-codes';

-- Setup Action Permissions for Training Pages
DO $$
DECLARE
    page_record RECORD;
    role_name TEXT;
    action_type TEXT;
BEGIN
    -- For each training page
    FOR page_record IN 
        SELECT id, page_name FROM page_permissions 
        WHERE page_name IN ('training', 'training-programs', 'training-sessions', 'training-participants', 'training-qr-codes')
    LOOP
        -- For each role
        FOR role_name IN SELECT UNNEST(ARRAY['admin', 'director', 'partner', 'coordinator', 'teacher'])
        LOOP
            -- For each action
            FOR action_type IN SELECT UNNEST(ARRAY['view', 'create', 'update', 'delete', 'export'])
            LOOP
                -- Admin, Director, Partner have all permissions
                IF role_name IN ('admin', 'director', 'partner') THEN
                    INSERT INTO page_action_permissions (page_id, role, action_name, is_allowed)
                    VALUES (page_record.id, role_name, action_type, true)
                    ON CONFLICT (page_id, role, action_name) 
                    DO UPDATE SET is_allowed = true, updated_at = NOW();
                
                -- Coordinator has all permissions except delete on programs
                ELSIF role_name = 'coordinator' THEN
                    IF page_record.page_name = 'training-programs' AND action_type = 'delete' THEN
                        INSERT INTO page_action_permissions (page_id, role, action_name, is_allowed)
                        VALUES (page_record.id, role_name, action_type, false)
                        ON CONFLICT (page_id, role, action_name) 
                        DO UPDATE SET is_allowed = false, updated_at = NOW();
                    ELSE
                        INSERT INTO page_action_permissions (page_id, role, action_name, is_allowed)
                        VALUES (page_record.id, role_name, action_type, true)
                        ON CONFLICT (page_id, role, action_name) 
                        DO UPDATE SET is_allowed = true, updated_at = NOW();
                    END IF;
                
                -- Teacher has limited permissions
                ELSIF role_name = 'teacher' THEN
                    -- Training overview - view only
                    IF page_record.page_name = 'training' THEN
                        INSERT INTO page_action_permissions (page_id, role, action_name, is_allowed)
                        VALUES (page_record.id, role_name, action_type, action_type = 'view')
                        ON CONFLICT (page_id, role, action_name) 
                        DO UPDATE SET is_allowed = (action_type = 'view'), updated_at = NOW();
                    
                    -- Training programs - view only
                    ELSIF page_record.page_name = 'training-programs' THEN
                        INSERT INTO page_action_permissions (page_id, role, action_name, is_allowed)
                        VALUES (page_record.id, role_name, action_type, action_type = 'view')
                        ON CONFLICT (page_id, role, action_name) 
                        DO UPDATE SET is_allowed = (action_type = 'view'), updated_at = NOW();
                    
                    -- Training sessions - view and update (for their own sessions)
                    ELSIF page_record.page_name = 'training-sessions' THEN
                        INSERT INTO page_action_permissions (page_id, role, action_name, is_allowed)
                        VALUES (page_record.id, role_name, action_type, action_type IN ('view', 'update'))
                        ON CONFLICT (page_id, role, action_name) 
                        DO UPDATE SET is_allowed = (action_type IN ('view', 'update')), updated_at = NOW();
                    
                    -- Training participants - view and update
                    ELSIF page_record.page_name = 'training-participants' THEN
                        INSERT INTO page_action_permissions (page_id, role, action_name, is_allowed)
                        VALUES (page_record.id, role_name, action_type, action_type IN ('view', 'update'))
                        ON CONFLICT (page_id, role, action_name) 
                        DO UPDATE SET is_allowed = (action_type IN ('view', 'update')), updated_at = NOW();
                    
                    -- QR codes - no access
                    ELSIF page_record.page_name = 'training-qr-codes' THEN
                        INSERT INTO page_action_permissions (page_id, role, action_name, is_allowed)
                        VALUES (page_record.id, role_name, action_type, false)
                        ON CONFLICT (page_id, role, action_name) 
                        DO UPDATE SET is_allowed = false, updated_at = NOW();
                    END IF;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- Display results
SELECT 
    pp.page_name,
    pp.page_path,
    pp.sort_order,
    r.role,
    rpp.is_allowed as has_access,
    COUNT(CASE WHEN pap.is_allowed THEN 1 END) as allowed_actions,
    COUNT(pap.action_name) as total_actions
FROM page_permissions pp
CROSS JOIN (VALUES ('admin'), ('director'), ('partner'), ('coordinator'), ('teacher')) AS r(role)
LEFT JOIN role_page_permissions rpp ON pp.id = rpp.page_id AND rpp.role = r.role
LEFT JOIN page_action_permissions pap ON pp.id = pap.page_id AND pap.role = r.role
WHERE pp.page_name LIKE 'training%'
GROUP BY pp.page_name, pp.page_path, pp.sort_order, r.role, rpp.is_allowed
ORDER BY pp.sort_order, r.role;