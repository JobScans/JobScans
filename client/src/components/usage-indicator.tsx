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

interface DonationMetrics {
  dailyDonations: number;
  totalDonated: number;
  lastDonationTime: string | null;
}

interface UsageStats {
  dailyAnalyses: number;
  dailyOutreach: number;
  costTransparency: {
    analysisCost: number;
    outreachCost: number;
    estimatedDailyCost: number;
  };
  performance: {
    providerStatus: 'operational' | 'degraded' | 'offline';
    uptimeToday: string;
  };
  serviceMode: ServiceMode;
  status: 'healthy' | 'critical';
  note: string;
}

export function UsageIndicator() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showOutreachCost, setShowOutreachCost] = useState(false);

  // Fetch usage status from API
  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ['/api/community-fund-status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Check if user previously hid the indicator
  useEffect(() => {
    const hiddenTimestamp = localStorage.getItem('usageIndicatorHidden');
    if (hiddenTimestamp) {
      const hiddenTime = parseInt(hiddenTimestamp);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (Date.now() - hiddenTime < twentyFourHours) {
        setIsVisible(false);
      } else {
        localStorage.removeItem('usageIndicatorHidden');
      }
    }
  }, []);

  if (!isVisible || isLoading) return null;

  // Extract stats from API response, with safe fallbacks
  const stats = {
    dailyAnalyses: (apiResponse as any)?.dailyAnalyses || 0,
    dailyOutreach: (apiResponse as any)?.dailyOutreach || 0,
    dailyUsage: (apiResponse as any)?.dailyUsage || 0,
    costTransparency: (apiResponse as any)?.costTransparency || {
      analysisCost: 0.006,
      outreachCost: 0.003,
      estimatedDailyCost: 0
    },
    donationMetrics: (apiResponse as any)?.donationMetrics || {
      dailyDonations: 0,
      totalDonated: 0,
      lastDonationTime: null
    },
    performance: (apiResponse as any)?.performance || {
      providerStatus: 'offline' as const,
      uptimeToday: '0%'
    },
    serviceMode: (apiResponse as any)?.serviceMode || {
      mode: 'minimal' as const,
      message: 'Loading...',
      features: {
        freshAnalysis: false,
        cacheAnalysis: true,
        outreachGeneration: false,
        archiveAccess: true,
        manualTools: true
      }
    },
    note: (apiResponse as any)?.note || 'Local usage tracking only'
  };

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
                ${stats.costTransparency.estimatedDailyCost.toFixed(3)}
              </div>
              <p className="text-sm" style={{color: 'var(--sage-600)'}}>
                Today's estimated cost ({stats.dailyAnalyses} analyses)
              </p>
            </div>
          </div>

          {/* Cost Transparency Grid */}
          <div className="grid grid-cols-2 gap-3 text-center mb-4">
            <div className="bg-white rounded-lg p-3 border border-sage-200">
              <div className="font-semibold" style={{color: 'var(--sage-800)'}}>
                {stats.dailyAnalyses}
              </div>
              <div className="text-xs" style={{color: 'var(--sage-600)'}}>
                Analyses Today
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-sage-200">
              <div className="font-semibold" style={{color: 'var(--sage-800)'}}>
                {stats.dailyOutreach}
              </div>
              <div className="text-xs" style={{color: 'var(--sage-600)'}}>
                Outreach Generated
              </div>
            </div>
            <div 
              className="bg-white rounded-lg p-3 border border-sage-200 cursor-pointer hover:bg-sage-50 transition-colors"
              onClick={() => setShowOutreachCost(!showOutreachCost)}
            >
              <div className="font-semibold text-emerald-600">
                ${showOutreachCost ? stats.costTransparency.outreachCost.toFixed(3) : stats.costTransparency.analysisCost.toFixed(3)}
              </div>
              <div className="text-xs" style={{color: 'var(--sage-600)'}}>
                {showOutreachCost ? 'Per Outreach' : 'Per Analysis'} ↻
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-sage-200">
              <div className="font-semibold text-blue-600">
                ${stats.donationMetrics.dailyDonations.toFixed(2)}
              </div>
              <div className="text-xs" style={{color: 'var(--sage-600)'}}>
                Donated Today
              </div>
            </div>
          </div>

          {/* Service Status */}
          {stats.performance.providerStatus !== 'operational' && (
            <div className={`rounded-lg p-3 mb-4 text-center ${
              stats.performance.providerStatus === 'degraded' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm font-medium ${
                stats.performance.providerStatus === 'degraded' ? 'text-amber-700' : 'text-red-700'
              }`}>
                {getStatusMessage()}
              </p>
            </div>
          )}

          {/* Support Button */}
          <div className="mb-4">
            <Button
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-2 transition-all"
              onClick={() => {
                window.location.href = '/donate';
              }}
            >
              💝 Support Community AI
            </Button>
          </div>

          {/* Hide Option */}
          <div className="pt-3 border-t" style={{borderColor: 'var(--sage-200)'}}>
            <Button
              variant="ghost"
              className="w-full text-xs"
              style={{color: 'var(--sage-500)'}}
              onClick={() => {
                setIsVisible(false);
                // Store preference in localStorage
                localStorage.setItem('usageIndicatorHidden', Date.now().toString());
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
