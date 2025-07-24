import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const jobScans = pgTable("job_scans", {
  id: serial("id").primaryKey(),
  jobTitle: text("job_title").notNull(),
  company: text("company").notNull(),
  originalUrl: text("original_url"),
  originalDescription: text("original_description").notNull(),
  contentHash: text("content_hash").notNull(),
  contentFingerprint: text("content_fingerprint"),
  ghostLikelihoodScore: integer("ghost_likelihood_score").notNull(),
  ghostLikelihoodLevel: text("ghost_likelihood_level").notNull(),
  redFlags: jsonb("red_flags").$type<RedFlag[]>().notNull().default([]),
  aiSummary: text("ai_summary").notNull(),
  confidenceExplanation: text("confidence_explanation"),
  isSharedToArchive: boolean("is_shared_to_archive").default(false),
  cacheExpiresAt: timestamp("cache_expires_at"),
  analysisSource: text("analysis_source").notNull().default("fresh"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export interface RedFlag {
  flag: string;
  explanation: string;
  severity: 'low' | 'medium' | 'high';
}

export const outreachMessages = pgTable("outreach_messages", {
  id: serial("id").primaryKey(),
  scanId: integer("scan_id").references(() => jobScans.id).notNull(),
  message: text("message").notNull(),
  messageType: text("message_type").notNull().default("follow_up"),
  aiCost: real("ai_cost").default(0.02).notNull(), // Track AI cost for outreach generation
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertJobScanSchema = createInsertSchema(jobScans).omit({
  id: true,
  createdAt: true,
});

export const insertOutreachMessageSchema = createInsertSchema(outreachMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertJobScan = z.infer<typeof insertJobScanSchema>;
export type JobScan = typeof jobScans.$inferSelect;

export type InsertOutreachMessage = z.infer<typeof insertOutreachMessageSchema>;
export type OutreachMessage = typeof outreachMessages.$inferSelect;

// Analysis request and response types
export const analyzeJobSchema = z.object({
  jobDescription: z.string().optional(),
  jobUrl: z.string().optional(),
}).refine(data => data.jobDescription || data.jobUrl, {
  message: "Either jobDescription or jobUrl is required",
});

export type AnalyzeJobRequest = z.infer<typeof analyzeJobSchema>;

export interface JobAnalysisResult extends JobScan {
  scanId: number;
}

export const generateOutreachSchema = z.object({
  scanId: z.number(),
  messageType: z.enum(["linkedin", "email", "general"]).default("linkedin"),
});

export type GenerateOutreachRequest = z.infer<typeof generateOutreachSchema>;
