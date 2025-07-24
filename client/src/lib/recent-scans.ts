import type { JobAnalysisResult } from "@shared/schema";

const RECENT_SCANS_KEY = "jobscans_recent_scans";
const MAX_RECENT_SCANS = 10;

export interface RecentScan {
  id: string;
  jobTitle: string;
  company: string;
  ghostLikelihoodScore: number;
  scannedAt: string;
  snippet: string; // First 100 chars of description
}

export class RecentScansManager {
  static saveRecentScan(scan: JobAnalysisResult): void {
    try {
      const recentScans = this.getRecentScans();
      
      const newScan: RecentScan = {
        id: `scan_${Date.now()}`,
        jobTitle: scan.jobTitle,
        company: scan.company,
        ghostLikelihoodScore: scan.ghostLikelihoodScore,
        scannedAt: new Date().toISOString(),
        snippet: scan.originalDescription.substring(0, 100) + (scan.originalDescription.length > 100 ? "..." : "")
      };
      
      // Remove duplicate if exists (same job title + company)
      const filtered = recentScans.filter(s => 
        !(s.jobTitle === newScan.jobTitle && s.company === newScan.company)
      );
      
      // Add new scan to beginning
      const updated = [newScan, ...filtered].slice(0, MAX_RECENT_SCANS);
      
      localStorage.setItem(RECENT_SCANS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn("Failed to save recent scan:", error);
    }
  }
  
  static getRecentScans(): RecentScan[] {
    try {
      const stored = localStorage.getItem(RECENT_SCANS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn("Failed to load recent scans:", error);
      return [];
    }
  }
  
  static clearRecentScans(): void {
    try {
      localStorage.removeItem(RECENT_SCANS_KEY);
    } catch (error) {
      console.warn("Failed to clear recent scans:", error);
    }
  }
  
  static searchRecentScans(query: string): RecentScan[] {
    const scans = this.getRecentScans();
    const lowerQuery = query.toLowerCase();
    
    return scans.filter(scan => 
      scan.jobTitle.toLowerCase().includes(lowerQuery) ||
      scan.company.toLowerCase().includes(lowerQuery) ||
      scan.snippet.toLowerCase().includes(lowerQuery)
    );
  }
}