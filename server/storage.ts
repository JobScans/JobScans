import { jobScans, outreachMessages, type User, type InsertUser, type JobScan, type InsertJobScan, type OutreachMessage, type InsertOutreachMessage } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Job scan operations
  createJobScan(scan: InsertJobScan): Promise<JobScan>;
  getJobScan(id: number): Promise<JobScan | undefined>;
  getRecentJobScans(limit?: number): Promise<JobScan[]>;
  getArchivedJobScans(limit?: number, offset?: number): Promise<JobScan[]>;
  getArchivedJobScansCount(): Promise<number>;
  shareJobScanToArchive(scanId: number): Promise<boolean>;
  
  // Outreach message operations
  createOutreachMessage(message: InsertOutreachMessage): Promise<OutreachMessage>;
  getOutreachMessagesByScanId(scanId: number): Promise<OutreachMessage[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private jobScans: Map<number, JobScan>;
  private outreachMessages: Map<number, OutreachMessage>;
  private currentUserId: number;
  private currentScanId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.jobScans = new Map();
    this.outreachMessages = new Map();
    this.currentUserId = 1;
    this.currentScanId = 1;
    this.currentMessageId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createJobScan(insertScan: InsertJobScan): Promise<JobScan> {
    const id = this.currentScanId++;
    const scan: JobScan = { 
      ...insertScan, 
      id,
      originalUrl: insertScan.originalUrl || null,
      confidenceExplanation: insertScan.confidenceExplanation || null,
      redFlags: insertScan.redFlags || [],
      isSharedToArchive: insertScan.isSharedToArchive || false,
      contentFingerprint: insertScan.contentFingerprint || null,
      cacheExpiresAt: insertScan.cacheExpiresAt || null,
      analysisSource: insertScan.analysisSource || "fresh",
      createdAt: new Date()
    };
    this.jobScans.set(id, scan);
    return scan;
  }

  async getJobScan(id: number): Promise<JobScan | undefined> {
    return this.jobScans.get(id);
  }

  async getRecentJobScans(limit: number = 50): Promise<JobScan[]> {
    const scans = Array.from(this.jobScans.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    return scans;
  }

  async getArchivedJobScans(limit: number = 20, offset: number = 0): Promise<JobScan[]> {
    const scans = Array.from(this.jobScans.values())
      .filter(scan => scan.isSharedToArchive && scan.ghostLikelihoodScore >= 70) // Only high-risk scans in archive
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
    return scans;
  }

  async getArchivedJobScansCount(): Promise<number> {
    return Array.from(this.jobScans.values())
      .filter(scan => scan.isSharedToArchive && scan.ghostLikelihoodScore >= 70)
      .length;
  }

  async shareJobScanToArchive(scanId: number): Promise<boolean> {
    const scan = this.jobScans.get(scanId);
    if (!scan) return false;
    
    // Update the scan to mark it as shared to archive
    const updatedScan = { ...scan, isSharedToArchive: true };
    this.jobScans.set(scanId, updatedScan);
    return true;
  }

  async createOutreachMessage(insertMessage: InsertOutreachMessage): Promise<OutreachMessage> {
    const id = this.currentMessageId++;
    const message: OutreachMessage = { 
      ...insertMessage, 
      id,
      messageType: insertMessage.messageType || "follow_up",
      aiCost: insertMessage.aiCost || 0.02,
      createdAt: new Date()
    };
    this.outreachMessages.set(id, message);
    return message;
  }

  async getOutreachMessagesByScanId(scanId: number): Promise<OutreachMessage[]> {
    return Array.from(this.outreachMessages.values())
      .filter(message => message.scanId === scanId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getCompanyScans(companyName: string): Promise<JobScan[]> {
    return Array.from(this.jobScans.values()).filter(scan => 
      scan.company.toLowerCase() === companyName.toLowerCase() && scan.isSharedToArchive
    );
  }

  async getRecentArchiveScans(cutoffDate: Date): Promise<JobScan[]> {
    return Array.from(this.jobScans.values()).filter(scan => 
      scan.isSharedToArchive && scan.createdAt >= cutoffDate
    );
  }

  async getScanByContentHash(contentHash: string): Promise<JobScan | undefined> {
    return Array.from(this.jobScans.values()).find(scan => 
      scan.contentHash === contentHash
    );
  }

  async getScansAfterDate(date: Date): Promise<JobScan[]> {
    return Array.from(this.jobScans.values()).filter(scan => 
      scan.createdAt >= date
    );
  }

  async getOutreachMessagesAfterDate(date: Date): Promise<OutreachMessage[]> {
    return Array.from(this.outreachMessages.values()).filter(message => 
      message.createdAt >= date
    );
  }
}

export const storage = new MemStorage();
