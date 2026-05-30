import {
  pgTable,
  text,
  timestamp,
  integer,
  primaryKey,
  jsonb,
  real,
} from "drizzle-orm/pg-core"

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  hashedPassword: text("hashedPassword"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
  settings: jsonb("settings").default({}),
})

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
)

// ==================== Business data tables ====================

export const plans = pgTable("plan", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  mode: text("mode").notNull(), // "quick" | "detailed"
  goal: jsonb("goal").notNull().default({}),
  stages: jsonb("stages").notNull().default([]),
  theories: jsonb("theories").notNull().default([]),
  weeklyGoal: text("weeklyGoal"),
  monthlyGoal: text("monthlyGoal"),
  phaseGoal: text("phaseGoal"),
  status: text("status").notNull().default("active"),
  endDate: text("endDate"),
  chatSessionId: text("chatSessionId"), // soft FK to chatSession: no .references() to avoid circular FK issues during creation
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
})

export const chatSessions = pgTable("chatSession", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mode: text("mode").notNull(), // "quick" | "detailed"
  title: text("title").notNull(),
  planId: text("planId"), // soft FK to plan: no .references() to avoid circular FK issues during creation
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).notNull().defaultNow(),
})

export const chatMessages = pgTable("chatMessage", {
  id: text("id").primaryKey(),
  sessionId: text("sessionId")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  timestamp: text("timestamp").notNull(),
})

export const checkins = pgTable("checkin", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: text("planId")
    .notNull()
    .references(() => plans.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  tasks: jsonb("tasks").notNull().default([]),
  feedback: jsonb("feedback").notNull().default({}),
  focusLevel: integer("focusLevel").notNull().default(5),
  moodRating: integer("moodRating").notNull().default(3),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
})

export const memories = pgTable("memory", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "goal" | "habit" | "preference" | "fact" | "pattern"
  content: text("content").notNull(),
  confidence: real("confidence").notNull().default(0.7),
  lastRecalledAt: timestamp("lastRecalledAt", { mode: "date" }).defaultNow(),
  source: text("source").default("auto-extraction"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
})
