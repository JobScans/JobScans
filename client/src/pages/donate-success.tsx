import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { CheckCircle, Heart, ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function DonateSuccess() {
  const { toast } = useToast();

  useEffect(() => {
    // Show success toast when page loads
    toast({
      title: "🎉 Thank you for your support!",
      description: "Your donation helps keep AI-powered job analysis accessible for everyone.",
      duration: 5000,
    });
  }, [toast]);

  return (
    <div className="min-h-screen bg-calming-gradient">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">
          <Card className="bg-white/90 backdrop-blur border-sage-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold text-sage-800 mb-4">
                Donation Successful!
              </CardTitle>
              <div className="space-y-4 text-sage-600">
                <p className="text-lg">
                  Thank you for supporting the JobShield community! 
                </p>
                <p>
                  Your contribution helps maintain free AI-powered job analysis for job seekers everywhere.
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="text-center space-y-6">
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <div className="flex items-center justify-center mb-2">
                  <Heart className="w-5 h-5 text-emerald-600 mr-2" />
                  <span className="font-semibold text-emerald-800">Impact</span>
                </div>
                <p className="text-sm text-emerald-700">
                  Your donation goes directly toward AI processing costs, keeping the service free and accessible.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to JobShield
                  </Button>
                </Link>
                
                <Link href="/archive">
                  <Button variant="outline" className="border-sage-300 text-sage-700 hover:bg-sage-50">
                    Browse Community Archive
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}