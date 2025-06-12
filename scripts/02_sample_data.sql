-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert Provinces
INSERT INTO tbl_tarl_provinces (name, name_kh, code) VALUES 
('Phnom Penh', 'ភ្នំពេញ', 'PP'),
('Siem Reap', 'សៀមរាប', 'SR'),
('Battambang', 'បាត់ដំបង', 'BB'),
('Kandal', 'កណ្តាល', 'KD'),
('Kampong Cham', 'កំពង់ចាម', 'KC');

-- Insert Districts
INSERT INTO tbl_tarl_districts (name, name_kh, code, province_id) VALUES 
-- Phnom Penh Districts
('Chamkar Mon', 'ចំការមន', 'CM', 1),
('Doun Penh', 'ដូនពេញ', 'DP', 1),
('Prampir Meakkakra', 'ប្រាំពីរមករា', 'PM', 1),

-- Siem Reap Districts
('Siem Reap', 'សៀមរាប', 'SR1', 2),
('Angkor Chum', 'អង្គរជុំ', 'AC', 2),
('Banteay Srei', 'បន្ទាយស្រី', 'BS', 2),

-- Battambang Districts
('Battambang', 'បាត់ដំបង', 'BB1', 3),
('Banan', 'បាណន់', 'BN', 3),
('Thma Koul', 'ថ្មគោល', 'TK', 3),

-- Kandal Districts
('Kandal Stueng', 'កណ្តាលស្ទឹង', 'KS', 4),
('Khsach Kandal', 'ខ្សាច់កណ្តាល', 'KK', 4),

-- Kampong Cham Districts
('Kampong Cham', 'កំពង់ចាម', 'KC1', 5),
('Chamkar Leu', 'ចំការលើ', 'CL', 5);

-- Insert Schools
INSERT INTO tbl_tarl_schools (name, name_kh, code, province_id, district_id, address, contact_person, phone, email, director_name, total_students, total_teachers) VALUES 
-- Phnom Penh Schools
('Preah Sisowath High School', 'វិទ្យាល័យព្រះសីសុវត្ថិ', 'PSH001', 1, 1, 'Street 184, Phnom Penh', 'Ms. Sophea Lim', '012-345-678', 'sophea@psh.edu.kh', 'Mr. Dara Kong', 1200, 45),
('Hun Sen Chamkar Mon Primary', 'បឋមសិក្សាហ៊ុនសែនចំការមន', 'HSC001', 1, 1, 'Street 163, Phnom Penh', 'Ms. Sreypov Chan', '012-345-679', 'sreypov@hsc.edu.kh', 'Ms. Bopha Keo', 800, 32),
('Doun Penh Secondary School', 'អនុវិទ្យាល័យដូនពេញ', 'DPS001', 1, 2, 'Street 108, Phnom Penh', 'Mr. Pisach Noun', '012-345-680', 'pisach@dps.edu.kh', 'Mr. Visal Tep', 950, 38),

-- Siem Reap Schools
('Angkor High School', 'វិទ្យាល័យអង្គរ', 'AHS001', 2, 4, 'Siem Reap City', 'Ms. Channary Sok', '012-345-681', 'channary@ahs.edu.kh', 'Mr. Kosal Vann', 1100, 42),
('Bayon Primary School', 'បឋមសិក្សាបាយ័ន', 'BPS001', 2, 4, 'Near Angkor Wat', 'Mr. Rithy Meas', '012-345-682', 'rithy@bps.edu.kh', 'Ms. Mealea Ros', 650, 28),

-- Battambang Schools
('Battambang Provincial School', 'សាលាខេត្តបាត់ដំបង', 'BPS002', 3, 7, 'Battambang City Center', 'Ms. Sreymom Chea', '012-345-683', 'sreymom@bps.edu.kh', 'Mr. Sovannak Pich', 1050, 40),

-- Kandal Schools
('Kandal Model School', 'សាលាគំរូកណ្តាល', 'KMS001', 4, 10, 'Ta Khmau City', 'Mr. Bunthoeun Ly', '012-345-684', 'bunthoeun@kms.edu.kh', 'Ms. Sopheak Nhem', 900, 35),

