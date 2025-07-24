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

export class ServiceModeManager {
  private static readonly CRITICAL_BALANCE = 1.0; // $1 minimum for full service
  private static readonly LOW_BALANCE = 5.0; // $5 for cache-only mode

  /**
   * Determine current service mode based on fund status
   */
  static getServiceMode(currentBalance: number, hasApiKey: boolean): ServiceMode {
    if (!hasApiKey) {
      return {
        mode: 'minimal',
        message: 'AI analysis unavailable - API key required. Archive and manual tools available.',
        features: {
          freshAnalysis: false,
          cacheAnalysis: false,
          outreachGeneration: false,
          archiveAccess: true,
          manualTools: true
        }
      };
    }

    if (currentBalance >= this.LOW_BALANCE) {
      return {
        mode: 'full',
        message: 'All features available',
        features: {
          freshAnalysis: true,
          cacheAnalysis: true,
          outreachGeneration: true,
          archiveAccess: true,
          manualTools: true
        }
      };
    }

    if (currentBalance >= this.CRITICAL_BALANCE) {
      return {
        mode: 'cache_only',
        message: 'Limited to cached analyses only. Fresh AI analysis temporarily unavailable.',
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
      mode: 'community_only',
      message: 'AI features temporarily unavailable. Using community archive and manual analysis tools.',
      features: {
        freshAnalysis: false,
        cacheAnalysis: false,
        outreachGeneration: false,
        archiveAccess: true,
        manualTools: true
      }
    };
  }

  /**
   * Check if a specific feature is available in current mode
   */
  static isFeatureAvailable(feature: keyof ServiceMode['features'], serviceMode: ServiceMode): boolean {
    return serviceMode.features[feature];
  }

  /**
   * Get user-friendly explanation for service limitations
   */
  static getFeatureUnavailableMessage(feature: keyof ServiceMode['features']): string {
    const messages = {
      freshAnalysis: 'Fresh AI analysis is currently unavailable due to funding limitations. Check the community archive for similar job postings.',
      cacheAnalysis: 'Cached analysis is currently unavailable. Browse the community archive for insights.',
      outreachGeneration: 'AI outreach generation is currently unavailable. Use manual templates from the archive.',
      archiveAccess: 'Archive access is currently unavailable.',
      manualTools: 'Manual analysis tools are currently unavailable.'
    };
    return messages[feature];
  }

  /**
   * Get upgrade suggestions based on current mode
   */
  static getUpgradeSuggestions(serviceMode: ServiceMode): string[] {
    switch (serviceMode.mode) {
      case 'cache_only':
        return [
          'Consider donating to restore fresh AI analysis',
          'Browse community archive for recent similar analyses',
          'Use manual red flag checklist for new postings'
        ];
      case 'community_only':
        return [
          'Donate to restore AI features',
          'Use community archive for pattern recognition',
          'Share your manual analysis findings with the community'
        ];
      case 'minimal':
        return [
          'Contact admin for API key setup',
          'Browse community archive for job posting insights',
          'Use manual analysis tools and checklists'
        ];
      default:
        return [];
    }
  }
}