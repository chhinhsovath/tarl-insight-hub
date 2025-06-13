/*
 TaRL Users Table
 Contains user data for role-based access and dashboard testing
*/

-- ----------------------------
-- Table structure for tbl_tarl_users
-- ----------------------------
DROP TABLE IF EXISTS "public"."tbl_tarl_users" CASCADE;
CREATE TABLE "public"."tbl_tarl_users" (
  "id" SERIAL PRIMARY KEY,
  "full_name" varchar(250) COLLATE "pg_catalog"."default" NOT NULL,
  "email" varchar(100) COLLATE "pg_catalog"."default",
  "phone" varchar(20) COLLATE "pg_catalog"."default",
  "role" varchar(50) COLLATE "pg_catalog"."default" NOT NULL,
  "school_id" int4,
  "province_id" int4,
  "district_id" int4,
  "gender" varchar(10) COLLATE "pg_catalog"."default",
  "date_of_birth" date,
  "years_of_experience" int4,
  "is_active" bool DEFAULT true,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------
-- Sample user data for testing roles and dashboards
-- ----------------------------
BEGIN;
INSERT INTO "public"."tbl_tarl_users" ("id", "full_name", "email", "phone", "role", "school_id", "province_id", "district_id", "gender", "date_of_birth", "years_of_experience", "is_active", "created_at", "updated_at") VALUES 
(1, 'Ms. Sophea Lim', 'sophea.lim@tarl.edu.kh', '012-345-678', 'Teacher', 1, 1, 1, 'Female', NULL, 8, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491'),
(2, 'Mr. Dara Kong', 'dara.kong@tarl.edu.kh', '012-345-679', 'Teacher', 1, 1, 1, 'Male', NULL, 12, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491'),
(3, 'Ms. Sreypov Chan', 'sreypov.chan@tarl.edu.kh', '012-345-680', 'Teacher', 2, 1, 1, 'Female', NULL, 6, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491'),
(4, 'Mr. Pisach Noun', 'pisach.noun@tarl.edu.kh', '012-345-681', 'Teacher', 3, 1, 2, 'Male', NULL, 10, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491'),
(5, 'Ms. Channary Sok', 'channary.sok@tarl.edu.kh', '012-345-682', 'Teacher', 4, 2, 4, 'Female', NULL, 7, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491'),
(6, 'Mr. Rithy Meas', 'rithy.meas@tarl.edu.kh', '012-345-683', 'Teacher', 5, 2, 4, 'Male', NULL, 9, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491'),
(7, 'Ms. Sreymom Chea', 'sreymom.chea@tarl.edu.kh', '012-345-684', 'Teacher', 6, 3, 7, 'Female', NULL, 11, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491'),
(8, 'Mr. Bunthoeun Ly', 'bunthoeun.ly@tarl.edu.kh', '012-345-685', 'Teacher', 7, 4, 10, 'Male', NULL, 5, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491'),
(9, 'Ms. Bopha Keo', 'bopha.keo@tarl.edu.kh', '012-345-686', 'Coordinator', NULL, 1, NULL, 'Female', NULL, 15, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491'),
(10, 'Mr. Visal Tep', 'visal.tep@tarl.edu.kh', '012-345-687', 'Coordinator', NULL, 2, NULL, 'Male', NULL, 13, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491'),
(11, 'Ms. Mealea Ros', 'mealea.ros@tarl.edu.kh', '012-345-688', 'Coordinator', NULL, 3, NULL, 'Female', NULL, 14, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491'),
(12, 'Mr. Kosal Vann', 'kosal.vann@tarl.edu.kh', '012-345-689', 'Admin', NULL, NULL, NULL, 'Male', NULL, 20, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491');
COMMIT;

-- ----------------------------
-- Indexes for performance
-- ----------------------------
CREATE INDEX "idx_tbl_tarl_users_role" ON "public"."tbl_tarl_users" USING btree (
  "role" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_tbl_tarl_users_school" ON "public"."tbl_tarl_users" USING btree (
  "school_id" "pg_catalog"."int4_ops" ASC NULLS LAST
);

-- ----------------------------
-- Constraints
-- ----------------------------
ALTER TABLE "public"."tbl_tarl_users" ADD CONSTRAINT "tbl_tarl_users_email_key" UNIQUE ("email");
ALTER TABLE "public"."tbl_tarl_users" ADD CONSTRAINT "tbl_tarl_users_gender_check" CHECK (gender::text = ANY (ARRAY['Male'::character varying, 'Female'::character varying, 'Other'::character varying]::text[]));
ALTER TABLE "public"."tbl_tarl_users" ADD CONSTRAINT "tbl_tarl_users_role_check" CHECK (role::text = ANY (ARRAY['Teacher'::character varying, 'Coordinator'::character varying, 'Admin'::character varying, 'Staff'::character varying]::text[]));
