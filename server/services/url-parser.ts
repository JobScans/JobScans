import { JSDOM } from 'jsdom';

interface JobExtraction {
  jobTitle: string;
  company: string;
  description: string;
  location?: string;
  salary?: string;
}

export class JobURLParser {
  static async extractJobFromURL(url: string): Promise<JobExtraction | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const html = await response.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      // LinkedIn parsing
      if (url.includes('linkedin.com/jobs')) {
        return this.parseLinkedIn(document);
      }
      
      // Indeed parsing
      if (url.includes('indeed.com')) {
        return this.parseIndeed(document);
      }
      
      // Glassdoor parsing
      if (url.includes('glassdoor.com')) {
        return this.parseGlassdoor(document);
      }
      
      // Generic fallback parsing
      return this.parseGeneric(document);
      
    } catch (error) {
      console.error('URL parsing error:', error);
      return null;
    }
  }
  
  private static parseLinkedIn(doc: Document): JobExtraction | null {
    const jobTitle = doc.querySelector('h1')?.textContent?.trim() || '';
    const company = doc.querySelector('.topcard__org-name-link, .job-details-jobs-unified-top-card__company-name')?.textContent?.trim() || '';
    const description = doc.querySelector('.description__text, .jobs-description-content__text')?.textContent?.trim() || '';
    
    return jobTitle && company ? { jobTitle, company, description } : null;
  }
  
  private static parseIndeed(doc: Document): JobExtraction | null {
    const jobTitle = doc.querySelector('[data-testid="jobsearch-JobInfoHeader-title"], h1.jobsearch-JobInfoHeader-title')?.textContent?.trim() || '';
    const company = doc.querySelector('[data-testid="inlineHeader-companyName"], .icl-u-lg-mr--sm')?.textContent?.trim() || '';
    const description = doc.querySelector('#jobDescriptionText, .jobsearch-jobDescriptionText')?.textContent?.trim() || '';
    
    return jobTitle && company ? { jobTitle, company, description } : null;
  }
  
  private static parseGlassdoor(doc: Document): JobExtraction | null {
    const jobTitle = doc.querySelector('[data-test="job-title"], .job-title')?.textContent?.trim() || '';
    const company = doc.querySelector('[data-test="employer-name"], .employer-name')?.textContent?.trim() || '';
    const description = doc.querySelector('[data-test="job-description"], .job-description')?.textContent?.trim() || '';
    
    return jobTitle && company ? { jobTitle, company, description } : null;
  }
  
  private static parseGeneric(doc: Document): JobExtraction | null {
    // Fallback selectors for generic job sites
    const titleSelectors = ['h1', '[class*="title"]', '[class*="job-title"]', '[id*="title"]'];
    const companySelectors = ['[class*="company"]', '[class*="employer"]', '[class*="org"]'];
    const descSelectors = ['[class*="description"]', '[class*="content"]', 'main', 'article'];
    
    const jobTitle = this.findBySelectors(doc, titleSelectors);
    const company = this.findBySelectors(doc, companySelectors);
    const description = this.findBySelectors(doc, descSelectors);
    
    return jobTitle && company ? { jobTitle, company, description } : null;
  }
  
  private static findBySelectors(doc: Document, selectors: string[]): string {
    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }
    return '';
  }
}