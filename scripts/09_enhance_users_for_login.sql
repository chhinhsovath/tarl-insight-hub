-- Function to check if a column exists
CREATE OR REPLACE FUNCTION column_exists(table_name text, column_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2
    );
END;
$$ LANGUAGE plpgsql;

-- Add new columns for authentication and security (only if they don't exist)
DO $$ 
BEGIN
    -- Add password column if it doesn't exist
    IF NOT column_exists('tbl_tarl_users', 'password') THEN
        ALTER TABLE "public"."tbl_tarl_users"
        ADD COLUMN "password" varchar(255) COLLATE "pg_catalog"."default";
    ELSE
        RAISE NOTICE 'Column password already exists in tbl_tarl_users.';
    END IF;

    -- Set a default password for existing users where password is NULL
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_tarl_users' AND column_name = 'password') THEN
        UPDATE tbl_tarl_users
        SET password = '$2b$10$gqmo2ZJ4atuJVWjV0T41ROLIfqDRgfhLZedU73weBC04sdP3LUr0u' -- bcrypt hash for '12345'
        WHERE password IS NULL;
    END IF;

    -- Add last_login column if it doesn't exist
    IF NOT column_exists('tbl_tarl_users', 'last_login') THEN
        ALTER TABLE "public"."tbl_tarl_users"
        ADD COLUMN "last_login" timestamp(6);
    END IF;

    -- Add password_reset_token column if it doesn't exist
    IF NOT column_exists('tbl_tarl_users', 'password_reset_token') THEN
        ALTER TABLE "public"."tbl_tarl_users"
        ADD COLUMN "password_reset_token" varchar(255) COLLATE "pg_catalog"."default";
    END IF;

    -- Add password_reset_expires column if it doesn't exist
    IF NOT column_exists('tbl_tarl_users', 'password_reset_expires') THEN
        ALTER TABLE "public"."tbl_tarl_users"
        ADD COLUMN "password_reset_expires" timestamp(6);
    END IF;

    -- Add failed_login_attempts column if it doesn't exist
    IF NOT column_exists('tbl_tarl_users', 'failed_login_attempts') THEN
        ALTER TABLE "public"."tbl_tarl_users"
        ADD COLUMN "failed_login_attempts" int4 DEFAULT 0;
    END IF;

    -- Add account_locked_until column if it doesn't exist
    IF NOT column_exists('tbl_tarl_users', 'account_locked_until') THEN
        ALTER TABLE "public"."tbl_tarl_users"
        ADD COLUMN "account_locked_until" timestamp(6);
    END IF;
END $$;

-- Create unique index for username if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'tbl_tarl_users'
        AND indexname = 'idx_tbl_tarl_users_username'
    ) THEN
        CREATE UNIQUE INDEX "idx_tbl_tarl_users_username" ON "public"."tbl_tarl_users" USING btree (
            "username" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
        );
    END IF;
END $$;

-- Make password required for new users if it's not already
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'tbl_tarl_users'
        AND column_name = 'password'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "public"."tbl_tarl_users"
        ALTER COLUMN "password" SET NOT NULL;
    END IF;
END $$;

-- Add check constraint for failed_login_attempts if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'tbl_tarl_users_failed_login_attempts_check'
    ) THEN
        ALTER TABLE "public"."tbl_tarl_users"
        ADD CONSTRAINT "tbl_tarl_users_failed_login_attempts_check" 
        CHECK (failed_login_attempts >= 0);
    END IF;
END $$;

-- Add comment to explain the table's purpose
COMMENT ON TABLE "public"."tbl_tarl_users" IS 'User accounts for TaRL Insight Hub with authentication and security features';

-- Drop the helper function
DROP FUNCTION IF EXISTS column_exists(text, text); 