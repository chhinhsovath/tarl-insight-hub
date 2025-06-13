-- =====================================================
-- UPDATE PROVINCES WITH OFFICIAL MOEYS DATA
-- =====================================================

BEGIN;

-- First, clear dependent data in the correct order
DELETE FROM tbl_tarl_learning_progress_summary;
DELETE FROM tbl_tarl_survey_responses;
DELETE FROM tbl_tarl_training_feedback;
DELETE FROM tbl_tarl_student_enrollments;
DELETE FROM tbl_tarl_study_hours_tracking;
DELETE FROM tbl_tarl_learning_tasks;
DELETE FROM tbl_tarl_formative_assessments;
DELETE FROM tbl_tarl_students;
DELETE FROM tbl_tarl_schools;
DELETE FROM tbl_tarl_districts;
DELETE FROM tbl_tarl_provinces;

-- Reset the sequence
ALTER SEQUENCE tbl_tarl_provinces_id_seq RESTART WITH 1;

-- Insert new province data
INSERT INTO tbl_tarl_provinces (name, name_kh, code, created_at, updated_at) VALUES 
('Battambang Province', 'ខេត្តបាត់ដំបង', 'BA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Banteay Meanchey Province', 'ខេត្តបន្ទាយមានជ័យ', 'BM', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Kampot Province', 'ខេត្តកំពត', 'KP', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Kampong Chhnang Province', 'ខេត្តកំពង់ឆ្នាំង', 'KC', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Kandal Province', 'ខេត្តកណ្តាល', 'KN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Kep Province', 'ខេត្តកែប', 'KB', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Koh Kong Province', 'ខេត្តកោះកុង', 'KK', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Kampong Cham Province', 'ខេត្តកំពង់ចាម', 'CM', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Kampong Thom Province', 'ខេត្តកំពង់ធំ', 'KT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Kratie Province', 'ខេត្តក្រចេះ', 'KH', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Kampong Speu Province', 'ខេត្តកំពង់ស្ពឺ', 'KS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Mondul Kiri Province', 'ខេត្តមណ្ឌលគីរី', 'MK', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Oddar Meanchey Province', 'ខេត្តឧត្តមានជ័យ', 'OM', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Pailin Province', 'ខេត្តប៉ៃលិន', 'PL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Phnom Penh Capital', 'រាជធានីភ្នំពេញ', 'PP', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Pursat Province', 'ខេត្តពោធិសាត់', 'PO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Prey Veng Province', 'ខេត្តព្រៃវែង', 'PY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Preah Vihear Province', 'ខេត្តព្រះវិហារ', 'PH', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Ratanak Kiri Province', 'ខេត្តរតនគីរី', 'RO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Preah Sihanouk Province', 'ខេត្តព្រះសីហនុ', 'PS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Siemreap Province', 'ខេត្តសៀមរាប', 'SR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Stung Treng Province', 'ខេត្តស្ទឹងត្រែង', 'ST', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Svay Rieng Province', 'ខេត្តស្វាយរៀង', 'SY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Takeo Province', 'ខេត្តតាកែវ', 'TA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Tboung Khmum Province', 'ខេត្តត្បូងឃ្មុំ', 'TB', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

COMMIT; 