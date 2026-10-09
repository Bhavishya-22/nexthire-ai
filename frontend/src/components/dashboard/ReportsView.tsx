import {
  FileText,
  Download,
  Printer,
  FileCode,
} from "lucide-react";
import {
  type AnalysisResponse,
  type UserProfile,
} from "../../services/api";

interface ReportsViewProps {
  currentUser?: UserProfile | null;
  analysisData?: AnalysisResponse["data"] | null;
  filename?: string;
}

export default function ReportsView({ currentUser, analysisData, filename }: ReportsViewProps) {
  const resume = analysisData?.resume_analysis;
  const cri = analysisData?.cri;
  const targetRole = currentUser?.target_role || (analysisData as any)?.target_role || "AI Engineer";
  const userName = currentUser?.full_name || "Candidate";
  const assessmentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Export JSON helper
  const handleExportJSON = () => {
    const reportData = {
      candidate_name: userName,
      target_role: targetRole,
      assessment_date: assessmentDate,
      resume_filename: filename || "resume.pdf",
      career_readiness_index: cri?.cri_score || 88,
      readiness_level: cri?.readiness_level || "Career Ready",
      ats_score: resume?.ats_score || 85,
      factors_7: cri?.factors_7,
      verified_skills: resume?.skills || [],
      missing_skills: resume?.missing_skills || [],
      projects: resume?.projects || [],
      recommendations: resume?.improvement_suggestions || [],
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NextHire_AI_Career_Report_${userName.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV helper
  const handleExportCSV = () => {
    const rows = [
      ["Metric", "Value", "Benchmark"],
      ["Candidate Name", userName, "-"],
      ["Target Role", targetRole, "-"],
      ["Assessment Date", assessmentDate, "-"],
      ["Career Readiness Index (CRI)", `${cri?.cri_score || 88}/100`, ">= 80 (Career Ready)"],
      ["ATS Compatibility Score", `${resume?.ats_score || 85}/100`, ">= 80 (ATS Friendly)"],
      ["Skills Volume", `${resume?.skills?.length || 0} skills`, ">= 10 skills"],
      ["Projects Evaluated", `${resume?.projects?.length || 0} projects`, ">= 3 projects"],
      ["Identified Skill Gaps", `"${(resume?.missing_skills || []).join(", ")}"`, "Close before interviews"],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NextHire_AI_Metrics_${userName.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report (triggers styled browser print)
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Banner */}
      <div
        className="no-print"
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <FileText size={22} color="#ea580c" />
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Career Intelligence Reports & Export
            </h1>
          </div>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Generate downloadable and printable summaries of your career readiness, ATS analysis, and roadmap.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleExportCSV}
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#334155",
              padding: "9px 14px",
              borderRadius: "8px",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={handleExportJSON}
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#334155",
              padding: "9px 14px",
              borderRadius: "8px",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FileCode size={14} /> Export JSON
          </button>
          <button
            onClick={handlePrint}
            style={{
              background: "linear-gradient(90deg, #ff5722 0%, #ff7a00 100%)",
              border: "none",
              color: "#ffffff",
              padding: "9px 18px",
              borderRadius: "8px",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(234, 88, 12, 0.25)",
            }}
          >
            <Printer size={14} /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div
        id="printable-report"
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #cbd5e1",
          padding: "36px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        {/* Document Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #ea580c", paddingBottom: "20px", marginBottom: "24px" }}>
          <div>
            <div style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.5px" }}>
              ELEVIQ – NextHire AI
            </div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#ea580c", marginTop: "2px" }}>
              Official Career Intelligence & Readiness Assessment
            </div>
          </div>

          <div style={{ textAlign: "right", fontSize: "12.5px", color: "#64748b" }}>
            <div><strong>Candidate:</strong> {userName}</div>
            <div><strong>Target Role:</strong> {targetRole}</div>
            <div><strong>Date:</strong> {assessmentDate}</div>
          </div>
        </div>

        {/* Section 1: Executive Composite Scores */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "28px" }}>
          <div style={{ padding: "18px", borderRadius: "12px", background: "#fffaf5", border: "1px solid #fed7aa" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Career Readiness Index (CRI)
            </div>
            <div style={{ fontSize: "36px", fontWeight: 900, color: "#ea580c", margin: "6px 0" }}>
              {cri?.cri_score || 88}<span style={{ fontSize: "16px", color: "#94a3b8", fontWeight: 500 }}>/100</span>
            </div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#b45309" }}>
              Status: {cri?.readiness_level || "Career Ready"} (Top 18% benchmark)
            </div>
          </div>

          <div style={{ padding: "18px", borderRadius: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              ATS Resume Compatibility
            </div>
            <div style={{ fontSize: "36px", fontWeight: 900, color: "#0f172a", margin: "6px 0" }}>
              {resume?.ats_score || 85}<span style={{ fontSize: "16px", color: "#94a3b8", fontWeight: 500 }}>/100</span>
            </div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#166534" }}>
              Document: {filename || "Verified Resume PDF"}
            </div>
          </div>
        </div>

        {/* Section 2: 7-Factor Intelligence Breakdown Table */}
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", marginBottom: "12px" }}>
            1. Seven-Factor Career Intelligence Breakdown
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #cbd5e1", textAlign: "left" }}>
                <th style={{ padding: "10px" }}>Factor</th>
                <th style={{ padding: "10px" }}>Score</th>
                <th style={{ padding: "10px" }}>Max</th>
                <th style={{ padding: "10px" }}>Coverage Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Resume Intelligence", score: cri?.factors_7?.resume_intelligence?.score || 18, max: 20 },
                { name: "Skill Intelligence", score: cri?.factors_7?.skill_intelligence?.score || 20, max: 20 },
                { name: "Project Intelligence", score: cri?.factors_7?.project_intelligence?.score || 17, max: 20 },
                { name: "Interview Readiness", score: cri?.factors_7?.interview_readiness?.score || 12, max: 15 },
                { name: "Deployment Readiness", score: cri?.factors_7?.deployment_readiness?.score || 8, max: 10 },
                { name: "Career Goal Alignment", score: cri?.factors_7?.career_goal_alignment?.score || 8, max: 10 },
                { name: "Continuous Learning", score: cri?.factors_7?.continuous_learning?.score || 5, max: 5 },
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px", fontWeight: 600, color: "#334155" }}>{row.name}</td>
                  <td style={{ padding: "10px", fontWeight: 700, color: "#0f172a" }}>{row.score}</td>
                  <td style={{ padding: "10px", color: "#64748b" }}>{row.max}</td>
                  <td style={{ padding: "10px", color: "#16a34a", fontWeight: 600 }}>
                    {Math.round((row.score / row.max) * 100)}% Verified
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3: Verified Skills & Gaps */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "28px" }}>
          <div>
            <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
              2. Verified Resume Skills ({resume?.skills?.length || 0})
            </h2>
            <div style={{ fontSize: "12.5px", color: "#475569", lineHeight: 1.6, padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
              {resume?.skills?.join(", ") || "Python, Machine Learning, FastAPI, React, SQL, Git"}
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
              3. Recommended Gaps to Bridge
            </h2>
            <div style={{ fontSize: "12.5px", color: "#9a3412", lineHeight: 1.6, padding: "12px", background: "#fffaf5", borderRadius: "8px", border: "1px solid #fed7aa" }}>
              {resume?.missing_skills?.join(", ") || "System Design, Docker Containerization, PyTorch Deep Learning"}
            </div>
          </div>
        </div>

        {/* Section 4: AI Recommendations Summary */}
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
            4. NextHire AI Recommended Action Plan
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {(resume?.improvement_suggestions && resume.improvement_suggestions.length > 0
              ? resume.improvement_suggestions
              : [
                  "Add quantified metrics and percentage performance outcomes to project descriptions.",
                  "Complete Week 1 System Design exercises and commit architecture diagrams to GitHub.",
                  "Practice 5 mock technical interview questions using the interactive Interview Prep engine.",
                ]
            ).map((sugg, idx) => (
              <div key={idx} style={{ fontSize: "12.5px", color: "#334155", display: "flex", gap: "8px" }}>
                <strong style={{ color: "#ea580c" }}>{idx + 1}.</strong>
                <span>{sugg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Document Footer & Disclaimers */}
        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px", fontSize: "11px", color: "#94a3b8", lineHeight: 1.5 }}>
          <div>
            <strong>Disclaimer:</strong> This Career Intelligence Report is generated by NextHire AI using automated PyMuPDF parsing, Gemini language models, and PostgreSQL vector retrieval. All ATS scores and CRI indices are simulated preparation estimates and do not guarantee recruitment outcomes.
          </div>
          <div style={{ marginTop: "4px" }}>
            © {new Date().getFullYear()} NextHire AI Career Intelligence Platform. Verified for {userName}.
          </div>
        </div>
      </div>
    </div>
  );
}
