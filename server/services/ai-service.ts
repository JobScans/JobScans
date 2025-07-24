import { analyzeJobWithQwen, generateOutreachWithQwen } from './together-ai';
import { RetryHandler } from './retry-handler';

// Pure Qwen2.5 7B implementation - no fallback complexity
const QWEN_PROVIDER = {
  name: 'Qwen2.5 7B',
  cost: 0.006, // 80% cost reduction vs previous setup
  analyzeJob: analyzeJobWithQwen,
  generateOutreach: generateOutreachWithQwen,
  enabled: () => !!process.env.TOGETHER_API_KEY
};

export async function analyzeJobPosting(jobData: string): Promise<{
  analysis: any;
  provider: string;
  cost: number;
}> {
  if (!QWEN_PROVIDER.enabled()) {
    throw new Error('Qwen2.5 7B is not available. Please configure TOGETHER_API_KEY.');
  }

  try {
    console.log(`Analyzing job posting with ${QWEN_PROVIDER.name}...`);
    
    const analysis = await RetryHandler.withRetry(
      () => QWEN_PROVIDER.analyzeJob(jobData),
      { maxAttempts: 3, delayMs: 1000, backoffMultiplier: 2 }
    );

    console.log(`✅ Job analysis successful with ${QWEN_PROVIDER.name}`);
    
    return {
      analysis,
      provider: QWEN_PROVIDER.name,
      cost: QWEN_PROVIDER.cost
    };
  } catch (error) {
    console.error(`❌ ${QWEN_PROVIDER.name} failed:`, error instanceof Error ? error.message : 'Unknown error');
    throw new Error(`Qwen2.5 7B analysis failed: ${error instanceof Error ? error.message : 'Service temporarily unavailable'}`);
  }
}

export async function generateOutreachMessage(
  jobData: string,
  analysisResults: any,
  userProfile?: string
): Promise<{
  message: string;
  provider: string;
  cost: number;
}> {
  if (!QWEN_PROVIDER.enabled()) {
    throw new Error('Qwen2.5 7B is not available for outreach generation. Please configure TOGETHER_API_KEY.');
  }

  try {
    console.log(`Generating outreach message with ${QWEN_PROVIDER.name}...`);
    
    const message = await RetryHandler.withRetry(
      () => QWEN_PROVIDER.generateOutreach(jobData, analysisResults, userProfile),
      { maxAttempts: 3, delayMs: 1000, backoffMultiplier: 2 }
    );

    console.log(`✅ Outreach generation successful with ${QWEN_PROVIDER.name}`);
    
    return {
      message,
      provider: QWEN_PROVIDER.name,
      cost: QWEN_PROVIDER.cost * 0.5 // Outreach generation costs roughly half of analysis
    };
  } catch (error) {
    console.error(`❌ ${QWEN_PROVIDER.name} outreach failed:`, error instanceof Error ? error.message : 'Unknown error');
    throw new Error(`Qwen2.5 7B outreach generation failed: ${error instanceof Error ? error.message : 'Service temporarily unavailable'}`);
  }
}

export function getAvailableProviders(): string[] {
  return QWEN_PROVIDER.enabled() ? [QWEN_PROVIDER.name] : [];
}

export function getPrimaryProvider(): string {
  return QWEN_PROVIDER.enabled() ? QWEN_PROVIDER.name : 'None';
}

export function getProviderStatus(): {
  isOnline: boolean;
  provider: string;
  cost: number;
} {
  return {
    isOnline: QWEN_PROVIDER.enabled(),
    provider: QWEN_PROVIDER.name,
    cost: QWEN_PROVIDER.cost
  };
}