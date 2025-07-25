import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from './ui/button';

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

interface UsageStats {
  currentBalance: number;
  dailyUsage: number;
  dailyAnalyses: number;
  dailyOutreach: number;
  weeklyAnalyses: number;
  cacheHitRate: string;
  avgResponseTime: string;
  costTransparency: {
    analysisCost: number;
    outreachCost: number;
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
  status: 'healthy' | 'critical';
  daysRemaining: number;
  weeklyTrend: number;
  note: string;
  debug: {
    hasTogetherKey: boolean;
    hasStripeKeys: boolean;
    hasDatabaseUrl: boolean;
  };
}

export function UsageIndicator() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Fetch usage status from API
  const { data: usageStats } = useQuery({
    queryKey: ['/api/usage-status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Default stats if API hasn't loaded yet
  const defaultStats: UsageStats = {
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
      providerStatus: 'offline',
      consecutiveFailures: 0,
      lastSuccessfulRequest: null,
      uptimeToday: '0%'
    },
    serviceMode: {
      mode: 'minimal',
      message: 'Loading...',
      features: {
        freshAnalysis: false,
        cacheAnalysis: true,
        outreachGeneration: false,
        archiveAccess: true,
        manualTools: true
      }
    },
    status: 'critical',
    daysRemaining: 0,
    weeklyTrend: 0,
    note: 'Loading usage data...',
    debug: {
      hasTogetherKey: false,
      hasStripeKeys: false,
      hasDatabaseUrl: false
    }
  };

  const stats: UsageStats = usageStats as UsageStats || defaultStats;

  const getStatusIcon = () => {
    switch (stats.performance.providerStatus) {
      case 'operational': return '🟢';
      case 'degraded': return '🟡';
      case 'offline': return '🔴';
      default: return '🟢';
    }
  };

  const getStatusMessage = () => {
    switch (stats.performance.providerStatus) {
      case 'operational': return '';
      case 'degraded': return 'Service issues detected';
      case 'offline': return 'API key required';
      default: return '';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Compact View */}
      {!isExpanded && (
        <Button
          onClick={() => setIsExpanded(true)}
          className="bg-white shadow-lg border-2 hover:shadow-xl transition-all duration-200 px-4 py-2 rounded-full"
          style={{
            borderColor: stats.performance.providerStatus === 'operational' ? 'var(--sage-300)' : 
                        stats.performance.providerStatus === 'degraded' ? '#f59e0b' : '#ef4444',
            color: 'var(--sage-700)'
          }}
          variant="outline"
        >
          <span className="text-sm font-medium">
            {getStatusIcon()} Usage Today: {stats.dailyAnalyses} analyses
          </span>
          {stats.performance.providerStatus !== 'operational' && (
            <span className="text-xs ml-2 opacity-75">
              {getStatusMessage()}
            </span>
          )}
        </Button>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="bg-white rounded-2xl shadow-2xl border p-6 w-80" style={{borderColor: 'var(--sage-200)'}}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-2xl mr-2">{getStatusIcon()}</span>
              <div>
                <h3 className="font-bold text-lg" style={{color: 'var(--sage-800)'}}>
                  Usage Tracker
                </h3>
                <p className="text-sm" style={{color: 'var(--sage-600)'}}>
                  Transparent cost monitoring
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsExpanded(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              style={{color: 'var(--sage-500)'}}
            >
              ✕
            </Button>
          </div>

          {/* Daily Usage */}
          <div className="bg-sage-50 rounded-lg p-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold" style={{color: 'var(--sage-800)'}}>
                ${(stats.costTransparency?.estimatedDailyCost || 0).toFixed(3)}
              </div>
              <p className="text-sm" style={{color: 'var(--sage-600)'}}>
                Today's estimated cost ({stats.dailyAnalyses || 0} analyses)
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center">
              <div className="font-semibold text-lg" style={{color: 'var(--sage-700)'}}>
                ${(stats.dailyUsage || 0).toFixed(2)}
              </div>
              <p className="text-xs" style={{color: 'var(--sage-600)'}}>
                Spent today
              </p>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg" style={{color: 'var(--sage-700)'}}>
                {stats.dailyAnalyses}
              </div>
              <p className="text-xs" style={{color: 'var(--sage-600)'}}>
                Analyses today
              </p>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg" style={{color: 'var(--sage-700)'}}>
                {stats.dailyOutreach || 0}
              </div>
              <p className="text-xs" style={{color: 'var(--sage-600)'}}>
                Outreach today
              </p>
            </div>
          </div>

          {/* Cache Savings */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-center">
              <span className="text-green-600 mr-2">💰</span>
              <div className="text-center">
                <div className="font-semibold text-green-700">
                  ${((stats.costTransparency?.estimatedDailyCost || 0) * 0.3).toFixed(2)} saved today
                </div>
                <p className="text-xs text-green-600">
                  Thanks to intelligent caching
                </p>
              </div>
            </div>
          </div>

          {/* Status Message */}
          {stats.status !== 'healthy' && (
            <div className={`rounded-lg p-3 mb-4 text-center ${
              stats.status === 'critical' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
            }`}>
              <p className={`text-sm font-medium ${
                stats.status === 'critical' ? 'text-red-700' : 'text-amber-700'
              }`}>
                {getStatusMessage()}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              className="w-full bg-sage-gradient text-white font-semibold py-2 hover:opacity-90 transition-opacity"
              onClick={() => {
                // TODO: Implement donation flow
                console.log('Donate clicked');
              }}
            >
              💝 Support the Community
            </Button>
            <Button
              variant="outline"
              className="w-full text-xs"
              style={{borderColor: 'var(--sage-300)', color: 'var(--sage-600)'}}
              onClick={() => {
                // TODO: Link to transparency page
                console.log('View transparency page');
              }}
            >
              📊 View Full Transparency Report
            </Button>
          </div>

          {/* Hide Option */}
          <div className="mt-3 pt-3 border-t" style={{borderColor: 'var(--sage-200)'}}>
            <Button
              variant="ghost"
              className="w-full text-xs"
              style={{color: 'var(--sage-500)'}}
              onClick={() => {
                setIsVisible(false);
                // Store preference in localStorage
                localStorage.setItem('fundIndicatorHidden', Date.now().toString());
              }}
            >
              Hide for 24 hours
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
