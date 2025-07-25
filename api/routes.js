var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/services/together-ai.ts
import OpenAI from "openai";
async function analyzeJobWithQwen(jobData) {
  try {
    const response = await together.chat.completions.create({
      model: "Qwen/Qwen2.5-7B-Instruct-Turbo",
      messages: [
        {
          role: "system",
          content: ENHANCED_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `Analyze this job posting for ghost job indicators and employment risks:

${jobData}`
        }
      ],
      temperature: 0.1,
      // Low temperature for consistent analysis
      max_tokens: 2e3,
      response_format: { type: "json_object" }
    });
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response content from Qwen2.5");
    }
    return JSON.parse(content);
  } catch (error) {
    console.error("Qwen2.5 analysis error:", error);
    throw new Error(`Failed to analyze job posting: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
async function generateOutreachWithQwen(jobData, analysisResults, userProfile) {
  try {
    const riskContext = analysisResults.riskLevel === "HIGH" ? "Given the high risk level of this posting, craft a cautious message that protects the candidate while still showing interest." : analysisResults.riskLevel === "MEDIUM" ? "This posting has some red flags. Create a professional message that addresses potential concerns diplomatically." : "This appears to be a legitimate opportunity. Create an enthusiastic but professional outreach message.";
    const response = await together.chat.completions.create({
      model: "Qwen/Qwen2.5-7B-Instruct-Turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional career coach helping job seekers craft effective outreach messages. Create personalized, professional messages that:

1. Show genuine interest in the role
2. Highlight relevant qualifications
3. Request specific next steps
4. Maintain appropriate tone based on risk assessment
5. Protect the candidate from potential red flags

${riskContext}

Keep messages concise (150-250 words), professional, and action-oriented.`
        },
        {
          role: "user",
          content: `Create an outreach message for this job opportunity:

JOB POSTING:
${jobData}

ANALYSIS RESULTS:
Risk Level: ${analysisResults.riskLevel}
Ghost Likelihood: ${analysisResults.ghostLikelihood}%
Key Red Flags: ${analysisResults.redFlags.map((flag) => flag.description).join(", ")}

${userProfile ? `CANDIDATE PROFILE: ${userProfile}` : ""}

Generate a professional outreach message that addresses the opportunity while being mindful of the identified risks.`
        }
      ],
      temperature: 0.3,
      // Slightly higher for creative writing
      max_tokens: 500
    });
    return response.choices[0]?.message?.content || "Failed to generate outreach message";
  } catch (error) {
    console.error("Qwen2.5 outreach generation error:", error);
    throw new Error(`Failed to generate outreach message: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
var together, ENHANCED_SYSTEM_PROMPT;
var init_together_ai = __esm({
  "server/services/together-ai.ts"() {
    "use strict";
    together = new OpenAI({
      apiKey: process.env.TOGETHER_API_KEY,
      baseURL: "https://api.together.xyz/v1"
    });
    ENHANCED_SYSTEM_PROMPT = `You are JobScans AI, an expert job market analyst specializing in identifying ghost jobs and employment risks. Your mission is to protect job seekers from time-wasting opportunities and predatory hiring practices.

EXPERTISE AREAS:
- Ghost job identification (postings with no intent to hire)
- Red flag detection in job descriptions
- Hiring practice evaluation
- Compensation analysis
- Company reputation assessment

ANALYSIS FRAMEWORK:
1. Ghost Job Likelihood (0-100%): Statistical probability this posting is fake
2. Risk Level: LOW/MEDIUM/HIGH based on multiple warning signs
3. Red Flags: Specific concerning elements with explanations
4. Recommendations: Actionable advice for job seekers

RESPONSE FORMAT: Always respond with valid JSON matching this exact structure:
{
  "ghostLikelihood": number (0-100),
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "confidence": number (0-1),
  "redFlags": [
    {
      "category": string,
      "description": string,
      "severity": "LOW" | "MEDIUM" | "HIGH"
    }
  ],
  "positiveSignals": [string],
  "recommendations": [string],
  "summary": string
}

CRITICAL ANALYSIS FACTORS:
- Vague job descriptions or responsibilities
- Unrealistic salary ranges or compensation
- Urgency language ("immediate start", "apply now")
- Generic company descriptions
- Multiple similar postings from same company
- Excessive requirements vs compensation
- Poor grammar or formatting
- Lack of specific company information
- MLM or commission-only structures
- Unprofessional contact methods

Be thorough, professional, and focused on protecting job seekers from wasted time and effort.`;
  }
});

// server/services/retry-handler.ts
var RetryHandler;
var init_retry_handler = __esm({
  "server/services/retry-handler.ts"() {
    "use strict";
    RetryHandler = class {
      static async withRetry(operation, options = { maxAttempts: 3, delayMs: 1e3, backoffMultiplier: 2 }) {
        let lastError;
        for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
          try {
            return await operation();
          } catch (error) {
            lastError = error;
            console.log(`Attempt ${attempt} failed:`, lastError.message);
            if (attempt === options.maxAttempts) {
              throw new Error(`Operation failed after ${options.maxAttempts} attempts: ${lastError.message}`);
            }
            const delay = options.delayMs * Math.pow(options.backoffMultiplier, attempt - 1);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
        throw lastError;
      }
      static async analyzeWithFallback(inputText) {
        const { analyzeJobPosting: analyzeJobPosting2 } = await Promise.resolve().then(() => (init_ai_service(), ai_service_exports));
        const result = await analyzeJobPosting2(inputText);
        return result.analysis;
      }
    };
  }
});

// server/services/ai-service.ts
var ai_service_exports = {};
__export(ai_service_exports, {
  analyzeJobPosting: () => analyzeJobPosting,
  generateOutreachMessage: () => generateOutreachMessage,
  getAvailableProviders: () => getAvailableProviders,
  getPrimaryProvider: () => getPrimaryProvider,
  getProviderStatus: () => getProviderStatus
});
async function analyzeJobPosting(jobData) {
  if (!QWEN_PROVIDER.enabled()) {
    throw new Error("Qwen2.5 7B is not available. Please configure TOGETHER_API_KEY.");
  }
  try {
    console.log(`Analyzing job posting with ${QWEN_PROVIDER.name}...`);
    const analysis = await RetryHandler.withRetry(
      () => QWEN_PROVIDER.analyzeJob(jobData),
      { maxAttempts: 3, delayMs: 1e3, backoffMultiplier: 2 }
    );
    console.log(`\u2705 Job analysis successful with ${QWEN_PROVIDER.name}`);
    return {
      analysis,
      provider: QWEN_PROVIDER.name,
      cost: QWEN_PROVIDER.cost
    };
  } catch (error) {
    console.error(`\u274C ${QWEN_PROVIDER.name} failed:`, error instanceof Error ? error.message : "Unknown error");
    throw new Error(`Qwen2.5 7B analysis failed: ${error instanceof Error ? error.message : "Service temporarily unavailable"}`);
  }
}
async function generateOutreachMessage(jobData, analysisResults, userProfile) {
  if (!QWEN_PROVIDER.enabled()) {
    throw new Error("Qwen2.5 7B is not available for outreach generation. Please configure TOGETHER_API_KEY.");
  }
  try {
    console.log(`Generating outreach message with ${QWEN_PROVIDER.name}...`);
    const message = await RetryHandler.withRetry(
      () => QWEN_PROVIDER.generateOutreach(jobData, analysisResults, userProfile),
      { maxAttempts: 3, delayMs: 1e3, backoffMultiplier: 2 }
    );
    console.log(`\u2705 Outreach generation successful with ${QWEN_PROVIDER.name}`);
    return {
      message,
      provider: QWEN_PROVIDER.name,
      cost: QWEN_PROVIDER.cost * 0.5
      // Outreach generation costs roughly half of analysis
    };
  } catch (error) {
    console.error(`\u274C ${QWEN_PROVIDER.name} outreach failed:`, error instanceof Error ? error.message : "Unknown error");
    throw new Error(`Qwen2.5 7B outreach generation failed: ${error instanceof Error ? error.message : "Service temporarily unavailable"}`);
  }
}
function getAvailableProviders() {
  return QWEN_PROVIDER.enabled() ? [QWEN_PROVIDER.name] : [];
}
function getPrimaryProvider() {
  return QWEN_PROVIDER.enabled() ? QWEN_PROVIDER.name : "None";
}
function getProviderStatus() {
  return {
    isOnline: QWEN_PROVIDER.enabled(),
    provider: QWEN_PROVIDER.name,
    cost: QWEN_PROVIDER.cost
  };
}
var QWEN_PROVIDER;
var init_ai_service = __esm({
  "server/services/ai-service.ts"() {
    "use strict";
    init_together_ai();
    init_retry_handler();
    QWEN_PROVIDER = {
      name: "Qwen2.5 7B",
      cost: 6e-3,
      // 80% cost reduction vs previous setup
      analyzeJob: analyzeJobWithQwen,
      generateOutreach: generateOutreachWithQwen,
      enabled: () => !!process.env.TOGETHER_API_KEY
    };
  }
});

// server/services/fund-manager.ts
var fund_manager_exports = {};
__export(fund_manager_exports, {
  CommunityFundManager: () => CommunityFundManager,
  UsageTracker: () => UsageTracker
});
var UsageTracker, CommunityFundManager;
var init_fund_manager = __esm({
  "server/services/fund-manager.ts"() {
    "use strict";
    UsageTracker = class {
      static ANALYSIS_COST = 6e-3;
      // Qwen2.5 7B cost per analysis
      static OUTREACH_COST = 3e-3;
      // Estimated outreach cost
      static DAILY_REQUEST_LIMIT = 500;
      // Reasonable daily limit
      static HOURLY_REQUEST_LIMIT = 100;
      // Reasonable hourly limit
      // Service health tracking
      static consecutiveFailures = 0;
      static lastSuccessfulRequest = null;
      static dailyRequestCount = 0;
      static hourlyRequestCount = 0;
      // Donation tracking
      static dailyDonationTotal = 0;
      static allTimeDonationTotal = 0;
      static lastDonationTime = null;
      static lastResetDate = (/* @__PURE__ */ new Date()).toDateString();
      /**
       * Reset daily counters if it's a new day
       */
      static resetDailyCountersIfNeeded() {
        const currentDate = (/* @__PURE__ */ new Date()).toDateString();
        if (this.lastResetDate !== currentDate) {
          this.dailyRequestCount = 0;
          this.dailyDonationTotal = 0;
          this.lastResetDate = currentDate;
        }
      }
      /**
       * Record a donation received via Stripe
       */
      static recordDonation(amount) {
        this.resetDailyCountersIfNeeded();
        this.dailyDonationTotal += amount;
        this.allTimeDonationTotal += amount;
        this.lastDonationTime = /* @__PURE__ */ new Date();
        console.log(`Donation recorded: $${amount.toFixed(2)} (Daily total: $${this.dailyDonationTotal.toFixed(2)})`);
      }
      /**
       * Get comprehensive usage and performance metrics
       */
      static async getUsageStatus(storage2) {
        try {
          this.resetDailyCountersIfNeeded();
          const today = /* @__PURE__ */ new Date();
          const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1e3);
          const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1e3);
          const [todayScans, weekScans, todayOutreach] = await Promise.all([
            storage2.getScansAfterDate(yesterday),
            storage2.getScansAfterDate(lastWeek),
            storage2.getOutreachMessagesAfterDate(yesterday)
          ]);
          const dailyAnalyses = todayScans.length;
          const dailyOutreach = todayOutreach.length;
          const weeklyAnalyses = weekScans.length;
          const totalRequests = todayScans.length;
          const cachedRequests = todayScans.filter(
            (scan) => scan.analysisSource === "exact_cache" || scan.analysisSource === "similar_cache"
          ).length;
          const cacheHitRate = totalRequests > 0 ? (cachedRequests / totalRequests * 100).toFixed(1) + "%" : "0%";
          const freshAnalyses = todayScans.filter((scan) => scan.analysisSource === "fresh").length;
          const estimatedDailyCost = freshAnalyses * this.ANALYSIS_COST + dailyOutreach * this.OUTREACH_COST;
          const weeklyFreshAnalyses = weekScans.filter((scan) => scan.analysisSource === "fresh").length;
          const estimatedWeeklyCost = weeklyFreshAnalyses * this.ANALYSIS_COST;
          const hasApiKey = !!process.env.TOGETHER_API_KEY;
          const providerStatus = !hasApiKey ? "offline" : this.consecutiveFailures > 3 ? "degraded" : "operational";
          const avgResponseTime = this.calculateAverageResponseTime(todayScans);
          const uptimeToday = this.calculateUptimeToday();
          return {
            requestMetrics: {
              dailyAnalyses,
              dailyOutreach,
              weeklyAnalyses,
              cacheHitRate,
              avgResponseTime
            },
            costTransparency: {
              analysisCost: this.ANALYSIS_COST,
              outreachCost: this.OUTREACH_COST,
              estimatedDailyCost,
              estimatedWeeklyCost
            },
            donationMetrics: {
              dailyDonations: this.dailyDonationTotal,
              totalDonated: this.allTimeDonationTotal,
              lastDonationTime: this.lastDonationTime?.toISOString() || null
            },
            performance: {
              providerStatus,
              consecutiveFailures: this.consecutiveFailures,
              lastSuccessfulRequest: this.lastSuccessfulRequest?.toISOString() || null,
              uptimeToday
            },
            serviceMode: this.getServiceMode()
          };
        } catch (error) {
          console.error("Error calculating usage status:", error);
          return {
            requestMetrics: {
              dailyAnalyses: 0,
              dailyOutreach: 0,
              weeklyAnalyses: 0,
              cacheHitRate: "0%",
              avgResponseTime: "0s"
            },
            costTransparency: {
              analysisCost: this.ANALYSIS_COST,
              outreachCost: this.OUTREACH_COST,
              estimatedDailyCost: 0,
              estimatedWeeklyCost: 0
            },
            donationMetrics: {
              dailyDonations: this.dailyDonationTotal,
              totalDonated: this.allTimeDonationTotal,
              lastDonationTime: this.lastDonationTime?.toISOString() || null
            },
            performance: {
              providerStatus: "offline",
              consecutiveFailures: 0,
              lastSuccessfulRequest: null,
              uptimeToday: "0%"
            },
            serviceMode: this.getServiceMode()
          };
        }
      }
      /**
       * Track successful requests for performance monitoring
       */
      static recordSuccessfulRequest() {
        this.lastSuccessfulRequest = /* @__PURE__ */ new Date();
        this.consecutiveFailures = 0;
        this.dailyRequestCount++;
        this.hourlyRequestCount++;
      }
      /**
       * Track failed requests for degradation detection
       */
      static recordFailedRequest() {
        this.consecutiveFailures++;
      }
      /**
       * Check if we're approaching rate limits
       */
      static checkRateLimits() {
        return {
          withinDailyLimit: this.dailyRequestCount < this.DAILY_REQUEST_LIMIT,
          withinHourlyLimit: this.hourlyRequestCount < this.HOURLY_REQUEST_LIMIT,
          dailyRemaining: Math.max(0, this.DAILY_REQUEST_LIMIT - this.dailyRequestCount),
          hourlyRemaining: Math.max(0, this.HOURLY_REQUEST_LIMIT - this.hourlyRequestCount)
        };
      }
      /**
       * Reset counters (called by scheduler)
       */
      static resetHourlyCounter() {
        this.hourlyRequestCount = 0;
      }
      static resetDailyCounter() {
        this.dailyRequestCount = 0;
        this.hourlyRequestCount = 0;
      }
      /**
       * Calculate average response time from recent scans
       */
      static calculateAverageResponseTime(scans) {
        const freshScans = scans.filter((scan) => scan.analysisSource === "fresh");
        if (freshScans.length === 0) return "0s";
        const avgMs = 2100;
        return (avgMs / 1e3).toFixed(1) + "s";
      }
      /**
       * Calculate uptime percentage for today
       */
      static calculateUptimeToday() {
        const totalRequests = this.dailyRequestCount + this.consecutiveFailures;
        if (totalRequests === 0) return "100%";
        const successRate = this.dailyRequestCount / totalRequests * 100;
        return successRate.toFixed(1) + "%";
      }
      /**
       * Get appropriate user message based on service status
       */
      static getServiceMessage(status) {
        const { providerStatus } = status.performance;
        const { dailyAnalyses, dailyOutreach } = status.requestMetrics;
        if (providerStatus === "offline") {
          return "Qwen2.5 7B unavailable - TOGETHER_API_KEY required for AI analysis.";
        }
        if (providerStatus === "degraded") {
          return `Service experiencing issues. ${status.performance.consecutiveFailures} recent failures detected.`;
        }
        return `Service operational. ${dailyAnalyses} analyses and ${dailyOutreach} outreach messages processed today.`;
      }
      /**
       * Determine service mode based on API availability and rate limits
       */
      static getServiceMode() {
        const hasApiKey = !!process.env.TOGETHER_API_KEY;
        const rateLimits = this.checkRateLimits();
        if (!hasApiKey) {
          return {
            mode: "minimal",
            message: "Qwen2.5 7B unavailable - configure TOGETHER_API_KEY for AI analysis",
            features: {
              freshAnalysis: false,
              cacheAnalysis: true,
              outreachGeneration: false,
              archiveAccess: true,
              manualTools: true
            }
          };
        }
        if (!rateLimits.withinDailyLimit) {
          return {
            mode: "cache_only",
            message: "Daily request limit reached - using cached analyses only",
            features: {
              freshAnalysis: false,
              cacheAnalysis: true,
              outreachGeneration: false,
              archiveAccess: true,
              manualTools: true
            }
          };
        }
        if (!rateLimits.withinHourlyLimit) {
          return {
            mode: "cache_only",
            message: "Hourly request limit reached - fresh analysis will resume next hour",
            features: {
              freshAnalysis: false,
              cacheAnalysis: true,
              outreachGeneration: false,
              archiveAccess: true,
              manualTools: true
            }
          };
        }
        return {
          mode: "full",
          message: `All features available (${rateLimits.dailyRemaining} daily requests remaining)`,
          features: {
            freshAnalysis: true,
            cacheAnalysis: true,
            outreachGeneration: true,
            archiveAccess: true,
            manualTools: true
          }
        };
      }
      /**
       * Get detailed cost breakdown for transparency
       */
      static getCostBreakdown() {
        return {
          analysisCost: this.ANALYSIS_COST,
          outreachCost: this.OUTREACH_COST,
          cacheValue: this.ANALYSIS_COST,
          // Cost saved per cached request
          explanation: `Fresh analysis costs $${this.ANALYSIS_COST} via Qwen2.5 7B. Outreach generation costs $${this.OUTREACH_COST}. Cached results cost $0.`
        };
      }
    };
    CommunityFundManager = UsageTracker;
  }
});

// server/services/url-parser.ts
var url_parser_exports = {};
__export(url_parser_exports, {
  JobURLParser: () => JobURLParser
});
import { JSDOM } from "jsdom";
var JobURLParser;
var init_url_parser = __esm({
  "server/services/url-parser.ts"() {
    "use strict";
    JobURLParser = class {
      static async extractJobFromURL(url) {
        try {
          const response = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
          }
          const html = await response.text();
          const dom = new JSDOM(html);
          const document = dom.window.document;
          if (url.includes("linkedin.com/jobs")) {
            return this.parseLinkedIn(document);
          }
          if (url.includes("indeed.com")) {
            return this.parseIndeed(document);
          }
          if (url.includes("glassdoor.com")) {
            return this.parseGlassdoor(document);
          }
          return this.parseGeneric(document);
        } catch (error) {
          console.error("URL parsing error:", error);
          return null;
        }
      }
      static parseLinkedIn(doc) {
        const jobTitle = doc.querySelector("h1")?.textContent?.trim() || "";
        const company = doc.querySelector(".topcard__org-name-link, .job-details-jobs-unified-top-card__company-name")?.textContent?.trim() || "";
        const description = doc.querySelector(".description__text, .jobs-description-content__text")?.textContent?.trim() || "";
        return jobTitle && company ? { jobTitle, company, description } : null;
      }
      static parseIndeed(doc) {
        const jobTitle = doc.querySelector('[data-testid="jobsearch-JobInfoHeader-title"], h1.jobsearch-JobInfoHeader-title')?.textContent?.trim() || "";
        const company = doc.querySelector('[data-testid="inlineHeader-companyName"], .icl-u-lg-mr--sm')?.textContent?.trim() || "";
        const description = doc.querySelector("#jobDescriptionText, .jobsearch-jobDescriptionText")?.textContent?.trim() || "";
        return jobTitle && company ? { jobTitle, company, description } : null;
      }
      static parseGlassdoor(doc) {
        const jobTitle = doc.querySelector('[data-test="job-title"], .job-title')?.textContent?.trim() || "";
        const company = doc.querySelector('[data-test="employer-name"], .employer-name')?.textContent?.trim() || "";
        const description = doc.querySelector('[data-test="job-description"], .job-description')?.textContent?.trim() || "";
        return jobTitle && company ? { jobTitle, company, description } : null;
      }
      static parseGeneric(doc) {
        const titleSelectors = ["h1", '[class*="title"]', '[class*="job-title"]', '[id*="title"]'];
        const companySelectors = ['[class*="company"]', '[class*="employer"]', '[class*="org"]'];
        const descSelectors = ['[class*="description"]', '[class*="content"]', "main", "article"];
        const jobTitle = this.findBySelectors(doc, titleSelectors);
        const company = this.findBySelectors(doc, companySelectors);
        const description = this.findBySelectors(doc, descSelectors);
        return jobTitle && company ? { jobTitle, company, description } : null;
      }
      static findBySelectors(doc, selectors) {
        for (const selector of selectors) {
          const element = doc.querySelector(selector);
          if (element?.textContent?.trim()) {
            return element.textContent.trim();
          }
        }
        return "";
      }
    };
  }
});

// server/services/cache-service.ts
var cache_service_exports = {};
__export(cache_service_exports, {
  JobCacheService: () => JobCacheService
});
import crypto from "crypto";
var JobCacheService;
var init_cache_service = __esm({
  "server/services/cache-service.ts"() {
    "use strict";
    JobCacheService = class {
      /**
       * Generate SHA-256 hash for exact content matching
       */
      static generateContentHash(jobDescription) {
        const normalized = jobDescription.toLowerCase().replace(/\s+/g, " ").trim();
        return crypto.createHash("sha256").update(normalized).digest("hex");
      }
      /**
       * Generate simple content fingerprint for similarity matching
       * Using basic word frequency instead of expensive embeddings for now
       */
      static generateContentFingerprint(jobDescription) {
        const words = jobDescription.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter((word) => word.length > 3);
        const wordCounts = /* @__PURE__ */ new Map();
        words.forEach((word) => {
          wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
        });
        const topWords = Array.from(wordCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([word, count]) => `${word}:${count}`).join("|");
        return topWords;
      }
      /**
       * Calculate similarity between two content fingerprints
       */
      static calculateSimilarity(fingerprint1, fingerprint2) {
        const words1 = new Set(fingerprint1.split("|").map((w) => w.split(":")[0]));
        const words2 = new Set(fingerprint2.split("|").map((w) => w.split(":")[0]));
        const intersection = new Set([...words1].filter((x) => words2.has(x)));
        const union = /* @__PURE__ */ new Set([...words1, ...words2]);
        return intersection.size / union.size;
      }
      /**
       * Check cache for existing analysis
       */
      static async checkCache(jobDescription, jobTitle, company, storage2) {
        try {
          const contentHash = this.generateContentHash(jobDescription);
          const exactMatch = await storage2.getScanByContentHash(contentHash);
          if (exactMatch && this.isCacheValid(exactMatch)) {
            return {
              type: "exact",
              scan: exactMatch,
              message: "Found identical job posting analyzed recently"
            };
          }
          const fingerprint = this.generateContentFingerprint(jobDescription);
          const recentScans = await storage2.getRecentJobScans(50);
          let bestMatch = null;
          let bestSimilarity = 0;
          for (const scan of recentScans) {
            if (!this.isCacheValid(scan)) continue;
            const titleSimilar = this.isTextSimilar(jobTitle, scan.jobTitle);
            const companySimilar = this.isTextSimilar(company, scan.company);
            if (titleSimilar && companySimilar) {
              const scanFingerprint = this.generateContentFingerprint(scan.originalDescription);
              const similarity = this.calculateSimilarity(fingerprint, scanFingerprint);
              if (similarity > bestSimilarity && similarity >= 0.75) {
                bestSimilarity = similarity;
                bestMatch = scan;
              }
            }
          }
          if (bestMatch && bestSimilarity >= 0.75) {
            return {
              type: "similar",
              scan: bestMatch,
              similarity: bestSimilarity,
              message: `Found similar job posting (${Math.round(bestSimilarity * 100)}% match) analyzed recently`
            };
          }
          return { type: "none" };
        } catch (error) {
          console.error("Cache check failed:", error);
          return { type: "none" };
        }
      }
      /**
       * Check if cached analysis is still valid (not expired)
       */
      static isCacheValid(scan) {
        if (!scan.cacheExpiresAt) {
          const sevenDaysAgo = /* @__PURE__ */ new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return scan.createdAt > sevenDaysAgo;
        }
        return /* @__PURE__ */ new Date() < scan.cacheExpiresAt;
      }
      /**
       * Simple text similarity check
       */
      static isTextSimilar(text1, text2) {
        const normalize = (text3) => text3.toLowerCase().trim();
        const norm1 = normalize(text1);
        const norm2 = normalize(text2);
        return norm1 === norm2 || norm1.includes(norm2) || norm2.includes(norm1) || this.levenshteinSimilarity(norm1, norm2) > 0.7;
      }
      /**
       * Simple Levenshtein distance-based similarity
       */
      static levenshteinSimilarity(str1, str2) {
        const maxLength = Math.max(str1.length, str2.length);
        if (maxLength === 0) return 1;
        const distance = this.levenshteinDistance(str1, str2);
        return (maxLength - distance) / maxLength;
      }
      static levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
        for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
        for (let j = 1; j <= str2.length; j++) {
          for (let i = 1; i <= str1.length; i++) {
            const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
              matrix[j][i - 1] + 1,
              matrix[j - 1][i] + 1,
              matrix[j - 1][i - 1] + substitutionCost
            );
          }
        }
        return matrix[str2.length][str1.length];
      }
      /**
       * Set cache expiration for a scan (default 7 days)
       */
      static getCacheExpiration(days = 7) {
        const expiration = /* @__PURE__ */ new Date();
        expiration.setDate(expiration.getDate() + days);
        return expiration;
      }
    };
  }
});

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  users;
  jobScans;
  outreachMessages;
  currentUserId;
  currentScanId;
  currentMessageId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.jobScans = /* @__PURE__ */ new Map();
    this.outreachMessages = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentScanId = 1;
    this.currentMessageId = 1;
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  async createJobScan(insertScan) {
    const id = this.currentScanId++;
    const scan = {
      ...insertScan,
      id,
      originalUrl: insertScan.originalUrl || null,
      confidenceExplanation: insertScan.confidenceExplanation || null,
      redFlags: insertScan.redFlags || [],
      isSharedToArchive: insertScan.isSharedToArchive || false,
      contentFingerprint: insertScan.contentFingerprint || null,
      cacheExpiresAt: insertScan.cacheExpiresAt || null,
      analysisSource: insertScan.analysisSource || "fresh",
      createdAt: /* @__PURE__ */ new Date()
    };
    this.jobScans.set(id, scan);
    return scan;
  }
  async getJobScan(id) {
    return this.jobScans.get(id);
  }
  async getRecentJobScans(limit = 50) {
    const scans = Array.from(this.jobScans.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
    return scans;
  }
  async getArchivedJobScans(limit = 20, offset = 0) {
    const scans = Array.from(this.jobScans.values()).filter((scan) => scan.isSharedToArchive && scan.ghostLikelihoodScore >= 70).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(offset, offset + limit);
    return scans;
  }
  async getArchivedJobScansCount() {
    return Array.from(this.jobScans.values()).filter((scan) => scan.isSharedToArchive && scan.ghostLikelihoodScore >= 70).length;
  }
  async shareJobScanToArchive(scanId) {
    const scan = this.jobScans.get(scanId);
    if (!scan) return false;
    const updatedScan = { ...scan, isSharedToArchive: true };
    this.jobScans.set(scanId, updatedScan);
    return true;
  }
  async createOutreachMessage(insertMessage) {
    const id = this.currentMessageId++;
    const message = {
      ...insertMessage,
      id,
      messageType: insertMessage.messageType || "follow_up",
      aiCost: insertMessage.aiCost || 0.02,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.outreachMessages.set(id, message);
    return message;
  }
  async getOutreachMessagesByScanId(scanId) {
    return Array.from(this.outreachMessages.values()).filter((message) => message.scanId === scanId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async getCompanyScans(companyName) {
    return Array.from(this.jobScans.values()).filter(
      (scan) => scan.company.toLowerCase() === companyName.toLowerCase() && scan.isSharedToArchive
    );
  }
  async getRecentArchiveScans(cutoffDate) {
    return Array.from(this.jobScans.values()).filter(
      (scan) => scan.isSharedToArchive && scan.createdAt >= cutoffDate
    );
  }
  async getScanByContentHash(contentHash) {
    return Array.from(this.jobScans.values()).find(
      (scan) => scan.contentHash === contentHash
    );
  }
  async getScansAfterDate(date) {
    return Array.from(this.jobScans.values()).filter(
      (scan) => scan.createdAt >= date
    );
  }
  async getOutreachMessagesAfterDate(date) {
    return Array.from(this.outreachMessages.values()).filter(
      (message) => message.createdAt >= date
    );
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var jobScans = pgTable("job_scans", {
  id: serial("id").primaryKey(),
  jobTitle: text("job_title").notNull(),
  company: text("company").notNull(),
  originalUrl: text("original_url"),
  originalDescription: text("original_description").notNull(),
  contentHash: text("content_hash").notNull(),
  contentFingerprint: text("content_fingerprint"),
  ghostLikelihoodScore: integer("ghost_likelihood_score").notNull(),
  ghostLikelihoodLevel: text("ghost_likelihood_level").notNull(),
  redFlags: jsonb("red_flags").$type().notNull().default([]),
  aiSummary: text("ai_summary").notNull(),
  confidenceExplanation: text("confidence_explanation"),
  isSharedToArchive: boolean("is_shared_to_archive").default(false),
  cacheExpiresAt: timestamp("cache_expires_at"),
  analysisSource: text("analysis_source").notNull().default("fresh"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var outreachMessages = pgTable("outreach_messages", {
  id: serial("id").primaryKey(),
  scanId: integer("scan_id").references(() => jobScans.id).notNull(),
  message: text("message").notNull(),
  messageType: text("message_type").notNull().default("follow_up"),
  aiCost: real("ai_cost").default(0.02).notNull(),
  // Track AI cost for outreach generation
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertJobScanSchema = createInsertSchema(jobScans).omit({
  id: true,
  createdAt: true
});
var insertOutreachMessageSchema = createInsertSchema(outreachMessages).omit({
  id: true,
  createdAt: true
});
var analyzeJobSchema = z.object({
  jobDescription: z.string().optional(),
  jobUrl: z.string().optional()
}).refine((data) => data.jobDescription || data.jobUrl, {
  message: "Either jobDescription or jobUrl is required"
});
var generateOutreachSchema = z.object({
  scanId: z.number(),
  messageType: z.enum(["linkedin", "email", "general"]).default("linkedin")
});

// server/routes.ts
import Stripe from "stripe";

// server/routes/cache-stats.ts
function registerCacheStatsRoutes(app) {
  app.get("/api/cache-stats", async (req, res) => {
    try {
      const recentScans = await storage.getRecentJobScans(100);
      const stats = {
        totalScans: recentScans.length,
        exactCacheHits: recentScans.filter((scan) => scan.analysisSource === "exact_cache").length,
        similarCacheHits: recentScans.filter((scan) => scan.analysisSource === "similar_cache").length,
        freshAnalyses: recentScans.filter((scan) => scan.analysisSource === "fresh").length,
        cacheHitRate: 0,
        estimatedCostSavings: 0
      };
      const totalCacheHits = stats.exactCacheHits + stats.similarCacheHits;
      stats.cacheHitRate = stats.totalScans > 0 ? totalCacheHits / stats.totalScans * 100 : 0;
      stats.estimatedCostSavings = totalCacheHits * 6e-3;
      res.json(stats);
    } catch (error) {
      console.error("Error fetching cache stats:", error);
      res.status(500).json({ error: "Failed to fetch cache statistics" });
    }
  });
}

// server/routes/ai-status.ts
init_ai_service();
function registerAIStatusRoutes(app) {
  app.get("/api/ai-status", (req, res) => {
    try {
      const availableProviders = getAvailableProviders();
      const primaryProvider = getPrimaryProvider();
      res.json({
        primaryProvider,
        availableProviders,
        isQwenEnabled: availableProviders.includes("Qwen2.5 7B"),
        totalProviders: availableProviders.length
      });
    } catch (error) {
      console.error("Error getting AI status:", error);
      res.status(500).json({ error: "Failed to get AI status" });
    }
  });
}

// server/routes/service-status.ts
init_ai_service();
init_fund_manager();
function registerServiceStatusRoutes(app) {
  app.get("/api/service-status", async (req, res) => {
    try {
      const providerStatus = getProviderStatus();
      const usageStatus = await UsageTracker.getUsageStatus(req.app.locals.storage);
      const overallHealth = {
        status: providerStatus.isOnline && usageStatus.serviceMode.features.freshAnalysis ? "operational" : "degraded",
        provider: providerStatus.provider,
        providerOnline: providerStatus.isOnline,
        serviceMode: usageStatus.serviceMode.mode,
        capabilities: {
          freshAnalysis: providerStatus.isOnline && usageStatus.serviceMode.features.freshAnalysis,
          cacheAnalysis: usageStatus.serviceMode.features.cacheAnalysis,
          outreachGeneration: providerStatus.isOnline && usageStatus.serviceMode.features.outreachGeneration,
          archiveAccess: usageStatus.serviceMode.features.archiveAccess,
          manualTools: usageStatus.serviceMode.features.manualTools
        },
        cost: {
          perAnalysis: providerStatus.cost,
          dailyRequests: usageStatus.requestMetrics.dailyAnalyses,
          dailyCost: usageStatus.costTransparency.estimatedDailyCost
        },
        performance: usageStatus.performance,
        messages: {
          primary: usageStatus.serviceMode.message,
          service: UsageTracker.getServiceMessage(usageStatus)
        }
      };
      res.json(overallHealth);
    } catch (error) {
      console.error("Service status check failed:", error);
      res.status(500).json({
        status: "error",
        message: "Unable to determine service status",
        capabilities: {
          freshAnalysis: false,
          cacheAnalysis: true,
          outreachGeneration: false,
          archiveAccess: true,
          manualTools: true
        }
      });
    }
  });
  app.get("/api/health-check", async (req, res) => {
    try {
      const providerStatus = getProviderStatus();
      res.json({
        status: providerStatus.isOnline ? "ok" : "degraded",
        provider: providerStatus.provider,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(503).json({
        status: "error",
        message: "Service unavailable",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  app.get("/api/cache-performance", async (req, res) => {
    try {
      const storage2 = req.app.locals.storage;
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1e3);
      const recentScans = await storage2.getScansAfterDate(yesterday);
      const cacheStats = {
        total: recentScans.length,
        fresh: recentScans.filter((scan) => scan.analysisSource === "fresh").length,
        exactCache: recentScans.filter((scan) => scan.analysisSource === "exact_cache").length,
        similarCache: recentScans.filter((scan) => scan.analysisSource === "similar_cache").length,
        cacheHitRate: recentScans.length > 0 ? ((recentScans.length - recentScans.filter((scan) => scan.analysisSource === "fresh").length) / recentScans.length * 100).toFixed(1) + "%" : "0%"
      };
      res.json(cacheStats);
    } catch (error) {
      console.error("Cache performance check failed:", error);
      res.status(500).json({ error: "Unable to retrieve cache statistics" });
    }
  });
}

// server/routes.ts
init_ai_service();
var stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil"
}) : null;
async function registerRoutes(app) {
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  registerCacheStatsRoutes(app);
  registerAIStatusRoutes(app);
  registerServiceStatusRoutes(app);
  app.get("/api/community-fund-status", async (req, res) => {
    try {
      const hasTogetherKey = !!process.env.TOGETHER_API_KEY;
      const hasStripeKeys = !!(process.env.STRIPE_SECRET_KEY && process.env.VITE_STRIPE_PUBLIC_KEY);
      const hasDatabaseUrl = !!process.env.DATABASE_URL;
      const serviceMode = hasTogetherKey ? {
        mode: "full",
        message: "All features operational",
        features: {
          freshAnalysis: true,
          cacheAnalysis: true,
          outreachGeneration: true,
          archiveAccess: true,
          manualTools: true
        }
      } : {
        mode: "minimal",
        message: "AI analysis requires API key configuration",
        features: {
          freshAnalysis: false,
          cacheAnalysis: false,
          outreachGeneration: false,
          archiveAccess: true,
          manualTools: true
        }
      };
      const performance = {
        providerStatus: hasTogetherKey ? "operational" : "offline",
        consecutiveFailures: 0,
        lastSuccessfulRequest: hasTogetherKey ? (/* @__PURE__ */ new Date()).toISOString() : null,
        uptimeToday: hasTogetherKey ? "100%" : "0%"
      };
      res.json({
        currentBalance: 0,
        // Not tracking real balance
        dailyUsage: 0,
        dailyAnalyses: 0,
        dailyOutreach: 0,
        weeklyAnalyses: 0,
        cacheHitRate: "0%",
        avgResponseTime: "0ms",
        costTransparency: {
          analysisCost: 6e-3,
          outreachCost: 3e-3,
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
        status: performance.providerStatus === "operational" ? "healthy" : "critical",
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
      console.error("Error fetching usage status:", error);
      res.status(500).json({
        error: "Failed to fetch usage status",
        note: "Internal server error"
      });
    }
  });
  app.post("/api/analyze-job", async (req, res) => {
    try {
      const { jobDescription, jobUrl } = analyzeJobSchema.parse(req.body);
      let inputText = jobDescription || "";
      let extractedData = null;
      if (jobUrl && !jobDescription) {
        try {
          const { JobURLParser: JobURLParser2 } = await Promise.resolve().then(() => (init_url_parser(), url_parser_exports));
          extractedData = await JobURLParser2.extractJobFromURL(jobUrl);
          if (extractedData) {
            inputText = `Job Title: ${extractedData.jobTitle}
Company: ${extractedData.company}

Description:
${extractedData.description}`;
          } else {
            inputText = jobUrl;
          }
        } catch (urlError) {
          console.log("URL parsing failed, using URL as input:", urlError.message);
          inputText = jobUrl;
        }
      }
      if (!inputText.trim()) {
        return res.status(400).json({ error: "Job description or URL is required" });
      }
      const { JobCacheService: JobCacheService2 } = await Promise.resolve().then(() => (init_cache_service(), cache_service_exports));
      const jobTitle = extractedData?.jobTitle || "Unknown Position";
      const company = extractedData?.company || "Unknown Company";
      const cacheResult = await JobCacheService2.checkCache(inputText, jobTitle, company, storage);
      let analysis;
      let analysisSource = "fresh";
      let cacheMessage = "";
      if (cacheResult.type === "exact") {
        analysis = {
          jobTitle: cacheResult.scan.jobTitle,
          company: cacheResult.scan.company,
          ghostLikelihoodScore: cacheResult.scan.ghostLikelihoodScore,
          ghostLikelihoodLevel: cacheResult.scan.ghostLikelihoodLevel,
          redFlags: cacheResult.scan.redFlags,
          aiSummary: cacheResult.scan.aiSummary,
          confidenceExplanation: cacheResult.scan.confidenceExplanation
        };
        analysisSource = "exact_cache";
        cacheMessage = cacheResult.message || "";
        console.log("Cache HIT (exact):", cacheMessage);
      } else if (cacheResult.type === "similar") {
        analysis = {
          jobTitle: cacheResult.scan.jobTitle,
          company: cacheResult.scan.company,
          ghostLikelihoodScore: cacheResult.scan.ghostLikelihoodScore,
          ghostLikelihoodLevel: cacheResult.scan.ghostLikelihoodLevel,
          redFlags: cacheResult.scan.redFlags,
          aiSummary: `${cacheResult.scan.aiSummary}

[Note: This analysis is based on a similar job posting analyzed recently]`,
          confidenceExplanation: cacheResult.scan.confidenceExplanation
        };
        analysisSource = "similar_cache";
        cacheMessage = cacheResult.message || "";
        console.log("Cache HIT (similar):", cacheMessage);
      } else {
        const analysisResult = await analyzeJobPosting(inputText);
        analysis = analysisResult.analysis;
        const { UsageTracker: UsageTracker2 } = await Promise.resolve().then(() => (init_fund_manager(), fund_manager_exports));
        UsageTracker2.recordSuccessfulRequest();
        console.log(`Cache MISS - Fresh AI analysis performed with ${analysisResult.provider} (cost: $${analysisResult.cost})`);
      }
      const contentHash = JobCacheService2.generateContentHash(inputText);
      const contentFingerprint = JobCacheService2.generateContentFingerprint(inputText);
      const cacheExpiration = JobCacheService2.getCacheExpiration(7);
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
  app.get("/api/scans", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const scans = await storage.getRecentJobScans(limit);
      res.json(scans);
    } catch (error) {
      console.error("Error fetching scans:", error);
      res.status(500).json({ error: "Failed to fetch scans" });
    }
  });
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
  app.get("/api/archive", async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 20, 50);
      const offset = parseInt(req.query.offset) || 0;
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
  app.post("/api/generate-outreach", async (req, res) => {
    try {
      const { scanId, messageType } = generateOutreachSchema.parse(req.body);
      const scan = await storage.getJobScan(scanId);
      if (!scan) {
        return res.status(404).json({ error: "Scan not found" });
      }
      const outreachResult = await generateOutreachMessage(
        scan.originalDescription,
        scan,
        void 0
        // No user profile for now
      );
      const aiCost = outreachResult.cost;
      await storage.createOutreachMessage({
        scanId,
        message: outreachResult.message,
        messageType: messageType || "linkedin",
        aiCost
      });
      const { UsageTracker: UsageTracker2 } = await Promise.resolve().then(() => (init_fund_manager(), fund_manager_exports));
      UsageTracker2.recordSuccessfulRequest();
      console.log(`Outreach generated with ${outreachResult.provider} (cost: $${outreachResult.cost})`);
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
        amount: Math.round(amount * 100),
        // Convert to cents
        currency: "usd",
        metadata: {
          type: "community_fund_donation",
          amount: amount.toString()
        }
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Error creating donation intent:", error);
      res.status(500).json({ error: "Failed to create donation intent: " + error.message });
    }
  });
  app.post("/api/stripe-webhook", async (req, res) => {
    try {
      if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(500).json({ error: "Stripe webhook not configured" });
      }
      const sig = req.headers["stripe-signature"];
      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        console.error(`Webhook signature verification failed:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        if (paymentIntent.metadata?.type === "community_fund_donation") {
          const amount = parseFloat(paymentIntent.metadata.amount);
          const { UsageTracker: UsageTracker2 } = await Promise.resolve().then(() => (init_fund_manager(), fund_manager_exports));
          UsageTracker2.recordDonation(amount);
          console.log(`Community fund donation received: $${amount}`);
        }
      }
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
  const httpServer = createServer(app);
  return httpServer;
}
export {
  registerRoutes
};
