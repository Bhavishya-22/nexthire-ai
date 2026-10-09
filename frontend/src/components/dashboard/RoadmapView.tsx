import { useState, useEffect } from "react";
import {
  GitBranch,
  CheckCircle2,
  Circle,
  Clock,
  Award,
  Loader2,
} from "lucide-react";
import {
  getDashboardRoadmap,
  toggleRoadmapTask,
  type RoadmapData,
  type UserProfile,
} from "../../services/api";

interface RoadmapViewProps {
  currentUser?: UserProfile | null;
  onProgressUpdated?: () => void;
}

export default function RoadmapView({ currentUser, onProgressUpdated }: RoadmapViewProps) {
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const res = await getDashboardRoadmap();
        setRoadmap(res.roadmap);
      } catch (e) {
        console.error("Failed to fetch roadmap:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmap();
  }, []);

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    setUpdatingTaskId(taskId);
    try {
      const res = await toggleRoadmapTask(taskId, !currentCompleted);
      setRoadmap(res.roadmap);
      if (onProgressUpdated) onProgressUpdated();
    } catch (e) {
      console.error("Failed to update task status:", e);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <Loader2 size={32} className="animate-spin" color="#ea580c" />
      </div>
    );
  }

  const role = roadmap?.target_role || currentUser?.target_role || "AI Engineer";
  const progressPct = roadmap?.progress_percentage || 0;
  const completedCount = roadmap?.completed_tasks || 0;
  const totalCount = roadmap?.total_tasks || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Roadmap Header & Progress Card */}
      <div
        style={{
          background: "linear-gradient(135deg, #fffaf5 0%, #ffffff 100%)",
          borderRadius: "16px",
          border: "1px solid #fed7aa",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <GitBranch size={22} color="#ea580c" />
              <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Personalized Career Roadmap for {role}
              </h1>
            </div>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              Structured 4-week milestone plan tailored to your verified skill gaps and target position.
            </p>
          </div>

          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #fed7aa",
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Overall Progress
              </div>
              <div style={{ fontSize: "18px", fontWeight: 900, color: "#ea580c" }}>
                {progressPct}% Completed
              </div>
            </div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              <strong>{completedCount}</strong> of <strong>{totalCount}</strong> tasks
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden", marginTop: "18px" }}>
          <div
            style={{
              height: "100%",
              width: `${progressPct}%`,
              background: "linear-gradient(90deg, #ff5722 0%, #ff7a00 100%)",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {/* 4-Week Milestone Timeline */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {roadmap?.weeks?.map((week) => {
          const weekCompleted = week.tasks.filter((t) => t.completed).length;
          const isWeekFinished = weekCompleted === week.tasks.length;

          return (
            <div
              key={week.week_number}
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: isWeekFinished ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                padding: "22px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              {/* Week Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "14px",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        background: isWeekFinished ? "#dcfce7" : "#ffedd5",
                        color: isWeekFinished ? "#166534" : "#ea580c",
                        fontSize: "11.5px",
                        fontWeight: 800,
                        padding: "3px 10px",
                        borderRadius: "12px",
                      }}
                    >
                      WEEK {week.week_number}
                    </span>
                    <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                      {week.title}
                    </h2>
                  </div>
                  <p style={{ fontSize: "12.5px", color: "#64748b", margin: "4px 0 0" }}>
                    {week.description}
                  </p>
                </div>

                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                  {weekCompleted} / {week.tasks.length} tasks completed
                </div>
              </div>

              {/* Milestone Box */}
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "#f8fafc",
                  border: "1px solid #f1f5f9",
                  fontSize: "12px",
                  color: "#334155",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Award size={15} color="#ea580c" />
                <span>
                  <strong>Week Milestone: </strong> {week.milestone}
                </span>
              </div>

              {/* Task Checkboxes */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {week.tasks.map((task) => {
                  const isUpdating = updatingTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      onClick={() => !isUpdating && handleToggleTask(task.id, task.completed)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        borderRadius: "10px",
                        background: task.completed ? "#f0fdf4" : "#fafafa",
                        border: task.completed ? "1px solid #dcfce7" : "1px solid #e2e8f0",
                        cursor: isUpdating ? "wait" : "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {isUpdating ? (
                          <Loader2 size={18} className="animate-spin" color="#ea580c" />
                        ) : task.completed ? (
                          <CheckCircle2 size={18} color="#16a34a" />
                        ) : (
                          <Circle size={18} color="#94a3b8" />
                        )}
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: task.completed ? 500 : 600,
                            color: task.completed ? "#166534" : "#1e293b",
                            textDecoration: task.completed ? "line-through" : "none",
                          }}
                        >
                          {task.title}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "2px 7px",
                            borderRadius: "8px",
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            color: "#475569",
                          }}
                        >
                          {task.category}
                        </span>
                        <span style={{ fontSize: "11.5px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Clock size={12} /> {task.duration}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
