import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export type VoiceTranscriptTurn = {
  role: "user" | "assistant";
  text: string;
  timestamp: number;
};

export const voiceSessions = pgTable("voice_sessions", {
  id: text("id").primaryKey().notNull(),
  channelName: text("channelName").notNull(),
  agentId: text("agentId"),
  uid: text("uid"),
  status: text("status").default("active").notNull(),
  urgency: text("urgency"),
  specialty: text("specialty"),
  triageId: text("triageId"),
  appointmentId: text("appointmentId"),
  transcript: jsonb("transcript").$type<VoiceTranscriptTurn[]>().default([]).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
});

export type VoiceSession = typeof voiceSessions.$inferSelect;
export type NewVoiceSession = typeof voiceSessions.$inferInsert;
