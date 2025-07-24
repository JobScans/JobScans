import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, desc, gte, count } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";
import { jobScans, type JobScan, type InsertJobScan } from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Database storage implementation for PostgreSQL
export class DatabaseStorage {
  async getArchivedJobScans(limit: number = 20, offset: number = 0): Promise<JobScan[]> {
    const scans = await db
      .select()
      .from(jobScans)
      .where(eq(jobScans.isSharedToArchive, true))
      .orderBy(desc(jobScans.createdAt))
      .limit(limit)
      .offset(offset);
    return scans;
  }

  async getArchivedJobScansCount(): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(jobScans)
      .where(eq(jobScans.isSharedToArchive, true));
    return result[0]?.count || 0;
  }

  async createJobScan(scan: InsertJobScan): Promise<JobScan> {
    const [newScan] = await db
      .insert(jobScans)
      .values(scan)
      .returning();
    return newScan;
  }

  async getJobScan(id: number): Promise<JobScan | undefined> {
    const [scan] = await db
      .select()
      .from(jobScans)
      .where(eq(jobScans.id, id));
    return scan || undefined;
  }

  async getRecentJobScans(limit: number = 10): Promise<JobScan[]> {
    const scans = await db
      .select()
      .from(jobScans)
      .orderBy(desc(jobScans.createdAt))
      .limit(limit);
    return scans;
  }

  async shareJobScanToArchive(scanId: number): Promise<boolean> {
    try {
      const result = await db
        .update(jobScans)
        .set({ isSharedToArchive: true })
        .where(eq(jobScans.id, scanId));
      return true;
    } catch (error) {
      console.error("Error sharing scan to archive:", error);
      return false;
    }
  }
}
