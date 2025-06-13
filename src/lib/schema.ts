import { pgTable, serial, text, timestamp, integer, boolean, varchar } from "drizzle-orm/pg-core"

export const users = pgTable("tbl_tarl_users", {
  id: serial("id").primaryKey(),
  full_name: text("full_name").notNull(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: text("email").unique(),
  password: text("password").notNull(),
  phone: varchar("phone", { length: 20 }),
  role: varchar("role", { length: 50 }).notNull(),
  school_id: integer("school_id"),
  province_id: integer("province_id"),
  district_id: integer("district_id"),
  gender: varchar("gender", { length: 10 }),
  date_of_birth: timestamp("date_of_birth"),
  years_of_experience: integer("years_of_experience"),
  is_active: boolean("is_active").default(true),
  last_login: timestamp("last_login"),
  password_reset_token: text("password_reset_token"),
  password_reset_expires: timestamp("password_reset_expires"),
  failed_login_attempts: integer("failed_login_attempts").default(0),
  account_locked_until: timestamp("account_locked_until"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
})

export const provinces = pgTable("tbl_tarl_provinces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
})

export const districts = pgTable("tbl_tarl_districts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  province_id: integer("province_id"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
})

export const schools = pgTable("tbl_tarl_schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  district_id: integer("district_id"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
})

export const observations = pgTable("observations", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.id).notNull(),
  observerId: integer("observer_id").references(() => users.id).notNull(),
  score: integer("score").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}) 