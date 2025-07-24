interface CompanyStats {
  company: string;
  totalScans: number;
  averageGhostScore: number;
  highRiskJobs: number;
  commonRedFlags: Array<{ flag: string; count: number }>;
  riskLevel: 'low' | 'medium' | 'high';
}

export class CompanyIntelligenceService {
  static async getCompanyReputation(companyName: string, storage: any): Promise<CompanyStats | null> {
    try {
      // Get all scans for this company from archive
      const companyScans = await storage.getCompanyScans(companyName);
      
      if (companyScans.length === 0) {
        return null;
      }
      
      const totalScans = companyScans.length;
      const averageGhostScore = Math.round(
        companyScans.reduce((sum: number, scan: any) => sum + scan.ghostLikelihoodScore, 0) / totalScans
      );
      
      const highRiskJobs = companyScans.filter((scan: any) => scan.ghostLikelihoodScore >= 70).length;
      
      // Aggregate red flags
      const flagCounts = new Map<string, number>();
      companyScans.forEach((scan: any) => {
        scan.redFlags.forEach((flag: any) => {
          const count = flagCounts.get(flag.flag) || 0;
          flagCounts.set(flag.flag, count + 1);
        });
      });
      
      const commonRedFlags = Array.from(flagCounts.entries())
        .map(([flag, count]) => ({ flag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      const riskLevel: 'low' | 'medium' | 'high' = 
        averageGhostScore >= 70 ? 'high' :
        averageGhostScore >= 40 ? 'medium' : 'low';
      
      return {
        company: companyName,
        totalScans,
        averageGhostScore,
        highRiskJobs,
        commonRedFlags,
        riskLevel
      };
      
    } catch (error) {
      console.error('Error getting company reputation:', error);
      return null;
    }
  }
  
  static async getTrendingRedFlags(storage: any, days: number = 30): Promise<Array<{ flag: string; count: number; trend: 'up' | 'down' | 'stable' }>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const recentScans = await storage.getRecentArchiveScans(cutoffDate);
      
      // Count red flags in recent period
      const flagCounts = new Map<string, number>();
      recentScans.forEach((scan: any) => {
        scan.redFlags.forEach((flag: any) => {
          const count = flagCounts.get(flag.flag) || 0;
          flagCounts.set(flag.flag, count + 1);
        });
      });
      
      // Simple trending logic (can be enhanced with historical comparison)
      return Array.from(flagCounts.entries())
        .map(([flag, count]) => ({
          flag,
          count,
          trend: count > 5 ? 'up' : count < 2 ? 'down' : 'stable' as 'up' | 'down' | 'stable'
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
        
    } catch (error) {
      console.error('Error getting trending red flags:', error);
      return [];
    }
  }
}