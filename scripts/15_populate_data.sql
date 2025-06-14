-- Insert Zones
INSERT INTO "public"."tbl_tarl_zones" ("name") VALUES
('Zone 1'),
('Zone 2'),
('Zone 3');

-- Insert Provinces
INSERT INTO "public"."tbl_tarl_provinces" ("name_kh", "name_en", "name_jp", "zone_id") VALUES
('ភ្នំពេញ', 'Phnom Penh', 'プノンペン', 1),
('កណ្តាល', 'Kandal', 'カンダル', 1),
('តាកែវ', 'Takeo', 'タケオ', 2),
('កំពង់ចាម', 'Kampong Cham', 'カンポンチャム', 2),
('បាត់ដំបង', 'Battambang', 'バッタンバン', 3);

-- Insert Districts
INSERT INTO "public"."tbl_tarl_districts" ("name", "name_en", "province_id") VALUES
('ខណ្ឌដូនពេញ', 'Doun Penh', 1),
('ខណ្ឌចំការមន', 'Chamkar Mon', 1),
('ស្រុកស្អាង', 'Sa Ang', 2),
('ស្រុកកណ្តាលស្ទឹង', 'Kandal Stueng', 2),
('ស្រុកដូនកែវ', 'Don Keo', 3),
('ស្រុកបាទី', 'Bati', 3),
('ស្រុកកំពង់ស្វាយ', 'Kampong Svay', 4),
('ស្រុកបាធាយ', 'Batheay', 4),
('ស្រុកបាត់ដំបង', 'Battambang', 5),
('ស្រុកឯកភ្នំ', 'Ek Phnom', 5);

-- Insert Communes
INSERT INTO "public"."tbl_tarl_communes" ("name", "district_id") VALUES
('ឃុំផ្សារថ្មី', 1),
('ឃុំផ្សារកណ្តាល', 1),
('ឃុំវត្តភ្នំ', 2),
('ឃុំមន្ទីរវិចិត្រកម្ម', 2),
('ឃុំស្អាង', 3),
('ឃុំព្រែកអាជី', 3),
('ឃុំកណ្តាលស្ទឹង', 4),
('ឃុំព្រែករការ', 4),
('ឃុំដូនកែវ', 5),
('ឃុំបាទី', 6),
('ឃុំកំពង់ស្វាយ', 7),
('ឃុំបាធាយ', 8),
('ឃុំបាត់ដំបង', 9),
('ឃុំឯកភ្នំ', 10);

-- Insert Villages
INSERT INTO "public"."tbl_tarl_villages" ("name", "commune_id") VALUES
('ភូមិ១', 1),
('ភូមិ២', 1),
('ភូមិ១', 2),
('ភូមិ២', 2),
('ភូមិ១', 3),
('ភូមិ២', 3),
('ភូមិ១', 4),
('ភូមិ២', 4),
('ភូមិ១', 5),
('ភូមិ២', 5);

-- Insert Schools
INSERT INTO "public"."tbl_tarl_schools" (
    "name", 
    "code", 
    "cluster", 
    "village_id", 
    "commune_id", 
    "district_id", 
    "province_id", 
    "zone_id", 
    "status"
) VALUES
('អនុវិទ្យាល័យផ្សារថ្មី', 'PP001', 'Cluster 1', 1, 1, 1, 1, 1, 1),
('អនុវិទ្យាល័យចំការមន', 'PP002', 'Cluster 1', 2, 2, 1, 1, 1, 1),
('អនុវិទ្យាល័យស្អាង', 'KD001', 'Cluster 2', 3, 3, 3, 2, 1, 1),
('អនុវិទ្យាល័យកណ្តាលស្ទឹង', 'KD002', 'Cluster 2', 4, 4, 4, 2, 1, 1),
('អនុវិទ្យាល័យដូនកែវ', 'TK001', 'Cluster 3', 5, 5, 5, 3, 2, 1),
('អនុវិទ្យាល័យបាទី', 'TK002', 'Cluster 3', 6, 6, 6, 3, 2, 1),
('អនុវិទ្យាល័យកំពង់ស្វាយ', 'KC001', 'Cluster 4', 7, 7, 7, 4, 2, 1),
('អនុវិទ្យាល័យបាធាយ', 'KC002', 'Cluster 4', 8, 8, 8, 4, 2, 1),
('អនុវិទ្យាល័យបាត់ដំបង', 'BB001', 'Cluster 5', 9, 9, 9, 5, 3, 1),
('អនុវិទ្យាល័យឯកភ្នំ', 'BB002', 'Cluster 5', 10, 10, 10, 5, 3, 1);

-- Insert Users (with hashed passwords)
INSERT INTO "public"."tbl_tarl_users" (
    "full_name",
    "email",
    "phone",
    "username",
    "password",
    "role",
    "is_active",
    "school_id",
    "gender"
) VALUES
-- Admin users
('Admin User', 'admin@tarl.org', '0123456789', 'admin', '$2b$10$KZ.dIzqUYN6DWtEAhe/y9.DmJPeXUCieAQAJHVHPN8gpCWn7SzIJa', 'admin', true, 1, 'M'),
('System Admin', 'system@tarl.org', '0123456788', 'system', '$2b$10$KZ.dIzqUYN6DWtEAhe/y9.DmJPeXUCieAQAJHVHPN8gpCWn7SzIJa', 'admin', true, 1, 'M'),

-- Coordinators
('Coordinator 1', 'coord1@tarl.org', '0123456787', 'coord1', '$2b$10$KZ.dIzqUYN6DWtEAhe/y9.DmJPeXUCieAQAJHVHPN8gpCWn7SzIJa', 'coordinator', true, 1, 'F'),
('Coordinator 2', 'coord2@tarl.org', '0123456786', 'coord2', '$2b$10$KZ.dIzqUYN6DWtEAhe/y9.DmJPeXUCieAQAJHVHPN8gpCWn7SzIJa', 'coordinator', true, 2, 'M'),

-- Teachers
('Teacher 1', 'teacher1@tarl.org', '0123456785', 'teacher1', '$2b$10$KZ.dIzqUYN6DWtEAhe/y9.DmJPeXUCieAQAJHVHPN8gpCWn7SzIJa', 'teacher', true, 1, 'F'),
('Teacher 2', 'teacher2@tarl.org', '0123456784', 'teacher2', '$2b$10$KZ.dIzqUYN6DWtEAhe/y9.DmJPeXUCieAQAJHVHPN8gpCWn7SzIJa', 'teacher', true, 2, 'M'),
('Teacher 3', 'teacher3@tarl.org', '0123456783', 'teacher3', '$2b$10$KZ.dIzqUYN6DWtEAhe/y9.DmJPeXUCieAQAJHVHPN8gpCWn7SzIJa', 'teacher', true, 3, 'F'),
('Teacher 4', 'teacher4@tarl.org', '0123456782', 'teacher4', '$2b$10$KZ.dIzqUYN6DWtEAhe/y9.DmJPeXUCieAQAJHVHPN8gpCWn7SzIJa', 'teacher', true, 4, 'M'),

-- Collectors
('Collector 1', 'collector1@tarl.org', '0123456781', 'collector1', '$2b$10$KZ.dIzqUYN6DWtEAhe/y9.DmJPeXUCieAQAJHVHPN8gpCWn7SzIJa', 'collector', true, 1, 'F'),
('Collector 2', 'collector2@tarl.org', '0123456780', 'collector2', '$2b$10$KZ.dIzqUYN6DWtEAhe/y9.DmJPeXUCieAQAJHVHPN8gpCWn7SzIJa', 'collector', true, 2, 'M'); 