import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export interface ResumeAnalysis {
  summary: string;
  skills: string[];
  projects: string[];
  experience: string[];
  education: string[];
  strengths: string[];
  missing_skills: string[];
  improvement_suggestions: string[];
  ats_score: number;
}

export interface JobMatch {
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  matching_projects: string[];
  strengths: string[];
  recommendations: string[];
}

export interface CRI {
  cri_score: number;
  readiness_level: string;
  breakdown: {
    ats_score: number;
    job_match_score: number;
    skills_score: number;
    projects_score: number;
    skill_coverage: number;
  };
}

export interface AnalysisResponse {
  success: boolean;
  filename: string;
  data: {
    resume_text_length: number;
    resume_analysis: ResumeAnalysis;
    job_match: JobMatch | null;
    cri: CRI | null;
  };
}

export const analyzeResume = async (
  file: File,
  jobDescription: string
): Promise<AnalysisResponse> => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("job_description", jobDescription);

  const response = await api.post<AnalysisResponse>(
    "/api/resume/analyze",
    formData
  );

  return response.data;
};

export default api;