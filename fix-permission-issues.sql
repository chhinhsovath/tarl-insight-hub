-- Fix Permission Issues Identified in Testing
-- Run this script to address the identified permission problems

-- 1. Fix Teacher role - should not have admin access
UPDATE role_page_permissions 
SET is_allowed = false 
WHERE role = 'teacher' 
AND page_id IN (
    SELECT id FROM page_permissions 
    WHERE page_name IN ('System Admin', 'Pages Management', 'Users', 'Hierarchy Management')
);

-- 2. Fix Collector role - should have limited access (only data collection related)
UPDATE role_page_permissions 
SET is_allowed = false 
WHERE role = 'collector' 
AND page_id IN (
    SELECT id FROM page_permissions 
    WHERE page_name IN ('System Admin', 'Pages Management', 'Users', 'Hierarchy Management', 'បណ្តុះបណ្តាល')
);

-- 3. Fix Intern role - should have very limited access
UPDATE role_page_permissions 
SET is_allowed = false 
WHERE role = 'intern' 
AND page_id IN (
    SELECT id FROM page_permissions 
    WHERE page_name IN ('System Admin', 'Pages Management', 'Users', 'Hierarchy Management', 'Schools', 'Analytics')
);

-- 4. Fix Training Organizer - should only access dashboard and training
UPDATE role_page_permissions 
SET is_allowed = false 
WHERE role = 'Training Organizer' 
AND page_id IN (
    SELECT id FROM page_permissions 
    WHERE page_name NOT IN ('Dashboard', 'បណ្តុះបណ្តាល', 'សម័យបណ្តុះបណ្តាល', 'កម្មវិធីបណ្តុះបណ្តាល', 'អ្នកចូលរួមបណ្តុះបណ្តាល', 'លេខកូដ QR', 'មតិយោបល់បណ្តុះបណ្តាល')
);

-- Enable dashboard access for Training Organizer
UPDATE role_page_permissions 
SET is_allowed = true 
WHERE role = 'Training Organizer' 
AND page_id = (SELECT id FROM page_permissions WHERE page_name = 'Dashboard');

-- 5. Add missing feedback permissions for training roles
INSERT INTO page_action_permissions (page_id, role, action_name, is_allowed)
SELECT 
    pp.id,
    r.role,
    'view' as action_name,
    true as is_allowed
FROM page_permissions pp
CROSS JOIN (
    SELECT 'admin' as role
    UNION SELECT 'director'
    UNION SELECT 'partner' 
    UNION SELECT 'coordinator'
    UNION SELECT 'teacher'
) r
WHERE pp.page_name = 'មតិយោបល់បណ្តុះបណ្តាល'
AND NOT EXISTS (
    SELECT 1 FROM page_action_permissions pap 
    WHERE pap.page_id = pp.id 
    AND pap.role = r.role 
    AND pap.action_name = 'view'
);

-- 6. Ensure coordinator can't create programs (as per frontend rules)
UPDATE page_action_permissions 
SET is_allowed = false 
WHERE role = 'coordinator' 
AND page_id = (SELECT id FROM page_permissions WHERE page_name = 'កម្មវិធីបណ្តុះបណ្តាល')
AND action_name = 'create';

-- 7. Fix teacher program permissions (should only view)
UPDATE page_action_permissions 
SET is_allowed = false 
WHERE role = 'teacher' 
AND page_id = (SELECT id FROM page_permissions WHERE page_name = 'កម្មវិធីបណ្តុះបណ្តាល')
AND action_name IN ('create', 'update', 'delete');

-- 8. Fix teacher session permissions (should only view and update, not create/delete)
UPDATE page_action_permissions 
SET is_allowed = false 
WHERE role = 'teacher' 
AND page_id = (SELECT id FROM page_permissions WHERE page_name = 'សម័យបណ្តុះបណ្តាល')
AND action_name IN ('create', 'delete');

-- 9. Fix teacher participant permissions (should only view and update, not create/delete)
UPDATE page_action_permissions 
SET is_allowed = false 
WHERE role = 'teacher' 
AND page_id = (SELECT id FROM page_permissions WHERE page_name = 'អ្នកចូលរួមបណ្តុះបណ្តាល')
AND action_name IN ('create', 'delete');

-- 10. Add proper role descriptions
UPDATE tbl_tarl_roles SET description = 'System administrator with full access' WHERE name = 'admin';
UPDATE tbl_tarl_roles SET description = 'Regional director with management access' WHERE name = 'director';
UPDATE tbl_tarl_roles SET description = 'Partner organization representative' WHERE name = 'partner';
UPDATE tbl_tarl_roles SET description = 'Training coordinator with session management' WHERE name = 'coordinator';
UPDATE tbl_tarl_roles SET description = 'Teacher with classroom and training access' WHERE name = 'teacher';
UPDATE tbl_tarl_roles SET description = 'Data collector with observation access' WHERE name = 'collector';
UPDATE tbl_tarl_roles SET description = 'Intern with limited read-only access' WHERE name = 'intern';
UPDATE tbl_tarl_roles SET description = 'Training program organizer' WHERE name = 'Training Organizer';

-- Verification queries (run these to check the fixes)
-- SELECT 'Teacher Admin Access Check' as test;
-- SELECT pp.page_name, rpp.is_allowed 
-- FROM role_page_permissions rpp 
-- JOIN page_permissions pp ON rpp.page_id = pp.id 
-- WHERE rpp.role = 'teacher' AND pp.page_name IN ('System Admin', 'Users', 'Pages Management');

-- SELECT 'Training Organizer Access Check' as test;
-- SELECT pp.page_name, rpp.is_allowed 
-- FROM role_page_permissions rpp 
-- JOIN page_permissions pp ON rpp.page_id = pp.id 
-- WHERE rpp.role = 'Training Organizer' AND rpp.is_allowed = true;

-- SELECT 'Feedback Permissions Check' as test;
-- SELECT pap.role, pap.action_name, pap.is_allowed 
-- FROM page_action_permissions pap 
-- JOIN page_permissions pp ON pap.page_id = pp.id 
-- WHERE pp.page_name = 'មតិយោបល់បណ្តុះបណ្តាល' AND pap.action_name = 'view';