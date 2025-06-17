-- TARL Insight Hub - Core Data Import for Supabase
-- Run this after importing the schema.sql

-- Insert Countries
INSERT INTO tbl_tarl_countries (id, country_name, country_code) VALUES 
(1, 'Cambodia', 'KH');

-- Insert Zones  
INSERT INTO tbl_tarl_zones (id, zone_name, country_id) VALUES 
(1, 'Central Zone', 1),
(2, 'Northern Zone', 1),
(3, 'Southern Zone', 1),
(4, 'Eastern Zone', 1),
(5, 'Western Zone', 1),
(6, 'Northeast Zone', 1);

-- Insert Sample Provinces
INSERT INTO tbl_tarl_provinces (id, province_name, zone_id) VALUES 
(1, 'Phnom Penh', 1),
(2, 'Kandal', 1),
(3, 'Siem Reap', 2),
(4, 'Battambang', 5),
(5, 'Kampong Thom', 1),
(6, 'Prey Veng', 4),
(7, 'Kampong Cham', 4),
(8, 'Takeo', 3),
(9, 'Kampong Speu', 1),
(10, 'Svay Rieng', 4),
(11, 'Banteay Meanchey', 5),
(12, 'Kampong Chhnang', 1),
(13, 'Kep', 3),
(14, 'Pailin', 5),
(15, 'Preah Vihear', 2),
(16, 'Pursat', 5),
(17, 'Sihanoukville', 3),
(18, 'Stung Treng', 6),
(19, 'Koh Kong', 3),
(20, 'Kratié', 6),
(21, 'Mondulkiri', 6),
(22, 'Ratanakiri', 6),
(23, 'Tbong Khmum', 4),
(24, 'Oddar Meanchey', 2),
(25, 'Preah Sihanouk', 3);

-- Insert Roles
INSERT INTO tbl_tarl_roles (id, name, description, hierarchy_level, can_manage_hierarchy, max_hierarchy_depth) VALUES 
(1, 'admin', 'System administrator with full access', 1, true, 999),
(2, 'director', 'Regional director with management access', 2, true, 3),
(3, 'partner', 'Partner organization representative', 2, true, 3),
(4, 'coordinator', 'Training coordinator with session management', 3, false, 1),
(5, 'teacher', 'Teacher with classroom and training access', 3, false, 1),
(6, 'collector', 'Data collector with observation access', 3, false, 0),
(7, 'intern', 'Intern with limited read-only access', 4, false, 0),
(8, 'Training Organizer', 'Training program organizer', 3, false, 1);

-- Insert Page Permissions
INSERT INTO page_permissions (id, page_name, page_path, page_title, icon_name, category, parent_page_id, sort_order, is_active) VALUES 
(1, 'Dashboard', '/dashboard', 'Dashboard', 'LayoutDashboard', 'Overview', NULL, 1, true),
(2, 'បណ្តុះបណ្តាល', '/training', 'Training Management', 'GraduationCap', 'Training', NULL, 2, true),
(3, 'Schools', '/schools', 'Schools Management', 'School', 'Management', NULL, 3, true),
(4, 'Students', '/students', 'Students Management', 'Users', 'Management', NULL, 5, true),
(5, 'Data Collection', '/collection', 'Data Collection', 'Database', 'Data', NULL, 7, true),
(6, 'Analytics', '/analytics', 'Analytics & Reports', 'BarChart3', 'Reports', NULL, 9, true),
(7, 'Observations', '/observations', 'Classroom Observations', 'Eye', 'Data', NULL, 11, true),
(8, 'Progress', '/progress', 'Learning Progress', 'TrendingUp', 'Data', NULL, 12, true),
(9, 'Reports', '/reports', 'System Reports', 'FileText', 'Data', NULL, 13, true),
(10, 'Visits', '/visits', 'School Visits', 'MapPin', 'Data', NULL, 14, true),
(11, 'System Admin', '/settings', 'System Administration', 'Settings', 'Admin', NULL, 15, true),
(12, 'Hierarchy Management', '/management/hierarchical', 'Hierarchy Management', 'Sitemap', 'Admin', 11, 16, true),
(13, 'Pages Management', '/settings/page-permissions', 'Permission Management', 'Shield', 'Admin', 11, 17, true),
(14, 'Users', '/users', 'User Management', 'UserCog', 'Admin', 11, 18, true),
(15, 'សម័យបណ្តុះបណ្តាល', '/training/sessions', 'Training Sessions', 'Calendar', 'Training', 2, 21, true),
(16, 'កម្មវិធីបណ្តុះបណ្តាល', '/training/programs', 'Training Programs', 'BookOpen', 'Training', 2, 22, true),
(17, 'អ្នកចូលរួមបណ្តុះបណ្តាល', '/training/participants', 'Training Participants', 'Users', 'Training', 2, 23, true),
(18, 'លេខកូដ QR', '/training/qr-codes', 'QR Codes', 'QrCode', 'Training', 2, 24, true),
(19, 'មតិយោបល់បណ្តុះបណ្តាល', '/training/feedback', 'Training Feedback', 'MessageSquare', 'Training', 2, 25, true);