-- Kampong Cham Schools
('Kampong Cham Central School', 'សាលាកណ្តាលកំពង់ចាម', 'KCC001', 5, 12, 'Kampong Cham City', 'Ms. Pheakdey Sim', '012-345-685', 'pheakdey@kcc.edu.kh', 'Mr. Ratanak Ouk', 850, 33);

-- Insert Users
INSERT INTO tbl_tarl_users (full_name, email, phone, role, school_id, province_id, district_id, gender, years_of_experience) VALUES 
-- Teachers
('Ms. Sophea Lim', 'sophea.lim@tarl.edu.kh', '012-345-678', 'Teacher', 1, 1, 1, 'Female', 8),
('Mr. Dara Kong', 'dara.kong@tarl.edu.kh', '012-345-679', 'Teacher', 1, 1, 1, 'Male', 12),
('Ms. Sreypov Chan', 'sreypov.chan@tarl.edu.kh', '012-345-680', 'Teacher', 2, 1, 1, 'Female', 6),
('Mr. Pisach Noun', 'pisach.noun@tarl.edu.kh', '012-345-681', 'Teacher', 3, 1, 2, 'Male', 10),
('Ms. Channary Sok', 'channary.sok@tarl.edu.kh', '012-345-682', 'Teacher', 4, 2, 4, 'Female', 7),
('Mr. Rithy Meas', 'rithy.meas@tarl.edu.kh', '012-345-683', 'Teacher', 5, 2, 4, 'Male', 9),
('Ms. Sreymom Chea', 'sreymom.chea@tarl.edu.kh', '012-345-684', 'Teacher', 6, 3, 7, 'Female', 11),
('Mr. Bunthoeun Ly', 'bunthoeun.ly@tarl.edu.kh', '012-345-685', 'Teacher', 7, 4, 10, 'Male', 5),

-- Coordinators
('Ms. Bopha Keo', 'bopha.keo@tarl.edu.kh', '012-345-686', 'Coordinator', NULL, 1, NULL, 'Female', 15),
('Mr. Visal Tep', 'visal.tep@tarl.edu.kh', '012-345-687', 'Coordinator', NULL, 2, NULL, 'Male', 13),
('Ms. Mealea Ros', 'mealea.ros@tarl.edu.kh', '012-345-688', 'Coordinator', NULL, 3, NULL, 'Female', 14),

-- Admin
('Mr. Kosal Vann', 'kosal.vann@tarl.edu.kh', '012-345-689', 'Admin', NULL, NULL, NULL, 'Male', 20);

-- Insert Surveys
INSERT INTO tbl_tarl_surveys (title, description, status, survey_type, target_audience, created_by, start_date, end_date) VALUES 
('TaRL Implementation Baseline Survey', 'Baseline survey to assess current teaching practices and student learning levels before TaRL implementation', 'Active', 'Pre-Training', 'Teachers', 12, '2024-01-15', '2024-02-15'),
('Teacher Training Effectiveness Survey', 'Survey to evaluate the effectiveness of TaRL teacher training programs', 'Active', 'Post-Training', 'Teachers', 12, '2024-02-01', '2024-03-01'),
('Student Learning Assessment', 'Assessment of student learning outcomes after TaRL implementation', 'Draft', 'Follow-up', 'Teachers', 12, '2024-03-01', '2024-04-01'),
('Parent Awareness Survey', 'Survey to assess parent awareness and support for TaRL methodology', 'Completed', 'General', 'Parents', 12, '2024-01-01', '2024-01-31');

