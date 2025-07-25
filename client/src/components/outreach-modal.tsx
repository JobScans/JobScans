import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Copy, X } from "lucide-react";
import type { JobAnalysisResult } from "@shared/schema";

interface OutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  scan: JobAnalysisResult | null;
}

export function OutreachModal({ isOpen, onClose, scan }: OutreachModalProps) {
  const [outreachMessage, setOutreachMessage] = useState("");
  const { toast } = useToast();

  const generateOutreachMutation = useMutation({
    mutationFn: async (scanId: number) => {
      const response = await fetch('/api/generate-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId }),
      });
      if (!response.ok) throw new Error('Failed to generate outreach message');
      return response.json();
    },
    onSuccess: (data) => {
      setOutreachMessage(data.message);
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Could not generate outreach message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(outreachMessage);
      toast({
        title: "Copied!",
        description: "Outreach message copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard. Please select and copy manually.",
        variant: "destructive",
      });
    }
  };

  const handleGenerate = () => {
    if (scan) {
      generateOutreachMutation.mutate(scan.id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Smart Outreach Message
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Generate a professional follow-up message based on your job analysis. 
            The AI will create a personalized message considering any red flags found.
          </p>

          {!outreachMessage ? (
            <div className="text-center py-8">
              <Button 
                onClick={handleGenerate}
                disabled={generateOutreachMutation.isPending}
                className="bg-sage-600 hover:bg-sage-700"
              >
                {generateOutreachMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Generating...
                  </>
                ) : (
                  'Generate Outreach Message'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Textarea
                  value={outreachMessage}
                  onChange={(e) => setOutreachMessage(e.target.value)}
                  rows={12}
                  className="resize-none"
                  placeholder="Your outreach message will appear here..."
                />
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  Feel free to edit this message before using it.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                  <Button onClick={handleGenerate} variant="outline">
                    Regenerate
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