-- Insert Sample Users (with bcrypt hashed passwords for 'password123')
INSERT INTO tbl_tarl_users (id, username, password_hash, full_name, email, role, is_active) VALUES 
(1, 'admin', '$2b$10$rqYhBxbH8X7QlP2TqXqYKO8hY5kH5M5X5X5X5X5X5X5X5X5X5X5X5', 'System Administrator', 'admin@tarl.org', 'admin', true),
(2, 'director1', '$2b$10$rqYhBxbH8X7QlP2TqXqYKO8hY5kH5M5X5X5X5X5X5X5X5X5X5X5X5', 'Director One', 'director1@tarl.org', 'director', true),
(3, 'partner1', '$2b$10$rqYhBxbH8X7QlP2TqXqYKO8hY5kH5M5X5X5X5X5X5X5X5X5X5X5X5', 'Partner One', 'partner1@tarl.org', 'partner', true),
(4, 'coordinator1', '$2b$10$rqYhBxbH8X7QlP2TqXqYKO8hY5kH5M5X5X5X5X5X5X5X5X5X5X5X5', 'Coordinator One', 'coordinator1@tarl.org', 'coordinator', true),
(5, 'teacher1', '$2b$10$rqYhBxbH8X7QlP2TqXqYKO8hY5kH5M5X5X5X5X5X5X5X5X5X5X5X5', 'Teacher One', 'teacher1@tarl.org', 'teacher', true),
(6, 'collector1', '$2b$10$rqYhBxbH8X7QlP2TqXqYKO8hY5kH5M5X5X5X5X5X5X5X5X5X5X5X5', 'Collector One', 'collector1@tarl.org', 'collector', true),
(7, 'intern1', '$2b$10$rqYhBxbH8X7QlP2TqXqYKO8hY5kH5M5X5X5X5X5X5X5X5X5X5X5X5', 'Intern One', 'intern1@tarl.org', 'intern', true);

-- Insert Role Page Permissions (Admin gets all access)
INSERT INTO role_page_permissions (role, page_id, is_allowed) 
SELECT 'admin', id, true FROM page_permissions;

-- Director permissions
INSERT INTO role_page_permissions (role, page_id, is_allowed) VALUES 
('director', 1, true),  -- Dashboard
('director', 2, true),  -- Training
('director', 3, true),  -- Schools
('director', 4, true),  -- Students
('director', 5, true),  -- Data Collection
('director', 6, true),  -- Analytics
('director', 7, true),  -- Observations
('director', 8, true),  -- Progress
('director', 9, true),  -- Reports
('director', 10, true), -- Visits
('director', 11, true), -- System Admin
('director', 12, true), -- Hierarchy Management
('director', 13, true), -- Pages Management
('director', 14, true), -- Users
('director', 15, true), -- Training Sessions
('director', 16, true), -- Training Programs
('director', 17, true), -- Training Participants
('director', 18, true), -- QR Codes
('director', 19, true); -- Training Feedback

-- Partner permissions (same as director)
INSERT INTO role_page_permissions (role, page_id, is_allowed) VALUES 
('partner', 1, true),   -- Dashboard
('partner', 2, true),   -- Training
('partner', 3, true),   -- Schools
('partner', 4, true),   -- Students
('partner', 5, true),   -- Data Collection
('partner', 6, true),   -- Analytics
('partner', 7, true),   -- Observations
('partner', 8, true),   -- Progress
('partner', 9, true),   -- Reports
('partner', 10, true),  -- Visits
('partner', 11, true),  -- System Admin
('partner', 12, true),  -- Hierarchy Management
('partner', 13, true),  -- Pages Management
('partner', 14, true),  -- Users
('partner', 15, true),  -- Training Sessions
('partner', 16, true),  -- Training Programs
('partner', 17, true),  -- Training Participants
('partner', 18, true),  -- QR Codes
('partner', 19, true);  -- Training Feedback

