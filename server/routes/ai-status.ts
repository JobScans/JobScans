import type { Express } from "express";
import { getAvailableProviders, getPrimaryProvider } from "../services/ai-service";

export function registerAIStatusRoutes(app: Express) {
  // Get AI provider status
  app.get("/api/ai-status", (req, res) => {
    try {
      const availableProviders = getAvailableProviders();
      const primaryProvider = getPrimaryProvider();
      
      res.json({
        primaryProvider,
        availableProviders,
        isQwenEnabled: availableProviders.includes('Qwen2.5 7B'),
        totalProviders: availableProviders.length
      });
    } catch (error) {
      console.error("Error getting AI status:", error);
      res.status(500).json({ error: "Failed to get AI status" });
    }
  });
}