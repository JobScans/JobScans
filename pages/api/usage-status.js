// Next.js API route for usage status endpoint
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const hasTogetherKey = !!process.env.TOGETHER_API_KEY;
  
  res.json({
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
    performance: {
      providerStatus: hasTogetherKey ? 'operational' : 'offline',
      consecutiveFailures: 0,
      lastSuccessfulRequest: null,
      uptimeToday: hasTogetherKey ? '100%' : '0%'
    },
    serviceMode: hasTogetherKey ? {
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
    },
    status: hasTogetherKey ? 'healthy' : 'critical',
    daysRemaining: 0,
    weeklyTrend: 0,
    note: hasTogetherKey ? 'Service operational with Qwen2.5 7B' : 'API key required for AI analysis',
    debug: {
      hasTogetherKey: hasTogetherKey,
      hasStripeKeys: !!(process.env.STRIPE_SECRET_KEY && process.env.VITE_STRIPE_PUBLIC_KEY),
      hasDatabaseUrl: !!process.env.DATABASE_URL
    }
  });
}
