/*
 Navicat Premium Dump SQL

 Source Server         : PostgreLocal
 Source Server Type    : PostgreSQL
 Source Server Version : 170005 (170005)
 Source Host           : localhost:5432
 Source Catalog        : pratham_tarl
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 170005 (170005)
 File Encoding         : 65001

 Date: 13/06/2025 13:04:42
*/


-- ----------------------------
-- Table structure for tbl_tarl_users
-- ----------------------------
DROP TABLE IF EXISTS "public"."tbl_tarl_users";
CREATE TABLE "public"."tbl_tarl_users" (
  "id" int4 NOT NULL DEFAULT nextval('tbl_tarl_users_id_seq'::regclass),
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
)
;
ALTER TABLE "public"."tbl_tarl_users" OWNER TO "postgres";

-- ----------------------------
-- Records of tbl_tarl_users
-- ----------------------------
BEGIN;
INSERT INTO "public"."tbl_tarl_users" ("id", "full_name", "email", "phone", "role", "school_id", "province_id", "district_id", "gender", "date_of_birth", "years_of_experience", "is_active", "created_at", "updated_at") VALUES (1, 'Ms. Sophea Lim', 'sophea.lim@tarl.edu.kh', '012-345-678', 'Teacher', 1, 1, 1, 'Female', NULL, 8, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491');
INSERT INTO "public"."tbl_tarl_users" ("id", "full_name", "email", "phone", "role", "school_id", "province_id", "district_id", "gender", "date_of_birth", "years_of_experience", "is_active", "created_at", "updated_at") VALUES (2, 'Mr. Dara Kong', 'dara.kong@tarl.edu.kh', '012-345-679', 'Teacher', 1, 1, 1, 'Male', NULL, 12, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491');
INSERT INTO "public"."tbl_tarl_users" ("id", "full_name", "email", "phone", "role", "school_id", "province_id", "district_id", "gender", "date_of_birth", "years_of_experience", "is_active", "created_at", "updated_at") VALUES (3, 'Ms. Sreypov Chan', 'sreypov.chan@tarl.edu.kh', '012-345-680', 'Teacher', 2, 1, 1, 'Female', NULL, 6, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491');
INSERT INTO "public"."tbl_tarl_users" ("id", "full_name", "email", "phone", "role", "school_id", "province_id", "district_id", "gender", "date_of_birth", "years_of_experience", "is_active", "created_at", "updated_at") VALUES (4, 'Mr. Pisach Noun', 'pisach.noun@tarl.edu.kh', '012-345-681', 'Teacher', 3, 1, 2, 'Male', NULL, 10, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491');
INSERT INTO "public"."tbl_tarl_users" ("id", "full_name", "email", "phone", "role", "school_id", "province_id", "district_id", "gender", "date_of_birth", "years_of_experience", "is_active", "created_at", "updated_at") VALUES (5, 'Ms. Channary Sok', 'channary.sok@tarl.edu.kh', '012-345-682', 'Teacher', 4, 2, 4, 'Female', NULL, 7, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491');
INSERT INTO "public"."tbl_tarl_users" ("id", "full_name", "email", "phone", "role", "school_id", "province_id", "district_id", "gender", "date_of_birth", "years_of_experience", "is_active", "created_at", "updated_at") VALUES (6, 'Mr. Rithy Meas', 'rithy.meas@tarl.edu.kh', '012-345-683', 'Teacher', 5, 2, 4, 'Male', NULL, 9, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491');
INSERT INTO "public"."tbl_tarl_users" ("id", "full_name", "email", "phone", "role", "school_id", "province_id", "district_id", "gender", "date_of_birth", "years_of_experience", "is_active", "created_at", "updated_at") VALUES (7, 'Ms. Sreymom Chea', 'sreymom.chea@tarl.edu.kh', '012-345-684', 'Teacher', 6, 3, 7, 'Female', NULL, 11, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491');
INSERT INTO "public"."tbl_tarl_users" ("id", "full_name", "email", "phone", "role", "school_id", "province_id", "district_id", "gender", "date_of_birth", "years_of_experience", "is_active", "created_at", "updated_at") VALUES (8, 'Mr. Bunthoeun Ly', 'bunthoeun.ly@tarl.edu.kh', '012-345-685', 'Teacher', 7, 4, 10, 'Male', NULL, 5, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491');
INSERT INTO "public"."tbl_tarl_users" ("id", "full_name", "email", "phone", "role", "school_id", "province_id", "district_id", "gender", "date_of_birth", "years_of_experience", "is_active", "created_at", "updated_at") VALUES (9, 'Ms. Bopha Keo', 'bopha.keo@tarl.edu.kh', '012-345-686', 'Coordinator', NULL, 1, NULL, 'Female', NULL, 15, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491');
INSERT INTO "public"."tbl_tarl_users" ("id", "full_name", "email", "phone", "role", "school_id", "province_id", "district_id", "gender", "date_of_birth", "years_of_experience", "is_active", "created_at", "updated_at") VALUES (10, 'Mr. Visal Tep', 'visal.tep@tarl.edu.kh', '012-345-687', 'Coordinator', NULL, 2, NULL, 'Male', NULL, 13, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491');
INSERT INTO "public"."tbl_tarl_users" ("id", "full_name", "email", "phone", "role", "school_id", "province_id", "district_id", "gender", "date_of_birth", "years_of_experience", "is_active", "created_at", "updated_at") VALUES (11, 'Ms. Mealea Ros', 'mealea.ros@tarl.edu.kh', '012-345-688', 'Coordinator', NULL, 3, NULL, 'Female', NULL, 14, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491');
INSERT INTO "public"."tbl_tarl_users" ("id", "full_name", "email", "phone", "role", "school_id", "province_id", "district_id", "gender", "date_of_birth", "years_of_experience", "is_active", "created_at", "updated_at") VALUES (12, 'Mr. Kosal Vann', 'kosal.vann@tarl.edu.kh', '012-345-689', 'Admin', NULL, NULL, NULL, 'Male', NULL, 20, 't', '2025-06-12 18:09:03.321491', '2025-06-12 18:09:03.321491');
COMMIT;

-- ----------------------------
-- Indexes structure for table tbl_tarl_users
-- ----------------------------
CREATE INDEX "idx_tbl_tarl_users_role" ON "public"."tbl_tarl_users" USING btree (
  "role" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "idx_tbl_tarl_users_school" ON "public"."tbl_tarl_users" USING btree (
  "school_id" "pg_catalog"."int4_ops" ASC NULLS LAST
);

-- ----------------------------
-- Uniques structure for table tbl_tarl_users
-- ----------------------------
ALTER TABLE "public"."tbl_tarl_users" ADD CONSTRAINT "tbl_tarl_users_email_key" UNIQUE ("email");

-- ----------------------------
-- Checks structure for table tbl_tarl_users
-- ----------------------------
ALTER TABLE "public"."tbl_tarl_users" ADD CONSTRAINT "tbl_tarl_users_gender_check" CHECK (gender::text = ANY (ARRAY['Male'::character varying::text, 'Female'::character varying::text, 'Other'::character varying::text]));
ALTER TABLE "public"."tbl_tarl_users" ADD CONSTRAINT "tbl_tarl_users_role_check" CHECK (role::text = ANY (ARRAY['Teacher'::character varying::text, 'Coordinator'::character varying::text, 'Admin'::character varying::text, 'Staff'::character varying::text]));

-- ----------------------------
-- Primary Key structure for table tbl_tarl_users
-- ----------------------------
ALTER TABLE "public"."tbl_tarl_users" ADD CONSTRAINT "tbl_tarl_users_pkey" PRIMARY KEY ("id");
