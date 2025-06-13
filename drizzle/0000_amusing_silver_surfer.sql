CREATE TABLE "tbl_tarl_districts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"province_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tbl_tarl_districts_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "observations" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer NOT NULL,
	"observer_id" integer NOT NULL,
	"score" integer NOT NULL,
	"notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tbl_tarl_provinces" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tbl_tarl_provinces_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tbl_tarl_schools" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"district_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tbl_tarl_schools_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tbl_tarl_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"password" text NOT NULL,
	"role" varchar(256) NOT NULL,
	"province_id" integer,
	"district_id" integer,
	"school_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_school_id_tbl_tarl_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."tbl_tarl_schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_observer_id_tbl_tarl_users_id_fk" FOREIGN KEY ("observer_id") REFERENCES "public"."tbl_tarl_users"("id") ON DELETE no action ON UPDATE no action;