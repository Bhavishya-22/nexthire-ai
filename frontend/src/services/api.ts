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

// --- Profile Update API Method ---
export interface UpdateProfilePayload {
  full_name?: string;
  target_role?: string;
  experience_level?: string;
  college?: string;
  degree?: string;
  grad_year?: string;
  education_details?: string;
  career_goal?: string;
  preferred_locations?: string[];
  preferred_job_type?: string;
  learning_hours_per_week?: number;
  technical_skills?: string[];
  soft_skills?: string[];
  certifications?: string[];
  projects?: any[];
  experience?: any[];
}

export const updateUserProfile = async (
  payload: UpdateProfilePayload
): Promise<{ success: boolean; message: string; user: UserProfile; data: AnalysisResponse["data"] }> => {
  const response = await api.put("/api/profile", payload);
  return response.data;
};

// --- Projects API Methods ---
export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  skills: string[];
  status: string;
  github_url?: string;
  live_url?: string;
  metrics?: string;
  suggestions?: string;
  created_at?: string;
}

export const getDashboardProjects = async (): Promise<{ success: boolean; projects: ProjectItem[] }> => {
  const response = await api.get("/api/dashboard/projects");
  return response.data;
};

export const addDashboardProject = async (
  payload: Omit<ProjectItem, "id" | "created_at">
): Promise<{ success: boolean; project: ProjectItem; projects: ProjectItem[] }> => {
  const response = await api.post("/api/dashboard/projects", payload);
  return response.data;
};

export const updateDashboardProject = async (
  id: string,
  payload: Partial<ProjectItem>
): Promise<{ success: boolean; project: ProjectItem; projects: ProjectItem[] }> => {
  const response = await api.put(`/api/dashboard/projects/${id}`, payload);
  return response.data;
};

export const deleteDashboardProject = async (
  id: string
): Promise<{ success: boolean; projects: ProjectItem[] }> => {
  const response = await api.delete(`/api/dashboard/projects/${id}`);
  return response.data;
};

// --- Roadmap API Methods ---
export interface RoadmapTask {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  category: string;
}

export interface RoadmapWeek {
  week_number: number;
  title: string;
  description: string;
  milestone: string;
  tasks: RoadmapTask[];
}

export interface RoadmapData {
  target_role: string;
  total_tasks: number;
  completed_tasks: number;
  progress_percentage: number;
  weeks: RoadmapWeek[];
}

export const getDashboardRoadmap = async (): Promise<{ success: boolean; roadmap: RoadmapData }> => {
  const response = await api.get("/api/dashboard/roadmap");
  return response.data;
};

export const toggleRoadmapTask = async (
  taskId: string,
  completed: boolean
): Promise<{ success: boolean; roadmap: RoadmapData }> => {
  const response = await api.put(`/api/dashboard/roadmap/tasks/${taskId}`, { completed });
  return response.data;
};

// --- Interview Prep API Methods ---
export interface InterviewQuestion {
  question_id: string;
  question: string;
  category: "Technical" | "Project" | "HR" | "Mock";
  target_role: string;
  difficulty: "Foundational" | "Intermediate" | "Advanced";
  relevant_skills: string[];
  evaluation_criteria: string;
  expected_concepts: string[];
}

export interface InterviewQuestionsResponse {
  success: boolean;
  target_role: string;
  category?: string;
  questions: InterviewQuestion[];
  total: number;
  is_cached?: boolean;
}

export interface InterviewFeedbackData {
  technical_correctness: number;
  answer_completeness: number;
  relevance: number;
  communication_clarity: number;
  practical_depth?: number;
  overall_score: number;
  rubric_breakdown?: {
    domain_competence?: string;
    methodology_and_depth?: string;
    communication_and_structure?: string;
    [key: string]: any;
  };
  strengths: string[];
  concepts_covered?: string[];
  missing_concepts: string[];
  suggested_improvements: string;
  model_answer_outline?: string;
  summary: string;
}

