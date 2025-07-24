interface ServiceMode {
  mode: 'full' | 'cache_only' | 'community_only' | 'minimal';
  message: string;
  features: {
    freshAnalysis: boolean;
    cacheAnalysis: boolean;
    outreachGeneration: boolean;
    archiveAccess: boolean;
    manualTools: boolean;
  };
}

interface UsageStatus {
  requestMetrics: {
    dailyAnalyses: number;
    dailyOutreach: number;
    weeklyAnalyses: number;
    cacheHitRate: string;
    avgResponseTime: string;
  };
  costTransparency: {
    analysisCost: number; // $0.006 per analysis
    outreachCost: number; // $0.003 per outreach
    estimatedDailyCost: number;
    estimatedWeeklyCost: number;
  };
  donationMetrics: {
    dailyDonations: number;
    totalDonated: number;
    lastDonationTime: string | null;
  };
  performance: {
    providerStatus: 'operational' | 'degraded' | 'offline';
    consecutiveFailures: number;
    lastSuccessfulRequest: string | null;
    uptimeToday: string;
  };
  serviceMode: ServiceMode;
}

export class UsageTracker {
  private static readonly ANALYSIS_COST = 0.006; // Qwen2.5 7B cost per analysis
  private static readonly OUTREACH_COST = 0.003; // Estimated outreach cost
  private static readonly DAILY_REQUEST_LIMIT = 500; // Reasonable daily limit
  private static readonly HOURLY_REQUEST_LIMIT = 100; // Reasonable hourly limit

  // Service health tracking
  private static consecutiveFailures = 0;
  private static lastSuccessfulRequest: Date | null = null;
  private static dailyRequestCount = 0;
  private static hourlyRequestCount = 0;
  
  // Donation tracking
  private static dailyDonationTotal = 0;
  private static allTimeDonationTotal = 0;
  private static lastDonationTime: Date | null = null;
  private static lastResetDate = new Date().toDateString();

  /**
   * Reset daily counters if it's a new day
   */
  private static resetDailyCountersIfNeeded() {
    const currentDate = new Date().toDateString();
    if (this.lastResetDate !== currentDate) {
      this.dailyRequestCount = 0;
      this.dailyDonationTotal = 0;
      this.lastResetDate = currentDate;
    }
  }

  /**
   * Record a donation received via Stripe
   */
  static recordDonation(amount: number) {
    this.resetDailyCountersIfNeeded();
    this.dailyDonationTotal += amount;
    this.allTimeDonationTotal += amount;
    this.lastDonationTime = new Date();
    console.log(`Donation recorded: $${amount.toFixed(2)} (Daily total: $${this.dailyDonationTotal.toFixed(2)})`);
  }

  /**
   * Get comprehensive usage and performance metrics
   */
  static async getUsageStatus(storage: any): Promise<UsageStatus> {
    try {
      this.resetDailyCountersIfNeeded();
      
      // Get recent usage data
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const [todayScans, weekScans, todayOutreach] = await Promise.all([
        storage.getScansAfterDate(yesterday),
        storage.getScansAfterDate(lastWeek),
        storage.getOutreachMessagesAfterDate(yesterday)
      ]);

      // Request metrics
      const dailyAnalyses = todayScans.length;
      const dailyOutreach = todayOutreach.length;
      const weeklyAnalyses = weekScans.length;
      
      // Calculate cache performance
      const totalRequests = todayScans.length;
      const cachedRequests = todayScans.filter((scan: any) => 
        scan.analysisSource === 'exact_cache' || scan.analysisSource === 'similar_cache'
      ).length;
      const cacheHitRate = totalRequests > 0 ? 
        ((cachedRequests / totalRequests) * 100).toFixed(1) + '%' : '0%';

      // Cost transparency (actual costs)
      const freshAnalyses = todayScans.filter((scan: any) => scan.analysisSource === 'fresh').length;
      const estimatedDailyCost = (freshAnalyses * this.ANALYSIS_COST) + (dailyOutreach * this.OUTREACH_COST);
      const weeklyFreshAnalyses = weekScans.filter((scan: any) => scan.analysisSource === 'fresh').length;
      const estimatedWeeklyCost = (weeklyFreshAnalyses * this.ANALYSIS_COST);

      // Service health
      const hasApiKey = !!process.env.TOGETHER_API_KEY;
      const providerStatus: 'operational' | 'degraded' | 'offline' = 
        !hasApiKey ? 'offline' : 
        this.consecutiveFailures > 3 ? 'degraded' : 'operational';

      const avgResponseTime = this.calculateAverageResponseTime(todayScans);
      const uptimeToday = this.calculateUptimeToday();

      return {
        requestMetrics: {
          dailyAnalyses,
          dailyOutreach,
          weeklyAnalyses,
          cacheHitRate,
          avgResponseTime
        },
        costTransparency: {
          analysisCost: this.ANALYSIS_COST,
          outreachCost: this.OUTREACH_COST,
          estimatedDailyCost,
          estimatedWeeklyCost
        },
        donationMetrics: {
          dailyDonations: this.dailyDonationTotal,
          totalDonated: this.allTimeDonationTotal,
          lastDonationTime: this.lastDonationTime?.toISOString() || null
        },
        performance: {
          providerStatus,
          consecutiveFailures: this.consecutiveFailures,
          lastSuccessfulRequest: this.lastSuccessfulRequest?.toISOString() || null,
          uptimeToday
        },
        serviceMode: this.getServiceMode()
      };

    } catch (error) {
      console.error('Error calculating usage status:', error);
      
      return {
        requestMetrics: {
          dailyAnalyses: 0,
          dailyOutreach: 0,
          weeklyAnalyses: 0,
          cacheHitRate: '0%',
          avgResponseTime: '0s'
        },
        costTransparency: {
          analysisCost: this.ANALYSIS_COST,
          outreachCost: this.OUTREACH_COST,
          estimatedDailyCost: 0,
          estimatedWeeklyCost: 0
        },
        donationMetrics: {
          dailyDonations: this.dailyDonationTotal,
          totalDonated: this.allTimeDonationTotal,
          lastDonationTime: this.lastDonationTime?.toISOString() || null
        },
        performance: {
          providerStatus: 'offline',
          consecutiveFailures: 0,
          lastSuccessfulRequest: null,
          uptimeToday: '0%'
        },
        serviceMode: this.getServiceMode()
      };
    }
  }

