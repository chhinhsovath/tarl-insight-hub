-- Remove permissions for 'New Observation' page from all roles
UPDATE role_page_permissions
SET is_allowed = FALSE
WHERE page_id = (SELECT id FROM page_permissions WHERE page_path = '/observations/new')
AND role IN ('Admin', 'Teacher', 'Collector', 'Coordinator'); 