export const getInterviewQuestions = async (
  category?: string,
  targetRole?: string,
  refresh: boolean = false
): Promise<InterviewQuestionsResponse> => {
  const params: Record<string, any> = {};
  if (category) params.category = category;
  if (targetRole) params.target_role = targetRole;
  if (refresh) params.refresh = true;

  const response = await api.get<InterviewQuestionsResponse>(
    "/api/dashboard/interview/questions",
    { params }
  );
  return response.data;
};

export const evaluateInterviewAnswer = async (
  question: string,
  answer: string,
  category: string,
  targetRole?: string,
  questionId?: string,
  expectedConcepts?: string[],
  evaluationCriteria?: string
): Promise<{ success: boolean; feedback: InterviewFeedbackData }> => {
  const response = await api.post("/api/dashboard/interview/feedback", {
    question_id: questionId,
    question,
    answer,
    category,
    target_role: targetRole,
    expected_concepts: expectedConcepts || [],
    evaluation_criteria: evaluationCriteria || "",
  });
  return response.data;
};

export const getInterviewHistory = async (
  targetRole?: string
): Promise<{ success: boolean; history: any[]; total: number }> => {
  const params = targetRole ? { target_role: targetRole } : {};
  const response = await api.get("/api/dashboard/interview/history", { params });
  return response.data;
};

// --- Learning Hub API Methods ---
export interface LearningResourceItem {
  id: string;
  title: string;
  skill: string;
  provider: string;
  url: string;
  resource_type: string;
  difficulty: string;
  duration: string;
  is_free: boolean;
  category: string;
  why_matters: string;
  expected_outcome: string;
  gap_source: string;
  practical_exercise: string;
  is_bookmarked: boolean;
  is_completed: boolean;
  completed_at?: string | null;
  learning_order: number;
}

export interface LearningProgressMetrics {
  total_completed: number;
  total_hours: number;
  total_bookmarked: number;
  completed_ids: string[];
  bookmarked_ids: string[];
}

export interface LearningRecommendationsResponse {
  success: boolean;
  target_role: string;
  recommendations: LearningResourceItem[];
  metrics: LearningProgressMetrics;
  total: number;
}

export const getLearningRecommendations = async (
  category?: string,
  targetRole?: string
): Promise<LearningRecommendationsResponse> => {
  const params: Record<string, any> = {};
  if (category) params.category = category;
  if (targetRole) params.target_role = targetRole;

  const response = await api.get<LearningRecommendationsResponse>(
    "/api/dashboard/learning/recommendations",
    { params }
  );
  return response.data;
};

export const toggleLearningBookmark = async (
  resourceId: string
): Promise<{ success: boolean; data: any }> => {
  const response = await api.post("/api/dashboard/learning/toggle-bookmark", {
    resource_id: resourceId,
  });
  return response.data;
};

export const toggleLearningComplete = async (
  resourceId: string,
  hours: number = 3.0
): Promise<{ success: boolean; data: any }> => {
  const response = await api.post("/api/dashboard/learning/toggle-complete", {
    resource_id: resourceId,
    hours,
  });
  return response.data;
};

export const getLearningProgress = async (): Promise<{
  success: boolean;
  metrics: LearningProgressMetrics;
}> => {
  const response = await api.get("/api/dashboard/learning/progress");
  return response.data;
};

// --- Progress Tracker API Methods ---
export interface ProgressData {
  roadmap_completion_percentage: number;
  tasks_completed: number;
  total_tasks: number;
  learning_hours_logged: number;
  learning_modules_completed?: number;
  mock_interviews_completed: number;
  skills_assessed: number;
  projects_count?: number;
  recent_activity: { title: string; timestamp: string; type: string }[];
  weekly_goals: { goal: string; completed: boolean }[];
}

export const getDashboardProgress = async (): Promise<{ success: boolean; progress: ProgressData }> => {
  const response = await api.get("/api/dashboard/progress");
  return response.data;
};

export default api;