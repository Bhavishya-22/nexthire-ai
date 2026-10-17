import { useState, useEffect, useCallback } from "react";
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
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Award,
  BookOpen,
  Tag,
  ChevronRight,
  Edit3,
} from "lucide-react";
import {
  getInterviewQuestions,
  evaluateInterviewAnswer,
  type InterviewQuestion,
  type InterviewFeedbackData,
  type UserProfile,
  type AnalysisResponse,
} from "../../services/api";

interface InterviewPrepViewProps {
  currentUser?: UserProfile | null;
  analysisData?: AnalysisResponse["data"] | null;
  onOpenEditProfile?: () => void;
}

export default function InterviewPrepView({
  currentUser,
  analysisData,
  onOpenEditProfile,
}: InterviewPrepViewProps) {
  // Derive active target role from user profile or analysis data
  const initialRole =
    currentUser?.target_role || (analysisData as any)?.target_role || "AI Engineer";
  const [activeRole, setActiveRole] = useState<string>(initialRole);
  const [isEditingRoleInline, setIsEditingRoleInline] = useState(false);
  const [customRoleInput, setCustomRoleInput] = useState(initialRole);

  // Synchronize when parent currentUser / analysisData updates (e.g. from EditProfileModal)
  useEffect(() => {
    const parentRole =
      currentUser?.target_role || (analysisData as any)?.target_role || "AI Engineer";
    if (parentRole && parentRole !== activeRole) {
      setActiveRole(parentRole);
      setCustomRoleInput(parentRole);
    }
  }, [currentUser?.target_role, (analysisData as any)?.target_role]);

  // Categories
  const [activeCategory, setActiveCategory] = useState<
    "Technical" | "Project" | "HR" | "Mock"
  >("Technical");

  // Questions state
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(true);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  // Candidate Answer & AI Evaluation state
  const [candidateAnswer, setCandidateAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<InterviewFeedbackData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch questions from backend whenever activeRole or activeCategory changes
  const fetchQuestions = useCallback(
    async (roleToFetch: string, catToFetch: string, forceRefresh: boolean = false) => {
      setLoadingQuestions(true);
      setQuestionsError(null);
      setFeedback(null);
      setCandidateAnswer("");
      setErrorMsg(null);
      setSelectedQuestionIndex(0);

      try {
        const res = await getInterviewQuestions(catToFetch, roleToFetch, forceRefresh);
        if (res.success && res.questions && res.questions.length > 0) {
          setQuestions(res.questions);
        } else {
          setQuestionsError("No questions returned for this role and category.");
          setQuestions([]);
        }
      } catch (err) {
        console.error("Failed to load interview questions:", err);
        setQuestionsError("Could not load questions. Check your connection or try again.");
      } finally {
        setLoadingQuestions(false);
      }
    },
    []
  );

  // Initial and reactive questions load on role or category change
  useEffect(() => {
    fetchQuestions(activeRole, activeCategory, false);
  }, [activeRole, activeCategory, fetchQuestions]);

  const activeQuestion: InterviewQuestion | undefined = questions[selectedQuestionIndex];

  // Submit Answer for AI Evaluation
  const handleSubmitAnswer = async () => {
    if (!candidateAnswer.trim() || candidateAnswer.trim().length < 10) {
      setErrorMsg(
        "Please provide a substantive answer (at least 10 characters) for AI evaluation."
      );
      return;
    }

    if (!activeQuestion) {
      setErrorMsg("No active question selected.");
      return;
    }

    setEvaluating(true);
    setErrorMsg(null);
    setFeedback(null);

    try {
      const res = await evaluateInterviewAnswer(
        activeQuestion.question,
        candidateAnswer.trim(),
        activeCategory,
        activeRole,
        activeQuestion.question_id,
        activeQuestion.expected_concepts,
        activeQuestion.evaluation_criteria
      );
      setFeedback(res.feedback);
    } catch {
      setErrorMsg("Could not evaluate answer. Please verify your connection.");
    } finally {
      setEvaluating(false);
    }
  };

  const handleApplyCustomRole = (newRole: string) => {
    const trimmed = newRole.trim();
    if (trimmed && trimmed !== activeRole) {
      setActiveRole(trimmed);
      setIsEditingRoleInline(false);
    }
  };

  const difficultyColors = {
    Foundational: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
    Intermediate: { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
    Advanced: { bg: "#faf5ff", text: "#7e22ce", border: "#e9d5ff" },
  };

  const commonRoles = [
    "AI Engineer",
    "Legal Advisor",
    "Data Scientist",
    "Backend Developer",
    "Machine Learning Engineer",
    "DevOps Engineer",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Banner with Active Target Role */}
      <div
        style={{
          background: "linear-gradient(135deg, #fffaf5 0%, #ffffff 100%)",
          borderRadius: "16px",
          border: "1px solid #fed7aa",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ flex: 1, minWidth: "300px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <Mic size={22} color="#ea580c" />
            <h1 style={{ fontSize: "21px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              AI Interview Prep Engine:{" "}
              <span style={{ color: "#ea580c" }}>{activeRole}</span>
            </h1>
          </div>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
            Practice rigorous interview questions tailored to the responsibilities, competencies, and
            evaluation standards for <strong>{activeRole}</strong>. Submit your answers to receive
            role-specific AI scoring, expected concept coverage, and exemplar model answers.
          </p>

          {/* Role Pill Switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Switch Role:</span>
            {commonRoles.map((r) => {
              const isCurrent = r.toLowerCase() === activeRole.toLowerCase();
              return (
                <button
                  key={r}
                  onClick={() => {
                    setActiveRole(r);
                    setCustomRoleInput(r);
                    setIsEditingRoleInline(false);
                  }}
                  style={{
                    fontSize: "11.5px",
                    fontWeight: isCurrent ? 700 : 500,
                    padding: "4px 10px",
                    borderRadius: "12px",
                    border: isCurrent ? "1px solid #ea580c" : "1px solid #e2e8f0",
                    background: isCurrent ? "#fff7ed" : "#ffffff",
                    color: isCurrent ? "#ea580c" : "#475569",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {r}
                </button>
              );
            })}

            {isEditingRoleInline ? (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="text"
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  placeholder="Enter custom role..."
                  style={{
                    padding: "3px 8px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "11.5px",
                    outline: "none",
                    width: "140px",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleApplyCustomRole(customRoleInput);
                  }}
                />
                <button
                  onClick={() => handleApplyCustomRole(customRoleInput)}
                  style={{
                    padding: "3px 8px",
                    background: "#ea580c",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Apply
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingRoleInline(true)}
                style={{
                  fontSize: "11.5px",
                  padding: "4px 8px",
                  borderRadius: "12px",
                  border: "1px dashed #cbd5e1",
                  background: "#ffffff",
                  color: "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Edit3 size={11} /> Custom Role
              </button>
            )}

            {onOpenEditProfile && (
              <button
                onClick={onOpenEditProfile}
                style={{
                  fontSize: "11.5px",
                  padding: "4px 8px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#64748b",
                  cursor: "pointer",
                  marginLeft: "auto",
                }}
              >
                Edit Career Profile
              </button>
            )}
          </div>
        </div>

        {/* Regenerate Button */}
        <button
          onClick={() => fetchQuestions(activeRole, activeCategory, true)}
          disabled={loadingQuestions}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "#ffffff",
            border: "1px solid #fed7aa",
            color: "#ea580c",
            fontWeight: 700,
            fontSize: "12.5px",
            padding: "8px 14px",
            borderRadius: "10px",
            cursor: loadingQuestions ? "not-allowed" : "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
          title="Regenerate a brand new question set using AI"
        >
          <RefreshCw size={14} className={loadingQuestions ? "animate-spin" : ""} />
          <span>Regenerate Questions</span>
        </button>
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
                if (activeCategory !== cat.id) {
                  setActiveCategory(cat.id as any);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "10px",
                border: "none",
                background: isActive
                  ? "linear-gradient(90deg, #ff5722 0%, #ff7a00 100%)"
                  : "#ffffff",
                color: isActive ? "#ffffff" : "#475569",
                fontWeight: isActive ? 700 : 600,
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: isActive
                  ? "0 4px 12px rgba(255, 87, 34, 0.25)"
                  : "0 1px 3px rgba(0,0,0,0.05)",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={16} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Question Selection on Left, Answer & Evaluation on Right */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "20px" }}>
        {/* Left Column: Question Selector List */}
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
            height: "fit-content",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "4px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              Questions ({questions.length})
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#ea580c",
                background: "#ffedd5",
                padding: "2px 8px",
                borderRadius: "10px",
              }}
            >
              {activeCategory}
            </span>
          </div>

          {loadingQuestions ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 16px",
                gap: "10px",
                color: "#64748b",
              }}
            >
              <Loader2 size={24} color="#ea580c" className="animate-spin" />
              <span style={{ fontSize: "12.5px" }}>Generating role-specific questions for {activeRole}...</span>
            </div>
          ) : questionsError ? (
            <div
              style={{
                padding: "16px",
                borderRadius: "10px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                fontSize: "12.5px",
                textAlign: "center",
              }}
            >
              <p style={{ margin: "0 0 8px" }}>{questionsError}</p>
              <button
                onClick={() => fetchQuestions(activeRole, activeCategory, true)}
                style={{
                  background: "#b91c1c",
                  color: "#ffffff",
                  border: "none",
                  padding: "5px 12px",
                  borderRadius: "6px",
                  fontSize: "11.5px",
                  cursor: "pointer",
                }}
              >
                Retry Generation
              </button>
            </div>
          ) : (
            questions.map((q, idx) => {
              const isSelected = selectedQuestionIndex === idx;
              const diffStyle =
                difficultyColors[q.difficulty as keyof typeof difficultyColors] ||
                difficultyColors.Intermediate;

              return (
                <button
                  key={q.question_id || idx}
                  onClick={() => {
                    setSelectedQuestionIndex(idx);
                    setFeedback(null);
                    setCandidateAnswer("");
                    setErrorMsg(null);
                  }}
                  style={{
                    padding: "12px",
                    borderRadius: "10px",
                    border: isSelected ? "1px solid #fed7aa" : "1px solid #f1f5f9",
                    background: isSelected ? "#fffaf5" : "#fafafa",
                    color: isSelected ? "#9a3412" : "#334155",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#ea580c" }}>
                      #{idx + 1}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "6px",
                        background: diffStyle.bg,
                        color: diffStyle.text,
                        border: `1px solid ${diffStyle.border}`,
                      }}
                    >
                      {q.difficulty}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "12.5px",
                      fontWeight: isSelected ? 700 : 500,
                      lineHeight: 1.4,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {q.question}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Right Column: Active Question Prompt, Answer Textarea & Evaluation */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Active Question Prompt Card */}
          {activeQuestion && (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              {/* Question Header Metadata */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <HelpCircle size={18} color="#ea580c" />
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#ea580c",
                      textTransform: "uppercase",
                    }}
                  >
                    Question {selectedQuestionIndex + 1} of {questions.length} • {activeCategory}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: "#f1f5f9",
                      color: "#475569",
                    }}
                  >
                    Role: {activeRole}
                  </span>
                  {activeQuestion.difficulty && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background:
                          difficultyColors[activeQuestion.difficulty as keyof typeof difficultyColors]
                            ?.bg || "#fff7ed",
                        color:
                          difficultyColors[activeQuestion.difficulty as keyof typeof difficultyColors]
                            ?.text || "#c2410c",
                        border: `1px solid ${
                          difficultyColors[activeQuestion.difficulty as keyof typeof difficultyColors]
                            ?.border || "#fed7aa"
                        }`,
                      }}
                    >
                      {activeQuestion.difficulty}
                    </span>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <h2
                style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: "0 0 16px",
                  lineHeight: 1.5,
                }}
              >
                {activeQuestion.question}
              </h2>

              {/* Relevant Skills and Expected Concepts Chips */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  marginBottom: "18px",
                  background: "#f8fafc",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  border: "1px solid #f1f5f9",
                }}
              >
                {activeQuestion.relevant_skills && activeQuestion.relevant_skills.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <Tag size={13} color="#ea580c" />
                    <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#64748b" }}>
                      Relevant Skills:
                    </span>
                    {activeQuestion.relevant_skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#334155",
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          padding: "2px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {activeQuestion.expected_concepts && activeQuestion.expected_concepts.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <BookOpen size={13} color="#ea580c" />
                    <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#64748b" }}>
                      Key Focus Concepts:
                    </span>
                    {activeQuestion.expected_concepts.map((concept, cIdx) => (
                      <span
                        key={cIdx}
                        style={{
                          fontSize: "11px",
                          fontWeight: 500,
                          color: "#ea580c",
                          background: "#fffaf5",
                          border: "1px solid #fed7aa",
                          padding: "2px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Evaluation Criteria Hint Card */}
              {activeQuestion.evaluation_criteria && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    background: "#fffaf5",
                    border: "1px solid #fed7aa",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    marginBottom: "16px",
                  }}
                >
                  <Info size={15} color="#ea580c" style={{ marginTop: "2px", flexShrink: 0 }} />
                  <div style={{ fontSize: "12px", color: "#9a3412", lineHeight: 1.4 }}>
                    <strong>Evaluation Criteria: </strong>
                    {activeQuestion.evaluation_criteria}
                  </div>
                </div>
              )}

              {/* Candidate Answer Textarea */}
              <div style={{ position: "relative" }}>
                <textarea
                  rows={6}
                  value={candidateAnswer}
                  onChange={(e) => setCandidateAnswer(e.target.value)}
                  placeholder={`Type your detailed answer for the ${activeRole} position here (e.g. using the STAR method: Situation, Task, Action, Result)...`}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13.5px",
                    lineHeight: 1.5,
                    resize: "vertical",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {errorMsg && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#b91c1c",
                    fontSize: "12.5px",
                    marginTop: "8px",
                  }}
                >
                  <AlertCircle size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "16px",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    fontSize: "11.5px",
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Info size={13} /> Evaluated against role-specific benchmarks for {activeRole}.
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={evaluating || !candidateAnswer.trim()}
                    style={{
                      background: "linear-gradient(90deg, #ff5722 0%, #ff7a00 100%)",
                      border: "none",
                      color: "#ffffff",
                      padding: "9px 22px",
                      borderRadius: "9px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: evaluating || !candidateAnswer.trim() ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 2px 8px rgba(234, 88, 12, 0.25)",
                      opacity: evaluating || !candidateAnswer.trim() ? 0.7 : 1,
                    }}
                  >
                    {evaluating ? (
                      <>
                        <Loader2 size={15} className="animate-spin" /> Evaluating Answer for {activeRole}...
                      </>
                    ) : (
                      <>
                        <Send size={15} /> Submit for AI Feedback
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Feedback Report Card */}
          {feedback && (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #fed7aa",
                padding: "26px",
                boxShadow: "0 4px 16px rgba(234, 88, 12, 0.08)",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "18px",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={20} color="#ea580c" />
                  <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    AI Evaluation & Guidance Report ({activeRole})
                  </h3>
                </div>
                <div
                  style={{
                    background: "#ffedd5",
                    color: "#ea580c",
                    fontSize: "14px",
                    fontWeight: 800,
                    padding: "5px 14px",
                    borderRadius: "16px",
                    border: "1px solid #fed7aa",
                  }}
                >
                  Score: {feedback.overall_score}/100
                </div>
              </div>

              {/* Feedback Metrics Bar Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                  gap: "10px",
                  marginBottom: "18px",
                }}
              >
                {[
                  {
                    label: "Domain Correctness",
                    score: feedback.technical_correctness,
                  },
                  {
                    label: "Completeness",
                    score: feedback.answer_completeness,
                  },
                  {
                    label: "Relevance",
                    score: feedback.relevance,
                  },
                  {
                    label: "Clarity",
                    score: feedback.communication_clarity,
                  },
                  {
                    label: "Practical Depth",
                    score: feedback.practical_depth ?? 75,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "10px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "11.5px",
                        marginBottom: "4px",
                      }}
                    >
                      <span style={{ color: "#64748b", fontWeight: 600 }}>{item.label}</span>
                      <strong style={{ color: "#0f172a" }}>{item.score}%</strong>
                    </div>
                    <div
                      style={{
                        height: "5px",
                        background: "#e2e8f0",
                        borderRadius: "3px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${item.score}%`,
                          background: "linear-gradient(90deg, #ff5722 0%, #ff7a00 100%)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Assessment Summary */}
              <p
                style={{
                  fontSize: "13px",
                  color: "#334155",
                  lineHeight: 1.6,
                  margin: "0 0 16px",
                  background: "#f8fafc",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  borderLeft: "3px solid #ea580c",
                }}
              >
                <strong>Assessment Summary: </strong> {feedback.summary}
              </p>

              {/* Concepts Covered vs Missing Concepts */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                  marginBottom: "16px",
                }}
              >
                {/* Concepts Covered */}
                {feedback.concepts_covered && feedback.concepts_covered.length > 0 && (
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "10px",
                      padding: "12px 14px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#166534",
                        marginBottom: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <CheckCircle2 size={14} color="#16a34a" /> Concepts Addressed:
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: "16px",
                        fontSize: "12px",
                        color: "#15803d",
                        lineHeight: 1.5,
                      }}
                    >
                      {feedback.concepts_covered.map((cc, idx) => (
                        <li key={idx}>{cc}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Concepts */}
                {feedback.missing_concepts && feedback.missing_concepts.length > 0 && (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "10px",
                      padding: "12px 14px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#991b1b",
                        marginBottom: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <AlertCircle size={14} color="#dc2626" /> Missing Concepts to Address:
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: "16px",
                        fontSize: "12px",
                        color: "#b91c1c",
                        lineHeight: 1.5,
                      }}
                    >
                      {feedback.missing_concepts.map((mc, idx) => (
                        <li key={idx}>{mc}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Strengths */}
              {feedback.strengths && feedback.strengths.length > 0 && (
                <div style={{ marginBottom: "14px" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#0f172a",
                      marginBottom: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Award size={15} color="#ea580c" /> Answer Strengths:
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "18px",
                      fontSize: "12.5px",
                      color: "#475569",
                      lineHeight: 1.5,
                    }}
                  >
                    {feedback.strengths.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Improvements */}
              {feedback.suggested_improvements && (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "#fffaf5",
                    border: "1px solid #fed7aa",
                    fontSize: "12.5px",
                    color: "#9a3412",
                    marginBottom: "14px",
                    lineHeight: 1.5,
                  }}
                >
                  <strong>Actionable Improvements: </strong>
                  {feedback.suggested_improvements}
                </div>
              )}

              {/* Exemplar Model Answer Outline */}
              {feedback.model_answer_outline && (
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    fontSize: "12.5px",
                    color: "#334155",
                    marginBottom: "14px",
                    lineHeight: 1.5,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#0f172a",
                      marginBottom: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <BookOpen size={14} color="#ea580c" /> Exemplar Model Answer Outline ({activeRole}):
                  </div>
                  <p style={{ margin: 0, whiteSpace: "pre-line" }}>
                    {feedback.model_answer_outline}
                  </p>
                </div>
              )}

              {/* Navigation to next question */}
              {selectedQuestionIndex < questions.length - 1 && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "14px" }}>
                  <button
                    onClick={() => {
                      setSelectedQuestionIndex((prev) => prev + 1);
                      setFeedback(null);
                      setCandidateAnswer("");
                      setErrorMsg(null);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 16px",
                      background: "#0f172a",
                      color: "#ffffff",
                      borderRadius: "8px",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <span>Practice Next Question</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}

              <div
                style={{
                  marginTop: "14px",
                  fontSize: "11px",
                  color: "#94a3b8",
                  fontStyle: "italic",
                }}
              >
                Disclaimer: AI guidance is provided for interview practice and preparation only. It does not constitute a guarantee of interview success.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