  /**
   * Track successful requests for performance monitoring
   */
  static recordSuccessfulRequest(): void {
    this.lastSuccessfulRequest = new Date();
    this.consecutiveFailures = 0;
    this.dailyRequestCount++;
    this.hourlyRequestCount++;
  }

  /**
   * Track failed requests for degradation detection
   */
  static recordFailedRequest(): void {
    this.consecutiveFailures++;
  }

  /**
   * Check if we're approaching rate limits
   */
  static checkRateLimits(): { 
    withinDailyLimit: boolean; 
    withinHourlyLimit: boolean; 
    dailyRemaining: number;
    hourlyRemaining: number;
  } {
    return {
      withinDailyLimit: this.dailyRequestCount < this.DAILY_REQUEST_LIMIT,
      withinHourlyLimit: this.hourlyRequestCount < this.HOURLY_REQUEST_LIMIT,
      dailyRemaining: Math.max(0, this.DAILY_REQUEST_LIMIT - this.dailyRequestCount),
      hourlyRemaining: Math.max(0, this.HOURLY_REQUEST_LIMIT - this.hourlyRequestCount)
    };
  }

  /**
   * Reset counters (called by scheduler)
   */
  static resetHourlyCounter(): void {
    this.hourlyRequestCount = 0;
  }

  static resetDailyCounter(): void {
    this.dailyRequestCount = 0;
    this.hourlyRequestCount = 0;
  }

  /**
   * Calculate average response time from recent scans
   */
  private static calculateAverageResponseTime(scans: any[]): string {
    const freshScans = scans.filter(scan => scan.analysisSource === 'fresh');
    if (freshScans.length === 0) return '0s';
    
    // Mock calculation - in real implementation, track actual response times
    const avgMs = 2100; // Average ~2.1 seconds for Qwen2.5 7B
    return (avgMs / 1000).toFixed(1) + 's';
  }

  /**
   * Calculate uptime percentage for today
   */
  private static calculateUptimeToday(): string {
    const totalRequests = this.dailyRequestCount + this.consecutiveFailures;
    if (totalRequests === 0) return '100%';
    
    const successRate = (this.dailyRequestCount / totalRequests) * 100;
    return successRate.toFixed(1) + '%';
  }

  /**
   * Get appropriate user message based on service status
   */
  static getServiceMessage(status: UsageStatus): string {
    const { providerStatus } = status.performance;
    const { dailyAnalyses, dailyOutreach } = status.requestMetrics;
    
    if (providerStatus === 'offline') {
      return 'Qwen2.5 7B unavailable - TOGETHER_API_KEY required for AI analysis.';
    }
    
    if (providerStatus === 'degraded') {
      return `Service experiencing issues. ${status.performance.consecutiveFailures} recent failures detected.`;
    }
    
    return `Service operational. ${dailyAnalyses} analyses and ${dailyOutreach} outreach messages processed today.`;
  }

  /**
   * Determine service mode based on API availability and rate limits
   */
  private static getServiceMode(): ServiceMode {
    const hasApiKey = !!process.env.TOGETHER_API_KEY;
    const rateLimits = this.checkRateLimits();

    if (!hasApiKey) {
      return {
        mode: 'minimal',
        message: 'Qwen2.5 7B unavailable - configure TOGETHER_API_KEY for AI analysis',
        features: {
          freshAnalysis: false,
          cacheAnalysis: true,
          outreachGeneration: false,
          archiveAccess: true,
          manualTools: true
        }
      };
    }

    if (!rateLimits.withinDailyLimit) {
      return {
        mode: 'cache_only',
        message: 'Daily request limit reached - using cached analyses only',
        features: {
          freshAnalysis: false,
          cacheAnalysis: true,
          outreachGeneration: false,
          archiveAccess: true,
          manualTools: true
        }
      };
    }

    if (!rateLimits.withinHourlyLimit) {
      return {
        mode: 'cache_only',
        message: 'Hourly request limit reached - fresh analysis will resume next hour',
        features: {
          freshAnalysis: false,
          cacheAnalysis: true,
          outreachGeneration: false,
          archiveAccess: true,
          manualTools: true
        }
      };
    }

    return {
      mode: 'full',
      message: `All features available (${rateLimits.dailyRemaining} daily requests remaining)`,
      features: {
        freshAnalysis: true,
        cacheAnalysis: true,
        outreachGeneration: true,
        archiveAccess: true,
        manualTools: true
      }
    };
  }

  /**
   * Get detailed cost breakdown for transparency
   */
  static getCostBreakdown(): {
    analysisCost: number;
    outreachCost: number;
    cacheValue: number;
    explanation: string;
  } {
    return {
      analysisCost: this.ANALYSIS_COST,
      outreachCost: this.OUTREACH_COST,
      cacheValue: this.ANALYSIS_COST, // Cost saved per cached request
      explanation: `Fresh analysis costs $${this.ANALYSIS_COST} via Qwen2.5 7B. Outreach generation costs $${this.OUTREACH_COST}. Cached results cost $0.`
    };
  }
}

// Export alias for backward compatibility  
export const CommunityFundManager = UsageTracker;