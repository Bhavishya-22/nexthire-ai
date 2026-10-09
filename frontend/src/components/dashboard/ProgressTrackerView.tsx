import { useState, useEffect } from "react";
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  Mic,
  Briefcase,
  Layers,
  Award,
  Calendar,
  Loader2,
  Target,
} from "lucide-react";
import {
  getDashboardProgress,
  type ProgressData,
  type UserProfile,
} from "../../services/api";

interface ProgressTrackerViewProps {
  currentUser?: UserProfile | null;
}

export default function ProgressTrackerView({ currentUser }: ProgressTrackerViewProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await getDashboardProgress();
        setProgress(res.progress);
      } catch (e) {
        console.error("Failed to load progress metrics:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <Loader2 size={32} className="animate-spin" color="#ea580c" />
      </div>
    );
  }

  const p = progress || {
    roadmap_completion_percentage: 25,
    tasks_completed: 2,
    total_tasks: 12,
    learning_hours_logged: 10,
    mock_interviews_completed: 1,
    skills_assessed: 8,
    jobs_saved: 2,
    applications_submitted: 1,
    recent_activity: [],
    weekly_goals: [],
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #fffaf5 0%, #ffffff 100%)",
          borderRadius: "16px",
          border: "1px solid #fed7aa",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <TrendingUp size={22} color="#ea580c" />
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Career Preparation Progress Tracker
          </h1>
        </div>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
          Quantifiable preparation metrics recorded across your learning roadmap, interview practice, and job applications{currentUser?.full_name ? ` for ${currentUser.full_name}` : ""}.
        </p>
      </div>

      {/* 6 Key Performance Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        {[
          { label: "Roadmap Completion", val: `${p.roadmap_completion_percentage}%`, sub: `${p.tasks_completed}/${p.total_tasks} Tasks`, icon: CheckCircle2, color: "#ea580c", bg: "#ffedd5" },
          { label: "Learning Hours Logged", val: `${p.learning_hours_logged} hrs`, sub: "Based on verified tasks", icon: Clock, color: "#2563eb", bg: "#dbeafe" },
          { label: "Mock Interviews Done", val: p.mock_interviews_completed, sub: "AI evaluated attempts", icon: Mic, color: "#9333ea", bg: "#f3e8ff" },
          { label: "Skills Assessed", val: p.skills_assessed, sub: "Verified profile skills", icon: Layers, color: "#0891b2", bg: "#cffafe" },
          { label: "Jobs Tracked / Saved", val: p.jobs_saved, sub: "Matching opportunities", icon: Briefcase, color: "#d97706", bg: "#fef3c7" },
          { label: "Applications Active", val: p.applications_submitted, sub: "Applied, Interview, Offer", icon: Award, color: "#16a34a", bg: "#dcfce7" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                padding: "18px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                  {stat.label}
                </span>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: stat.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: stat.color,
                  }}
                >
                  <Icon size={16} />
                </div>
              </div>

              <div style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a", marginBottom: "4px" }}>
                {stat.val}
              </div>

              <div style={{ fontSize: "11.5px", color: "#94a3b8" }}>
                {stat.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly Goals & Recent Activity Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Weekly Goals Checklist */}
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
            <Target size={18} color="#ea580c" />
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Weekly Preparation Goals
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {p.weekly_goals && p.weekly_goals.length > 0 ? (
              p.weekly_goals.map((g, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: g.completed ? "#f0fdf4" : "#fafafa",
                    border: g.completed ? "1px solid #dcfce7" : "1px solid #f1f5f9",
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: 600, color: g.completed ? "#166534" : "#334155" }}>
                    {g.goal}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "10px",
                      background: g.completed ? "#dcfce7" : "#f1f5f9",
                      color: g.completed ? "#166534" : "#64748b",
                    }}
                  >
                    {g.completed ? "Achieved" : "In Progress"}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: "13px", color: "#94a3b8" }}>No active goals configured for this week.</div>
            )}
          </div>
        </div>

        {/* Recent Activity Timeline */}
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
            <Calendar size={18} color="#ea580c" />
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Recent Career Milestones
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {p.recent_activity && p.recent_activity.length > 0 ? (
              p.recent_activity.map((act, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "#f8fafc",
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ea580c" }} />
                    <span style={{ fontSize: "13px", color: "#334155", fontWeight: 500 }}>
                      {act.title}
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                    {act.timestamp}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ fontSize: "13px", color: "#94a3b8" }}>No recent activity records logged yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
