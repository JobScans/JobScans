import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import type { JobScan } from "@shared/schema";

interface ArchiveViewProps {
  onClose: () => void;
}

interface ArchiveResponse {
  scans: JobScan[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export function ArchiveView({ onClose }: ArchiveViewProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const pageSize = 20;

  const { data: archiveData, isLoading } = useQuery<ArchiveResponse>({
    queryKey: ['/api/archive', { 
      limit: pageSize, 
      offset: currentPage * pageSize,
      search: searchTerm,
      riskFilter,
      sortBy
    }],
    staleTime: 60000, // Cache for 1 minute
  });

  // Reset page when search/filter changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(0);
  };

  const handleFilterChange = (value: string) => {
    setRiskFilter(value);
    setCurrentPage(0);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(0);
  };

  // Filter data client-side for immediate response
  const filteredScans = archiveData?.scans?.filter(scan => {
    const matchesSearch = !searchTerm || 
      scan.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scan.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scan.redFlags.some(flag => flag.flag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRisk = riskFilter === "all" || 
      (riskFilter === "high" && scan.ghostLikelihoodScore >= 70) ||
      (riskFilter === "medium" && scan.ghostLikelihoodScore >= 30 && scan.ghostLikelihoodScore < 70) ||
      (riskFilter === "low" && scan.ghostLikelihoodScore < 30);
    
    return matchesSearch && matchesRisk;
  }) || [];

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-stone-200">
        <div className="px-6 py-4 border-b border-stone-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-stone-800">Job Analysis Archive</h2>
            <Button 
              onClick={onClose}
              variant="ghost"
              className="text-stone-600 hover:text-stone-800"
            >
              ✕ Close
            </Button>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-12 text-stone-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-600 mx-auto mb-4"></div>
            <p>Loading archived analyses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-stone-200">
      <div className="px-6 py-4 border-b border-stone-200">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-stone-800">Job Analysis Archive</h2>
          <Button 
            onClick={onClose}
            variant="ghost"
            className="text-stone-600 hover:text-stone-800"
          >
            ✕ Close
          </Button>
        </div>
        <p className="text-stone-600 mt-2">Red flag analyses shared by other users to help the community identify problematic postings.</p>
        
        {/* Search and Filter Controls */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
            <Input
              placeholder="Search jobs, companies, or red flags..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={riskFilter} onValueChange={handleFilterChange}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="high">High Risk (70%+)</SelectItem>
              <SelectItem value="medium">Medium Risk (30-69%)</SelectItem>
              <SelectItem value="low">Low Risk (&lt;30%)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="risk-high">Highest Risk</SelectItem>
              <SelectItem value="risk-low">Lowest Risk</SelectItem>
              <SelectItem value="company">Company A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="p-6">
        {!filteredScans || filteredScans.length === 0 ? (
          <div className="text-center py-12 text-stone-500">
            <div className="text-4xl mb-4">{searchTerm ? "🔍" : "🗂️"}</div>
            <p className="text-lg mb-2">
              {searchTerm ? "No Results Found" : "No Archived Analyses Yet"}
            </p>
            <p>
              {searchTerm 
                ? "Try different search terms or adjust filters" 
                : "High-risk job postings shared by users will appear here to help the community."
              }
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredScans.map((scan) => (
              <div key={scan.id} className="border border-stone-200 rounded-lg p-4 hover:bg-stone-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-stone-800 text-lg">{scan.jobTitle}</h3>
                    <p className="text-stone-600">{scan.company}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-white text-sm font-bold ${
                      scan.ghostLikelihoodScore < 30 ? 'bg-emerald-500' : 
                      scan.ghostLikelihoodScore < 70 ? 'bg-amber-400' : 'bg-rose-500'
                    }`}>
                      {scan.ghostLikelihoodScore}% {scan.ghostLikelihoodLevel.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {scan.redFlags.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold text-rose-700 mb-2">🚩 Red Flags:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {scan.redFlags.slice(0, 4).map((flag, index) => (
                        <span key={index} className="text-xs bg-rose-100 text-rose-800 px-2 py-1 rounded">
                          {flag.flag}
                        </span>
                      ))}
                      {scan.redFlags.length > 4 && (
                        <span className="text-xs text-stone-500 px-2 py-1">
                          +{scan.redFlags.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="text-sm text-stone-600 bg-stone-50 p-3 rounded">
                  <p className="line-clamp-2">{scan.aiSummary}</p>
                </div>
                
                <div className="flex justify-between items-center mt-3 text-xs text-stone-500">
                  <span>Shared {new Date(scan.createdAt).toLocaleDateString()}</span>
                  {scan.originalUrl && (
                    <a 
                      href={scan.originalUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-stone-600 hover:text-stone-800 underline"
                    >
                      View Original
                    </a>
                  )}
                </div>
              </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {archiveData.pagination.total > pageSize && (
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-stone-200">
                <div className="text-sm text-stone-600">
                  Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, archiveData.pagination.total)} of {archiveData.pagination.total} analyses
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!archiveData.pagination.hasMore}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}