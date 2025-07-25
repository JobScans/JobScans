import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeJobSchema, generateOutreachSchema } from "@shared/schema";
import Stripe from "stripe";
import { registerCacheStatsRoutes } from "./routes/cache-stats";
import { registerAIStatusRoutes } from "./routes/ai-status";
import { registerServiceStatusRoutes } from "./routes/service-status";
import { analyzeJobPosting, generateOutreachMessage } from "./services/ai-service";

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });



  // Register cache statistics routes
  registerCacheStatsRoutes(app);
  
  // Register AI status routes
  registerAIStatusRoutes(app);
  
  // Register enhanced service status routes
  registerServiceStatusRoutes(app);

  // Usage status endpoint (replaces community-fund-status)
  app.get("/api/community-fund-status", async (req, res) => {
    try {
      // Simple API key detection for service mode
      const hasTogetherKey = !!process.env.TOGETHER_API_KEY;
      const hasStripeKeys = !!(process.env.STRIPE_SECRET_KEY && process.env.VITE_STRIPE_PUBLIC_KEY);
      const hasDatabaseUrl = !!process.env.DATABASE_URL;
      
      const serviceMode = hasTogetherKey ? {
        mode: 'full' as const,
        message: 'All features operational',
        features: {
          freshAnalysis: true,
          cacheAnalysis: true,
          outreachGeneration: true,
          archiveAccess: true,
          manualTools: true
        }
      } : {
        mode: 'minimal' as const,
        message: 'AI analysis requires API key configuration',
        features: {
          freshAnalysis: false,
          cacheAnalysis: false,
          outreachGeneration: false,
          archiveAccess: true,
          manualTools: true
        }
      };

      const performance = {
        providerStatus: hasTogetherKey ? 'operational' as const : 'offline' as const,
        consecutiveFailures: 0,
        lastSuccessfulRequest: hasTogetherKey ? new Date().toISOString() : null,
        uptimeToday: hasTogetherKey ? '100%' : '0%'
      };
      
      // Return data in a format compatible with frontend
      res.json({
        currentBalance: 0, // Not tracking real balance
        dailyUsage: 0,
        dailyAnalyses: 0,
        dailyOutreach: 0,
        weeklyAnalyses: 0,
        cacheHitRate: '0%',
        avgResponseTime: '0ms',
        
        costTransparency: {
          analysisCost: 0.006,
          outreachCost: 0.003,
          estimatedDailyCost: 0,
          estimatedWeeklyCost: 0
        },
        donationMetrics: {
          dailyDonations: 0,
          totalDonated: 0,
          lastDonationTime: null
        },
        performance,
        serviceMode,
        
        status: performance.providerStatus === 'operational' ? 'healthy' : 'critical',
        daysRemaining: 0,
        weeklyTrend: 0,
        
        note: hasTogetherKey ? "AI analysis operational" : "API key required for AI features",
        debug: {
          hasTogetherKey,
          hasStripeKeys,
          hasDatabaseUrl
        }
      });
    } catch (error) {
      console.error('Error fetching usage status:', error);
      res.status(500).json({ 
        error: "Failed to fetch usage status",
        note: "Internal server error"
      });
    }
  });

  // Analyze job posting
  app.post("/api/analyze-job", async (req, res) => {
    try {
      const { jobDescription, jobUrl } = analyzeJobSchema.parse(req.body);
      
      let inputText = jobDescription || "";
      let extractedData = null;
      
      // If URL provided, try to extract job data
      if (jobUrl && !jobDescription) {
        try {
          const { JobURLParser } = await import("./services/url-parser");
          extractedData = await JobURLParser.extractJobFromURL(jobUrl);
          if (extractedData) {
            inputText = `Job Title: ${extractedData.jobTitle}\nCompany: ${extractedData.company}\n\nDescription:\n${extractedData.description}`;
          } else {
            inputText = jobUrl; // Fallback to analyzing the URL itself
          }
        } catch (urlError) {
          console.log("URL parsing failed, using URL as input:", (urlError as Error).message);
          inputText = jobUrl;
        }
      }
      
      if (!inputText.trim()) {
        return res.status(400).json({ error: "Job description or URL is required" });
      }

      // Check cache first to save AI costs
      const { JobCacheService } = await import("./services/cache-service");
      
      // Extract job metadata for cache checking
      const jobTitle = extractedData?.jobTitle || "Unknown Position";
      const company = extractedData?.company || "Unknown Company";
      
      const cacheResult = await JobCacheService.checkCache(inputText, jobTitle, company, storage);
      
      let analysis;
      let analysisSource = "fresh";
      let cacheMessage = "";
      
      if (cacheResult.type === 'exact') {
        // Use exact cached result
        analysis = {
          jobTitle: cacheResult.scan!.jobTitle,
          company: cacheResult.scan!.company,
          ghostLikelihoodScore: cacheResult.scan!.ghostLikelihoodScore,
          ghostLikelihoodLevel: cacheResult.scan!.ghostLikelihoodLevel,
          redFlags: cacheResult.scan!.redFlags,
          aiSummary: cacheResult.scan!.aiSummary,
          confidenceExplanation: cacheResult.scan!.confidenceExplanation
        };
        analysisSource = "exact_cache";
        cacheMessage = cacheResult.message || "";
        console.log("Cache HIT (exact):", cacheMessage);
      } else if (cacheResult.type === 'similar') {
        // Use similar cached result with note
        analysis = {
          jobTitle: cacheResult.scan!.jobTitle,
          company: cacheResult.scan!.company,
          ghostLikelihoodScore: cacheResult.scan!.ghostLikelihoodScore,
          ghostLikelihoodLevel: cacheResult.scan!.ghostLikelihoodLevel,
          redFlags: cacheResult.scan!.redFlags,
          aiSummary: `${cacheResult.scan!.aiSummary}\n\n[Note: This analysis is based on a similar job posting analyzed recently]`,
          confidenceExplanation: cacheResult.scan!.confidenceExplanation
        };
        analysisSource = "similar_cache";
        cacheMessage = cacheResult.message || "";
        console.log("Cache HIT (similar):", cacheMessage);
      } else {
        // No cache hit, perform fresh AI analysis with new unified service
        const analysisResult = await analyzeJobPosting(inputText);
        analysis = analysisResult.analysis;
        
        // Record successful request for performance tracking
        const { UsageTracker } = await import("./services/fund-manager");
        UsageTracker.recordSuccessfulRequest();
        
        console.log(`Cache MISS - Fresh AI analysis performed with ${analysisResult.provider} (cost: $${analysisResult.cost})`);
      }
      
      // Store the analysis result with cache metadata
      const contentHash = JobCacheService.generateContentHash(inputText);
      const contentFingerprint = JobCacheService.generateContentFingerprint(inputText);
      const cacheExpiration = JobCacheService.getCacheExpiration(7); // 7 days cache
      
      const scan = await storage.createJobScan({
        jobTitle: analysis.jobTitle,
        company: analysis.company,
        originalUrl: jobUrl || "",
        originalDescription: inputText,
        contentHash,
        contentFingerprint,
        ghostLikelihoodScore: analysis.ghostLikelihoodScore,
        ghostLikelihoodLevel: analysis.ghostLikelihoodLevel,
        redFlags: analysis.redFlags,
        aiSummary: analysis.aiSummary,
        confidenceExplanation: analysis.confidenceExplanation,
        cacheExpiresAt: cacheExpiration,
        analysisSource
      });

      res.json({ scanId: scan.id, ...scan });
    } catch (error) {
      console.error("Error analyzing job:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to analyze job posting" });
      }
    }
  });

  // Get recent scans
  app.get("/api/scans", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const scans = await storage.getRecentJobScans(limit);
      res.json(scans);
    } catch (error) {
      console.error("Error fetching scans:", error);
      res.status(500).json({ error: "Failed to fetch scans" });
    }
  });

  // Get specific scan
  app.get("/api/scan/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid scan ID" });
      }

      const scan = await storage.getJobScan(id);
      if (!scan) {
        return res.status(404).json({ error: "Scan not found" });
      }

      res.json({ scanId: scan.id, ...scan });
    } catch (error) {
      console.error("Error fetching scan:", error);
      res.status(500).json({ error: "Failed to fetch scan" });
    }
  });

  // Get archived scans (public high-risk job analyses) with pagination
  app.get("/api/archive", async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50); // Max 50 per page
      const offset = parseInt(req.query.offset as string) || 0;
      
      const [archivedScans, totalCount] = await Promise.all([
        storage.getArchivedJobScans(limit, offset),
        storage.getArchivedJobScansCount()
      ]);
      
      res.json({
        scans: archivedScans,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      });
    } catch (error) {
      console.error("Error fetching archive:", error);
      res.status(500).json({ error: "Failed to fetch archive" });
    }
  });

  // Share scan to archive
  app.post("/api/scan/:id/share", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid scan ID" });
      }

      const scan = await storage.getJobScan(id);
      if (!scan) {
        return res.status(404).json({ error: "Scan not found" });
      }

      // Only share high-risk scans to prevent archive spam
      if (scan.ghostLikelihoodScore < 70) {
        return res.status(400).json({ error: "Only high-risk job postings can be shared to archive" });
      }

      const success = await storage.shareJobScanToArchive(id);
      if (!success) {
        return res.status(500).json({ error: "Failed to share scan to archive" });
      }

      res.json({ message: "Scan shared to archive successfully" });
    } catch (error) {
      console.error("Error sharing scan:", error);
      res.status(500).json({ error: "Failed to share scan to archive" });
    }
  });

  // Generate outreach message
  app.post("/api/generate-outreach", async (req, res) => {
    try {
      const { scanId, messageType } = generateOutreachSchema.parse(req.body);
      
      const scan = await storage.getJobScan(scanId);
      if (!scan) {
        return res.status(404).json({ error: "Scan not found" });
      }

      // Generate outreach message using new unified AI service
      const outreachResult = await generateOutreachMessage(
        scan.originalDescription,
        scan,
        undefined // No user profile for now
      );

      // Store the outreach message with AI cost tracking
      const aiCost = outreachResult.cost;
      await storage.createOutreachMessage({
        scanId,
        message: outreachResult.message,
        messageType: messageType || "linkedin",
        aiCost
      });

      // Record successful request for performance tracking
      const { UsageTracker } = await import("./services/fund-manager");
      UsageTracker.recordSuccessfulRequest();
      
      console.log(`Outreach generated with ${outreachResult.provider} (cost: $${outreachResult.cost})`);

      // Return just the message text for the modal
      res.json({ message: outreachResult.message });
    } catch (error) {
      console.error("Error generating outreach:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to generate outreach message" });
      }
    }
  });

  // Get outreach messages for a scan
  app.get("/api/scan/:id/outreach", async (req, res) => {
    try {
      const scanId = parseInt(req.params.id);
      if (isNaN(scanId)) {
        return res.status(400).json({ error: "Invalid scan ID" });
      }

      const messages = await storage.getOutreachMessagesByScanId(scanId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching outreach messages:", error);
      res.status(500).json({ error: "Failed to fetch outreach messages" });
    }
  });

  // Create donation payment intent
  app.post("/api/create-donation-intent", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ error: "Stripe not configured" });
      }

      const { amount } = req.body;
      
      if (!amount || amount < 1) {
        return res.status(400).json({ error: "Invalid donation amount" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          type: "community_fund_donation",
          amount: amount.toString(),
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating donation intent:", error);
      res.status(500).json({ error: "Failed to create donation intent: " + error.message });
    }
  });

  // Stripe webhook for donation processing
  app.post("/api/stripe-webhook", async (req, res) => {
    try {
      if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(500).json({ error: "Stripe webhook not configured" });
      }

      const sig = req.headers['stripe-signature'] as string;
      let event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } catch (err: any) {
        console.error(`Webhook signature verification failed:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle successful payment
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        
        if (paymentIntent.metadata?.type === 'community_fund_donation') {
          const amount = parseFloat(paymentIntent.metadata.amount);
          
          // Record donation for transparency tracking
          const { UsageTracker } = await import("./services/fund-manager");
          UsageTracker.recordDonation(amount);
          
          console.log(`Community fund donation received: $${amount}`);
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
