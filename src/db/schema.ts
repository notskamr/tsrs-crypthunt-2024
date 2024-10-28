import { relations, sql } from "drizzle-orm";
import { customType, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { generateId } from "lucia";

export type House = "sagar" | "vasundhara" | "srishti" | "himgiri" | "alumni";
export const HouseOptions = ["sagar", "vasundhara", "srishti", "himgiri", "alumni"] as const;


// remove the $type<House>() to make it a normal text column - for interhouse type checking we keep it
export const users = sqliteTable("users", {
    id: text("id").notNull().primaryKey().$defaultFn(() => generateId(12)),
    username: text("username").notNull().unique(),
    teamId: integer("team_id"),
    role: text("role", { enum: ["player", "oc", "admin"] }).notNull().default("player"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});
export type SelectUser = typeof users.$inferSelect;

export const userRelations = relations(users, ({ one, many }) => ({
    team: one(teams, {
        fields: [users.teamId],
        references: [teams.id],
    }),
    sessions: many(sessions),
    responses: many(questionResponses),
}));

export const sessions = sqliteTable("sessions", {
    id: text("id").notNull().primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
    ipAddress: text("ip_address").notNull(),
    ipCountry: text("ip_country"),
});
export type SelectSession = typeof sessions.$inferSelect;

export const sessionRelations = relations(sessions, ({ one, many }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));

// remove the $type<House>() to make it a normal text column - for interhouse type checking we keep it
export const teams = sqliteTable("teams", {
    id: integer("id").notNull().primaryKey(),
    name: text("name").$type<House>().notNull().unique(),
    currentQuestionId: text("current_question_id").notNull(),
    points: integer("points").notNull().default(0),
    isHouse: integer("is_house", { mode: "boolean" }).notNull().default(false),
    levelUpTime: integer("level_up_time", { mode: "timestamp" }),
    bannedUntil: integer("banned_until", { mode: "timestamp" }),
    hasFinished: integer("has_finished", { mode: "boolean" }).notNull().default(false),
    hashedPassword: text("hashed_password").notNull(),
});

export type SelectTeam = typeof teams.$inferSelect;


export const teamRelations = relations(teams, ({ many, one }) => ({
    members: many(users),
    currentQuestion: one(questions, {
        fields: [teams.currentQuestionId],
        references: [questions.id],
    }),
    responses: many(questionResponses),
}));

// --- QUESTIONS SYSTEM ---
export type QuestionType = "online" | "offline";

export const questions = sqliteTable("questions", {
    id: text("id").notNull().$defaultFn(() => crypto.randomUUID()),
    title: text("title"),
    position: integer("position").notNull(),
    content: text("content").notNull(),
    answer: text("answer").notNull(),
    points: integer("points").notNull().default(1),
    type: text("type").$type<QuestionType>().default("online").notNull(),
});
export type SelectQuestion = typeof questions.$inferSelect;

export const questionResponses = sqliteTable("question_responses", {
    id: integer("id").notNull().primaryKey(),
    teamId: integer("team_id").notNull(),
    questionId: text("question_id").notNull(),
    userId: text("user_id").notNull(),
    response: text("response").notNull(),
    isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});

export const questionResponseRelations = relations(questionResponses, ({ one }) => ({
    team: one(teams, {
        fields: [questionResponses.teamId],
        references: [teams.id],
    }),
    question: one(questions, {
        fields: [questionResponses.questionId],
        references: [questions.id],
    }),
    user: one(users, {
        fields: [questionResponses.userId],
        references: [users.id],
    })
}));

// LOGGING
export const logs = sqliteTable("logs", {
    id: integer("id").notNull().primaryKey(),
    message: text("message").notNull(),
    namespace: text("namespace"),
    level: text("level").notNull(),
    priority: integer("priority").notNull().default(0),
    timestamp: integer("timestamp", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});

export const dbkv = sqliteTable("kv", {
    key: text("key").notNull().primaryKey(),
    value: text("value").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});

export const validUsernames = sqliteTable("valid_usernames", {
    username: text("username").notNull().unique(),
});