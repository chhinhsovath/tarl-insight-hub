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

export const countries = pgTable("countries", {
  id: serial("country_id").primaryKey(),
  code: varchar("country_code", { length: 10 }).notNull().unique(),
  name_kh: varchar("country_name_kh", { length: 250 }).notNull(),
  name_en: varchar("country_name_en", { length: 250 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
})

export const provinces = pgTable("provinces", {
  id: serial("province_id").primaryKey(),
  name_kh: varchar("province_name_kh", { length: 250 }).notNull(),
  name_en: varchar("province_name_en", { length: 250 }).notNull(),
  country_id: integer("country_id").references(() => countries.id).notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
})

export const districts = pgTable("districts", {
  id: serial("district_id").primaryKey(),
  code: varchar("district_code", { length: 10 }).unique(),
  name_kh: varchar("district_name_kh", { length: 250 }).notNull(),
  name_en: varchar("district_name_en", { length: 250 }).notNull(),
  province_id: integer("province_id").references(() => provinces.id).notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
})

export const communes = pgTable("communes", {
  id: serial("commune_id").primaryKey(),
  code: varchar("commune_code", { length: 10 }).unique(),
  name_kh: varchar("commune_name_kh", { length: 250 }).notNull(),
  name_en: varchar("commune_name_en", { length: 250 }).notNull(),
  district_id: integer("district_id").references(() => districts.id).notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
})

export const villages = pgTable("villages", {
  id: serial("village_id").primaryKey(),
  code: varchar("village_code", { length: 10 }).unique(),
  name_kh: varchar("village_name_kh", { length: 250 }).notNull(),
  name_en: varchar("village_name_en", { length: 250 }).notNull(),
  commune_id: integer("commune_id").references(() => communes.id).notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
})

export const schools = pgTable("schools", {
  school_id: serial("school_id").primaryKey(),
  name: varchar("school_name", { length: 250 }).notNull(),
  code: varchar("school_code", { length: 50 }).unique(),
  cluster_id: integer("cluster_id"),
  district_id: integer("district_id").references(() => districts.id),
  province_id: integer("province_id").references(() => provinces.id).notNull(),
  commune_id: integer("commune_id").references(() => communes.id),
  village_id: integer("village_id").references(() => villages.id),
  status: integer("status").default(1),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
})

export const observations = pgTable("observations", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schools.school_id).notNull(),
  observerId: integer("observer_id").references(() => users.id).notNull(),
  score: integer("score").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})