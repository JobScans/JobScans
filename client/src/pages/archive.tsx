import { Button } from "@/components/ui/button";
import { ArchiveView } from "@/components/archive-view";
import { useLocation } from "wouter";

export default function Archive() {
  const [location, setLocation] = useLocation();

  const handleClose = () => {
    // Check if we came from a results page (has state indicating results)
    const hasResults = sessionStorage.getItem('currentScanResults');
    
    if (hasResults) {
      setLocation("/");
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/");
    }
  };

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-stone-800">Community Archive</h1>
              <p className="text-stone-600 mt-2">Browse job analyses shared by the community to identify problematic postings</p>
            </div>
            <Button 
              onClick={handleClose}
              variant="outline"
              className="text-stone-600 hover:text-stone-800"
            >
              ← Back to Home
            </Button>
          </div>
          
          <ArchiveView onClose={handleClose} />
        </div>
      </div>
    </div>
  );
}