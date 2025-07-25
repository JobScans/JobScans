// Client-side service mode detection
export function getServiceMode() {
  // Check if we're in development (always show full features)
  const isDev = import.meta.env.DEV;
  
  // In production, this environment variable will be set by Vercel build if API key exists
  const hasApiKey = isDev || import.meta.env.VITE_SERVICE_MODE === 'full';
  
  return {
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
      providerStatus: hasApiKey ? "operational" : "offline",
      consecutiveFailures: 0,
      lastSuccessfulRequest: hasApiKey ? new Date().toISOString() : null,
      uptimeToday: hasApiKey ? "100%" : "0%"
    },
    
    serviceMode: {
      mode: hasApiKey ? "full" : "minimal",
      message: hasApiKey ? "All features operational" : "AI analysis requires API key configuration",
      features: {
        freshAnalysis: hasApiKey,
        cacheAnalysis: hasApiKey,
        outreachGeneration: hasApiKey,
        archiveAccess: true,
        manualTools: true
      }
    },
    
    status: hasApiKey ? "healthy" : "critical",
    daysRemaining: 0,
    weeklyTrend: 0,
    note: hasApiKey ? "AI analysis operational" : "API key required for AI features"
  };
}
