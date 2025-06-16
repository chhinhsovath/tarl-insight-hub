-- =====================================================
-- HIERARCHICAL PERMISSION SYSTEM SCHEMA
-- This script creates tables to support organizational hierarchy
-- and role-based data filtering for the TaRL platform
-- =====================================================

-- =====================================================
-- USER HIERARCHY ASSIGNMENTS
-- =====================================================

-- User-School assignments for Directors/Partners
CREATE TABLE IF NOT EXISTS user_school_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    school_id INTEGER NOT NULL,
    assignment_type VARCHAR(50) NOT NULL, -- 'direct', 'district', 'province', 'zone'
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, school_id, assignment_type)
);

-- User-District assignments for Directors/Partners
CREATE TABLE IF NOT EXISTS user_district_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    district_id INTEGER NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, district_id)
);

-- User-Province assignments for Directors/Partners
CREATE TABLE IF NOT EXISTS user_province_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    province_id INTEGER NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, province_id)
);

-- User-Zone assignments for Directors/Partners
CREATE TABLE IF NOT EXISTS user_zone_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    zone_id INTEGER NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, zone_id)
);

-- =====================================================
-- TEACHER-CLASS ASSIGNMENTS
-- =====================================================

-- Classes table (if not exists)
CREATE TABLE IF NOT EXISTS tbl_tarl_classes (
    id SERIAL PRIMARY KEY,
    class_name VARCHAR(255) NOT NULL,
    class_level INTEGER,
    school_id INTEGER NOT NULL,
    teacher_id INTEGER,
    academic_year VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table (if not exists)
CREATE TABLE IF NOT EXISTS tbl_tarl_students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(100) UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    class_id INTEGER,
    school_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teacher-Class assignments (many-to-many)
CREATE TABLE IF NOT EXISTS teacher_class_assignments (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    subject VARCHAR(100),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(teacher_id, class_id, subject)
);

-- =====================================================
-- ENHANCED ROLE DEFINITIONS
-- =====================================================

-- Add hierarchy level to existing roles table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_roles' AND column_name = 'hierarchy_level') THEN
        ALTER TABLE tbl_tarl_roles ADD COLUMN hierarchy_level INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_roles' AND column_name = 'can_manage_hierarchy') THEN
        ALTER TABLE tbl_tarl_roles ADD COLUMN can_manage_hierarchy BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tbl_tarl_roles' AND column_name = 'max_hierarchy_depth') THEN
        ALTER TABLE tbl_tarl_roles ADD COLUMN max_hierarchy_depth INTEGER DEFAULT 0;
    END IF;
END $$;

-- Update role hierarchy levels
UPDATE tbl_tarl_roles SET 
    hierarchy_level = 1, 
    can_manage_hierarchy = true, 
    max_hierarchy_depth = 999 
WHERE role_name = 'Admin';

UPDATE tbl_tarl_roles SET 
    hierarchy_level = 2, 
    can_manage_hierarchy = true, 
    max_hierarchy_depth = 3 
WHERE role_name IN ('Director', 'Partner');

UPDATE tbl_tarl_roles SET 
    hierarchy_level = 3, 
    can_manage_hierarchy = false, 
    max_hierarchy_depth = 1 
WHERE role_name = 'Teacher';

UPDATE tbl_tarl_roles SET 
    hierarchy_level = 3, 
    can_manage_hierarchy = false, 
    max_hierarchy_depth = 0 
WHERE role_name = 'Collector';

-- =====================================================
-- DATA ACCESS SCOPE TABLE
-- =====================================================

-- Define what data each role can access at different levels
CREATE TABLE IF NOT EXISTS role_data_scope (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL,
    data_type VARCHAR(100) NOT NULL, -- 'schools', 'users', 'students', 'observations', etc.
    scope_level VARCHAR(50) NOT NULL, -- 'global', 'zone', 'province', 'district', 'school', 'class', 'self'
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_update BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_export BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note: Default scope permissions will be inserted by the setup script
-- This avoids conflicts with existing role names in the database

-- =====================================================
-- FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add foreign key constraints after tables are created
DO $$ BEGIN
    -- user_school_assignments
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_school_user') THEN
        ALTER TABLE user_school_assignments 
        ADD CONSTRAINT fk_user_school_user 
        FOREIGN KEY (user_id) REFERENCES tbl_tarl_users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_school_school') THEN
        ALTER TABLE user_school_assignments 
        ADD CONSTRAINT fk_user_school_school 
        FOREIGN KEY (school_id) REFERENCES tbl_tarl_schools(id) ON DELETE CASCADE;
    END IF;

    -- user_district_assignments
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_district_user') THEN
        ALTER TABLE user_district_assignments 
        ADD CONSTRAINT fk_user_district_user 
        FOREIGN KEY (user_id) REFERENCES tbl_tarl_users(id) ON DELETE CASCADE;
    END IF;

    -- user_province_assignments
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_province_user') THEN
        ALTER TABLE user_province_assignments 
        ADD CONSTRAINT fk_user_province_user 
        FOREIGN KEY (user_id) REFERENCES tbl_tarl_users(id) ON DELETE CASCADE;
    END IF;

    -- user_zone_assignments
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_zone_user') THEN
        ALTER TABLE user_zone_assignments 
        ADD CONSTRAINT fk_user_zone_user 
        FOREIGN KEY (user_id) REFERENCES tbl_tarl_users(id) ON DELETE CASCADE;
    END IF;

    -- teacher_class_assignments
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_teacher_class_teacher') THEN
        ALTER TABLE teacher_class_assignments 
        ADD CONSTRAINT fk_teacher_class_teacher 
        FOREIGN KEY (teacher_id) REFERENCES tbl_tarl_users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_teacher_class_class') THEN
        ALTER TABLE teacher_class_assignments 
        ADD CONSTRAINT fk_teacher_class_class 
        FOREIGN KEY (class_id) REFERENCES tbl_tarl_classes(id) ON DELETE CASCADE;
    END IF;

    -- tbl_tarl_classes
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_class_school') THEN
        ALTER TABLE tbl_tarl_classes 
        ADD CONSTRAINT fk_class_school 
        FOREIGN KEY (school_id) REFERENCES tbl_tarl_schools(id) ON DELETE CASCADE;
    END IF;

    -- tbl_tarl_students
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_student_class') THEN
        ALTER TABLE tbl_tarl_students 
        ADD CONSTRAINT fk_student_class 
        FOREIGN KEY (class_id) REFERENCES tbl_tarl_classes(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_student_school') THEN
        ALTER TABLE tbl_tarl_students 
        ADD CONSTRAINT fk_student_school 
        FOREIGN KEY (school_id) REFERENCES tbl_tarl_schools(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_school_assignments_user_id ON user_school_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_school_assignments_school_id ON user_school_assignments(school_id);
CREATE INDEX IF NOT EXISTS idx_user_district_assignments_user_id ON user_district_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_province_assignments_user_id ON user_province_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_zone_assignments_user_id ON user_zone_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_assignments_teacher_id ON teacher_class_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_assignments_class_id ON teacher_class_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON tbl_tarl_students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON tbl_tarl_students(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON tbl_tarl_classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON tbl_tarl_classes(teacher_id);

-- =====================================================
-- VIEWS FOR EASY DATA ACCESS
-- =====================================================

-- View to get user's accessible schools
CREATE OR REPLACE VIEW user_accessible_schools AS
SELECT DISTINCT 
    u.id as user_id,
    u.username,
    u.role,
    s.id as school_id,
    s.school_name,
    s.school_code,
    'direct' as access_type
FROM tbl_tarl_users u
JOIN user_school_assignments usa ON u.id = usa.user_id
JOIN tbl_tarl_schools s ON usa.school_id = s.id
WHERE usa.is_active = true

UNION

SELECT DISTINCT 
    u.id as user_id,
    u.username,
    u.role,
    s.id as school_id,
    s.school_name,
    s.school_code,
    'district' as access_type
FROM tbl_tarl_users u
JOIN user_district_assignments uda ON u.id = uda.user_id
JOIN tbl_tarl_schools s ON s.district_id = uda.district_id
WHERE uda.is_active = true

UNION

SELECT DISTINCT 
    u.id as user_id,
    u.username,
    u.role,
    s.id as school_id,
    s.school_name,
    s.school_code,
    'province' as access_type
FROM tbl_tarl_users u
JOIN user_province_assignments upa ON u.id = upa.user_id
JOIN tbl_tarl_schools s ON s.province_id = upa.province_id
WHERE upa.is_active = true

UNION

SELECT DISTINCT 
    u.id as user_id,
    u.username,
    u.role,
    s.id as school_id,
    s.school_name,
    s.school_code,
    'zone' as access_type
FROM tbl_tarl_users u
JOIN user_zone_assignments uza ON u.id = uza.user_id
JOIN tbl_tarl_schools s ON s.zone_id = uza.zone_id
WHERE uza.is_active = true;

-- View to get teacher's classes and students
CREATE OR REPLACE VIEW teacher_classes_students AS
SELECT 
    u.id as teacher_id,
    u.username as teacher_name,
    c.id as class_id,
    c.class_name,
    c.class_level,
    s.id as student_id,
    s.first_name,
    s.last_name,
    s.student_id as student_code,
    sc.id as school_id,
    sc.school_name
FROM tbl_tarl_users u
JOIN teacher_class_assignments tca ON u.id = tca.teacher_id
JOIN tbl_tarl_classes c ON tca.class_id = c.id
LEFT JOIN tbl_tarl_students s ON c.id = s.class_id
JOIN tbl_tarl_schools sc ON c.school_id = sc.id
WHERE tca.is_active = true AND c.is_active = true AND (s.is_active = true OR s.id IS NULL);

COMMENT ON SCHEMA public IS 'Enhanced TaRL database schema with hierarchical permissions';