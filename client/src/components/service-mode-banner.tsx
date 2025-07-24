import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InfoIcon, AlertTriangle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

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

interface ServiceModeBannerProps {
  serviceMode: ServiceMode;
  onViewArchive?: () => void;
  onDonate?: () => void;
}

export function ServiceModeBanner({ serviceMode, onViewArchive, onDonate }: ServiceModeBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [, setLocation] = useLocation();

  if (serviceMode.mode === 'full') {
    return null; // No banner needed for full service
  }

  const getIcon = () => {
    switch (serviceMode.mode) {
      case 'cache_only': return <InfoIcon className="h-5 w-5" />;
      case 'community_only': return <AlertTriangle className="h-5 w-5" />;
      case 'minimal': return <XCircle className="h-5 w-5" />;
      default: return <InfoIcon className="h-5 w-5" />;
    }
  };

  const getVariant = () => {
    switch (serviceMode.mode) {
      case 'cache_only': return 'default';
      case 'community_only': return 'destructive';
      case 'minimal': return 'destructive';
      default: return 'default';
    }
  };

  const getSuggestions = () => {
    switch (serviceMode.mode) {
      case 'cache_only':
        return [
          'Browse community archive for recent analyses',
          'Use cached results for similar job postings',
          'Manual red flag checklist available'
        ];
      case 'community_only':
        return [
          'Access thousands of community-analyzed job postings',
          'Search by company, role, or red flag patterns',
          'Use manual analysis tools and checklists'
        ];
      case 'minimal':
        return [
          'Browse community archive for insights',
          'Use manual analysis tools',
          'Access red flag pattern database'
        ];
      default:
        return [];
    }
  };

  return (
    <Alert variant={getVariant()} className="mb-6">
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1">
          <AlertDescription className="text-sm">
            {/* Compact header with expand/collapse */}
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="font-medium">{serviceMode.message}</div>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </div>
            
            {/* Expandable content */}
            {isExpanded && (
              <div className="mt-3 space-y-3">
                <div className="text-xs opacity-90">
                  <strong>Available features:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {getSuggestions().map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex space-x-2">
                  {onViewArchive && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setLocation('/archive')}
                      className="h-7 text-xs"
                    >
                      📚 Browse Archive
                    </Button>
                  )}
                  {onDonate && serviceMode.mode !== 'minimal' && (
                    <Button 
                      size="sm" 
                      onClick={() => setLocation('/donate')}
                      className="h-7 text-xs bg-sage-gradient text-white"
                    >
                      💝 Support Service
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Quick action buttons always visible */}
            {!isExpanded && (
              <div className="flex space-x-2 mt-2">
                {onViewArchive && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setLocation('/archive')}
                    className="h-6 text-xs px-2"
                  >
                    Browse Archive
                  </Button>
                )}
                {onDonate && serviceMode.mode !== 'minimal' && (
                  <Button 
                    size="sm" 
                    onClick={() => setLocation('/donate')}
                    className="h-6 text-xs px-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Support
                  </Button>
                )}
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}