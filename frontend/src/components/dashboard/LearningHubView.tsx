import { useState, useEffect } from "react";
import {
  GraduationCap,
  ExternalLink,
  Bookmark,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import {
  getLearningRecommendations,
  toggleLearningBookmark,
  toggleLearningComplete,
  type LearningResourceItem,
  type LearningProgressMetrics,
  type AnalysisResponse,
  type UserProfile,
} from "../../services/api";

interface LearningHubViewProps {
  currentUser?: UserProfile | null;
  analysisData?: AnalysisResponse["data"] | null;
  onNavigateToInterview?: (role?: string) => void;
}

export default function LearningHubView({
  currentUser,
  analysisData,
  onNavigateToInterview: _onNavigateToInterview,
}: LearningHubViewProps) {
  const targetRole = currentUser?.target_role || (analysisData as any)?.target_role || "AI Engineer";

  const [resources, setResources] = useState<LearningResourceItem[]>([]);
  const [metrics, setMetrics] = useState<LearningProgressMetrics>({
    total_completed: 0,
    total_hours: 0,
    total_bookmarked: 0,
    completed_ids: [],
    bookmarked_ids: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await getLearningRecommendations(
        activeCategory === "Bookmarked" || activeCategory === "Completed" ? undefined : activeCategory,
        targetRole
      );
      setResources(res.recommendations);
      setMetrics(res.metrics);
    } catch (e) {
      console.error("Failed to fetch learning recommendations:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [currentUser?.target_role, activeCategory]);

  const handleToggleBookmark = async (resourceId: string) => {
    setActionLoadingId(resourceId);
    try {
      const res = await toggleLearningBookmark(resourceId);
      // Update local resource state and metrics
      setResources((prev) =>
        prev.map((r) =>
          r.id === resourceId ? { ...r, is_bookmarked: res.data.action === "added" } : r
        )
      );
      setMetrics((prev) => ({
        ...prev,
        total_bookmarked: res.data.total_bookmarked,
        bookmarked_ids: res.data.bookmarked_ids,
      }));
    } catch (e) {
      console.error("Failed to toggle bookmark:", e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleComplete = async (resource: LearningResourceItem) => {
    setActionLoadingId(resource.id);
    try {
      // Parse hours e.g. "4 hrs" -> 4.0
      const parsedHours = parseFloat(resource.duration) || 3.0;
      const res = await toggleLearningComplete(resource.id, parsedHours);
      const isCompleted = res.data.action === "completed";

      setResources((prev) =>
        prev.map((r) =>
          r.id === resource.id
            ? { ...r, is_completed: isCompleted, completed_at: isCompleted ? new Date().toISOString() : null }
            : r
        )
      );

      // Recalculate metrics
      const newTotal = res.data.total_completed;
      const hourDiff = isCompleted ? parsedHours : -parsedHours;
      setMetrics((prev) => ({
        ...prev,
        total_completed: newTotal,
        total_hours: Math.max(0, Math.round((prev.total_hours + hourDiff) * 10) / 10),
        completed_ids: Object.keys(res.data.completed_resources),
      }));
    } catch (e) {
      console.error("Failed to toggle complete:", e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const priorityTabs = [
    "All",
    "Critical Gaps",
    "High-Priority Role",
    "Foundation",
    "Hands-on Projects",
    "Bookmarked",
    "Completed",
  ];

  // In-memory filter for Bookmarked and Completed tabs
  const displayedResources = resources.filter((r) => {
    if (activeCategory === "Bookmarked") return r.is_bookmarked;
    if (activeCategory === "Completed") return r.is_completed;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Banner with Metrics & Personalized Role Calibration */}
      <div
        style={{
          background: "linear-gradient(135deg, #fffaf5 0%, #ffffff 100%)",
          borderRadius: "16px",
          border: "1px solid #fed7aa",
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <GraduationCap size={22} color="#ea580c" />
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Personalized Learning Hub & Skill Bridge
            </h1>
          </div>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Verified courses, official documentation, and practical exercises curated for <strong>{targetRole}</strong>.
          </p>
        </div>

        {/* 4 Summary Stat Badges */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "8px 14px", borderRadius: "10px", textAlign: "center" }}>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>{resources.length}</div>
            <div style={{ fontSize: "10.5px", color: "#64748b", fontWeight: 600 }}>Resources</div>
          </div>
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "8px 14px", borderRadius: "10px", textAlign: "center" }}>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#166534" }}>{metrics.total_completed}</div>
            <div style={{ fontSize: "10.5px", color: "#166534", fontWeight: 600 }}>Completed</div>
          </div>
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "8px 14px", borderRadius: "10px", textAlign: "center" }}>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#2563eb" }}>{metrics.total_hours} hrs</div>
            <div style={{ fontSize: "10.5px", color: "#2563eb", fontWeight: 600 }}>Study Logged</div>
          </div>
          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", padding: "8px 14px", borderRadius: "10px", textAlign: "center" }}>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#ea580c" }}>{metrics.total_bookmarked}</div>
            <div style={{ fontSize: "10.5px", color: "#ea580c", fontWeight: 600 }}>Saved</div>
          </div>
        </div>
      </div>


      {/* Priority Navigation Tabs */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
        {priorityTabs.map((tab) => {
          const isActive = activeCategory === tab;
          let count = resources.length;
          if (tab === "Bookmarked") count = metrics.total_bookmarked;
          else if (tab === "Completed") count = metrics.total_completed;
          else if (tab !== "All") count = resources.filter((r) => r.category === tab).length;

          return (
            <button
              key={tab}
              onClick={() => setActiveCategory(tab)}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                border: "none",
                background: isActive ? "#0f172a" : "#ffffff",
                color: isActive ? "#ffffff" : "#475569",
                fontWeight: isActive ? 700 : 500,
                fontSize: "12.5px",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
            >
              <span>{tab}</span>
              <span
                style={{
                  fontSize: "11px",
                  background: isActive ? "rgba(255,255,255,0.2)" : "#f1f5f9",
                  padding: "1px 6px",
                  borderRadius: "8px",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Learning Resource Cards List */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
          <Loader2 size={36} className="animate-spin" color="#ea580c" />
        </div>
      ) : displayedResources.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px dashed #cbd5e1",
            padding: "40px 20px",
            textAlign: "center",
            color: "#64748b",
          }}
        >
          <GraduationCap size={36} color="#94a3b8" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#334155", margin: "0 0 6px" }}>
            No resources found in "{activeCategory}"
          </h3>
          <p style={{ fontSize: "13px", margin: "0 0 16px" }}>
            Explore other priority categories or complete courses to see them listed here.
          </p>
          <button
            onClick={() => setActiveCategory("All")}
            style={{
              background: "#ffedd5",
              color: "#c2410c",
              border: "none",
              padding: "8px 14px",
              borderRadius: "8px",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Show All Resources
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px" }}>
          {displayedResources.map((res) => {
            const isCompleted = res.is_completed;
            const isBookmarked = res.is_bookmarked;
            const isCritical = res.category === "Critical Gaps";

            return (
              <div
                key={res.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: isCompleted ? "1.5px solid #86efac" : isCritical ? "1.5px solid #fed7aa" : "1px solid #e2e8f0",
                  padding: "22px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
              >
                <div>
                  {/* Priority Tag & Category Badges */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: isCritical ? "#fee2e2" : "#f1f5f9",
                          color: isCritical ? "#b91c1c" : "#334155",
                        }}
                      >
                        {res.category}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: "#eff6ff",
                          color: "#1d4ed8",
                        }}
                      >
                        {res.resource_type}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: "#f8fafc",
                          color: "#64748b",
                        }}
                      >
                        {res.difficulty}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleBookmark(res.id)}
                      disabled={actionLoadingId === res.id}
                      title={isBookmarked ? "Remove Bookmark" : "Bookmark Resource"}
                      style={{
                        background: isBookmarked ? "#ffedd5" : "none",
                        border: "none",
                        borderRadius: "8px",
                        padding: "6px",
                        cursor: "pointer",
                        color: isBookmarked ? "#ea580c" : "#94a3b8",
                      }}
                    >
                      <Bookmark size={16} fill={isBookmarked ? "#ea580c" : "none"} />
                    </button>
                  </div>

                  {/* Resource Title & Provider */}
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px", lineHeight: 1.35 }}>
                    {res.title}
                  </h3>
                  <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#ea580c", marginBottom: "8px" }}>
                    Provider: {res.provider}
                  </div>

                  {/* Metadata Row: Duration & Verified Free Status */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={13} /> {res.duration}
                    </span>
                    <span>•</span>
                    <span style={{ color: "#166534", fontWeight: 600 }}>
                      {res.is_free ? "Free / Open Access" : "Platform Verified"}
                    </span>
                    <span>•</span>
                    <span style={{ fontWeight: 600, color: "#334155" }}>
                      Skill: {res.skill}
                    </span>
                  </div>

                  {/* Why it Matters for Target Role */}
                  <div style={{ fontSize: "12px", color: "#475569", marginBottom: "10px", lineHeight: 1.4 }}>
                    <strong style={{ color: "#0f172a" }}>Why this matters: </strong>
                    {res.why_matters}
                  </div>

                  {/* Gap Source Explanation */}
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "8px 10px",
                      fontSize: "11.5px",
                      color: "#475569",
                      marginBottom: "12px",
                    }}
                  >
                    <span style={{ fontWeight: 700, color: "#ea580c" }}>Gap Identification: </span>
                    {res.gap_source}
                  </div>

                  {/* Practical Hands-on Exercise */}
                  {res.practical_exercise && (
                    <div
                      style={{
                        background: "#fffaf5",
                        border: "1px solid #fed7aa",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        fontSize: "11.5px",
                        color: "#334155",
                        marginBottom: "14px",
                      }}
                    >
                      <span style={{ fontWeight: 700, color: "#ea580c" }}>Practical Exercise: </span>
                      {res.practical_exercise}
                    </div>
                  )}
                </div>

                {/* Card Actions: Direct Authentic Link & Completion Status Toggle */}
                <div style={{ paddingTop: "12px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      color: "#ea580c",
                      textDecoration: "none",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      background: "#fff7ed",
                    }}
                  >
                    Open Resource <ExternalLink size={13} />
                  </a>

                  <button
                    onClick={() => handleToggleComplete(res)}
                    disabled={actionLoadingId === res.id}
                    style={{
                      background: isCompleted ? "#dcfce7" : "#ffffff",
                      border: isCompleted ? "1px solid #86efac" : "1px solid #cbd5e1",
                      color: isCompleted ? "#166534" : "#475569",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <CheckCircle2 size={14} color={isCompleted ? "#166534" : "#94a3b8"} />
                    {isCompleted ? "Completed" : "Mark Complete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
