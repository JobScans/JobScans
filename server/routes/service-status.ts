import type { Express } from "express";
import { getProviderStatus } from "../services/ai-service";
import { UsageTracker } from "../services/fund-manager";

/**
 * Enhanced service status routes for better outage handling
 */
export function registerServiceStatusRoutes(app: Express): void {
  
  // Comprehensive service health endpoint
  app.get("/api/service-status", async (req, res) => {
    try {
      const providerStatus = getProviderStatus();
      const usageStatus = await UsageTracker.getUsageStatus(req.app.locals.storage);
      
      const overallHealth = {
        status: providerStatus.isOnline && usageStatus.serviceMode.features.freshAnalysis ? 'operational' : 'degraded',
        provider: providerStatus.provider,
        providerOnline: providerStatus.isOnline,
        serviceMode: usageStatus.serviceMode.mode,
        capabilities: {
          freshAnalysis: providerStatus.isOnline && usageStatus.serviceMode.features.freshAnalysis,
          cacheAnalysis: usageStatus.serviceMode.features.cacheAnalysis,
          outreachGeneration: providerStatus.isOnline && usageStatus.serviceMode.features.outreachGeneration,
          archiveAccess: usageStatus.serviceMode.features.archiveAccess,
          manualTools: usageStatus.serviceMode.features.manualTools
        },
        cost: {
          perAnalysis: providerStatus.cost,
          dailyRequests: usageStatus.requestMetrics.dailyAnalyses,
          dailyCost: usageStatus.costTransparency.estimatedDailyCost
        },
        performance: usageStatus.performance,
        messages: {
          primary: usageStatus.serviceMode.message,
          service: UsageTracker.getServiceMessage(usageStatus)
        }
      };
      
      res.json(overallHealth);
    } catch (error) {
      console.error('Service status check failed:', error);
      res.status(500).json({
        status: 'error',
        message: 'Unable to determine service status',
        capabilities: {
          freshAnalysis: false,
          cacheAnalysis: true,
          outreachGeneration: false,
          archiveAccess: true,
          manualTools: true
        }
      });
    }
  });

  // Quick health check for uptime monitoring
  app.get("/api/health-check", async (req, res) => {
    try {
      const providerStatus = getProviderStatus();
      
      res.json({
        status: providerStatus.isOnline ? 'ok' : 'degraded',
        provider: providerStatus.provider,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        message: 'Service unavailable',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Cache statistics for performance monitoring
  app.get("/api/cache-performance", async (req, res) => {
    try {
      const storage = req.app.locals.storage;
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const recentScans = await storage.getScansAfterDate(yesterday);
      
      const cacheStats = {
        total: recentScans.length,
        fresh: recentScans.filter((scan: any) => scan.analysisSource === 'fresh').length,
        exactCache: recentScans.filter((scan: any) => scan.analysisSource === 'exact_cache').length,
        similarCache: recentScans.filter((scan: any) => scan.analysisSource === 'similar_cache').length,
        cacheHitRate: recentScans.length > 0 ? 
          ((recentScans.length - recentScans.filter((scan: any) => scan.analysisSource === 'fresh').length) / recentScans.length * 100).toFixed(1) + '%' : 
          '0%'
      };
      
      res.json(cacheStats);
    } catch (error) {
      console.error('Cache performance check failed:', error);
      res.status(500).json({ error: 'Unable to retrieve cache statistics' });
    }
  });
}