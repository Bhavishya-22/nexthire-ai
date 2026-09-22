import { useState } from "react";
import { analyzeResume, type AnalysisResponse } from "../services/api";
import ScoreCard from "./ScoreCard";

interface ResumeUploadProps {
  onBack?: () => void;
}

export default function ResumeUpload({ onBack }: ResumeUploadProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse["data"] | null>(null);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a valid PDF file.");
      setSelectedFile(null);
      return;
    }

    setError("");
    setSelectedFile(file);
    setResult(null);
  }

  async function handleAnalyze() {
    if (!selectedFile) {
      setError("Please upload a PDF resume first.");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);

    try {
      const response = await analyzeResume(selectedFile, jobDescription);
      setResult(response.data);
    } catch (err: any) {
      console.error("Resume analysis failed:", err);
      const detail =
        err.response?.data?.detail ||
        "Resume analysis failed. Please verify the backend is running and try again.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "40px 24px 80px",
        minHeight: "80vh",
      }}
    >
      {/* Top Header & Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                background: "white",
                border: "1px solid #fed7aa",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#ff6b00",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "12px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              }}
            >
              ← Back to Overview
            </button>
          )}
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#1e293b",
              margin: 0,
            }}
          >
            AI Resume & Career Analysis
          </h1>
          <p style={{ color: "#64748b", margin: "6px 0 0", fontSize: "16px" }}>
            Upload your PDF resume to extract skills, evaluate ATS compatibility,
            and calculate your Career Readiness Index.
          </p>
        </div>
      </div>

      {/* Upload Controls Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
          marginBottom: "36px",
        }}
      >
        {/* PDF File Card */}
        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "28px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
            border: "1px solid #ffedd5",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span style={{ fontSize: "24px" }}>📄</span>
            <h3 style={{ margin: 0, fontSize: "18px", color: "#1e293b" }}>
              Upload Resume (PDF)
            </h3>
          </div>

          <div
            style={{
              border: "2px dashed #fdba74",
              borderRadius: "14px",
              padding: "24px",
              textAlign: "center",
              background: "#fffaf5",
              cursor: "pointer",
            }}
          >
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              disabled={loading}
              id="resume-file-input"
              style={{ display: "none" }}
            />
            <label
              htmlFor="resume-file-input"
              style={{ cursor: loading ? "not-allowed" : "pointer", display: "block" }}
            >
              <div style={{ fontSize: "40px", marginBottom: "8px" }}>📂</div>
              <p style={{ margin: "0 0 6px", fontWeight: 600, color: "#ff6b00" }}>
                {selectedFile ? selectedFile.name : "Click to select a PDF resume"}
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
                Supports standard PDF files up to 10MB
              </p>
            </label>
          </div>

          {selectedFile && (
            <div
              style={{
                marginTop: "14px",
                padding: "10px 14px",
                background: "#f0fdf4",
                borderRadius: "10px",
                border: "1px solid #bbf7d0",
                color: "#166534",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>✓</span>
              <span>
                Ready: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          )}
        </div>

        {/* Job Description Card */}
        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "28px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
            border: "1px solid #ffedd5",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span style={{ fontSize: "24px" }}>💼</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#1e293b" }}>
                Target Job Description
              </h3>
              <span style={{ fontSize: "12px", color: "#f97316", fontWeight: 600 }}>
                Optional — unlocks tailored Job Match & CRI
              </span>
            </div>
          </div>

          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste a job description or requirements here to calculate role compatibility..."
            rows={5}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              fontFamily: "inherit",
              fontSize: "14px",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
              flex: 1,
            }}
          />
        </div>
      </div>

      {/* Action Button & Feedback */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading || !selectedFile}
          style={{
            background:
              loading || !selectedFile
                ? "#cbd5e1"
                : "linear-gradient(90deg, #ff6b00, #ff3d00)",
            color: "white",
            border: "none",
            borderRadius: "14px",
            padding: "16px 48px",
            fontSize: "17px",
            fontWeight: 700,
            cursor: loading || !selectedFile ? "not-allowed" : "pointer",
            boxShadow:
              loading || !selectedFile
                ? "none"
                : "0 10px 25px rgba(255, 107, 0, 0.3)",
            transition: "all 0.25s ease",
          }}
        >
          {loading ? "Analyzing Resume with AI..." : "Run AI Career Analysis"}
        </button>

        {loading && (
          <div style={{ marginTop: "16px", color: "#ea580c", fontWeight: 600, fontSize: "14px" }}>
            Extracting text and generating career intelligence with Gemini...
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: "16px",
              maxWidth: "600px",
              margin: "16px auto 0",
              padding: "12px 18px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "10px",
              color: "#b91c1c",
              fontSize: "14px",
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Analysis Results Display */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Key Score Highlights */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            {result.resume_analysis && (
              <ScoreCard
                title="ATS Score"
                score={result.resume_analysis.ats_score}
                badgeText={
                  result.resume_analysis.ats_score >= 80
                    ? "ATS Optimized"
                    : result.resume_analysis.ats_score >= 60
                    ? "Moderate"
                    : "Needs Polish"
                }
                subtitle="Resume parseability & keyword density"
                color="orange"
              />
            )}

            {result.job_match && (
              <ScoreCard
                title="Job Compatibility"
                score={result.job_match.match_score}
                badgeText={
                  result.job_match.match_score >= 75
                    ? "High Fit"
                    : result.job_match.match_score >= 50
                    ? "Medium Fit"
                    : "Low Fit"
                }
                subtitle="Alignment with target role"
                color="blue"
              />
            )}

            {result.cri && (
              <ScoreCard
                title="Career Readiness Index"
                score={result.cri.cri_score}
                badgeText={result.cri.readiness_level}
                subtitle={`Composite readiness: ${result.cri.readiness_level}`}
                color="green"
              />
            )}
          </div>

          {/* Detailed CRI Breakdown (if available) */}
          {result.cri && (
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "28px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
                border: "1px solid #e2e8f0",
              }}
            >
              <h3 style={{ margin: "0 0 16px", color: "#1e293b", fontSize: "18px" }}>
                🎯 Career Readiness Index (CRI) Breakdown
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "16px",
                }}
              >
                <div style={{ background: "#fff7ed", padding: "14px", borderRadius: "12px" }}>
                  <span style={{ fontSize: "12px", color: "#9a3412", fontWeight: 600 }}>ATS Weight (30%)</span>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#ea580c" }}>
                    {result.cri.breakdown.ats_score}
                  </div>
                </div>
                <div style={{ background: "#eff6ff", padding: "14px", borderRadius: "12px" }}>
                  <span style={{ fontSize: "12px", color: "#1e40af", fontWeight: 600 }}>Job Match (30%)</span>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#2563eb" }}>
                    {result.cri.breakdown.job_match_score}
                  </div>
                </div>
                <div style={{ background: "#f0fdf4", padding: "14px", borderRadius: "12px" }}>
                  <span style={{ fontSize: "12px", color: "#166534", fontWeight: 600 }}>Skills Volume (20%)</span>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#16a34a" }}>
                    {result.cri.breakdown.skills_score}
                  </div>
                </div>
                <div style={{ background: "#faf5ff", padding: "14px", borderRadius: "12px" }}>
                  <span style={{ fontSize: "12px", color: "#6b21a8", fontWeight: 600 }}>Projects Volume (10%)</span>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#9333ea" }}>
                    {result.cri.breakdown.projects_score}
                  </div>
                </div>
                <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px" }}>
                  <span style={{ fontSize: "12px", color: "#334155", fontWeight: 600 }}>Skill Coverage (10%)</span>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "#475569" }}>
                    {result.cri.breakdown.skill_coverage}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Professional Summary */}
          {result.resume_analysis?.summary && (
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "28px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
                border: "1px solid #e2e8f0",
              }}
            >
              <h3 style={{ margin: "0 0 12px", color: "#1e293b", fontSize: "18px" }}>
                👤 Candidate Summary
              </h3>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.7, fontSize: "15px" }}>
                {result.resume_analysis.summary}
              </p>
            </div>
          )}

          {/* Skills & Missing Skills Grid */}
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
                padding: "28px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
                border: "1px solid #e2e8f0",
              }}
            >
              <h3 style={{ margin: "0 0 16px", color: "#1e293b", fontSize: "18px" }}>
                🧠 Identified Skills ({result.resume_analysis?.skills?.length || 0})
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {result.resume_analysis?.skills?.map((skill: string, index: number) => (
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

            {/* Missing Skills */}
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "28px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
                border: "1px solid #fee2e2",
              }}
            >
              <h3 style={{ margin: "0 0 16px", color: "#991b1b", fontSize: "18px" }}>
                🧩 Skill Gaps ({result.resume_analysis?.missing_skills?.length || 0})
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {result.resume_analysis?.missing_skills?.length ? (
                  result.resume_analysis.missing_skills.map((skill: string, index: number) => (
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

          {/* Job Match Analysis (if available) */}
          {result.job_match && (
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "28px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
                border: "1px solid #bfdbfe",
              }}
            >
              <h3 style={{ margin: "0 0 16px", color: "#1e3a8a", fontSize: "18px" }}>
                💼 Job Description Alignment
              </h3>

              <div style={{ marginBottom: "18px" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: "14px", color: "#166534" }}>
                  ✓ Matching Skills:
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {result.job_match.matching_skills?.map((skill: string, idx: number) => (
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

              {result.job_match.recommendations?.length > 0 && (
                <div>
                  <h4 style={{ margin: "0 0 10px", fontSize: "14px", color: "#1e293b" }}>
                    💡 Recommendations for this Position:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "20px", color: "#475569", lineHeight: 1.7 }}>
                    {result.job_match.recommendations.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Improvement Suggestions */}
          {result.resume_analysis?.improvement_suggestions?.length > 0 && (
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "28px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
                border: "1px solid #fed7aa",
              }}
            >
              <h3 style={{ margin: "0 0 16px", color: "#c2410c", fontSize: "18px" }}>
                💡 Actionable Improvement Suggestions
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {result.resume_analysis.improvement_suggestions.map(
                  (suggestion: string, index: number) => (
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
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}