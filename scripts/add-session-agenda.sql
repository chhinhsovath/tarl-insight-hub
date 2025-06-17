-- Add agenda column to training sessions table
ALTER TABLE tbl_tarl_training_sessions 
ADD COLUMN IF NOT EXISTS agenda TEXT;

-- Add description/notes column for additional details
ALTER TABLE tbl_tarl_training_sessions 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update some existing sessions with sample agendas
UPDATE tbl_tarl_training_sessions 
SET agenda = '<h2>Session Agenda</h2><ul><li><strong>9:00 - 9:30 AM</strong>: Registration & Welcome</li><li><strong>9:30 - 10:30 AM</strong>: Introduction to TaRL Methodology</li><li><strong>10:30 - 10:45 AM</strong>: Tea Break</li><li><strong>10:45 - 12:00 PM</strong>: Hands-on Activities</li><li><strong>12:00 - 1:00 PM</strong>: Lunch Break</li><li><strong>1:00 - 2:30 PM</strong>: Group Discussions</li><li><strong>2:30 - 3:00 PM</strong>: Q&A and Closing</li></ul>' 
WHERE id IN (1, 2, 3, 4) AND agenda IS NULL;