-- Insert Sample Survey Responses
INSERT INTO tbl_tarl_survey_responses (survey_id, respondent_id, school_id, respondent_name, respondent_role, responses, is_complete, started_at, completed_at) VALUES 
(1, 1, 1, 'Ms. Sophea Lim', 'Teacher', '{"q1": "Strongly Agree", "q2": "Agree", "q3": "Neutral", "q4": "Agree", "q5": "Strongly Agree"}', true, '2024-01-20 09:00:00', '2024-01-20 09:25:00'),
(1, 2, 1, 'Mr. Dara Kong', 'Teacher', '{"q1": "Agree", "q2": "Agree", "q3": "Agree", "q4": "Strongly Agree", "q5": "Agree"}', true, '2024-01-21 10:00:00', '2024-01-21 10:30:00'),
(1, 3, 2, 'Ms. Sreypov Chan', 'Teacher', '{"q1": "Strongly Agree", "q2": "Strongly Agree", "q3": "Agree", "q4": "Agree", "q5": "Strongly Agree"}', true, '2024-01-22 14:00:00', '2024-01-22 14:20:00'),
(2, 4, 3, 'Mr. Pisach Noun', 'Teacher', '{"q1": "Agree", "q2": "Neutral", "q3": "Agree", "q4": "Agree", "q5": "Strongly Agree"}', true, '2024-02-05 11:00:00', '2024-02-05 11:35:00'),
(2, 5, 4, 'Ms. Channary Sok', 'Teacher', '{"q1": "Strongly Agree", "q2": "Agree", "q3": "Strongly Agree", "q4": "Agree", "q5": "Agree"}', true, '2024-02-06 15:00:00', '2024-02-06 15:28:00'),
(1, 6, 5, 'Mr. Rithy Meas', 'Teacher', '{"q1": "Agree", "q2": "Agree", "q3": "Disagree", "q4": "Neutral", "q5": "Agree"}', false, '2024-01-25 13:00:00', NULL);

-- Insert Training Feedback
INSERT INTO tbl_tarl_training_feedback (training_title, training_date, training_location, respondent_id, respondent_name, respondent_role, school_id, overall_rating, content_quality_rating, trainer_effectiveness_rating, venue_rating, materials_rating, objectives_met, will_apply_learning, will_recommend_training, would_attend_future_training, training_duration_appropriate, materials_helpful, pace_appropriate, previous_tarl_training, most_valuable_aspect, additional_topics_needed, suggestions_for_improvement, years_of_experience, subjects_taught, grade_levels_taught) VALUES 
('TaRL Methodology Training - Batch 1', '2024-01-15', 'Phnom Penh Training Center', 1, 'Ms. Sophea Lim', 'Teacher', 1, 5, 5, 4, 4, 5, true, true, true, true, true, true, true, false, 'Practical teaching strategies that can be immediately applied in classroom', 'More examples for different grade levels', 'Provide more hands-on practice sessions', 8, 'Math, Khmer', 'Grade 1-3'),

('TaRL Methodology Training - Batch 1', '2024-01-15', 'Phnom Penh Training Center', 2, 'Mr. Dara Kong', 'Teacher', 1, 4, 4, 5, 4, 4, true, true, true, true, true, true, false, false, 'Interactive teaching methods and student assessment techniques', 'Classroom management strategies', 'More time for Q&A sessions', 12, 'Science, Math', 'Grade 4-6'),

('TaRL Methodology Training - Batch 2', '2024-01-22', 'Siem Reap Training Center', 5, 'Ms. Channary Sok', 'Teacher', 4, 5, 5, 5, 3, 4, true, true, true, true, true, true, true, false, 'Student-centered learning approach', 'Technology integration in TaRL', 'Better training venue with air conditioning', 7, 'Khmer, Social Studies', 'Grade 2-4'),

('TaRL Methodology Training - Batch 2', '2024-01-22', 'Siem Reap Training Center', 6, 'Mr. Rithy Meas', 'Teacher', 5, 4, 4, 4, 3, 4, true, true, false, true, false, true, true, true, 'Differentiated instruction techniques', 'Parent engagement strategies', 'Shorter training sessions, extend over more days', 9, 'Math, English', 'Grade 1-2'),

('TaRL Advanced Training', '2024-02-05', 'Battambang Training Center', 7, 'Ms. Sreymom Chea', 'Teacher', 6, 5, 5, 5, 5, 5, true, true, true, true, true, true, true, true, 'Advanced assessment and remediation strategies', 'Multi-grade classroom management', 'Perfect as is!', 11, 'All subjects', 'Grade 1-6');
