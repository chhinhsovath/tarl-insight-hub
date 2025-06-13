-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

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