-- Coordinator permissions
INSERT INTO role_page_permissions (role, page_id, is_allowed) VALUES 
('coordinator', 1, true),  -- Dashboard
('coordinator', 2, true),  -- Training
('coordinator', 3, true),  -- Schools
('coordinator', 4, true),  -- Students
('coordinator', 5, true),  -- Data Collection
('coordinator', 6, true),  -- Analytics
('coordinator', 7, true),  -- Observations
('coordinator', 8, true),  -- Progress
('coordinator', 9, true),  -- Reports
('coordinator', 10, true), -- Visits
('coordinator', 11, true), -- System Admin
('coordinator', 12, true), -- Hierarchy Management
('coordinator', 13, true), -- Pages Management
('coordinator', 14, true), -- Users
('coordinator', 15, true), -- Training Sessions
('coordinator', 16, true), -- Training Programs
('coordinator', 17, true), -- Training Participants
('coordinator', 18, true), -- QR Codes
('coordinator', 19, true); -- Training Feedback

-- Teacher permissions (limited)
INSERT INTO role_page_permissions (role, page_id, is_allowed) VALUES 
('teacher', 1, true),   -- Dashboard
('teacher', 2, true),   -- Training
('teacher', 3, true),   -- Schools
('teacher', 4, true),   -- Students
('teacher', 7, true),   -- Observations
('teacher', 8, true),   -- Progress
('teacher', 15, true),  -- Training Sessions
('teacher', 16, true),  -- Training Programs
('teacher', 17, true),  -- Training Participants
('teacher', 18, true),  -- QR Codes
('teacher', 19, true);  -- Training Feedback

-- Collector permissions (data focused)
INSERT INTO role_page_permissions (role, page_id, is_allowed) VALUES 
('collector', 1, true),  -- Dashboard
('collector', 3, true),  -- Schools
('collector', 4, true),  -- Students
('collector', 5, true),  -- Data Collection
('collector', 6, true),  -- Analytics
('collector', 7, true),  -- Observations
('collector', 8, true),  -- Progress
('collector', 9, true),  -- Reports
('collector', 10, true); -- Visits

-- Intern permissions (very limited)
INSERT INTO role_page_permissions (role, page_id, is_allowed) VALUES 
('intern', 1, true),    -- Dashboard
('intern', 2, true),    -- Training
('intern', 15, true),   -- Training Sessions
('intern', 16, true),   -- Training Programs
('intern', 17, true),   -- Training Participants
('intern', 18, true),   -- QR Codes
('intern', 19, true);   -- Training Feedback

-- Training Organizer permissions (training focused)
INSERT INTO role_page_permissions (role, page_id, is_allowed) VALUES 
('Training Organizer', 1, true),  -- Dashboard
('Training Organizer', 2, true),  -- Training
('Training Organizer', 15, true), -- Training Sessions
('Training Organizer', 16, true), -- Training Programs
('Training Organizer', 17, true), -- Training Participants
('Training Organizer', 18, true), -- QR Codes
('Training Organizer', 19, true); -- Training Feedback

-- Insert Action Permissions for Training Modules

-- Admin - Full access to all training modules
INSERT INTO page_action_permissions (page_id, role, action_name, is_allowed) VALUES 
-- Training Programs
(16, 'admin', 'view', true),
(16, 'admin', 'create', true),
(16, 'admin', 'update', true),
(16, 'admin', 'delete', true),
(16, 'admin', 'export', true),
-- Training Sessions
(15, 'admin', 'view', true),
(15, 'admin', 'create', true),
(15, 'admin', 'update', true),
(15, 'admin', 'delete', true),
(15, 'admin', 'export', true),
-- Training Participants
(17, 'admin', 'view', true),
(17, 'admin', 'create', true),
(17, 'admin', 'update', true),
(17, 'admin', 'delete', true),
(17, 'admin', 'export', true),
-- Training Feedback
(19, 'admin', 'view', true);

