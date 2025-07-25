import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, DollarSign, Zap } from "lucide-react";

interface UsageStats {
  dailyUsage: number;
  currentBalance: number;
  serviceMode?: {
    mode: string;
    message: string;
    features: {
      freshAnalysis: boolean;
      cacheAnalysis: boolean;
      outreachGeneration: boolean;
      archiveAccess: boolean;
      manualTools: boolean;
    };
  };
}

export function UsageIndicator() {
  const { data: stats } = useQuery<UsageStats>({
    queryKey: ['/api/community-fund-status'],
    refetchInterval: 30000,
  });

  if (!stats) return null;

  const getServiceBadge = () => {
    const mode = stats.serviceMode?.mode || 'full';
    switch (mode) {
      case 'full':
        return <Badge className="bg-green-100 text-green-800">Full Service</Badge>;
      case 'cache_only':
        return <Badge className="bg-yellow-100 text-yellow-800">Cache Only</Badge>;
      case 'community_only':
        return <Badge className="bg-blue-100 text-blue-800">Community Mode</Badge>;
      case 'minimal':
        return <Badge className="bg-gray-100 text-gray-800">Limited Service</Badge>;
      default:
        return <Badge>Service Active</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-sage-600" />
              <span className="text-sm text-gray-600">
                Daily Usage: <span className="font-medium">{stats.dailyUsage}</span>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-sage-600" />
              <span className="text-sm text-gray-600">
                Balance: <span className="font-medium">${stats.currentBalance.toFixed(2)}</span>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-sage-600" />
              <span className="text-sm text-gray-600">
                Per Analysis: <span className="font-medium">$0.006</span>
              </span>
            </div>
          </div>
          
          {getServiceBadge()}
        </div>
        
        {stats.serviceMode?.message && (
          <p className="text-xs text-gray-500 mt-2">
            {stats.serviceMode.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
