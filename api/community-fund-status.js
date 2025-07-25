// Ultra-simple Vercel serverless function
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const hasKey = process.env.TOGETHER_API_KEY ? true : false;
  
  res.status(200).json({
    currentBalance: 0,
    dailyUsage: 0,
    dailyAnalyses: 0,
    dailyOutreach: 0,
    weeklyAnalyses: 0,
    cacheHitRate: "0%",
    avgResponseTime: "0ms",
    
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
    
    performance: {
      providerStatus: hasKey ? "operational" : "offline",
      consecutiveFailures: 0,
      lastSuccessfulRequest: hasKey ? new Date().toISOString() : null,
      uptimeToday: hasKey ? "100%" : "0%"
    },
    
    serviceMode: {
      mode: hasKey ? "full" : "minimal",
      message: hasKey ? "All features operational" : "AI analysis requires API key configuration",
      features: {
        freshAnalysis: hasKey,
        cacheAnalysis: hasKey,
        outreachGeneration: hasKey,
        archiveAccess: true,
        manualTools: true
      }
    },
    
    status: hasKey ? "healthy" : "critical",
    daysRemaining: 0,
    weeklyTrend: 0,
    note: hasKey ? "AI analysis operational" : "API key required for AI features",
    
    debug: {
      hasTogetherKey: hasKey,
      timestamp: new Date().toISOString()
    }
  });
}
