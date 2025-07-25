import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { analyzeJob } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArchiveView } from "@/components/archive-view";
import { OutreachModal } from "@/components/outreach-modal";
import { UsageIndicator } from "@/components/usage-indicator";
import { ServiceModeBanner } from "@/components/service-mode-banner";
import { useLocation } from "wouter";
import { getServiceMode } from "@/lib/service-detection";
import type { JobAnalysisResult } from "@shared/schema";

// Simple job input parser
const parseJobInput = (input: string) => {
  let jobTitle = "Job Posting";
  let companyName = "Unknown Company";
  let jobUrl = "";
  let jobDescription = input;

  // Attempt to parse URL
  try {
    const url = new URL(input);
    jobUrl = input;
    if (url.hostname.includes('linkedin.com/jobs')) {
      const pathSegments = url.pathname.split('/');
      jobTitle = pathSegments[pathSegments.length - 2]?.replace(/-/g, ' ') || "LinkedIn Job";
      companyName = "LinkedIn Company";
    } else if (url.hostname.includes('indeed.com')) {
      jobTitle = "Indeed Job";
      companyName = "Indeed Company";
    } else {
      jobTitle = "Web Job Posting";
      companyName = url.hostname.split('.')[0];
    }
    jobDescription = `Job from ${jobUrl}. Please paste full description for better analysis.`;
  } catch (e) {
    // If not a valid URL, treat as raw description
    const lines = input.split('\n').filter(line => line.trim() !== '');
    jobTitle = lines[0] ? lines[0].substring(0, 50) + (lines[0].length > 50 ? '...' : '') : "Job Posting";
    companyName = lines[1] ? lines[1].substring(0, 30) + (lines[1].length > 30 ? '...' : '') : "Unknown Company";
  }

  return { jobTitle, companyName, jobUrl, jobDescription };
};

