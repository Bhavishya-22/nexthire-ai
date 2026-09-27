import { useState } from "react";
import { analyzeResume, type AnalysisResponse } from "../services/api";
import CareerDashboard from "./CareerDashboard";

interface ResumeUploadProps {
  onBack?: () => void;
  onAnalysisSuccess?: (data: AnalysisResponse["data"], filename: string) => void;
  onAskAssistant?: () => void;
}

export default function ResumeUpload({
  onBack,
  onAnalysisSuccess,
  onAskAssistant,
}: ResumeUploadProps) {
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
      if (onAnalysisSuccess) {
        onAnalysisSuccess(response.data, selectedFile.name);
      }
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
        maxWidth: "1150px",
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

      {/* Dynamic Results Dashboard */}
      {result && (
        <CareerDashboard
          analysisData={result}
          filename={selectedFile?.name}
          onAskAssistant={onAskAssistant}
        />
      )}
    </div>
  );
}