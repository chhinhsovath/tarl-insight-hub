-- Add password field to tbl_tarl_users table
ALTER TABLE "public"."tbl_tarl_users" 
ADD COLUMN "password" varchar(255) COLLATE "pg_catalog"."default";

-- Update existing users with a default password (you should change this in production)
UPDATE "public"."tbl_tarl_users" 
SET "password" = 'default_password123' 
WHERE "password" IS NULL;

-- Make password field required for new users
ALTER TABLE "public"."tbl_tarl_users" 
ALTER COLUMN "password" SET NOT NULL;

-- Add an index on email for faster lookups during login
CREATE INDEX IF NOT EXISTS "idx_tbl_tarl_users_email" ON "public"."tbl_tarl_users" USING btree (
  "email" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
); 