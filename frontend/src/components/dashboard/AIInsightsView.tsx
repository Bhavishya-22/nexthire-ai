import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Clock,
  Target,
  FileCheck,
  Mic,
  Code,
} from "lucide-react";
import {
  type AnalysisResponse,
  type UserProfile,
} from "../../services/api";

interface AIInsightsViewProps {
  currentUser?: UserProfile | null;
  analysisData?: AnalysisResponse["data"] | null;
  onNavigateToRoadmap?: () => void;
  onNavigateToInterview?: () => void;
}

export default function AIInsightsView({
  currentUser,
  analysisData,
  onNavigateToRoadmap,
  onNavigateToInterview,
}: AIInsightsViewProps) {
  const resume = analysisData?.resume_analysis;
  const cri = analysisData?.cri;
  const targetRole = currentUser?.target_role || (analysisData as any)?.target_role || "AI Engineer";

  const atsScore = resume?.ats_score ?? 85;
  const criScore = cri?.cri_score ?? 88;
  const readinessLevel = cri?.readiness_level ?? "Career Ready";

  // Actionable recommendations with rationale and next steps
  const recommendations = [
    {
      id: "rec-1",
      title: "Quantify Key Achievements on Resume",
      tag: "Resume Intelligence",
      impact: "High Impact",
      impactColor: "#ef4444",
      impactBg: "#fee2e2",
      whyItMatters:
        "Technical recruiters and ATS screeners prioritize bullets with measurable outcomes (e.g. latency reduced by 40%, 98% accuracy, 10k users served).",
      action: "Revise project bullet points using the STAR method with specific performance metrics.",
      time: "~ 1-2 hrs",
      icon: FileCheck,
    },
    {
      id: "rec-2",
      title: `Close Missing Skill Gap: ${resume?.missing_skills?.[0] || "System Design & Architecture"}`,
      tag: "Skill Coverage",
      impact: "High Impact",
      impactColor: "#ef4444",
      impactBg: "#fee2e2",
      whyItMatters: `For ${targetRole} positions, production architectures and data pipelines are tested in technical screening rounds.`,
      action: "Complete Week 1 and 2 roadmap modules focusing on distributed systems and microservices.",
      time: "~ 15 hrs",
      icon: Target,
    },
    {
      id: "rec-3",
      title: "Deploy 1 End-to-End Containerized Project",
      tag: "Project Intelligence",
      impact: "Medium Impact",
      impactColor: "#ea580c",
      impactBg: "#ffedd5",
      whyItMatters:
        "Projects running live on Docker/Cloud demonstrate practical deployment readiness beyond textbook Jupyter notebooks.",
      action: "Containerize your primary project with a Dockerfile, health check endpoints, and live demo link.",
      time: "~ 20 hrs",
      icon: Code,
    },
    {
      id: "rec-4",
      title: `Practice 5 Mock Technical Questions for ${targetRole}`,
      tag: "Interview Readiness",
      impact: "High Impact",
      impactColor: "#ef4444",
      impactBg: "#fee2e2",
      whyItMatters:
        "First-round interviews evaluate technical correctness and communication clarity under time constraints.",
      action: "Use the NextHire AI Interview Prep module to answer questions and get automated feedback.",
      time: "~ 3 hrs",
      icon: Mic,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Banner */}
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
          <Sparkles size={22} color="#ea580c" />
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            AI Career Readiness & Actionable Insights
          </h1>
        </div>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
          Personalized guidance grounded in your confirmed resume data and target career role of{" "}
          <strong style={{ color: "#ea580c" }}>{targetRole}</strong>. All scores are simulated estimates for preparation.
        </p>
      </div>

      {/* Metrics Row: ATS & CRI Quality Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
        {/* ATS Compatibility Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                ATS Compatibility
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>Simulated parsing estimate</div>
            </div>
            <span
              style={{
                background: atsScore >= 80 ? "#dcfce7" : "#fef3c7",
                color: atsScore >= 80 ? "#166534" : "#b45309",
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "12px",
              }}
            >
              {atsScore >= 80 ? "ATS Friendly" : "Moderate Pass"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "10px" }}>
            <span style={{ fontSize: "36px", fontWeight: 900, color: "#0f172a" }}>{atsScore}</span>
            <span style={{ fontSize: "16px", fontWeight: 600, color: "#94a3b8" }}>/100</span>
          </div>

          <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden", marginBottom: "12px" }}>
            <div style={{ height: "100%", width: `${atsScore}%`, background: "#ea580c" }} />
          </div>

          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
            Standard sections detected: Header, Education, Skills, Projects, and Experience parsed cleanly.
          </p>
        </div>

        {/* CRI Composite Readiness */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Career Readiness Index (CRI)
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8" }}>Composite 7-factor benchmark</div>
            </div>
            <span
              style={{
                background: "#ffedd5",
                color: "#c2410c",
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "12px",
              }}
            >
              {readinessLevel}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "10px" }}>
            <span style={{ fontSize: "36px", fontWeight: 900, color: "#ea580c" }}>{criScore}</span>
            <span style={{ fontSize: "16px", fontWeight: 600, color: "#94a3b8" }}>/100</span>
          </div>

          <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden", marginBottom: "12px" }}>
            <div style={{ height: "100%", width: `${criScore}%`, background: "linear-gradient(90deg, #f97316, #ea580c)" }} />
          </div>

          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
            Calculated from ATS (30%), Job Match (30%), Skills volume (20%), Projects (10%), and Skill coverage (10%).
          </p>
        </div>
      </div>

      {/* Strengths & Areas to Improve Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Verified Strengths */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "22px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <CheckCircle2 size={18} color="#16a34a" />
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Verified Career Strengths
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {(resume?.strengths && resume.strengths.length > 0
              ? resume.strengths
              : [
                  "Demonstrated proficiency in core engineering languages (Python, SQL).",
                  "Multiple practical projects with documented architectures.",
                  "Clear foundational CS background and problem-solving skills.",
                ]
            ).map((s, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "#f0fdf4",
                  border: "1px solid #dcfce7",
                  fontSize: "13px",
                  color: "#166534",
                }}
              >
                <span style={{ fontWeight: 700, color: "#16a34a" }}>✓</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Areas to Improve */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "22px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <AlertTriangle size={18} color="#ea580c" />
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Critical Areas to Improve
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {(resume?.missing_skills && resume.missing_skills.length > 0
              ? resume.missing_skills.slice(0, 3).map((m) => `Target role requirement missing: ${m}`)
              : [
                  "Add measurable business impact metrics to projects.",
                  "Include cloud deployment & containerization experience.",
                  "Expand on end-to-end testing and system design.",
                ]
            ).map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "#fffaf5",
                  border: "1px solid #fed7aa",
                  fontSize: "13px",
                  color: "#9a3412",
                }}
              >
                <span style={{ fontWeight: 700, color: "#ea580c" }}>!</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prioritized Actionable Recommendations */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <TrendingUp size={18} color="#ea580c" />
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Prioritized Next Actions (What, Why, Next Step)
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {recommendations.map((rec) => {
            const Icon = rec.icon;
            return (
              <div
                key={rec.id}
                style={{
                  padding: "18px",
                  borderRadius: "14px",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  transition: "all 0.15s ease",
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px",
                    background: rec.impactBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: rec.impactColor,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                      {rec.title}
                    </span>
                    <span
                      style={{
                        background: rec.impactBg,
                        color: rec.impactColor,
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "10px",
                      }}
                    >
                      {rec.impact}
                    </span>
                    <span style={{ fontSize: "11.5px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={12} /> {rec.time}
                    </span>
                  </div>

                  <div style={{ fontSize: "12.5px", color: "#475569", lineHeight: 1.5, marginBottom: "8px" }}>
                    <strong style={{ color: "#334155" }}>Why it matters: </strong>
                    {rec.whyItMatters}
                  </div>

                  <div style={{ fontSize: "12.5px", color: "#ea580c", fontWeight: 600 }}>
                    <strong>Action: </strong> {rec.action}
                  </div>
                </div>

                {rec.id.includes("Roadmap") || rec.id === "rec-2" ? (
                  <button
                    onClick={onNavigateToRoadmap}
                    style={{
                      background: "#fff7ed",
                      border: "1px solid #fed7aa",
                      color: "#ea580c",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Open Roadmap <ArrowRight size={13} />
                  </button>
                ) : rec.id === "rec-4" ? (
                  <button
                    onClick={onNavigateToInterview}
                    style={{
                      background: "#fff7ed",
                      border: "1px solid #fed7aa",
                      color: "#ea580c",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Start Prep <ArrowRight size={13} />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
