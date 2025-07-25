import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowLeft, ExternalLink } from "lucide-react";
import type { JobAnalysisResult } from "@shared/schema";

interface ArchiveViewProps {
  onBack: () => void;
  onViewScan: (scan: JobAnalysisResult) => void;
}

export function ArchiveView({ onBack, onViewScan }: ArchiveViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRisk, setSelectedRisk] = useState<string>("");

  const { data: archiveScans, isLoading } = useQuery<JobAnalysisResult[]>({
    queryKey: ['/api/archive', searchTerm, selectedRisk],
  });

  const filteredScans = archiveScans?.filter(scan => {
    const matchesSearch = !searchTerm || 
      scan.originalDescription?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = !selectedRisk || 
      scan.redFlags.some(flag => flag.severity.toUpperCase() === selectedRisk);
    return matchesSearch && matchesRisk;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Scanner
        </Button>
        <h2 className="text-2xl font-bold text-gray-900">Community Archive</h2>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            placeholder="Search job postings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select 
          value={selectedRisk}
          onChange={(e) => setSelectedRisk(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All Risk Levels</option>
          <option value="HIGH">High Risk</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="LOW">Low Risk</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-2 text-gray-600">Loading archive...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredScans.map((scan) => (
            <Card key={scan.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      Job Analysis #{scan.id}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(scan.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {scan.redFlags.map((flag, idx) => (
                      <Badge 
                        key={idx}
                        variant={flag.severity === 'high' ? 'destructive' : 
                                 flag.severity === 'medium' ? 'default' : 'secondary'}
                      >
                        {flag.severity}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-3">
                  {scan.originalDescription?.substring(0, 150)}...
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {scan.redFlags.length} red flags detected
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onViewScan(scan)}
                  >
                    View Analysis
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredScans.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No archived analyses found.</p>
              <p className="text-sm mt-1">High-risk job analyses will appear here when shared by the community.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
