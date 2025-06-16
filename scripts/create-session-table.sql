-- Create user session table for authentication
CREATE TABLE IF NOT EXISTS tbl_tarl_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  username VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  session_expires TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES tbl_tarl_users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_token ON tbl_tarl_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_session_expires ON tbl_tarl_sessions(session_expires);
CREATE INDEX IF NOT EXISTS idx_expires_at ON tbl_tarl_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_id ON tbl_tarl_sessions(user_id);

-- Clean up expired sessions automatically
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM tbl_tarl_sessions WHERE session_expires < NOW();
  DELETE FROM tbl_tarl_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a user session table that matches the expected structure
-- This supports both session_expires and expires_at columns for compatibility
CREATE TABLE IF NOT EXISTS user_sessions AS SELECT * FROM tbl_tarl_sessions WHERE 1=0;

COMMENT ON TABLE tbl_tarl_sessions IS 'User authentication sessions with automatic cleanup';
COMMENT ON COLUMN tbl_tarl_sessions.session_expires IS 'Session expiry timestamp (legacy)';
COMMENT ON COLUMN tbl_tarl_sessions.expires_at IS 'Session expiry timestamp (new format)';