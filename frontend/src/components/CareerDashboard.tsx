import ScoreCard from "./ScoreCard";
import type { AnalysisResponse } from "../services/api";

interface CareerDashboardProps {
  analysisData: AnalysisResponse["data"] | null;
  filename?: string;
  onStartUpload?: () => void;
  onAskAssistant?: () => void;
}

export default function CareerDashboard({
  analysisData,
  filename,
  onStartUpload,
  onAskAssistant,
}: CareerDashboardProps) {
  if (!analysisData) {
    return (
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "60px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "24px",
            padding: "48px 32px",
            border: "1px dashed #fdba74",
            boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ fontSize: "52px", marginBottom: "16px" }}>📊</div>
          <h2 style={{ fontSize: "26px", color: "#1e293b", margin: "0 0 10px", fontWeight: 800 }}>
            Career Intelligence Dashboard
          </h2>
          <p style={{ color: "#64748b", maxWidth: "560px", margin: "0 auto 28px", fontSize: "15px", lineHeight: 1.6 }}>
            Upload your PDF resume to generate your dynamic Career Readiness Index (CRI), ATS compatibility score, extracted skills, projects, and AI-powered recommendations.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            {onStartUpload && (
              <button
                onClick={onStartUpload}
                style={{
                  background: "linear-gradient(90deg, #ff6b00, #ff3d00)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  padding: "14px 32px",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(255, 107, 0, 0.3)",
                }}
              >
                Upload Resume to View Dashboard
              </button>
            )}
            {onAskAssistant && (
              <button
                onClick={onAskAssistant}
                style={{
                  background: "#fff7ed",
                  color: "#ea580c",
                  border: "1px solid #fed7aa",
                  borderRadius: "12px",
                  padding: "14px 28px",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Open Career Assistant (RAG)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { resume_analysis, job_match, cri } = analysisData;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Header Info Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          paddingBottom: "12px",
          borderBottom: "1px solid #fed7aa",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              padding: "4px 10px",
              borderRadius: "12px",
              background: "#ffedd5",
              color: "#c2410c",
              letterSpacing: "0.5px",
            }}
          >
            Live Career Analysis
          </span>
          {filename && (
            <span style={{ marginLeft: "10px", fontSize: "14px", color: "#475569", fontWeight: 600 }}>
              📄 {filename}
            </span>
          )}
        </div>

        {onAskAssistant && (
          <button
            onClick={onAskAssistant}
            style={{
              background: "#fffaf5",
              border: "1px solid #fdba74",
              borderRadius: "10px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#ea580c",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>💬</span> Query Career Assistant about this Analysis
          </button>
        )}
      </div>

      {/* 1. Score Highlights Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
        }}
      >
        {resume_analysis && (
          <ScoreCard
            title="ATS Compatibility Score"
            score={resume_analysis.ats_score}
            badgeText={
              resume_analysis.ats_score >= 80
                ? "ATS Optimized"
                : resume_analysis.ats_score >= 60
                ? "Moderate Fit"
                : "Needs Polish"
            }
            subtitle="Formatting, sections & keyword density"
            color="orange"
          />
        )}

        {job_match && (
          <ScoreCard
            title="Job Description Fit"
            score={job_match.match_score}
            badgeText={
              job_match.match_score >= 75
                ? "High Alignment"
                : job_match.match_score >= 50
                ? "Medium Alignment"
                : "Developing Fit"
            }
            subtitle="Compatibility with target job requirements"
            color="blue"
          />
        )}

        {cri && (
          <ScoreCard
            title="Career Readiness Index (CRI)"
            score={cri.cri_score}
            badgeText={cri.readiness_level}
            subtitle={`Composite readiness: ${cri.readiness_level}`}
            color="green"
          />
        )}
      </div>

      {/* 2. Detailed 5-Factor CRI Breakdown */}
      {cri && (
        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "26px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, color: "#1e293b", fontSize: "18px", fontWeight: 700 }}>
              🎯 Career Readiness Index (CRI) 5-Factor Breakdown
            </h3>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#166534",
                background: "#f0fdf4",
                padding: "4px 12px",
                borderRadius: "20px",
              }}
            >
              Overall: {cri.cri_score}/100 ({cri.readiness_level})
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: "14px",
            }}
          >
            <div style={{ background: "#fff7ed", padding: "14px", borderRadius: "12px", border: "1px solid #ffedd5" }}>
              <span style={{ fontSize: "12px", color: "#9a3412", fontWeight: 600 }}>ATS Weight (30%)</span>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#ea580c" }}>{cri.breakdown.ats_score}</div>
              <span style={{ fontSize: "11px", color: "#9a3412" }}>Resume parseability</span>
            </div>
            <div style={{ background: "#eff6ff", padding: "14px", borderRadius: "12px", border: "1px solid #dbeafe" }}>
              <span style={{ fontSize: "12px", color: "#1e40af", fontWeight: 600 }}>Job Match (30%)</span>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#2563eb" }}>{cri.breakdown.job_match_score}</div>
              <span style={{ fontSize: "11px", color: "#1e40af" }}>Role alignment</span>
            </div>
            <div style={{ background: "#f0fdf4", padding: "14px", borderRadius: "12px", border: "1px solid #dcfce7" }}>
              <span style={{ fontSize: "12px", color: "#166534", fontWeight: 600 }}>Skills Volume (20%)</span>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#16a34a" }}>{cri.breakdown.skills_score}</div>
              <span style={{ fontSize: "11px", color: "#166534" }}>Technical breadth</span>
            </div>
            <div style={{ background: "#faf5ff", padding: "14px", borderRadius: "12px", border: "1px solid #f3e8ff" }}>
              <span style={{ fontSize: "12px", color: "#6b21a8", fontWeight: 600 }}>Projects Volume (10%)</span>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#9333ea" }}>{cri.breakdown.projects_score}</div>
              <span style={{ fontSize: "11px", color: "#6b21a8" }}>Practical execution</span>
            </div>
            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "12px", color: "#334155", fontWeight: 600 }}>Skill Coverage (10%)</span>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#475569" }}>{cri.breakdown.skill_coverage}%</div>
              <span style={{ fontSize: "11px", color: "#475569" }}>Required vs acquired</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Candidate Summary */}
      {resume_analysis?.summary && (
        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "26px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3 style={{ margin: "0 0 10px", color: "#1e293b", fontSize: "18px", fontWeight: 700 }}>
            👤 Professional Summary
          </h3>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.7, fontSize: "15px" }}>
            {resume_analysis.summary}
          </p>
        </div>
      )}

      {/* 4. Skills & Missing Skills Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Extracted Skills */}
        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "26px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
            border: "1px solid #fed7aa",
          }}
        >
          <h3 style={{ margin: "0 0 16px", color: "#1e293b", fontSize: "18px", fontWeight: 700 }}>
            🧠 Identified Skills ({resume_analysis.skills?.length || 0})
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {resume_analysis.skills && resume_analysis.skills.map((skill, index) => (
              <span
                key={index}
                style={{
                  background: "#fff7ed",
                  color: "#c2410c",
                  border: "1px solid #ffedd5",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Skill Gaps */}
        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "26px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
            border: "1px solid #fee2e2",
          }}
        >
          <h3 style={{ margin: "0 0 16px", color: "#991b1b", fontSize: "18px", fontWeight: 700 }}>
            🧩 Skill Gaps ({resume_analysis?.missing_skills?.length || 0})
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {resume_analysis?.missing_skills?.length ? (
              resume_analysis.missing_skills.map((skill, index) => (
                <span
                  key={index}
                  style={{
                    background: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  + {skill}
                </span>
              ))
            ) : (
              <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>
                No critical skill gaps identified.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 5. ISSUE 2 FIX: Extracted Projects Section */}
      {resume_analysis?.projects && resume_analysis.projects.length > 0 && (
        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "26px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span style={{ fontSize: "22px" }}>🚀</span>
            <h3 style={{ margin: 0, color: "#1e293b", fontSize: "18px", fontWeight: 700 }}>
              Extracted Projects ({resume_analysis.projects.length})
            </h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
            {resume_analysis.projects.map((project, idx) => (
              <div
                key={idx}
                style={{
                  background: "#fafaf9",
                  border: "1px solid #e7e5e4",
                  borderRadius: "14px",
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      background: "#ffedd5",
                      color: "#c2410c",
                      fontSize: "11px",
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: "10px",
                    }}
                  >
                    PROJECT #{idx + 1}
                  </span>
                </div>
                <p style={{ margin: 0, color: "#334155", fontSize: "14px", lineHeight: 1.6, fontWeight: 500 }}>
                  {project}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. ISSUE 2 FIX: Extracted Experience & Education Section */}
      {((resume_analysis?.experience && resume_analysis.experience.length > 0) ||
        (resume_analysis?.education && resume_analysis.education.length > 0)) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          {/* Work / Practical Experience */}
          {resume_analysis?.experience && resume_analysis.experience.length > 0 && (
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "26px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <span style={{ fontSize: "22px" }}>💼</span>
                <h3 style={{ margin: 0, color: "#1e293b", fontSize: "18px", fontWeight: 700 }}>
                  Experience & Roles ({resume_analysis.experience.length})
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {resume_analysis.experience.map((exp, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "14px 18px",
                      fontSize: "14px",
                      color: "#334155",
                      lineHeight: 1.5,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <span style={{ color: "#2563eb", fontWeight: 700 }}>•</span>
                    <span>{exp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {resume_analysis?.education && resume_analysis.education.length > 0 && (
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "26px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <span style={{ fontSize: "22px" }}>🎓</span>
                <h3 style={{ margin: 0, color: "#1e293b", fontSize: "18px", fontWeight: 700 }}>
                  Academic Background
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {resume_analysis.education.map((edu, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "12px",
                      padding: "14px 18px",
                      fontSize: "14px",
                      color: "#166534",
                      lineHeight: 1.5,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span>
                    <span>{edu}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. Job Match Alignment (if present) */}
      {job_match && (
        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "26px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
            border: "1px solid #bfdbfe",
          }}
        >
          <h3 style={{ margin: "0 0 16px", color: "#1e3a8a", fontSize: "18px", fontWeight: 700 }}>
            💼 Target Job Description Alignment
          </h3>

          <div style={{ marginBottom: "18px" }}>
            <h4 style={{ margin: "0 0 10px", fontSize: "14px", color: "#166534", fontWeight: 600 }}>
              ✓ Matching Skills for Role:
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {job_match.matching_skills?.map((skill, idx) => (
                <span
                  key={idx}
                  style={{
                    background: "#f0fdf4",
                    color: "#15803d",
                    border: "1px solid #bbf7d0",
                    padding: "5px 12px",
                    borderRadius: "16px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {job_match.recommendations?.length > 0 && (
            <div>
              <h4 style={{ margin: "0 0 10px", fontSize: "14px", color: "#1e293b", fontWeight: 600 }}>
                💡 Recommendations for this Position:
              </h4>
              <ul style={{ margin: 0, paddingLeft: "20px", color: "#475569", lineHeight: 1.7 }}>
                {job_match.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 8. Actionable Improvement Suggestions */}
      {resume_analysis?.improvement_suggestions && resume_analysis.improvement_suggestions.length > 0 && (
        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "26px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
            border: "1px solid #fed7aa",
          }}
        >
          <h3 style={{ margin: "0 0 16px", color: "#c2410c", fontSize: "18px", fontWeight: 700 }}>
            💡 Actionable Resume & Career Improvement Suggestions
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {resume_analysis.improvement_suggestions.map((suggestion, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: "12px",
                  background: "#fffaf5",
                  padding: "14px 18px",
                  borderRadius: "12px",
                  border: "1px solid #ffedd5",
                  fontSize: "14px",
                  color: "#475569",
                  lineHeight: 1.5,
                }}
              >
                <span style={{ color: "#ea580c", fontWeight: 700 }}>#{index + 1}</span>
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
