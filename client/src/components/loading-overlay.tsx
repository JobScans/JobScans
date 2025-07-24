import { Loader2 } from "lucide-react";

export default function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="inline-flex items-center space-x-3 bg-white rounded-lg shadow-lg p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div>
            <p className="text-lg font-medium text-gray-900">Analyzing job posting...</p>
            <p className="text-sm text-gray-500">This may take a few seconds</p>
          </div>
        </div>
      </div>
    </div>
  );
}
