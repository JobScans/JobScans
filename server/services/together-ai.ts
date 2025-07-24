import OpenAI from 'openai';

// Together AI client configured for Qwen2.5 7B
const together = new OpenAI({
  apiKey: process.env.TOGETHER_API_KEY,
  baseURL: 'https://api.together.xyz/v1',
});

// Enhanced system prompt optimized for Qwen2.5 7B job analysis
const ENHANCED_SYSTEM_PROMPT = `You are JobScans AI, an expert job market analyst specializing in identifying ghost jobs and employment risks. Your mission is to protect job seekers from time-wasting opportunities and predatory hiring practices.

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

export async function analyzeJobWithQwen(jobData: string): Promise<any> {
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
          content: `Analyze this job posting for ghost job indicators and employment risks:\n\n${jobData}`
        }
      ],
      temperature: 0.1, // Low temperature for consistent analysis
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from Qwen2.5');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Qwen2.5 analysis error:', error);
    throw new Error(`Failed to analyze job posting: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateOutreachWithQwen(
  jobData: string, 
  analysisResults: any, 
  userProfile?: string
): Promise<string> {
  try {
    const riskContext = analysisResults.riskLevel === 'HIGH' 
      ? "Given the high risk level of this posting, craft a cautious message that protects the candidate while still showing interest."
      : analysisResults.riskLevel === 'MEDIUM'
      ? "This posting has some red flags. Create a professional message that addresses potential concerns diplomatically."
      : "This appears to be a legitimate opportunity. Create an enthusiastic but professional outreach message.";

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
Key Red Flags: ${analysisResults.redFlags.map((flag: any) => flag.description).join(', ')}

${userProfile ? `CANDIDATE PROFILE: ${userProfile}` : ''}

Generate a professional outreach message that addresses the opportunity while being mindful of the identified risks.`
        }
      ],
      temperature: 0.3, // Slightly higher for creative writing
      max_tokens: 500
    });

    return response.choices[0]?.message?.content || 'Failed to generate outreach message';
  } catch (error) {
    console.error('Qwen2.5 outreach generation error:', error);
    throw new Error(`Failed to generate outreach message: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}