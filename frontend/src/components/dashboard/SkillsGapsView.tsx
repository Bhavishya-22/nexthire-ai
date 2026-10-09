import { useState } from "react";
import {
  Sliders,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Search,
  Sparkles,
  Code,
  Database,
  Cpu,
  Server,
  MessageSquare,
  Loader2,
} from "lucide-react";
import {
  type AnalysisResponse,
  type UserProfile,
} from "../../services/api";
import axios from "axios";

interface SkillsGapsViewProps {
  currentUser?: UserProfile | null;
  analysisData?: AnalysisResponse["data"] | null;
  onNavigateToRoadmap?: () => void;
}

export default function SkillsGapsView({
  currentUser,
  analysisData,
  onNavigateToRoadmap,
}: SkillsGapsViewProps) {
  const resume = analysisData?.resume_analysis;
  const userSkills = resume?.skills || ["Python", "FastAPI", "React", "TypeScript", "Machine Learning", "SQL", "Git"];
  const targetRole = currentUser?.target_role || (analysisData as any)?.target_role || "AI Engineer";

  // Job matching simulation state
  const [customJD, setCustomJD] = useState("");
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [jobMatchResult, setJobMatchResult] = useState<any>(analysisData?.job_match || null);
  const [addedSkillsToRoadmap, setAddedSkillsToRoadmap] = useState<string[]>([]);

  // Categorized Skills Mapping
  const categories = [
    {
      name: "Programming",
      icon: Code,
      color: "#2563eb",
      userHas: userSkills.filter((s) => /python|java|c\+\+|javascript|typescript|c\b/i.test(s)),
      targetRequires: ["Python", "TypeScript", "Algorithms"],
      priority: "High",
    },
    {
      name: "Machine Learning & AI",
      icon: Cpu,
      color: "#ea580c",
      userHas: userSkills.filter((s) => /machine learning|deep learning|neural|scikit|tensorflow|pytorch|cv|nlp/i.test(s)),
      targetRequires: ["Deep Learning", "PyTorch", "Model Evaluation"],
      priority: "High",
    },
    {
      name: "Data & Databases",
      icon: Database,
      color: "#0891b2",
      userHas: userSkills.filter((s) => /sql|dbms|postgres|mongo|database/i.test(s)),
      targetRequires: ["PostgreSQL", "Vector Embeddings", "Data Pipelines"],
      priority: "Medium",
    },
    {
      name: "GenAI & LLMs",
      icon: Sparkles,
      color: "#9333ea",
      userHas: userSkills.filter((s) => /llm|rag|prompt|gemini|openai|langchain/i.test(s)),
      targetRequires: ["RAG Architecture", "Vector Retrieval", "Prompt Tuning"],
      priority: "High",
    },
    {
      name: "Deployment & Cloud",
      icon: Server,
      color: "#16a34a",
      userHas: userSkills.filter((s) => /docker|aws|gcp|azure|ci\/cd|git|linux/i.test(s)),
      targetRequires: ["Docker", "FastAPI Serving", "Cloud Hosting"],
      priority: "High",
    },
    {
      name: "Communication & Soft Skills",
      icon: MessageSquare,
      color: "#d97706",
      userHas: ["Problem Solving", "Technical Documentation"],
      targetRequires: ["STAR Behavioral", "Cross-team Collaboration"],
      priority: "Medium",
    },
  ];

  const missingSkillsList = resume?.missing_skills && resume.missing_skills.length > 0
    ? resume.missing_skills
    : ["System Design", "Docker & Kubernetes", "PyTorch Deep Learning", "MLOps Pipelines"];

  const handleCompareJD = async () => {
    if (!customJD.trim()) return;
    setMatchingLoading(true);
    try {
      const resumeSnippet = `${resume?.summary || ""} Skills: ${userSkills.join(", ")}`;
      const res = await axios.post("/api/job-match", {
        resume_text: resumeSnippet,
        job_description: customJD,
      });
      if (res.data?.data) {
        setJobMatchResult(res.data.data);
      }
    } catch (err) {
      console.error("Job match calculation error:", err);
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleAddToRoadmap = (skill: string) => {
    if (!addedSkillsToRoadmap.includes(skill)) {
      setAddedSkillsToRoadmap([...addedSkillsToRoadmap, skill]);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Banner */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <Sliders size={22} color="#ea580c" />
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Skills & Skill Gaps Analysis
          </h1>
        </div>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
          Benchmark your verified skills against industry benchmarks for{" "}
          <strong style={{ color: "#ea580c" }}>{targetRole}</strong>.
        </p>
      </div>

      {/* Target Role Skill Coverage Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
        {/* Six Category Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Categorized Skill Coverage for {targetRole}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {categories.map((cat) => {
              const Icon = cat.icon;
              const hasCount = cat.userHas.length;
              const hasSkills = hasCount > 0;

              return (
                <div
                  key={cat.name}
                  style={{
                    background: "#ffffff",
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    padding: "16px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "8px",
                          background: `${cat.color}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: cat.color,
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a" }}>
                        {cat.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "8px",
                        background: cat.priority === "High" ? "#fee2e2" : "#fef3c7",
                        color: cat.priority === "High" ? "#b91c1c" : "#b45309",
                      }}
                    >
                      {cat.priority}
                    </span>
                  </div>

                  <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
                    Verified on Resume:
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                    {hasSkills ? (
                      cat.userHas.map((s) => (
                        <span
                          key={s}
                          style={{
                            background: "#f0fdf4",
                            border: "1px solid #dcfce7",
                            color: "#166534",
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "2px 7px",
                            borderRadius: "12px",
                          }}
                        >
                          ✓ {s}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: "11.5px", color: "#ef4444", fontWeight: 500 }}>
                        No direct evidence in resume
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Identified Gaps & Add to Roadmap */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "22px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <AlertCircle size={18} color="#ea580c" />
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Identified Skill Gaps
            </h2>
          </div>
          <p style={{ fontSize: "12.5px", color: "#64748b", margin: "0 0 16px" }}>
            These skills are commonly required for {targetRole} job descriptions but are underrepresented in your resume.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
            {missingSkillsList.map((skill) => {
              const isAdded = addedSkillsToRoadmap.includes(skill);
              return (
                <div
                  key={skill}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "#fffaf5",
                    border: "1px solid #fed7aa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#9a3412" }}>
                      {skill}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                      High Priority for {targetRole}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddToRoadmap(skill)}
                    disabled={isAdded}
                    style={{
                      background: isAdded ? "#dcfce7" : "#ea580c",
                      border: "none",
                      color: isAdded ? "#166534" : "#ffffff",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: isAdded ? "default" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {isAdded ? (
                      <>
                        <CheckCircle2 size={13} /> Added to Roadmap
                      </>
                    ) : (
                      <>
                        <Plus size={13} /> Add to Roadmap
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {onNavigateToRoadmap && (
            <button
              onClick={onNavigateToRoadmap}
              style={{
                marginTop: "16px",
                width: "100%",
                background: "linear-gradient(90deg, #ff5722 0%, #ff7a00 100%)",
                border: "none",
                color: "#ffffff",
                padding: "10px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              Continue to Roadmap <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Target Job Description Comparator Box */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <Search size={18} color="#ea580c" />
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Compare Against a Specific Job Description
          </h2>
        </div>
        <p style={{ fontSize: "12.5px", color: "#64748b", margin: "0 0 14px" }}>
          Paste any job posting or internship requirements to run real-time matching against your verified profile.
        </p>

        <textarea
          rows={3}
          value={customJD}
          onChange={(e) => setCustomJD(e.target.value)}
          placeholder="Paste job description text here (e.g., We are looking for an AI Engineer proficient in PyTorch, Docker, FastAPI...)"
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            fontSize: "13px",
            marginBottom: "12px",
            resize: "vertical",
          }}
        />

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleCompareJD}
            disabled={matchingLoading || !customJD.trim()}
            style={{
              background: "#0f172a",
              color: "#ffffff",
              border: "none",
              borderRadius: "9px",
              padding: "9px 20px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: matchingLoading || !customJD.trim() ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {matchingLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Calculating Match...
              </>
            ) : (
              <>
                <Sparkles size={15} /> Compute Role Fit
              </>
            )}
          </button>
        </div>

        {jobMatchResult && (
          <div
            style={{
              marginTop: "18px",
              padding: "16px",
              borderRadius: "12px",
              background: "#fffaf5",
              border: "1px solid #fed7aa",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                Match Score:{" "}
                <span style={{ color: "#ea580c", fontSize: "18px" }}>
                  {jobMatchResult.match_score}%
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12.5px" }}>
              <div>
                <strong style={{ color: "#166534" }}>Matching Skills ({jobMatchResult.matching_skills?.length || 0}):</strong>
                <div style={{ color: "#334155", marginTop: "4px" }}>
                  {jobMatchResult.matching_skills?.join(", ") || "None"}
                </div>
              </div>
              <div>
                <strong style={{ color: "#ef4444" }}>Missing Skills ({jobMatchResult.missing_skills?.length || 0}):</strong>
                <div style={{ color: "#334155", marginTop: "4px" }}>
                  {jobMatchResult.missing_skills?.join(", ") || "None"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
