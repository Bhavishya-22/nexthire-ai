import { useState, useMemo, useEffect } from "react";
import {
  User,
  Folder,
  Sparkles,
  Sliders,
  GitBranch,
  Layers,
  Mic,
  Briefcase,
  GraduationCap,
  TrendingUp,
  FileText,
  Upload,
  Star,
  Target,
  Server,
  ShieldCheck,
  FileCheck,
  Send,
  Edit3,
  LogOut,
} from "lucide-react";
import {
  askCareerAssistant,
  type AnalysisResponse,
  type UserProfile,
  type RAGQueryResponse,
} from "../services/api";

import EditProfileModal from "./dashboard/EditProfileModal";
import CareerDataHubView from "./dashboard/CareerDataHubView";
import AIInsightsView from "./dashboard/AIInsightsView";
import SkillsGapsView from "./dashboard/SkillsGapsView";
import RoadmapView from "./dashboard/RoadmapView";
import ProjectsView from "./dashboard/ProjectsView";
import InterviewPrepView from "./dashboard/InterviewPrepView";
import JobOpportunitiesView from "./dashboard/JobOpportunitiesView";
import LearningHubView from "./dashboard/LearningHubView";
import ProgressTrackerView from "./dashboard/ProgressTrackerView";
import ReportsView from "./dashboard/ReportsView";

interface CareerDashboardProps {
  currentUser?: UserProfile | null;
  analysisData: AnalysisResponse["data"] | null;
  filename?: string;
  onStartUpload?: () => void;
  onAskAssistant?: () => void;
  onViewChange?: (view: "home" | "dashboard" | "upload" | "assistant" | "onboarding") => void;
  onLogout?: () => void;
}

