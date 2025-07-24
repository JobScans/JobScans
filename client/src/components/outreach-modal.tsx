import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Copy, MessageCircle, Mail, Linkedin } from "lucide-react";
import type { JobAnalysisResult } from "@shared/schema";

interface OutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanData: JobAnalysisResult;
}

interface OutreachRequest {
  scanId: number;
  messageType: "linkedin" | "email" | "general";
}

export function OutreachModal({ isOpen, onClose, scanData }: OutreachModalProps) {
  const [messageType, setMessageType] = useState<"linkedin" | "email" | "general">("linkedin");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const { toast } = useToast();

  const generateOutreachMutation = useMutation({
    mutationFn: async (request: OutreachRequest) => {
      const response = await fetch("/api/generate-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate outreach message");
      }
      
      const data = await response.json();
      return data.message;
    },
    onSuccess: (message: string) => {
      setGeneratedMessage(message);
      toast({
        title: "Message Generated!",
        description: "Your personalized outreach message is ready to copy.",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate message",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    generateOutreachMutation.mutate({
      scanId: scanData.scanId,
      messageType,
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedMessage);
      toast({
        title: "Copied!",
        description: "Message copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const getMessageTypeIcon = () => {
    switch (messageType) {
      case "linkedin": return <Linkedin className="h-4 w-4" />;
      case "email": return <Mail className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getRiskAdjustedTone = () => {
    if (scanData.ghostLikelihoodScore >= 70) {
      return "Strategic approach to stand out from potential applicant pile";
    } else if (scanData.ghostLikelihoodScore >= 30) {
      return "Proactive but professional tone";
    } else {
      return "Standard professional outreach";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{color: 'var(--sage-800)'}}>
            📨 Outreach Message Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Context */}
          <div className="p-4 rounded-lg" style={{backgroundColor: 'var(--sage-50)', borderColor: 'var(--sage-200)'}}>
            <h4 className="font-semibold mb-2" style={{color: 'var(--sage-700)'}}>Job Context</h4>
            <p className="text-sm mb-1"><strong>Position:</strong> {scanData.jobTitle}</p>
            <p className="text-sm mb-1"><strong>Company:</strong> {scanData.company}</p>
            <p className="text-sm mb-2">
              <strong>Ghost Risk:</strong> 
              <span className={`ml-1 px-2 py-1 rounded-full text-xs font-semibold ${
                scanData.ghostLikelihoodScore < 30 ? 'bg-emerald-100 text-emerald-700' : 
                scanData.ghostLikelihoodScore < 70 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {scanData.ghostLikelihoodScore}% {scanData.ghostLikelihoodLevel}
              </span>
            </p>
            <p className="text-xs" style={{color: 'var(--sage-600)'}}>
              <strong>Recommended Tone:</strong> {getRiskAdjustedTone()}
            </p>
          </div>

          {/* Message Type Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{color: 'var(--sage-700)'}}>
              Message Platform
            </label>
            <Select value={messageType} onValueChange={(value: any) => setMessageType(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linkedin">
                  <div className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4" />
                    LinkedIn Message
                  </div>
                </SelectItem>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Outreach
                  </div>
                </SelectItem>
                <SelectItem value="general">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    General Message
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generateOutreachMutation.isPending}
            className="w-full bg-soft-blue-gradient text-white py-3 font-semibold hover:opacity-90 transition-all duration-200"
          >
            {generateOutreachMutation.isPending ? (
              "Generating Message..."
            ) : (
              <>
                {getMessageTypeIcon()}
                <span className="ml-2">Generate {messageType.charAt(0).toUpperCase() + messageType.slice(1)} Message</span>
              </>
            )}
          </Button>

          {/* Generated Message */}
          {generatedMessage && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold" style={{color: 'var(--sage-700)'}}>
                  Your Personalized Message
                </label>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
              </div>
              <Textarea
                value={generatedMessage}
                onChange={(e) => setGeneratedMessage(e.target.value)}
                className="min-h-[120px]"
                placeholder="Generated message will appear here..."
              />
              <p className="text-xs" style={{color: 'var(--sage-500)'}}>
                Tip: Feel free to edit the message above before copying. Personal touches always help!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}