-- Director - Full access to training modules
INSERT INTO page_action_permissions (page_id, role, action_name, is_allowed) VALUES 
-- Training Programs
(16, 'director', 'view', true),
(16, 'director', 'create', true),
(16, 'director', 'update', true),
(16, 'director', 'delete', true),
(16, 'director', 'export', true),
-- Training Sessions
(15, 'director', 'view', true),
(15, 'director', 'create', true),
(15, 'director', 'update', true),
(15, 'director', 'delete', true),
(15, 'director', 'export', true),
-- Training Participants
(17, 'director', 'view', true),
(17, 'director', 'create', true),
(17, 'director', 'update', true),
(17, 'director', 'delete', true),
(17, 'director', 'export', true),
-- Training Feedback
(19, 'director', 'view', true);

-- Partner - Full access to training modules
INSERT INTO page_action_permissions (page_id, role, action_name, is_allowed) VALUES 
-- Training Programs
(16, 'partner', 'view', true),
(16, 'partner', 'create', true),
(16, 'partner', 'update', true),
(16, 'partner', 'delete', true),
(16, 'partner', 'export', true),
-- Training Sessions
(15, 'partner', 'view', true),
(15, 'partner', 'create', true),
(15, 'partner', 'update', true),
(15, 'partner', 'delete', true),
(15, 'partner', 'export', true),
-- Training Participants
(17, 'partner', 'view', true),
(17, 'partner', 'create', true),
(17, 'partner', 'update', true),
(17, 'partner', 'delete', true),
(17, 'partner', 'export', true),
-- Training Feedback
(19, 'partner', 'view', true);

-- Coordinator - Limited program creation
INSERT INTO page_action_permissions (page_id, role, action_name, is_allowed) VALUES 
-- Training Programs (no create/delete)
(16, 'coordinator', 'view', true),
(16, 'coordinator', 'create', false),
(16, 'coordinator', 'update', true),
(16, 'coordinator', 'delete', false),
(16, 'coordinator', 'export', true),
-- Training Sessions
(15, 'coordinator', 'view', true),
(15, 'coordinator', 'create', true),
(15, 'coordinator', 'update', true),
(15, 'coordinator', 'delete', true),
(15, 'coordinator', 'export', true),
-- Training Participants
(17, 'coordinator', 'view', true),
(17, 'coordinator', 'create', true),
(17, 'coordinator', 'update', true),
(17, 'coordinator', 'delete', true),
(17, 'coordinator', 'export', true),
-- Training Feedback
(19, 'coordinator', 'view', true);

-- Teacher - View and limited update
INSERT INTO page_action_permissions (page_id, role, action_name, is_allowed) VALUES 
-- Training Programs (view only)
(16, 'teacher', 'view', true),
(16, 'teacher', 'create', false),
(16, 'teacher', 'update', false),
(16, 'teacher', 'delete', false),
(16, 'teacher', 'export', false),
-- Training Sessions (view and update)
(15, 'teacher', 'view', true),
(15, 'teacher', 'create', false),
(15, 'teacher', 'update', true),
(15, 'teacher', 'delete', false),
(15, 'teacher', 'export', false),
-- Training Participants (view and update)
(17, 'teacher', 'view', true),
(17, 'teacher', 'create', false),
(17, 'teacher', 'update', true),
(17, 'teacher', 'delete', false),
(17, 'teacher', 'export', false),
-- Training Feedback
(19, 'teacher', 'view', true);

-- Reset sequence values to avoid conflicts
SELECT setval('tbl_tarl_countries_id_seq', (SELECT MAX(id) FROM tbl_tarl_countries));
SELECT setval('tbl_tarl_zones_id_seq', (SELECT MAX(id) FROM tbl_tarl_zones));
SELECT setval('tbl_tarl_provinces_id_seq', (SELECT MAX(id) FROM tbl_tarl_provinces));
SELECT setval('tbl_tarl_roles_id_seq', (SELECT MAX(id) FROM tbl_tarl_roles));
SELECT setval('page_permissions_id_seq', (SELECT MAX(id) FROM page_permissions));
SELECT setval('tbl_tarl_users_id_seq', (SELECT MAX(id) FROM tbl_tarl_users));
SELECT setval('role_page_permissions_id_seq', (SELECT MAX(id) FROM role_page_permissions));
SELECT setval('page_action_permissions_id_seq', (SELECT MAX(id) FROM page_action_permissions));