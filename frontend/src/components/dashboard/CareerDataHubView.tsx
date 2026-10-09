import { useState } from "react";
import {
  FileText,
  Upload,
  CheckCircle2,
  Edit3,
  Layers,
  GraduationCap,
  Briefcase,
  Sparkles,
  Save,
  Clock,
  Plus,
  Trash2,
} from "lucide-react";
import {
  updateUserProfile,
  type AnalysisResponse,
  type UserProfile,
} from "../../services/api";

interface CareerDataHubViewProps {
  currentUser?: UserProfile | null;
  analysisData?: AnalysisResponse["data"] | null;
  filename?: string;
  onStartUpload?: () => void;
  onOpenEditProfile: () => void;
  onDataUpdated?: (updatedData: AnalysisResponse["data"]) => void;
}

export default function CareerDataHubView({
  currentUser,
  analysisData,
  filename,
  onStartUpload,
  onOpenEditProfile,
  onDataUpdated,
}: CareerDataHubViewProps) {
  const resume = analysisData?.resume_analysis;
  const currentFilename = filename || (analysisData as any)?.filename || currentUser?.resume_filename || "Uploaded_Resume.pdf";

  // Editable lists
  const [skills, setSkills] = useState<string[]>(resume?.skills || []);
  const [newSkill, setNewSkill] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSaveData = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await updateUserProfile({
        technical_skills: skills,
      });
      setSaveSuccess(true);
      if (onDataUpdated) {
        onDataUpdated(res.data);
      }
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error("Failed to save data changes:", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Banner Card */}
      <div
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
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "#ffedd5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ea580c",
            }}
          >
            <FileText size={28} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {currentFilename}
              </h1>
              <span
                style={{
                  background: "#dcfce7",
                  color: "#166534",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "12px",
                }}
              >
                Active Resume
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "4px", fontSize: "12.5px", color: "#64748b" }}>
              <span>Parsed & Indexed in PostgreSQL / pgvector Knowledge Base</span>
              <span>•</span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Clock size={13} /> ATS Score: <strong style={{ color: "#ea580c" }}>{resume?.ats_score || 85}/100</strong>
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onStartUpload}
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#334155",
              padding: "9px 16px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Upload size={15} /> Upload / Replace Resume
          </button>
          <button
            onClick={onOpenEditProfile}
            style={{
              background: "linear-gradient(90deg, #ff5722 0%, #ff7a00 100%)",
              border: "none",
              color: "#ffffff",
              padding: "9px 18px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(234, 88, 12, 0.25)",
            }}
          >
            <Edit3 size={15} /> Edit Career Profile
          </button>
        </div>
      </div>

      {/* Grid: Extracted Profile Review & Correction */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
        {/* Left Column: Extracted Skills & Verification */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "22px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Layers size={18} color="#ea580c" />
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Extracted Skills & Competencies ({skills.length})
              </h2>
            </div>
            {saveSuccess && (
              <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                <CheckCircle2 size={14} /> Saved!
              </span>
            )}
          </div>

          <p style={{ fontSize: "12.5px", color: "#64748b", margin: "0 0 14px" }}>
            Review AI-extracted skills from your resume. You can add missing skills or remove incorrect tags, then save updates.
          </p>

          {/* Add skill input */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
              placeholder="Add skill (e.g. Docker, PyTorch)..."
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
              }}
            />
            <button
              onClick={handleAddSkill}
              style={{
                background: "#ffedd5",
                border: "1px solid #fed7aa",
                color: "#ea580c",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Plus size={14} /> Add
            </button>
          </div>

          {/* Skill tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "18px" }}>
            {skills.map((skill) => (
              <span
                key={skill}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                  color: "#c2410c",
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "16px",
                }}
              >
                {skill}
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    color: "#94a3b8",
                    cursor: "pointer",
                    display: "flex",
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
          </div>

          <button
            onClick={handleSaveData}
            disabled={isSaving}
            style={{
              background: "#0f172a",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Save size={14} /> {isSaving ? "Saving..." : "Save Verified Skills"}
          </button>
        </div>

        {/* Right Column: Education & Experience Breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Education Card */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <GraduationCap size={18} color="#ea580c" />
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Education Records
              </h2>
            </div>
            {resume?.education && resume.education.length > 0 ? (
              resume.education.map((edu, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "#f8fafc",
                    border: "1px solid #f1f5f9",
                    fontSize: "13px",
                    color: "#334155",
                    marginBottom: "8px",
                  }}
                >
                  {edu}
                </div>
              ))
            ) : (
              <div style={{ fontSize: "13px", color: "#94a3b8" }}>No formal education records parsed.</div>
            )}
          </div>

          {/* Experience / Internships Card */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Briefcase size={18} color="#ea580c" />
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Work Experience & Internships
              </h2>
            </div>
            {resume?.experience && resume.experience.length > 0 ? (
              resume.experience.map((exp, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "#f8fafc",
                    border: "1px solid #f1f5f9",
                    fontSize: "13px",
                    color: "#334155",
                    marginBottom: "8px",
                  }}
                >
                  {typeof exp === "string" ? exp : JSON.stringify(exp)}
                </div>
              ))
            ) : (
              <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                Candidate categorized as Fresher / Student.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Projects Extracted Review */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "22px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <Sparkles size={18} color="#ea580c" />
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Extracted Projects & Achievements
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "14px" }}>
          {resume?.projects && resume.projects.length > 0 ? (
            resume.projects.map((proj, idx) => {
              const text = typeof proj === "string" ? proj : (proj as any).name || (proj as any).title;
              return (
                <div
                  key={idx}
                  style={{
                    padding: "14px",
                    borderRadius: "12px",
                    background: "#fffaf5",
                    border: "1px solid #ffedd5",
                  }}
                >
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#9a3412", marginBottom: "4px" }}>
                    Project {idx + 1}
                  </div>
                  <div style={{ fontSize: "13px", color: "#334155", lineHeight: 1.5 }}>
                    {text}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ fontSize: "13px", color: "#94a3b8" }}>No projects extracted from resume.</div>
          )}
        </div>
      </div>
    </div>
  );
}
