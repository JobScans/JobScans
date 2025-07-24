import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { analyzeJob } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Search, X, Lightbulb, ChevronRight } from "lucide-react";
import type { JobAnalysisResult, JobScan } from "@shared/schema";

interface JobScannerProps {
  onScanStart: () => void;
  onScanComplete: (result: JobAnalysisResult) => void;
  recentScans: JobScan[];
}

export default function JobScanner({ onScanStart, onScanComplete, recentScans }: JobScannerProps) {
  const [input, setInput] = useState("");
  const { toast } = useToast();

  const analyzeJobMutation = useMutation({
    mutationFn: analyzeJob,
    onSuccess: (result) => {
      onScanComplete(result);
      toast({
        title: "Analysis Complete",
        description: "Job posting has been analyzed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze job posting",
        variant: "destructive",
      });
    },
  });

  const handleScan = () => {
    if (!input.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a job URL or description to analyze.",
        variant: "destructive",
      });
      return;
    }

    onScanStart();
    
    const isUrl = input.trim().startsWith("http");
    analyzeJobMutation.mutate({
      ...(isUrl ? { jobUrl: input.trim() } : { jobDescription: input.trim() })
    });
  };

  const clearInput = () => {
    setInput("");
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return "bg-red-100 text-red-800";
    if (score >= 40) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getRiskLabel = (score: number) => {
    if (score >= 70) return "High Risk";
    if (score >= 40) return "Medium Risk";
    return "Low Risk";
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Scan Job Posting</CardTitle>
          <p className="text-gray-600">
            Paste a job URL or description to get instant AI-powered insights about potential red flags and ghost job likelihood.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="job-input" className="block text-sm font-medium text-gray-700 mb-2">
              Job URL or Description
            </label>
            <Textarea
              id="job-input"
              rows={8}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste a job URL (LinkedIn, Indeed, etc.) or copy the full job description here..."
              className="resize-none"
            />
          </div>

          <div className="flex space-x-3">
            <Button 
              onClick={handleScan}
              disabled={analyzeJobMutation.isPending || !input.trim()}
              className="flex-1"
            >
              <Search className="mr-2 h-4 w-4" />
              {analyzeJobMutation.isPending ? "Analyzing..." : "Scan Job"}
            </Button>
            <Button 
              variant="outline"
              onClick={clearInput}
              disabled={!input.trim()}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Tips */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
              <Lightbulb className="mr-1 h-4 w-4" />
              Quick Tips
            </h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Paste complete job URLs for best analysis accuracy</li>
              <li>• Include full job descriptions when copying text</li>
              <li>• Works with LinkedIn, Indeed, Glassdoor, and more</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Recent Scans */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Scans</CardTitle>
            <Button variant="link" className="text-primary">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentScans.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No scans yet</p>
            ) : (
              recentScans.slice(0, 3).map((scan) => (
                <div key={scan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {scan.jobTitle}
                    </p>
                    <p className="text-xs text-gray-500">
                      {scan.company} • {new Date(scan.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getRiskColor(scan.ghostLikelihoodScore)}>
                      {scan.ghostLikelihoodScore}% Risk
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
