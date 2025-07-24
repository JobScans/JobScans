import crypto from 'crypto';
import type { JobScan } from '@shared/schema';

interface CacheResult {
  type: 'exact' | 'similar' | 'none';
  scan?: JobScan;
  similarity?: number;
  message?: string;
}

export class JobCacheService {
  /**
   * Generate SHA-256 hash for exact content matching
   */
  static generateContentHash(jobDescription: string): string {
    // Normalize content: remove extra whitespace, convert to lowercase
    const normalized = jobDescription
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
    
    return crypto
      .createHash('sha256')
      .update(normalized)
      .digest('hex');
  }

  /**
   * Generate simple content fingerprint for similarity matching
   * Using basic word frequency instead of expensive embeddings for now
   */
  static generateContentFingerprint(jobDescription: string): string {
    const words = jobDescription
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3); // Filter out common short words

    // Count word frequencies
    const wordCounts = new Map<string, number>();
    words.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });

    // Get top 20 most frequent words as fingerprint
    const topWords = Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => `${word}:${count}`)
      .join('|');

    return topWords;
  }

  /**
   * Calculate similarity between two content fingerprints
   */
  static calculateSimilarity(fingerprint1: string, fingerprint2: string): number {
    const words1 = new Set(fingerprint1.split('|').map(w => w.split(':')[0]));
    const words2 = new Set(fingerprint2.split('|').map(w => w.split(':')[0]));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    // Jaccard similarity
    return intersection.size / union.size;
  }

  /**
   * Check cache for existing analysis
   */
  static async checkCache(
    jobDescription: string, 
    jobTitle: string, 
    company: string,
    storage: any
  ): Promise<CacheResult> {
    try {
      const contentHash = this.generateContentHash(jobDescription);
      
      // Step 1: Check for exact match
      const exactMatch = await storage.getScanByContentHash(contentHash);
      if (exactMatch && this.isCacheValid(exactMatch)) {
        return {
          type: 'exact',
          scan: exactMatch,
          message: 'Found identical job posting analyzed recently'
        };
      }

      // Step 2: Check for similar content
      const fingerprint = this.generateContentFingerprint(jobDescription);
      const recentScans = await storage.getRecentJobScans(50);
      
      let bestMatch: JobScan | null = null;
      let bestSimilarity = 0;

      for (const scan of recentScans) {
        if (!this.isCacheValid(scan)) continue;
        
        // Quick company + title filter for better matches
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
          type: 'similar',
          scan: bestMatch,
          similarity: bestSimilarity,
          message: `Found similar job posting (${Math.round(bestSimilarity * 100)}% match) analyzed recently`
        };
      }

      return { type: 'none' };

    } catch (error) {
      console.error('Cache check failed:', error);
      return { type: 'none' };
    }
  }

  /**
   * Check if cached analysis is still valid (not expired)
   */
  private static isCacheValid(scan: JobScan): boolean {
    if (!scan.cacheExpiresAt) {
      // Default: 7 days for cache expiration
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return scan.createdAt > sevenDaysAgo;
    }
    
    return new Date() < scan.cacheExpiresAt;
  }

  /**
   * Simple text similarity check
   */
  private static isTextSimilar(text1: string, text2: string): boolean {
    const normalize = (text: string) => text.toLowerCase().trim();
    const norm1 = normalize(text1);
    const norm2 = normalize(text2);
    
    // Check for exact match or significant overlap
    return norm1 === norm2 || 
           norm1.includes(norm2) || 
           norm2.includes(norm1) ||
           this.levenshteinSimilarity(norm1, norm2) > 0.7;
  }

  /**
   * Simple Levenshtein distance-based similarity
   */
  private static levenshteinSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;
    
    const distance = this.levenshteinDistance(str1, str2);
    return (maxLength - distance) / maxLength;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
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
  static getCacheExpiration(days: number = 7): Date {
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + days);
    return expiration;
  }
}