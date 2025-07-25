// Simple Vercel serverless function for API key detection
export default function handler(req, res) {
  try {
    // Simple API key detection for service mode
    const hasTogetherKey = !!process.env.TOGETHER_API_KEY;
    const hasStripeKeys = !!(process.env.STRIPE_SECRET_KEY && process.env.VITE_STRIPE_PUBLIC_KEY);
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    
    const serviceMode = hasTogetherKey ? {
      mode: 'full',
      message: 'All features operational',
      features: {
        freshAnalysis: true,
        cacheAnalysis: true,
        outreachGeneration: true,
        archiveAccess: true,
        manualTools: true
      }
    } : {
      mode: 'minimal',
      message: 'AI analysis requires API key configuration',
      features: {
        freshAnalysis: false,
        cacheAnalysis: false,
        outreachGeneration: false,
        archiveAccess: true,
        manualTools: true
      }
    };

    const performance = {
      providerStatus: hasTogetherKey ? 'operational' : 'offline',
      consecutiveFailures: 0,
      lastSuccessfulRequest: hasTogetherKey ? new Date().toISOString() : null,
      uptimeToday: hasTogetherKey ? '100%' : '0%'
    };
    
    // Return data in a format compatible with frontend
    res.status(200).json({
      currentBalance: 0,
      dailyUsage: 0,
      dailyAnalyses: 0,
      dailyOutreach: 0,
      weeklyAnalyses: 0,
      cacheHitRate: '0%',
      avgResponseTime: '0ms',
      
      costTransparency: {
        analysisCost: 0.006,
        outreachCost: 0.003,
        estimatedDailyCost: 0,
        estimatedWeeklyCost: 0
      },
      donationMetrics: {
        dailyDonations: 0,
        totalDonated: 0,
        lastDonationTime: null
      },
      performance,
      serviceMode,
      
      status: performance.providerStatus === 'operational' ? 'healthy' : 'critical',
      daysRemaining: 0,
      weeklyTrend: 0,
      
      note: hasTogetherKey ? "AI analysis operational" : "API key required for AI features",
      debug: {
        hasTogetherKey,
        hasStripeKeys,
        hasDatabaseUrl,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in community-fund-status:', error);
    res.status(500).json({ 
      error: "Failed to fetch usage status",
      note: "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
}
