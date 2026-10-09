import React, { useState } from "react";
import {
  X,
  User,
  GraduationCap,
  Briefcase,
  Layers,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Upload,
} from "lucide-react";
import {
  updateUserProfile,
  type UserProfile,
  type AnalysisResponse,
} from "../../services/api";

interface EditProfileModalProps {
  currentUser?: UserProfile | null;
  analysisData?: AnalysisResponse["data"] | null;
  filename?: string;
  onClose: () => void;
  onSuccess: (updatedUser: UserProfile, updatedAnalysis: AnalysisResponse["data"]) => void;
  onStartUpload?: () => void;
}

export default function EditProfileModal({
  currentUser,
  analysisData,
  filename,
  onClose,
  onSuccess,
  onStartUpload,
}: EditProfileModalProps) {
  const resume = analysisData?.resume_analysis;
  const preferences = (analysisData as any)?.preferences || {};

  // Form states
  const [activeTab, setActiveTab] = useState<"personal" | "education" | "career" | "skills" | "resume">("personal");

  // Personal Info
  const [fullName, setFullName] = useState(currentUser?.full_name || "");
  const email = currentUser?.email || "";

  // Education
  const existingEdu = resume?.education?.[0] || "";
  const [degree, setDegree] = useState(preferences.degree || (existingEdu.split(" - ")[0] || "B.Tech CSE"));
  const [college, setCollege] = useState(preferences.college || (existingEdu.split(" - ")[1]?.split(" (")[0] || "University"));
  const [gradYear, setGradYear] = useState(preferences.grad_year || "2026");
  const [educationDetails, setEducationDetails] = useState(preferences.education_details || existingEdu);

  // Career Preferences
  const [targetRole, setTargetRole] = useState(currentUser?.target_role || (analysisData as any)?.target_role || "AI Engineer");
  const [experienceLevel, setExperienceLevel] = useState<string>(preferences.experience_level || "Fresher");
  const [preferredLocations, setPreferredLocations] = useState<string>(
    (preferences.preferred_locations || ["Bengaluru", "Hyderabad", "Remote"]).join(", ")
  );
  const [preferredJobType, setPreferredJobType] = useState<string>(preferences.preferred_job_type || "Full-time");
  const [careerGoal, setCareerGoal] = useState<string>(
    preferences.career_goal || "Secure a high-impact engineering role in top product companies."
  );
  const [learningHours, setLearningHours] = useState<number>(preferences.learning_hours_per_week || 12);

  // Skills & Professional
  const [techSkills, setTechSkills] = useState<string[]>(
    resume?.skills && resume.skills.length > 0
      ? resume.skills
      : ["Python", "FastAPI", "React", "TypeScript", "Machine Learning", "SQL", "Git"]
  );
  const [newSkillInput, setNewSkillInput] = useState("");
  const [softSkills, setSoftSkills] = useState<string>(
    (preferences.soft_skills || ["Problem Solving", "Communication", "Team Leadership", "Analytical Thinking"]).join(", ")
  );
  const [certifications, setCertifications] = useState<string>(
    (resume?.certifications || ["Google AI Certification", "AWS Cloud Practitioner"]).join(", ")
  );

  // Resume state
  const currentFilename = filename || (analysisData as any)?.filename || currentUser?.resume_filename || "Uploaded_Resume.pdf";

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add Skill Helper
  const handleAddSkill = () => {
    if (newSkillInput.trim() && !techSkills.includes(newSkillInput.trim())) {
      setTechSkills([...techSkills, newSkillInput.trim()]);
      setNewSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setTechSkills(techSkills.filter((s) => s !== skillToRemove));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setError("Full name is required.");
      setActiveTab("personal");
      return;
    }

    if (!targetRole.trim()) {
      setError("Target job role is required.");
      setActiveTab("career");
      return;
    }

    setLoading(true);

    try {
      const locList = preferredLocations
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const softList = softSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const certList = certifications
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        full_name: fullName.trim(),
        target_role: targetRole.trim(),
        experience_level: experienceLevel,
        college: college.trim(),
        degree: degree.trim(),
        grad_year: gradYear.trim(),
        education_details: educationDetails.trim(),
        career_goal: careerGoal.trim(),
        preferred_locations: locList,
        preferred_job_type: preferredJobType,
        learning_hours_per_week: Number(learningHours) || 10,
        technical_skills: techSkills,
        soft_skills: softList,
        certifications: certList,
      };

      const res = await updateUserProfile(payload);
      setSuccessMsg("Profile and preferences saved successfully!");

      // Update parent state after brief animation
      setTimeout(() => {
        onSuccess(res.user, res.data);
      }, 700);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to update profile. Please try again.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "760px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          animation: "fadeIn 0.2s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(90deg, #fffaf5 0%, #ffffff 100%)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "#ffedd5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ea580c",
                }}
              >
                <User size={18} />
              </div>
              <h2 style={{ fontSize: "19px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Edit Career Profile & Preferences
              </h2>
            </div>
            <p style={{ fontSize: "12.5px", color: "#64748b", margin: "4px 0 0 40px" }}>
              Update your details, correct extracted resume items, and refine your target career path.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "50%",
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            padding: "8px 20px",
            borderBottom: "1px solid #f1f5f9",
            background: "#fafafa",
            overflowX: "auto",
          }}
        >
          {[
            { id: "personal", label: "Personal Info", icon: User },
            { id: "education", label: "Education", icon: GraduationCap },
            { id: "career", label: "Career Preferences", icon: Briefcase },
            { id: "skills", label: "Skills & Credentials", icon: Layers },
            { id: "resume", label: "Resume & Documents", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "none",
                  background: isActive ? "#ffffff" : "transparent",
                  color: isActive ? "#ea580c" : "#64748b",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Alerts */}
        {error && (
          <div
            style={{
              margin: "12px 24px 0",
              padding: "10px 14px",
              borderRadius: "8px",
              background: "#fef2f2",
              border: "1px solid #fee2e2",
              color: "#b91c1c",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              margin: "12px 24px 0",
              padding: "10px 14px",
              borderRadius: "8px",
              background: "#f0fdf4",
              border: "1px solid #dcfce7",
              color: "#15803d",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Form Content */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
            {/* TAB 1: PERSONAL INFO */}
            {activeTab === "personal" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Full Name <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Bhavishya Sarvani"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13.5px",
                      color: "#0f172a",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                      Email Address
                    </label>
                    <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Read-only (Authentication ID)</span>
                  </div>
                  <input
                    type="email"
                    value={email}
                    disabled
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      fontSize: "13.5px",
                      color: "#64748b",
                      cursor: "not-allowed",
                    }}
                  />
                </div>

                <div
                  style={{
                    padding: "14px",
                    borderRadius: "12px",
                    background: "#fffaf5",
                    border: "1px solid #ffedd5",
                    fontSize: "12px",
                    color: "#9a3412",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <User size={16} color="#ea580c" />
                  <span>
                    Your personal information is securely stored with user-level tenant isolation in PostgreSQL / SQLite.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: EDUCATION */}
            {activeTab === "education" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Degree / Specialization
                    </label>
                    <input
                      type="text"
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      placeholder="e.g., B.Tech CSE (AI & ML)"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13.5px",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Graduation Year
                    </label>
                    <input
                      type="text"
                      value={gradYear}
                      onChange={(e) => setGradYear(e.target.value)}
                      placeholder="e.g., 2026"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13.5px",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    College / University
                  </label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g., Jawaharlal Nehru Technological University"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13.5px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Education Summary / Coursework Notes
                  </label>
                  <textarea
                    rows={3}
                    value={educationDetails}
                    onChange={(e) => setEducationDetails(e.target.value)}
                    placeholder="Relevant coursework: Data Structures, Machine Learning, Operating Systems..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>
            )}

            {/* TAB 3: CAREER PREFERENCES */}
            {activeTab === "career" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Target Job Role <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g., AI Engineer, Full Stack Developer, Data Scientist"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13.5px",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Experience Level
                    </label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13.5px",
                        background: "#ffffff",
                      }}
                    >
                      <option value="Student">Student (0 Yrs)</option>
                      <option value="Fresher">Fresher (0-1 Yr)</option>
                      <option value="Experienced">Experienced (1-3 Yrs)</option>
                      <option value="Mid-Senior">Mid-Senior (3+ Yrs)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Preferred Job Type
                    </label>
                    <select
                      value={preferredJobType}
                      onChange={(e) => setPreferredJobType(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13.5px",
                        background: "#ffffff",
                      }}
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Internship">Internship</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Preferred Locations (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={preferredLocations}
                    onChange={(e) => setPreferredLocations(e.target.value)}
                    placeholder="e.g., Bengaluru, Hyderabad, Pune, Remote"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13.5px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Career Goal
                  </label>
                  <textarea
                    rows={2}
                    value={careerGoal}
                    onChange={(e) => setCareerGoal(e.target.value)}
                    placeholder="e.g., Build production AI systems in top technology companies..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                      Target Weekly Learning Hours: <strong style={{ color: "#ea580c" }}>{learningHours} hrs/week</strong>
                    </label>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={40}
                    step={1}
                    value={learningHours}
                    onChange={(e) => setLearningHours(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#ea580c" }}
                  />
                </div>
              </div>
            )}

            {/* TAB 4: SKILLS & CREDENTIALS */}
            {activeTab === "skills" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Technical Skills (Extracted & Verified)
                  </label>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      placeholder="Add a new skill (e.g. PyTorch, Docker, Next.js)"
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                      }}
                    />
                    <button
                      type="button"
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

                  {/* Skills Cloud */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "7px",
                      padding: "12px",
                      borderRadius: "10px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      maxHeight: "150px",
                      overflowY: "auto",
                    }}
                  >
                    {techSkills.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          background: "#ffffff",
                          border: "1px solid #fed7aa",
                          color: "#c2410c",
                          fontSize: "12px",
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: "16px",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                        }}
                      >
                        {skill}
                        <button
                          type="button"
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
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Soft Skills (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={softSkills}
                    onChange={(e) => setSoftSkills(e.target.value)}
                    placeholder="e.g., Problem Solving, Team Leadership, Communication"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13.5px",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Certifications (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={certifications}
                    onChange={(e) => setCertifications(e.target.value)}
                    placeholder="e.g., AWS Certified Developer, DeepLearning.AI Specialization"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13.5px",
                    }}
                  />
                </div>
              </div>
            )}

            {/* TAB 5: RESUME & DOCUMENTS */}
            {activeTab === "resume" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
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
                        borderRadius: "8px",
                        background: "#ffedd5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ea580c",
                      }}
                    >
                      <FileText size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                        {currentFilename}
                      </div>
                      <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                        Active resume indexed in Career Knowledge Base (RAG)
                      </div>
                    </div>
                  </div>
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
                    Verified
                  </span>
                </div>

                <div
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background: "#fffaf5",
                    border: "1px dashed #fed7aa",
                    textAlign: "center",
                  }}
                >
                  <Upload size={24} color="#ea580c" style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a" }}>
                    Upload / Replace Active Resume
                  </div>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 12px" }}>
                    Uploading a new resume runs full PyMuPDF parsing, Gemini extraction, CRI recomputation, and vector indexing.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onStartUpload) onStartUpload();
                    }}
                    style={{
                      background: "#ea580c",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 18px",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(234, 88, 12, 0.25)",
                    }}
                  >
                    Open Resume Upload Engine →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #f1f5f9",
              background: "#fafafa",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: "9px 18px",
                borderRadius: "9px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#475569",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "9px 24px",
                borderRadius: "9px",
                border: "none",
                background: "linear-gradient(90deg, #ff5722 0%, #ff7a00 100%)",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 12px rgba(255, 87, 34, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={16} /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
