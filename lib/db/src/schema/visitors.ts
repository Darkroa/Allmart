import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const visitorsTable = pgTable("visitors", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  ip: text("ip"),
  country: text("country"),
  city: text("city"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  page: text("page").notNull().default("/"),
  isReturning: boolean("is_returning").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Visitor = typeof visitorsTable.$inferSelect;
