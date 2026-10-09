import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Authentication Token Helpers
const TOKEN_KEY = "nexthire_auth_token";

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
};

export const clearAuthToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
};

// Automatically attach Bearer token to all requests when present
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Existing Resume Analysis Types (Preserved) ---
export interface ResumeAnalysis {
  summary: string;
  skills: string[];
  technologies?: string[];
  projects: string[];
  experience: string[];
  education: string[];
  certifications?: string[];
  achievements?: string[];
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

export interface CRIFactor {
  score: number;
  max: number;
  label: string;
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
  factors_7?: {
    resume_intelligence: CRIFactor;
    skill_intelligence: CRIFactor;
    project_intelligence: CRIFactor;
    interview_readiness: CRIFactor;
    deployment_readiness: CRIFactor;
    career_goal_alignment: CRIFactor;
    continuous_learning: CRIFactor;
  };
}

export interface AnalysisResponse {
  success: boolean;
  filename: string;
  indexed_to_knowledge_base?: boolean;
  data: {
    resume_text_length: number;
    resume_analysis: ResumeAnalysis;
    job_match: JobMatch | null;
    cri: CRI | null;
  };
}

// --- RAG & Career Knowledge Base Types ---
export interface CitationItem {
  document_id: number;
  document_title: string;
  doc_type: string;
  category: string;
  snippet: string;
  similarity: number;
}

export interface RAGQueryResponse {
  success: boolean;
  query: string;
  answer: string;
  citations: CitationItem[];
  has_sufficient_context: boolean;
}

export interface CareerDocumentItem {
  id: number;
  title: string;
  doc_type: string;
  content_preview: string;
  chunk_count: number;
  created_at: string;
}

export interface DocumentListResponse {
  success: boolean;
  documents: CareerDocumentItem[];
  total_chunks: number;
}

// --- Auth & User Profile Types ---
export interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  onboarding_completed?: boolean;
  target_role?: string;
  resume_filename?: string;
  has_profile?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  access_token: string;
  token_type: string;
  user: UserProfile;
}

// --- Onboarding Specific Types ---
export interface OnboardingParseResponse {
  success: boolean;
  filename: string;
  full_name: string;
  target_role: string;
  extracted_profile: ResumeAnalysis;
  resume_text: string;
}

export interface ConfirmProfilePayload {
  full_name: string;
  target_role: string;
  filename: string;
  resume_text: string;
  profile: ResumeAnalysis;
}

export interface ProfileResponse {
  success: boolean;
  has_profile: boolean;
  onboarding_completed: boolean;
  target_role?: string;
  resume_filename?: string;
  user?: UserProfile;
  analysis_data?: AnalysisResponse["data"];
}


// --- Resume Analysis API Method (Preserved) ---
export const analyzeResume = async (
  file: File,
  jobDescription: string
): Promise<AnalysisResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  if (jobDescription.trim()) {
    formData.append("job_description", jobDescription.trim());
  }

  const response = await api.post<AnalysisResponse>(
    "/api/resume/analyze",
    formData
  );

  return response.data;
};

// --- RAG API Methods ---
export const askCareerAssistant = async (
  query: string,
  topK: number = 5
): Promise<RAGQueryResponse> => {
  const response = await api.post<RAGQueryResponse>("/api/rag/chat", {
    query,
    top_k: topK,
  });
  return response.data;
};

export const getCareerDocuments = async (): Promise<DocumentListResponse> => {
  const response = await api.get<DocumentListResponse>("/api/rag/documents");
  return response.data;
};

export const addCareerDocument = async (
  title: string,
  docType: string,
  content: string
): Promise<any> => {
  const response = await api.post("/api/rag/documents", {
    title,
    doc_type: docType,
    content,
  });
  return response.data;
};

export const deleteCareerDocument = async (docId: number): Promise<any> => {
  const response = await api.delete(`/api/rag/documents/${docId}`);
  return response.data;
};

// --- Auth API Methods ---
export const registerUser = async (
  fullName: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/api/auth/register", {
    full_name: fullName,
    email,
    password,
  });
  if (response.data.access_token) {
    setAuthToken(response.data.access_token);
  }
  return response.data;
};

export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/api/auth/login", {
    email,
    password,
  });
  if (response.data.access_token) {
    setAuthToken(response.data.access_token);
  }
  return response.data;
};

export const getCurrentUser = async (): Promise<UserProfile | null> => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await api.get<{ success: boolean; user: UserProfile }>(
      "/api/auth/me"
    );
    return response.data.user;
  } catch {
    clearAuthToken();
    return null;
  }
};

export const logoutUser = (): void => {
  clearAuthToken();
};

// --- Onboarding & Career Profile API Methods ---
export const parseOnboardingResume = async (
  file: File,
  fullName?: string,
  targetRole?: string
): Promise<OnboardingParseResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  if (fullName && fullName.trim()) {
    formData.append("full_name", fullName.trim());
  }
  if (targetRole && targetRole.trim()) {
    formData.append("target_role", targetRole.trim());
  }

  const response = await api.post<OnboardingParseResponse>(
    "/api/onboarding/parse-resume",
    formData
  );
  return response.data;
};

export const confirmOnboardingProfile = async (
  payload: ConfirmProfilePayload
): Promise<any> => {
  const response = await api.post("/api/onboarding/confirm-profile", payload);
  return response.data;
};

export const analyzeAndOnboard = async (
  file: File,
  fullName: string,
  targetRole: string
): Promise<{ success: boolean; user: UserProfile; data: AnalysisResponse["data"] }> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("full_name", fullName.trim());
  if (targetRole.trim()) {
    formData.append("target_role", targetRole.trim());
  }

  const response = await api.post<{ success: boolean; user: UserProfile; data: AnalysisResponse["data"] }>(
    "/api/onboarding/analyze-and-onboard",
    formData
  );
  return response.data;
};

export const getUserProfile = async (): Promise<ProfileResponse | null> => {
  try {
    const response = await api.get<ProfileResponse>("/api/profile");
    return response.data;
  } catch {
    return null;
  }
};

export default api;