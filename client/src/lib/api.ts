import { apiRequest } from "./queryClient";
import type { AnalyzeJobRequest, JobAnalysisResult, GenerateOutreachRequest, OutreachMessage, JobScan } from "@shared/schema";

export async function analyzeJob(data: AnalyzeJobRequest): Promise<JobAnalysisResult> {
  const response = await apiRequest("POST", "/api/analyze-job", data);
  return response.json();
}

export async function getRecentScans(): Promise<JobScan[]> {
  const response = await apiRequest("GET", "/api/scans");
  return response.json();
}

export async function getScan(id: number): Promise<JobAnalysisResult> {
  const response = await apiRequest("GET", `/api/scan/${id}`);
  return response.json();
}

export async function generateOutreach(data: GenerateOutreachRequest): Promise<OutreachMessage> {
  const response = await apiRequest("POST", "/api/generate-outreach", data);
  return response.json();
}

export async function getOutreachMessages(scanId: number): Promise<OutreachMessage[]> {
  const response = await apiRequest("GET", `/api/scan/${scanId}/outreach`);
  return response.json();
}
