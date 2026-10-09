import React, { useState } from "react";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Briefcase,
  User,
  AlertCircle,
} from "lucide-react";
import {
  analyzeAndOnboard,
  type AnalysisResponse,
  type UserProfile,
} from "../services/api";

interface OnboardingProps {
  currentUser: UserProfile | null;
  onOnboardingComplete: (data: AnalysisResponse["data"], filename: string) => void;
  onLogout?: () => void;
}

const TARGET_ROLE_SUGGESTIONS = [
  "AI Engineer",
  "Machine Learning Engineer",
  "Software Engineer",
  "Data Scientist",
  "Full Stack Developer",
  "Cloud Engineer",
];

export default function Onboarding({
  currentUser,
  onOnboardingComplete,
  onLogout,
}: OnboardingProps) {
  const [fullName, setFullName] = useState(currentUser?.full_name || "");
  const [targetRole, setTargetRole] = useState(currentUser?.target_role || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [error, setError] = useState("");

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file?: File) => {
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a valid PDF resume file (.pdf).");
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit. Please choose a smaller PDF.");
      setSelectedFile(null);
      return;
    }

    setError("");
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please provide your full name.");
      return;
    }

    if (!targetRole.trim()) {
      setError("Please specify your target job role (e.g., AI Engineer).");
      return;
    }

    if (!selectedFile) {
      setError("Please upload your PDF resume to continue.");
      return;
    }

    setLoading(true);
    setLoadingStage("Uploading resume & extracting text via PyMuPDF...");

    const t1 = setTimeout(() => {
      setLoadingStage("Analyzing career profile, skills & ATS score via Gemini...");
    }, 1200);

    const t2 = setTimeout(() => {
      setLoadingStage("Calculating Career Readiness Index (CRI) & auto-indexing into RAG...");
    }, 2800);

    try {
      const res = await analyzeAndOnboard(selectedFile, fullName, targetRole);

      clearTimeout(t1);
      clearTimeout(t2);

      if (res.success && res.data) {
        onOnboardingComplete(res.data, selectedFile.name);
      } else {
        setError("Failed to complete resume onboarding. Please try again.");
      }
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Resume processing failed. Please verify the PDF has readable text and try again.";
      setError(typeof detail === "string" ? detail : JSON.stringify(detail));
    } finally {
      setLoading(false);
      setLoadingStage("");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #fffbf5 0%, #fff4e6 50%, #fed7aa 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Top Header / Branding */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            background: "#ffffff",
            padding: "8px 18px",
            borderRadius: "30px",
            border: "1px solid #fed7aa",
            boxShadow: "0 4px 14px rgba(254, 215, 170, 0.4)",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #ff5722, #ff7a00)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={16} color="#ffffff" />
          </div>
          <span style={{ fontSize: "14px", fontWeight: 800, color: "#c2410c" }}>
            Step 2 of 3 • Resume Onboarding
          </span>
        </div>

        <h1
          style={{
            fontSize: "30px",
            fontWeight: 900,
            color: "#0f172a",
            margin: "0 0 10px",
            letterSpacing: "-0.5px",
          }}
        >
          Let's Build Your Career Profile
        </h1>
        <p style={{ margin: 0, color: "#64748b", fontSize: "15px", maxWidth: "520px", lineHeight: 1.5 }}>
          Upload your resume. Our AI will automatically extract your skills, calculate your{" "}
          <strong>Career Readiness Index (CRI)</strong>, and build your personalized knowledge base.
        </p>
      </div>

      {/* Main Form Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          background: "#ffffff",
          borderRadius: "24px",
          padding: "36px 32px",
          boxShadow: "0 20px 50px -12px rgba(234, 88, 12, 0.15), 0 4px 16px rgba(0,0,0,0.03)",
          border: "1px solid #ffedd5",
        }}
      >
        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fee2e2",
              borderRadius: "14px",
              padding: "14px 16px",
              color: "#b91c1c",
              fontSize: "13.5px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div style={{ flex: 1, lineHeight: 1.45 }}>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          {/* Field 1: Full Name */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13.5px",
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: "8px",
              }}
            >
              Full Name <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <User
                size={18}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                type="text"
                placeholder="e.g. Alex Rivera"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 42px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14.5px",
                  outline: "none",
                  boxSizing: "border-box",
                  color: "#0f172a",
                  transition: "border 0.15s, box-shadow 0.15s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#f97316";
                  e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#cbd5e1";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {/* Field 2: Target Job Role */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13.5px",
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: "8px",
              }}
            >
              Job Interest / Target Career Role <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div style={{ position: "relative", marginBottom: "10px" }}>
              <Briefcase
                size={18}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                type="text"
                placeholder="e.g. AI Engineer or Machine Learning Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 42px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14.5px",
                  outline: "none",
                  boxSizing: "border-box",
                  color: "#0f172a",
                  transition: "border 0.15s, box-shadow 0.15s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#f97316";
                  e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#cbd5e1";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Target Role Suggestion Pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {TARGET_ROLE_SUGGESTIONS.map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => setTargetRole(role)}
                  disabled={loading}
                  style={{
                    background: targetRole === role ? "#fff7ed" : "#f8fafc",
                    border: `1px solid ${targetRole === role ? "#fdba74" : "#e2e8f0"}`,
                    color: targetRole === role ? "#ea580c" : "#475569",
                    padding: "4px 10px",
                    borderRadius: "16px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Field 3: Resume PDF Upload */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13.5px",
                fontWeight: 700,
                color: "#1e293b",
                marginBottom: "8px",
              }}
            >
              Resume PDF Document <span style={{ color: "#ef4444" }}>*</span>
            </label>

            {!selectedFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                style={{
                  border: `2px dashed ${isDragging ? "#ea580c" : "#fdba74"}`,
                  borderRadius: "16px",
                  background: isDragging ? "#fff7ed" : "#fffbf5",
                  padding: "32px 20px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onClick={() => document.getElementById("resume-input-file")?.click()}
              >
                <input
                  id="resume-input-file"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                  disabled={loading}
                />
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "#ffedd5",
                    color: "#ea580c",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <Upload size={22} />
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                  Drag & drop your resume here, or{" "}
                  <span style={{ color: "#ea580c", textDecoration: "underline" }}>browse files</span>
                </div>
                <div style={{ fontSize: "12.5px", color: "#64748b" }}>
                  Only PDF documents supported (up to 10MB)
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "14px",
                  padding: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "#dcfce7",
                      color: "#16a34a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileText size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#14532d" }}>
                      {selectedFile.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#15803d" }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB • Ready for AI Analysis
                    </div>
                  </div>
                </div>

                {!loading && (
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "6px 10px",
                      color: "#64748b",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    title="Remove or replace file"
                  >
                    <X size={14} />
                    <span>Replace</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Progress Indicator */}
          {loading && (
            <div
              style={{
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                borderRadius: "14px",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  border: "2px solid #ea580c",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  flexShrink: 0,
                }}
              />
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#c2410c" }}>
                {loadingStage || "Processing resume..."}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "6px",
              background: loading
                ? "#fdba74"
                : "linear-gradient(90deg, #ff5722 0%, #ff7a00 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "14px",
              padding: "15px 24px",
              fontSize: "15px",
              fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 8px 20px rgba(255, 87, 34, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {loading ? (
              <span>Analyzing Resume & Building Profile...</span>
            ) : (
              <>
                <span>Analyze Resume & Continue</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Back / Sign Out option */}
        {onLogout && (
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              type="button"
              onClick={onLogout}
              disabled={loading}
              style={{
                background: "none",
                border: "none",
                color: "#64748b",
                fontSize: "12.5px",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Sign out and return to login
            </button>
          </div>
        )}
      </div>

      {/* Info note */}
      <div
        style={{
          marginTop: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#94a3b8",
          fontSize: "12px",
        }}
      >
        <CheckCircle2 size={14} color="#16a34a" />
        <span>Skills, projects, and work experience will be parsed automatically. No manual entry needed.</span>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
