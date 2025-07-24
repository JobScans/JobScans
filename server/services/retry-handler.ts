export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
}

export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = { maxAttempts: 3, delayMs: 1000, backoffMultiplier: 2 }
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.log(`Attempt ${attempt} failed:`, lastError.message);
        
        if (attempt === options.maxAttempts) {
          throw new Error(`Operation failed after ${options.maxAttempts} attempts: ${lastError.message}`);
        }
        
        // Wait before retry with exponential backoff
        const delay = options.delayMs * Math.pow(options.backoffMultiplier, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
  
  static async analyzeWithFallback(inputText: string): Promise<any> {
    // Legacy fallback method - now redirects to new unified AI service
    const { analyzeJobPosting } = await import("./ai-service");
    const result = await analyzeJobPosting(inputText);
    return result.analysis;
  }
}