export default function Home() {
  const [input, setInput] = useState("");
  const [currentScan, setCurrentScan] = useState<JobAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Welcome to JobScans! Paste a job posting to analyze.");
  const [showDemo, setShowDemo] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showOutreachModal, setShowOutreachModal] = useState(false);
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  // Get fund status for service mode using client-side detection
  const fundStatus = getServiceMode();

  const analyzeJobMutation = useMutation({
    mutationFn: analyzeJob,
    onSuccess: (result) => {
      setCurrentScan(result);
      setLoading(false);
      setMessage("Analysis complete! Here's what we found.");
      toast({
        title: "Analysis Complete",
        description: "Job posting has been analyzed successfully.",
      });
    },
    onError: (error) => {
      setLoading(false);
      setMessage("Analysis failed. Please try again.");
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze job posting",
        variant: "destructive",
      });
    },
  });

  const handleScan = () => {
    if (!input.trim()) {
      setMessage("Please enter a job URL or description to analyze.");
      return;
    }

    setLoading(true);
    setMessage("Analyzing job posting... This may take a few seconds.");
    setCurrentScan(null);
    
    const isUrl = input.trim().startsWith("http");
    analyzeJobMutation.mutate({
      ...(isUrl ? { jobUrl: input.trim() } : { jobDescription: input.trim() })
    });
  };



  const handleNewScan = () => {
    setCurrentScan(null);
    setInput("");
    setMessage("Ready for another scan! Paste a job posting to analyze.");
  };

  const handleCopyReport = () => {
    if (!currentScan) return;
    
    const parsedData = parseJobInput(input);
    const riskEmoji = currentScan.ghostLikelihoodScore >= 70 ? '🚨' : 
                     currentScan.ghostLikelihoodScore >= 30 ? '⚠️' : '✅';
    
    const reportText = `JOBSCANS ANALYSIS REPORT
========================

${riskEmoji} Position: ${currentScan.jobTitle}
🏢 Company: ${currentScan.company}
📊 Ghost Job Risk: ${currentScan.ghostLikelihoodScore}% (${currentScan.ghostLikelihoodLevel.toUpperCase()})
📅 Analyzed: ${new Date().toLocaleDateString()}
${parsedData.jobUrl ? `🔗 Source: ${parsedData.jobUrl}` : ''}

🧠 AI SUMMARY:
${currentScan.aiSummary}

${currentScan.redFlags.length > 0 ? `🚩 RED FLAGS (${currentScan.redFlags.length} detected):
${currentScan.redFlags.map((flag, i) => `${i + 1}. ${flag.flag} (${flag.severity.toUpperCase()})
   ${flag.explanation}`).join('\n\n')}` : '✅ NO SIGNIFICANT RED FLAGS DETECTED'}

💡 CONFIDENCE EXPLANATION:
${currentScan.confidenceExplanation || 'Analysis completed with standard confidence metrics.'}

📋 RECOMMENDED NEXT STEPS:
${currentScan.ghostLikelihoodScore >= 70 ? 
  '• Consider skipping this opportunity\n• Focus time on higher-quality listings\n• Share experience with JobScans community' :
  currentScan.ghostLikelihoodScore >= 30 ?
  '• Proceed with caution and research thoroughly\n• Ask specific questions during interviews\n• Verify company legitimacy independently' :
  '• This appears to be a legitimate opportunity\n• Prepare standard interview materials\n• Apply with confidence'
}

---
Generated by JobScans © 2025 | AI-powered job posting analysis
This analysis is for informational purposes only. Always conduct your own research.`.trim();

    navigator.clipboard.writeText(reportText)
      .then(() => {
        toast({ title: "Success", description: "Enhanced analysis report copied to clipboard!" });
        setMessage("Professional report copied! Ready to paste in emails, notes, or documents.");
      })
      .catch(() => toast({ title: "Error", description: "Failed to copy report. Please try again.", variant: "destructive" }));
  };

  const handleShareToArchive = async (scanId: number) => {
    try {
      const response = await fetch(`/api/scan/${scanId}/share`, {
        method: 'POST'
      });
      
      if (response.ok) {
        toast({ 
          title: "Shared Successfully", 
          description: "This analysis has been added to the community archive to help other job seekers." 
        });
      } else {
        const error = await response.json();
        toast({ 
          title: "Share Failed", 
          description: error.error || "Failed to share analysis to archive.", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ 
        title: "Network Error", 
        description: "Unable to share to archive. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  const parsedData = parseJobInput(input);

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">

      
      <div className="flex-1 py-4 px-4">
        <div className="max-w-4xl mx-auto">
          {!currentScan && (
            <>
              {/* Header - only show when no results */}
              <div className="text-center mb-8">
                <h1 className="text-5xl font-bold text-stone-700 mb-4">Are You Wasting Your Time?</h1>
                <p className="text-xl text-stone-600">Scan postings for red flags, ghost jobs, and employer tricks. Built for real applicants.</p>
              </div>

              {/* Status Message */}
              {message !== "Welcome to JobScans! Paste a job posting to analyze." && (
                <div className="mb-6 p-4 bg-stone-50 rounded-lg border border-stone-200 text-center">
                  <p className="text-stone-700">{message}</p>
                </div>
              )}

              {/* AI Provider Status */}
              {fundStatus && fundStatus.serviceMode && fundStatus.serviceMode.mode === 'full' ? (
                <div className="mb-6 p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
                  <p className="text-emerald-700 text-sm">
                    ✨ AI Analysis Ready - Using Qwen2.5 7B
                  </p>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-red-600 text-lg mr-2">⚠️</span>
                    <h3 className="text-red-800 font-semibold">AI Analysis Temporarily Unavailable</h3>
                  </div>
                  <p className="text-red-700 text-sm text-center mb-3">
                    {(fundStatus && fundStatus.serviceMode && fundStatus.serviceMode.message) || 'Fresh AI analysis is currently unavailable due to funding limitations.'}
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button
                      onClick={() => setLocation('/archive')}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-100"
                    >
                      📊 Browse Archive
                    </Button>
                    <Button
                      onClick={() => setLocation('/donate')}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      💝 Restore AI
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Input Section */}
          {!currentScan && (
            <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-6 mb-8">
              <Textarea
                rows={6}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste a job URL (LinkedIn, Indeed, etc.) or copy the full job description here..."
                className="mb-4 resize-none"
                disabled={loading}
              />
              <div className="flex space-x-4">
                <Button 
                  onClick={handleScan}
                  disabled={loading || !input.trim()}
                  className="flex-1 bg-stone-600 hover:bg-stone-700 text-white py-3 font-semibold"
                >
                  {loading ? "Analyzing..." : "🔍 Analyze Job Posting"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setInput("")}
                  disabled={!input.trim() || loading}
                  className="px-6"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-8 text-center mb-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-600 mx-auto mb-4"></div>
            <p className="text-stone-600">Analyzing job posting with AI...</p>
          </div>
        )}

        {/* Results Section */}
        {currentScan && !showArchive && (
          <div className="min-h-screen bg-calming-gradient">
            {/* Header with Archive Button */}
            <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10" style={{borderColor: 'var(--sage-200)'}}>
              <div className="max-w-4xl mx-auto px-6 py-4 flex justify-end">
                <Button 
                  onClick={() => setLocation('/archive')}
                  variant="outline"
                  style={{borderColor: 'var(--sage-300)', color: 'var(--sage-700)'}}
                  className="hover:scale-105 transition-all duration-200"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--sage-50)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  📁 View Archive
                </Button>
              </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
              {/* Hero Section - Job Summary */}
              <div className="bg-white rounded-2xl shadow-lg border overflow-hidden" style={{borderColor: 'var(--sage-200)'}}>
                <div className="bg-sage-gradient p-6 text-white">
                  <h1 className="text-2xl font-bold mb-2">{parsedData.jobTitle}</h1>
                  <p className="text-white/80 text-lg">{parsedData.companyName}</p>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold" style={{color: 'var(--sage-700)'}}>Ghost Job Likelihood</span>
                    <div className="flex items-center space-x-3">
                      <div className={`text-4xl font-bold ${
                        currentScan.ghostLikelihoodScore < 30 ? 'text-emerald-600' : 
                        currentScan.ghostLikelihoodScore < 70 ? 'text-amber-500' : 'text-rose-600'
                      }`}>
                        {currentScan.ghostLikelihoodScore}%
                      </div>
                      <span className={`px-4 py-2 rounded-full text-white font-bold text-sm ${
                        currentScan.ghostLikelihoodScore < 30 ? 'bg-emerald-500' : 
                        currentScan.ghostLikelihoodScore < 70 ? 'bg-amber-400' : 'bg-rose-500'
                      }`}>
                        {currentScan.ghostLikelihoodLevel.toUpperCase()} RISK
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Red Flags */}
                {currentScan.redFlags.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg border overflow-hidden" style={{borderColor: 'var(--sage-200)'}}>
                    <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-4 text-white">
                      <h2 className="text-xl font-bold flex items-center">
                        🚩 Red Flags Detected
                        <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-sm">
                          {currentScan.redFlags.length}
                        </span>
                      </h2>
                    </div>
                    <div className="p-6 space-y-4">
                      {currentScan.redFlags.map((flag, index) => (
                        <div key={index} className="border-l-4 border-rose-200 bg-rose-50/50 p-4 rounded-r-lg">
                          <h4 className="font-semibold text-rose-800 mb-1">{flag.flag}</h4>
                          <p className="text-rose-700 text-sm">{flag.explanation}</p>
                          <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-semibold ${
                            flag.severity === 'high' ? 'bg-rose-200 text-rose-800' :
                            flag.severity === 'medium' ? 'bg-amber-200 text-amber-800' :
                            'bg-gray-200 text-gray-800'
                          }`}>
                            {flag.severity.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Right Column - AI Analysis */}
                <div className="bg-white rounded-2xl shadow-lg border overflow-hidden" style={{borderColor: 'var(--sage-200)'}}>
                  <div className="bg-soft-blue-gradient p-4 text-white">
                    <h2 className="text-xl font-bold flex items-center">
                      🧠 AI Analysis
                    </h2>
                  </div>
                  <div className="p-6">
                    <p className="leading-relaxed" style={{color: 'var(--sage-700)'}}>{currentScan.aiSummary}</p>
                  </div>
                </div>
              </div>

              {/* Action Panel */}
              <div className="bg-white rounded-2xl shadow-lg border p-6" style={{borderColor: 'var(--sage-200)'}}>
                <h3 className="text-xl font-bold mb-4 text-center" style={{color: 'var(--sage-800)'}}>Take Action</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button
                    onClick={handleNewScan}
                    className="bg-sage-gradient text-white py-3 px-4 font-semibold hover:opacity-90 transition-all duration-200 transform hover:scale-105 rounded-xl text-sm"
                  >
                    🔁 Scan Another
                  </Button>
                  <Button
                    onClick={handleCopyReport}
                    variant="outline"
                    className="py-3 px-4 font-semibold transition-all duration-200 transform hover:scale-105 rounded-xl border-stone-300 text-stone-700 hover:bg-stone-50 text-sm"
                  >
                    📋 Copy Report
                  </Button>
                  <Button
                    onClick={() => setShowOutreachModal(true)}
                    variant="outline"
                    className="py-3 px-4 font-semibold transition-all duration-200 transform hover:scale-105 rounded-xl text-sm"
                    style={{borderColor: 'var(--soft-blue-500)', color: 'var(--soft-blue-600)'}}
                  >
                    📨 Outreach Message
                  </Button>
                  {currentScan && currentScan.ghostLikelihoodScore >= 70 && (
                    <Button
                      onClick={() => handleShareToArchive(currentScan.scanId)}
                      variant="outline"
                      className="py-3 px-4 font-semibold border-amber-400 text-amber-700 hover:bg-amber-50 transition-all duration-200 transform hover:scale-105 rounded-xl text-sm"
                    >
                      📁 Share Archive
                    </Button>
                  )}
                </div>
                

              </div>

              {/* Original Posting - Collapsible */}
              <div className="bg-white rounded-2xl shadow-lg border overflow-hidden" style={{borderColor: 'var(--sage-200)'}}>
                <Button
                  variant="ghost"
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="w-full p-6 text-left hover:bg-stone-50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold" style={{color: 'var(--sage-700)'}}>
                      Original Job Description
                    </span>
                    <span style={{color: 'var(--sage-500)'}}>
                      {showFullDescription ? '🔼 Hide' : '🔽 Show'}
                    </span>
                  </div>
                </Button>
                {showFullDescription && (
                  <div className="border-t p-6" style={{borderColor: 'var(--sage-200)', backgroundColor: 'var(--sage-50)'}}>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2" style={{color: 'var(--sage-700)'}}>Job URL:</h4>
                        <p className="break-words bg-white p-3 rounded-lg border" style={{color: 'var(--sage-600)', borderColor: 'var(--sage-200)'}}>
                          {parsedData.jobUrl || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2" style={{color: 'var(--sage-700)'}}>Full Description:</h4>
                        <div className="bg-white p-4 rounded-lg border max-h-96 overflow-y-auto" style={{borderColor: 'var(--sage-200)'}}>
                          <p className="whitespace-pre-wrap" style={{color: 'var(--sage-600)'}}>
                            {parsedData.jobDescription || 'No description provided.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Archive Section */}
        {showArchive && <ArchiveView onClose={() => setShowArchive(false)} />}

        {/* Outreach Modal */}
        {currentScan && (
          <OutreachModal
            isOpen={showOutreachModal}
            onClose={() => setShowOutreachModal(false)}
            scanData={currentScan}
          />
        )}

        {/* Usage Indicator */}
        <UsageIndicator fundStatus={fundStatus} />
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-6 border-t border-stone-300 bg-stone-50">
        <div className="text-center">
          <p className="text-stone-600">JobScans © 2025</p>
        </div>
      </footer>
    </div>
  );
}
