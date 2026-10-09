import { useState } from "react";
import {
  Mic,
  Code,
  Layers,
  Users,
  Send,
  Sparkles,
  HelpCircle,
  Loader2,
  Info,
} from "lucide-react";
import {
  evaluateInterviewAnswer,
  type InterviewFeedbackData,
  type UserProfile,
  type AnalysisResponse,
} from "../../services/api";

interface InterviewPrepViewProps {
  currentUser?: UserProfile | null;
  analysisData?: AnalysisResponse["data"] | null;
}

export default function InterviewPrepView({ currentUser, analysisData }: InterviewPrepViewProps) {
  const role = currentUser?.target_role || (analysisData as any)?.target_role || "AI Engineer";
  const resume = analysisData?.resume_analysis;

  const [activeCategory, setActiveCategory] = useState<"Technical" | "Project" | "HR" | "Mock">("Technical");

  // Questions categorized by type
  const questionsByCategory: Record<string, string[]> = {
    Technical: [
      `How would you design a scalable vector retrieval pipeline for a RAG system in ${role}?`,
      "Explain the difference between supervised and unsupervised learning, and when to use each.",
      "How do you handle class imbalance and metric selection (e.g. F1 vs Precision-Recall)?",
      "Explain how database indexing in PostgreSQL accelerates queries under high concurrency.",
    ],
    Project: [
      `Walk through the technical architecture of your project '${resume?.projects?.[0] ? (typeof resume.projects[0] === 'string' ? resume.projects[0].slice(0, 35) : (resume.projects[0] as any).name) : "AI Career Intelligence Platform"}'. What were the hardest trade-offs?`,
      "What metrics did you track to evaluate latency, memory footprint, and model accuracy in your projects?",
      "If you had to scale your primary project to 100,000 active daily users, what would break first?",
    ],
    HR: [
      "Tell me about a time you faced a difficult technical bug or roadblock. How did you resolve it?",
      "Why are you specifically interested in starting your career as an AI Engineer / Software Engineer?",
      "How do you prioritize learning new frameworks while delivering project milestones on tight schedules?",
    ],
    Mock: [
      `Full Simulation: Explain how you would deploy a FastAPI service with Docker on AWS, and explain your strategy for monitoring model drift in production for ${role}.`,
    ],
  };

  const currentQuestions = questionsByCategory[activeCategory] || [];
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const activeQuestion = currentQuestions[selectedQuestionIndex] || currentQuestions[0];

  // Answer and feedback state
  const [candidateAnswer, setCandidateAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<InterviewFeedbackData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmitAnswer = async () => {
    if (!candidateAnswer.trim() || candidateAnswer.trim().length < 10) {
      setErrorMsg("Please provide a substantive answer (at least 10 characters) for AI evaluation.");
      return;
    }

    setEvaluating(true);
    setErrorMsg(null);
    setFeedback(null);

    try {
      const res = await evaluateInterviewAnswer(
        activeQuestion,
        candidateAnswer.trim(),
        activeCategory,
        role
      );
      setFeedback(res.feedback);
    } catch {
      setErrorMsg("Could not evaluate answer. Please verify your connection.");
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #fffaf5 0%, #ffffff 100%)",
          borderRadius: "16px",
          border: "1px solid #fed7aa",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <Mic size={22} color="#ea580c" />
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            AI Interview Prep Engine for {role}
          </h1>
        </div>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
          Practice role-specific interview questions, submit your answers, and receive detailed AI evaluation guidance
          grounded in industry hiring standards.
        </p>
      </div>

      {/* Category Tabs */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
        {[
          { id: "Technical", label: "Technical Interview", icon: Code },
          { id: "Project", label: "Project Deep Dive", icon: Layers },
          { id: "HR", label: "HR & Behavioral", icon: Users },
          { id: "Mock", label: "Full Mock Simulation", icon: Mic },
        ].map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id as any);
                setSelectedQuestionIndex(0);
                setFeedback(null);
                setCandidateAnswer("");
                setErrorMsg(null);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "10px",
                border: "none",
                background: isActive ? "linear-gradient(90deg, #ff5722 0%, #ff7a00 100%)" : "#ffffff",
                color: isActive ? "#ffffff" : "#475569",
                fontWeight: isActive ? 700 : 600,
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: isActive ? "0 4px 12px rgba(255, 87, 34, 0.25)" : "0 1px 3px rgba(0,0,0,0.05)",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={16} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Layout: Question Selection on Left, Answer & Evaluation on Right */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "20px" }}>
        {/* Question Selector List */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "18px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
            Available Questions ({currentQuestions.length})
          </div>

          {currentQuestions.map((q, idx) => {
            const isSelected = selectedQuestionIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedQuestionIndex(idx);
                  setFeedback(null);
                  setErrorMsg(null);
                }}
                style={{
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: isSelected ? "1px solid #fed7aa" : "1px solid #f1f5f9",
                  background: isSelected ? "#fffaf5" : "#fafafa",
                  color: isSelected ? "#9a3412" : "#334155",
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: "12.5px",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "6px",
                  lineHeight: 1.4,
                }}
              >
                <span style={{ color: "#ea580c" }}>{idx + 1}.</span>
                <span style={{ flex: 1 }}>{q}</span>
              </button>
            );
          })}
        </div>

        {/* Answer Box & Feedback Area */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Active Question Prompt */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "22px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <HelpCircle size={18} color="#ea580c" />
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#ea580c", textTransform: "uppercase" }}>
                Question {selectedQuestionIndex + 1} of {currentQuestions.length}
              </span>
            </div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: "0 0 16px", lineHeight: 1.4 }}>
              {activeQuestion}
            </h2>

            {/* Answer Input */}
            <div style={{ position: "relative" }}>
              <textarea
                rows={5}
                value={candidateAnswer}
                onChange={(e) => setCandidateAnswer(e.target.value)}
                placeholder="Type your structured answer here (e.g. using the STAR method: Situation, Task, Action, Result)..."
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13.5px",
                  lineHeight: 1.5,
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {errorMsg && (
              <div style={{ color: "#b91c1c", fontSize: "12.5px", marginTop: "8px" }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px" }}>
              <div style={{ fontSize: "11.5px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                <Info size={13} /> Responses are evaluated for technical correctness, clarity, and missing concepts.
              </div>

              <button
                onClick={handleSubmitAnswer}
                disabled={evaluating || !candidateAnswer.trim()}
                style={{
                  background: "linear-gradient(90deg, #ff5722 0%, #ff7a00 100%)",
                  border: "none",
                  color: "#ffffff",
                  padding: "9px 20px",
                  borderRadius: "9px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: evaluating || !candidateAnswer.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 8px rgba(234, 88, 12, 0.25)",
                }}
              >
                {evaluating ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Evaluating Answer...
                  </>
                ) : (
                  <>
                    <Send size={15} /> Submit for AI Feedback
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Feedback Card */}
          {feedback && (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #fed7aa",
                padding: "24px",
                boxShadow: "0 4px 14px rgba(234, 88, 12, 0.08)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={20} color="#ea580c" />
                  <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    AI Evaluation & Guidance Report
                  </h3>
                </div>
                <div
                  style={{
                    background: "#ffedd5",
                    color: "#ea580c",
                    fontSize: "13px",
                    fontWeight: 800,
                    padding: "4px 12px",
                    borderRadius: "16px",
                  }}
                >
                  Score: {feedback.overall_score}/100
                </div>
              </div>

              {/* Feedback Metrics Bar Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginBottom: "16px" }}>
                {[
                  { label: "Technical Correctness", score: feedback.technical_correctness },
                  { label: "Answer Completeness", score: feedback.answer_completeness },
                  { label: "Relevance to Question", score: feedback.relevance },
                  { label: "Communication Clarity", score: feedback.communication_clarity },
                ].map((item) => (
                  <div key={item.label} style={{ background: "#f8fafc", padding: "10px", borderRadius: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", marginBottom: "4px" }}>
                      <span style={{ color: "#64748b", fontWeight: 600 }}>{item.label}</span>
                      <strong style={{ color: "#0f172a" }}>{item.score}%</strong>
                    </div>
                    <div style={{ height: "4px", background: "#e2e8f0", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${item.score}%`, background: "#ea580c" }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <p style={{ fontSize: "13px", color: "#334155", lineHeight: 1.5, margin: "0 0 14px" }}>
                <strong>Assessment Summary: </strong> {feedback.summary}
              </p>

              {/* Missing Concepts */}
              {feedback.missing_concepts && feedback.missing_concepts.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#b91c1c", marginBottom: "4px" }}>
                    Missing Concepts to Address:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12.5px", color: "#64748b" }}>
                    {feedback.missing_concepts.map((mc, idx) => (
                      <li key={idx}>{mc}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Improvements */}
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "#fffaf5",
                  border: "1px solid #ffedd5",
                  fontSize: "12.5px",
                  color: "#9a3412",
                }}
              >
                <strong>Suggested Improvement: </strong> {feedback.suggested_improvements}
              </div>

              <div style={{ marginTop: "12px", fontSize: "11px", color: "#94a3b8", fontStyle: "italic" }}>
                Disclaimer: AI guidance is provided for interview practice and preparation only. It does not constitute a guarantee of interview success.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