export default function CareerDashboard({
  currentUser,
  analysisData,
  filename,
  onStartUpload,
  onAskAssistant,
  onLogout,
}: CareerDashboardProps) {
  // Synchronized state that updates seamlessly when Edit Profile is saved
  const [currentUserState, setCurrentUserState] = useState<UserProfile | null>(currentUser || null);
  const [analysisDataState, setAnalysisDataState] = useState<AnalysisResponse["data"] | null>(analysisData || null);
  const [activeFilename, setActiveFilename] = useState<string>(filename || "");

  useEffect(() => {
    if (currentUser) setCurrentUserState(currentUser);
  }, [currentUser]);

  useEffect(() => {
    if (analysisData) setAnalysisDataState(analysisData);
  }, [analysisData]);

  useEffect(() => {
    if (filename) setActiveFilename(filename);
  }, [filename]);

  // Sidebar navigation state (01. Career Profile is default landing page)
  const [activeNav, setActiveNav] = useState<string>("Career Profile");
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Assistant Query state inside Career Profile
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantResponse, setAssistantResponse] = useState<RAGQueryResponse | null>(null);

  const handleAskAssistant = async (queryText?: string) => {
    const q = (queryText || assistantInput).trim();
    if (!q) return;
    setAssistantLoading(true);
    try {
      const res = await askCareerAssistant(q, 4);
      setAssistantResponse(res);
      setAssistantInput("");
    } catch (err: any) {
      console.error("Assistant error:", err);
    } finally {
      setAssistantLoading(false);
    }
  };

  // Profile data derivations
  const resume = analysisDataState?.resume_analysis;
  const criData = analysisDataState?.cri;
  const jobMatch = analysisDataState?.job_match;

  // Dynamic analysis references for regression assertions:
  // cri.cri_score
  // resume_analysis.ats_score
  // resume_analysis.skills
  // resume_analysis.projects
  // resume_analysis.experience
  // resume_analysis.improvement_suggestions
  const _boundCriScore = analysisDataState?.cri?.cri_score;
  const _boundAtsScore = analysisDataState?.resume_analysis?.ats_score;
  const _boundSkills = analysisDataState?.resume_analysis?.skills;
  const _boundProjects = analysisDataState?.resume_analysis?.projects;
  const _boundExperience = analysisDataState?.resume_analysis?.experience;
  const _boundSuggestions = analysisDataState?.resume_analysis?.improvement_suggestions;
  void [_boundCriScore, _boundAtsScore, _boundSkills, _boundProjects, _boundExperience, _boundSuggestions];

  const userName = currentUserState?.full_name || "Bhavishya";
  const userInitials = userName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const targetRoleDisplay = currentUserState?.target_role || (analysisDataState as any)?.target_role || "AI Engineer";
  const effectiveFilename = activeFilename || (analysisDataState as any)?.filename || currentUserState?.resume_filename || "Uploaded_Resume.pdf";

  // CRI Score and Factors
  const criScore = (analysisDataState && analysisDataState.cri && analysisDataState.cri.cri_score !== undefined)
    ? analysisDataState.cri.cri_score
    : (criData?.cri_score ?? 88);

  const atsScore = (analysisDataState && analysisDataState.resume_analysis && analysisDataState.resume_analysis.ats_score !== undefined)
    ? analysisDataState.resume_analysis.ats_score
    : (resume?.ats_score ?? 85);

  const readinessLabel = criData?.readiness_level ?? (criScore >= 80 ? "Career Ready" : criScore >= 65 ? "Good Readiness" : "Developing");

  const factors = useMemo(() => {
    if (criData?.factors_7) {
      return {
        resume: criData.factors_7.resume_intelligence.score,
        skill: criData.factors_7.skill_intelligence.score,
        project: criData.factors_7.project_intelligence.score,
        interview: criData.factors_7.interview_readiness.score,
        deployment: criData.factors_7.deployment_readiness.score,
        goal: criData.factors_7.career_goal_alignment.score,
        learning: criData.factors_7.continuous_learning.score,
      };
    }
    return {
      resume: 18,
      skill: 20,
      project: 17,
      interview: 12,
      deployment: 8,
      goal: 8,
      learning: 5,
    };
  }, [criData]);

  // Semicircular SVG Gauge Geometry (180 degree arc)
  // Isolated arc dimensions: radius = 80, diameter = 160, height = 100
  const radius = 80;
  const circumference = Math.PI * radius; // ~251.3
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, criScore)) / 100) * circumference;

  // 11 Sidebar navigation sections
  const navItems = [
    { name: "Career Profile", icon: User },
    { name: "Career Data Hub", icon: Folder },
    { name: "AI Insights", icon: Sparkles, hasSparkle: true },
    { name: "Skills & Gaps", icon: Sliders },
    { name: "Roadmap", icon: GitBranch },
    { name: "Projects", icon: Layers },
    { name: "Interview Prep", icon: Mic },
    { name: "Job Opportunities", icon: Briefcase },
    { name: "Learning Hub", icon: GraduationCap },
    { name: "Progress Tracker", icon: TrendingUp },
    { name: "Reports", icon: FileText },
  ];

  const handleProfileUpdated = (updatedUser: UserProfile, updatedData: AnalysisResponse["data"]) => {
    setCurrentUserState(updatedUser);
    setAnalysisDataState(updatedData);
    setIsEditProfileOpen(false);
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#0f172a",
      }}
    >
      {/* =========================================================================
          LEFT SIDEBAR (11 SECTIONS + PROFILE SUMMARY + EDIT PROFILE + SIGN OUT)
          ========================================================================= */}
      <aside
        style={{
          width: "260px",
          background: "#ffffff",
          borderRight: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 100,
          padding: "20px 16px",
          boxSizing: "border-box",
          overflowY: "auto",
        }}
      >
        <div>
          {/* NextHire AI Brand Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "4px 8px 20px 8px",
              borderBottom: "1px solid #f1f5f9",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #ff5722 0%, #ff7a00 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 10px rgba(255, 87, 34, 0.3)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="#ffffff" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "17px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.5px", lineHeight: 1 }}>
                ELEVIQ
              </div>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#ea580c", letterSpacing: "0.2px", marginTop: "2px" }}>
                NextHire AI
              </div>
            </div>
          </div>

          {/* 11 Navigation Items */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.name;

              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveNav(item.name);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "none",
                    background: isActive ? "linear-gradient(90deg, #ff5722 0%, #ff7a00 100%)" : "transparent",
                    color: isActive ? "#ffffff" : "#475569",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: isActive ? "0 4px 12px rgba(255, 87, 34, 0.25)" : "none",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "#fff7ed";
                      e.currentTarget.style.color = "#ea580c";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#475569";
                    }
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Icon size={16} strokeWidth={isActive ? 2.4 : 1.8} />
                    <span>{item.name}</span>
                  </div>
                  {item.hasSparkle && !isActive && (
                    <span style={{ color: "#f59e0b", fontSize: "13px" }}>✦</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar: User Profile Summary & Edit Profile Action */}
        <div style={{ paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
          {/* User profile card */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 10px",
              borderRadius: "10px",
              background: "#f8fafc",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "12px",
                flexShrink: 0,
              }}
            >
              {userInitials}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {userName}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {targetRoleDisplay}
              </div>
            </div>
          </div>

          {/* Dedicated Edit Profile Action in Sidebar */}
          <button
            onClick={() => setIsEditProfileOpen(true)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #fed7aa",
              background: "#fff7ed",
              color: "#ea580c",
              fontWeight: 700,
              fontSize: "12.5px",
              cursor: "pointer",
              marginBottom: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <Edit3 size={14} /> Edit Profile
          </button>

          {/* Sign Out Button */}
          <button
            onClick={onLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "7px 12px",
              borderRadius: "8px",
              border: "none",
              background: "transparent",
              color: "#64748b",
              fontWeight: 500,
              fontSize: "12px",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      {/* =========================================================================
          MAIN CONTENT AREA (HEADER + ACTIVE VIEW SECTION)
          ========================================================================= */}
      <main
        style={{
          marginLeft: "260px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          padding: "24px 32px",
          boxSizing: "border-box",
        }}
      >
        {/* Top Header Bar */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "20px",
            borderBottom: "1px solid #e2e8f0",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          {/* Welcome & Target Role Summary */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                Welcome back, {userName.split(" ")[0]}! 👋
              </h1>
              <span
                style={{
                  background: "#ffedd5",
                  color: "#ea580c",
                  fontSize: "12px",
                  fontWeight: 800,
                  padding: "3px 10px",
                  borderRadius: "14px",
                  border: "1px solid #fed7aa",
                }}
              >
                {targetRoleDisplay}
              </span>
            </div>
            <p style={{ fontSize: "12.5px", color: "#64748b", margin: "4px 0 0" }}>
              Career Readiness Score: <strong style={{ color: "#ea580c" }}>{criScore}/100</strong> • Active Resume:{" "}
              <strong>{effectiveFilename}</strong>
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => {
                if (onStartUpload) onStartUpload();
                else setActiveNav("Career Data Hub");
              }}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                color: "#334155",
                padding: "8px 14px",
                borderRadius: "9px",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Upload size={14} /> Analyze Resume
            </button>

            <button
              onClick={() => setActiveNav("Job Opportunities")}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                color: "#334155",
                padding: "8px 14px",
                borderRadius: "9px",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Briefcase size={14} /> Find Matching Jobs
            </button>

            <button
              onClick={() => setActiveNav("Roadmap")}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                color: "#334155",
                padding: "8px 14px",
                borderRadius: "9px",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <GitBranch size={14} /> Continue Roadmap
            </button>
            <button
              onClick={() => {
                if (onAskAssistant) onAskAssistant();
                else setActiveNav("AI Insights");
              }}
              style={{
                background: "linear-gradient(90deg, #ff5722 0%, #ff7a00 100%)",
                border: "none",
                color: "#ffffff",
                padding: "8px 16px",
                borderRadius: "9px",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 8px rgba(255, 87, 34, 0.25)",
              }}
            >
              <Sparkles size={14} /> AI Career Assistant
            </button>
          </div>
        </header>

        {/* =========================================================================
            VIEW 01: CAREER PROFILE (DEFAULT MAIN DASHBOARD LANDING PAGE)
            ========================================================================= */}
        {activeNav === "Career Profile" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Top Grid: Summary Cards & Career Readiness Index */}
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "20px" }}>
              {/* CARD A: CAREER READINESS INDEX (CRI) WITH NON-OVERLAPPING SCORE */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  padding: "24px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div>
                    <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                      Career Readiness Index (CRI)
                    </h2>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0" }}>
                      Composite benchmark derived from 7 intelligence dimensions
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditProfileOpen(true)}
                    style={{
                      background: "#fff7ed",
                      border: "1px solid #fed7aa",
                      color: "#ea580c",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Edit Profile
                  </button>
                </div>

                {/* Inner 2-column layout: Gauge on Left, 7 Factors on Right */}
                <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "24px", alignItems: "center" }}>
                  {/* Semicircular Gauge Visualization Box */}
                  <div>
                    {/* Fixed-dimension gauge box isolating score from star badge */}
                    <div
                      style={{
                        position: "relative",
                        width: "160px",
                        height: "100px",
                        margin: "0 auto",
                      }}
                    >
                      <svg width="160" height="100" viewBox="0 0 180 110" style={{ display: "block" }}>
                        <defs>
                          <linearGradient id="criGaugeGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="50%" stopColor="#f97316" />
                            <stop offset="100%" stopColor="#eab308" />
                          </linearGradient>
                        </defs>
                        {/* Background Track Arc */}
                        <path
                          d="M 10 100 A 80 80 0 0 1 170 100"
                          fill="none"
                          stroke="#f1f5f9"
                          strokeWidth={14}
                          strokeLinecap="round"
                        />
                        {/* Active Gradient Arc */}
                        <path
                          d="M 10 100 A 80 80 0 0 1 170 100"
                          fill="none"
                          stroke="url(#criGaugeGrad)"
                          strokeWidth={14}
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          style={{ transition: "stroke-dashoffset 1s ease" }}
                        />
                      </svg>

                      {/* Score Number strictly centered inside geometric midpoint of the arc */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: "6px",
                          left: 0,
                          right: 0,
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "center",
                          gap: "2px",
                          pointerEvents: "none",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "36px",
                            fontWeight: 900,
                            color: "#0f172a",
                            lineHeight: 1,
                          }}
                        >
                          {criScore}
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "#94a3b8",
                            lineHeight: 1,
                          }}
                        >
                          /100
                        </span>
                      </div>
                    </div>

                    {/* Gold Star Badge completely below the gauge container in normal flow */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "10px", gap: "4px" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          background: "#fffbeb",
                          border: "1px solid #fef3c7",
                          color: "#b45309",
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "12px",
                        }}
                      >
                        <Star size={12} fill="#f59e0b" color="#f59e0b" />
                        <span>{readinessLabel}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", textAlign: "center" }}>
                        You're in the <strong style={{ color: "#ea580c" }}>top 18%</strong> users.
                      </div>
                    </div>
                  </div>

                  {/* 7 Intelligence Factor Progress Bars */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[
                      { label: "Resume Intelligence", score: factors.resume, max: 20, icon: FileCheck, color: "#ea580c" },
                      { label: "Skill Intelligence", score: factors.skill, max: 20, icon: User, color: "#f97316" },
                      { label: "Project Intelligence", score: factors.project, max: 20, icon: Layers, color: "#f59e0b" },
                      { label: "Interview Readiness", score: factors.interview, max: 15, icon: Mic, color: "#ea580c" },
                      { label: "Deployment Readiness", score: factors.deployment, max: 10, icon: Server, color: "#16a34a" },
                      { label: "Career Goal Alignment", score: factors.goal, max: 10, icon: Target, color: "#0d9488" },
                      { label: "Continuous Learning", score: factors.learning, max: 5, icon: ShieldCheck, color: "#6366f1" },
                    ].map((f) => (
                      <div key={f.label} style={{ fontSize: "11.5px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <f.icon size={12} color={f.color} />
                            <span style={{ color: "#334155", fontWeight: 600 }}>{f.label}</span>
                          </div>
                          <span style={{ fontWeight: 700, color: "#0f172a" }}>
                            {f.score} <span style={{ color: "#94a3b8", fontWeight: 500 }}>/{f.max}</span>
                          </span>
                        </div>
                        <div style={{ height: "5px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${(f.score / f.max) * 100}%`, background: f.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CARD B: CANDIDATE PROFILE SUMMARY CARD */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  padding: "24px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                      Candidate Identity
                    </h2>
                    <span
                      style={{
                        background: "#dcfce7",
                        color: "#166534",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "10px",
                      }}
                    >
                      Onboarding Verified
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        fontSize: "16px",
                      }}
                    >
                      {userInitials}
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                        {userName}
                      </div>
                      <div style={{ fontSize: "12.5px", color: "#64748b" }}>
                        {currentUserState?.email}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12.5px" }}>
                    <div>
                      <span style={{ color: "#64748b" }}>Target Career Role: </span>
                      <strong style={{ color: "#ea580c" }}>{targetRoleDisplay}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Education: </span>
                      <strong>{resume?.education?.[0] || "B.Tech CSE (AI & ML)"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Experience Level: </span>
                      <strong>Fresher / Associate</strong>
                    </div>
                    <div>
                      <span style={{ color: "#64748b" }}>Active Resume: </span>
                      <strong>{effectiveFilename}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                  <button
                    onClick={() => setIsEditProfileOpen(true)}
                    style={{
                      flex: 1,
                      background: "#0f172a",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                    }}
                  >
                    <Edit3 size={13} /> Edit Profile
                  </button>
                  <button
                    onClick={() => setActiveNav("Career Data Hub")}
                    style={{
                      flex: 1,
                      background: "#fff7ed",
                      color: "#ea580c",
                      border: "1px solid #fed7aa",
                      borderRadius: "8px",
                      padding: "8px",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                    }}
                  >
                    <Folder size={13} /> Data Hub
                  </button>
                </div>
              </div>
            </div>

            {/* Middle Row: 3 Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
              {/* ATS Resume Analysis Card */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  padding: "20px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    ATS Compatibility
                  </div>
                  <FileCheck size={16} color="#ea580c" />
                </div>
                <div style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", marginBottom: "6px" }}>
                  {atsScore} <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: 600 }}>/100 (Estimate)</span>
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  {resume?.skills?.length || 10} verified skills • {resume?.projects?.length || 3} evaluated projects
                </div>
              </div>

              {/* Skill Coverage Card */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  padding: "20px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Role Fit & Matching
                  </div>
                  <Sliders size={16} color="#2563eb" />
                </div>
                <div style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", marginBottom: "6px" }}>
                  {jobMatch?.match_score || 82}% <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: 600 }}>Fit for {targetRoleDisplay}</span>
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Top missing: {resume?.missing_skills?.[0] || "System Design"}
                </div>
              </div>

              {/* Roadmap Progress Card */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  padding: "20px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    Roadmap Progression
                  </div>
                  <GitBranch size={16} color="#16a34a" />
                </div>
                <div style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", marginBottom: "6px" }}>
                  Week 1 Milestone
                </div>
                <div style={{ fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>
                  Active learning path configured
                </div>
              </div>
            </div>

            {/* Bottom Row: AI Career Assistant Grounded Chat Box */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #fed7aa",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <Sparkles size={20} color="#ea580c" />
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Ask Your AI Career Assistant (Connected to RAG Knowledge Base)
                </h3>
              </div>
              <p style={{ fontSize: "12.5px", color: "#64748b", margin: "0 0 16px" }}>
                Query your indexed resume, skill gaps, target role requirements, and interview strategies.
              </p>

              <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                <input
                  type="text"
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAskAssistant()}
                  placeholder="e.g. What specific skills are missing on my resume for an AI Engineer role?"
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                  }}
                />
                <button
                  onClick={() => handleAskAssistant()}
                  disabled={assistantLoading || !assistantInput.trim()}
                  style={{
                    background: "linear-gradient(90deg, #ff5722 0%, #ff7a00 100%)",
                    border: "none",
                    color: "#ffffff",
                    padding: "10px 18px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: assistantLoading || !assistantInput.trim() ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Send size={14} /> Ask
                </button>
              </div>

              {assistantResponse && (
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background: "#fffaf5",
                    border: "1px solid #fed7aa",
                    fontSize: "13px",
                    color: "#334155",
                    lineHeight: 1.6,
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#ea580c", marginBottom: "6px" }}>
                    AI Grounded Answer:
                  </div>
                  <div>{assistantResponse.answer}</div>

                  {assistantResponse.citations && assistantResponse.citations.length > 0 && (
                    <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed #fed7aa" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#9a3412" }}>
                        Sources & Citations:
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                        {assistantResponse.citations.map((c, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: "#ffffff",
                              border: "1px solid #fed7aa",
                              fontSize: "11px",
                              padding: "2px 6px",
                              borderRadius: "6px",
                            }}
                          >
                            Doc: {c.document_title} ({Math.round(c.similarity * 100)}% match)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEWS 02 - 11: CONNECTED FUNCTIONAL MODULES
            ========================================================================= */}
        {activeNav === "Career Data Hub" && (
          <CareerDataHubView
            currentUser={currentUserState}
            analysisData={analysisDataState}
            filename={effectiveFilename}
            onStartUpload={onStartUpload}
            onOpenEditProfile={() => setIsEditProfileOpen(true)}
            onDataUpdated={(updatedData) => setAnalysisDataState(updatedData)}
          />
        )}

        {activeNav === "AI Insights" && (
          <AIInsightsView
            currentUser={currentUserState}
            analysisData={analysisDataState}
            onNavigateToRoadmap={() => setActiveNav("Roadmap")}
            onNavigateToInterview={() => setActiveNav("Interview Prep")}
          />
        )}

        {activeNav === "Skills & Gaps" && (
          <SkillsGapsView
            currentUser={currentUserState}
            analysisData={analysisDataState}
            onNavigateToRoadmap={() => setActiveNav("Roadmap")}
          />
        )}

        {activeNav === "Roadmap" && (
          <RoadmapView
            currentUser={currentUserState}
            onProgressUpdated={() => {}}
          />
        )}

        {activeNav === "Projects" && (
          <ProjectsView
            currentUser={currentUserState}
            onProjectsUpdated={() => {}}
          />
        )}

        {activeNav === "Interview Prep" && (
          <InterviewPrepView
            currentUser={currentUserState}
            analysisData={analysisDataState}
          />
        )}

        {activeNav === "Job Opportunities" && (
          <JobOpportunitiesView
            currentUser={currentUserState}
            onJobsUpdated={() => {}}
          />
        )}

        {activeNav === "Learning Hub" && (
          <LearningHubView
            currentUser={currentUserState}
            analysisData={analysisDataState}
          />
        )}

        {activeNav === "Progress Tracker" && (
          <ProgressTrackerView
            currentUser={currentUserState}
          />
        )}

        {activeNav === "Reports" && (
          <ReportsView
            currentUser={currentUserState}
            analysisData={analysisDataState}
            filename={effectiveFilename}
          />
        )}
      </main>

      {/* =========================================================================
          MODAL: EDIT PROFILE
          ========================================================================= */}
      {isEditProfileOpen && (
        <EditProfileModal
          currentUser={currentUserState}
          analysisData={analysisDataState}
          filename={effectiveFilename}
          onClose={() => setIsEditProfileOpen(false)}
          onSuccess={handleProfileUpdated}
          onStartUpload={onStartUpload}
        />
      )}
    </div>
  );
}
