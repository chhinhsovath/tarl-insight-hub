-- Fix Teacher Role Permissions
-- Enable appropriate access for teachers based on role testing validation

-- Enable Dashboard access (basic system access)
UPDATE role_page_permissions 
SET is_allowed = true 
WHERE role = 'teacher' 
AND page_id = (SELECT id FROM page_permissions WHERE page_name = 'Dashboard');

-- Enable Students access (teachers work with students)
UPDATE role_page_permissions 
SET is_allowed = true 
WHERE role = 'teacher' 
AND page_id = (SELECT id FROM page_permissions WHERE page_name = 'Students');

-- Enable Observations access (classroom observations)
UPDATE role_page_permissions 
SET is_allowed = true 
WHERE role = 'teacher' 
AND page_id = (SELECT id FROM page_permissions WHERE page_name = 'Observations');

-- Enable Progress access (student progress tracking)
UPDATE role_page_permissions 
SET is_allowed = true 
WHERE role = 'teacher' 
AND page_id = (SELECT id FROM page_permissions WHERE page_name = 'Progress');

-- Enable Schools access (read-only access to school information)
UPDATE role_page_permissions 
SET is_allowed = true 
WHERE role = 'teacher' 
AND page_id = (SELECT id FROM page_permissions WHERE page_name = 'Schools');

-- Keep admin functions disabled (System Admin, Users, Pages Management, Hierarchy Management)
-- These should remain false as per security requirements

-- Verification query
SELECT 'Teacher Permissions After Update' as status;
SELECT pp.page_name, rpp.is_allowed 
FROM role_page_permissions rpp 
JOIN page_permissions pp ON rpp.page_id = pp.id 
WHERE rpp.role = 'teacher' 
ORDER BY pp.sort_order;