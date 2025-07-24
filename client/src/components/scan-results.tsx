import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Share, Info, Mail, Bookmark, Plus, CheckCircle, AlertTriangle, TriangleAlert, Clock, Bot } from "lucide-react";
import OutreachModal from "./outreach-modal";
import { useToast } from "@/hooks/use-toast";
import type { JobAnalysisResult } from "@shared/schema";

interface ScanResultsProps {
  scan: JobAnalysisResult;
  onNewScan: () => void;
}

export default function ScanResults({ scan, onNewScan }: ScanResultsProps) {
  const [showOutreachModal, setShowOutreachModal] = useState(false);
  const { toast } = useToast();

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-red-600";
    if (score >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const getRiskBgColor = (score: number) => {
    if (score >= 70) return "bg-red-100 text-red-800";
    if (score >= 40) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return "High Risk";
    if (score >= 40) return "Medium Risk";
    return "Low Risk";
  };

  const getScoreArcLength = (score: number) => {
    const circumference = 2 * Math.PI * 40;
    return (score / 100) * circumference;
  };

  const copyReport = async () => {
    const reportText = `JobShield Analysis Report
    
Job Title: ${scan.jobTitle}
Company: ${scan.company}
Ghost Job Likelihood: ${scan.ghostLikelihoodScore}% (${scan.ghostLikelihoodLevel})

Red Flags:
${scan.redFlags.map(flag => `• ${flag.flag}: ${flag.explanation}`).join('\n')}

AI Summary:
${scan.aiSummary}`;

    try {
      await navigator.clipboard.writeText(reportText);
      toast({
        title: "Report Copied",
        description: "Analysis report copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const shareReport = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `JobShield Analysis: ${scan.jobTitle}`,
          text: `Ghost job likelihood: ${scan.ghostLikelihoodScore}%`,
          url: window.location.href,
        });
      } catch {
        // Share cancelled
      }
    } else {
      copyReport();
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <TriangleAlert className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'high':
        return "bg-red-50 border-red-200";
      case 'medium':
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        {/* Results Header */}
        <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{scan.jobTitle}</CardTitle>
              <p className="text-gray-600">{scan.company}</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm" onClick={copyReport}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={shareReport}>
                <Share className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {scan.originalUrl && (
            <div className="mt-2">
              <a 
                href={scan.originalUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:text-primary/80 font-mono break-all"
              >
                {scan.originalUrl}
              </a>
            </div>
          )}
        </CardHeader>

        {/* Ghost Likelihood Score */}
        <CardContent className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Ghost Job Likelihood</h4>
            <Button variant="ghost" size="sm">
              <Info className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="8"/>
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="none" 
                  stroke={scan.ghostLikelihoodScore >= 70 ? "#DC2626" : scan.ghostLikelihoodScore >= 40 ? "#D97706" : "#059669"}
                  strokeWidth="8" 
                  strokeDasharray={`${getScoreArcLength(scan.ghostLikelihoodScore)} 251.2`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getRiskColor(scan.ghostLikelihoodScore)}`}>
                    {scan.ghostLikelihoodScore}%
                  </div>
                  <div className="text-xs text-gray-500">Risk</div>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge className={getRiskBgColor(scan.ghostLikelihoodScore)}>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  {getRiskLevel(scan.ghostLikelihoodScore)}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                {scan.confidenceExplanation || "Analysis completed based on job posting content and common ghost job indicators."}
              </p>
            </div>
          </div>
        </CardContent>

        {/* Red Flags Section */}
        <CardContent className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Red Flags Detected</h4>
            <span className="text-sm text-gray-500">{scan.redFlags.length} found</span>
          </div>
          
          <div className="space-y-3">
            {scan.redFlags.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No significant red flags detected
              </div>
            ) : (
              scan.redFlags.map((flag, index) => (
                <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg border ${getSeverityBg(flag.severity)}`}>
                  {getSeverityIcon(flag.severity)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{flag.flag}</p>
                    <p className="text-xs text-gray-600 mt-1">{flag.explanation}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>

        {/* AI Recommendations */}
        <CardContent className="p-6">
          <h4 className="text-lg font-semibold mb-3">Our Recommendation</h4>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start space-x-3">
              <Bot className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-800">
                  {scan.aiSummary}
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Action Buttons */}
        <CardContent className="p-6 bg-gray-50 border-t">
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => setShowOutreachModal(true)}>
              <Mail className="mr-2 h-4 w-4" />
              Generate Outreach
            </Button>
            <Button variant="outline">
              <Bookmark className="mr-2 h-4 w-4" />
              Save to Archive
            </Button>
          </div>
          <Button 
            variant="ghost" 
            className="w-full mt-3"
            onClick={onNewScan}
          >
            <Plus className="mr-2 h-4 w-4" />
            Scan Another Job
          </Button>
        </CardContent>
      </Card>

      <OutreachModal 
        isOpen={showOutreachModal}
        onClose={() => setShowOutreachModal(false)}
        scanId={scan.scanId}
        jobTitle={scan.jobTitle}
        company={scan.company}
      />
    </>
  );
}
