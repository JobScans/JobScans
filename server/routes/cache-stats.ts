import type { Express } from "express";
import { storage } from "../storage";
import { UsageTracker } from "../services/fund-manager";

export function registerCacheStatsRoutes(app: Express) {
  // Cache statistics endpoint
  app.get("/api/cache-stats", async (req, res) => {
    try {
      const recentScans = await storage.getRecentJobScans(100);
      
      const stats = {
        totalScans: recentScans.length,
        exactCacheHits: recentScans.filter(scan => scan.analysisSource === 'exact_cache').length,
        similarCacheHits: recentScans.filter(scan => scan.analysisSource === 'similar_cache').length,
        freshAnalyses: recentScans.filter(scan => scan.analysisSource === 'fresh').length,
        cacheHitRate: 0,
        estimatedCostSavings: 0
      };
      
      const totalCacheHits = stats.exactCacheHits + stats.similarCacheHits;
      stats.cacheHitRate = stats.totalScans > 0 ? (totalCacheHits / stats.totalScans) * 100 : 0;
      
      // Updated cost estimation: $0.006 per fresh analysis with Qwen2.5 7B
      stats.estimatedCostSavings = totalCacheHits * 0.006;
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching cache stats:", error);
      res.status(500).json({ error: "Failed to fetch cache statistics" });
    }
  });

  // Note: community-fund-status endpoint moved to main routes.ts file
}