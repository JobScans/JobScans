import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, Trash2 } from "lucide-react";
import { RecentScansManager, type RecentScan } from "@/lib/recent-scans";

interface RecentScansSidebarProps {
  onScanSelect?: (scan: RecentScan) => void;
  className?: string;
}

export function RecentScansSidebar({ onScanSelect, className = "" }: RecentScansSidebarProps) {
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredScans, setFilteredScans] = useState<RecentScan[]>([]);

  useEffect(() => {
    const scans = RecentScansManager.getRecentScans();
    setRecentScans(scans);
    setFilteredScans(scans);
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredScans(RecentScansManager.searchRecentScans(searchQuery));
    } else {
      setFilteredScans(recentScans);
    }
  }, [searchQuery, recentScans]);

  const handleClearAll = () => {
    RecentScansManager.clearRecentScans();
    setRecentScans([]);
    setFilteredScans([]);
  };

  const getRiskBadgeColor = (score: number) => {
    if (score >= 70) return "bg-red-100 text-red-700";
    if (score >= 30) return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (recentScans.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No recent scans yet</p>
      </div>
    );
  }

  return (
    <div className={`p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Recent Scans</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="text-gray-500 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search recent scans..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <ScrollArea className="h-64">
        <div className="space-y-2">
          {filteredScans.map((scan) => (
            <div
              key={scan.id}
              className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onScanSelect?.(scan)}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm truncate pr-2">{scan.jobTitle}</h4>
                <Badge className={`text-xs ${getRiskBadgeColor(scan.ghostLikelihoodScore)}`}>
                  {scan.ghostLikelihoodScore}%
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mb-1">{scan.company}</p>
              <p className="text-xs text-gray-500 truncate">{scan.snippet}</p>
              <p className="text-xs text-gray-400 mt-1">{formatDate(scan.scannedAt)}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}