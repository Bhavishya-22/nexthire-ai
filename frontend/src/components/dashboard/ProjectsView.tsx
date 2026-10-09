import { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  GitBranch,
  ExternalLink,
  Edit2,
  Trash2,
  Sparkles,
  Loader2,
  X,
  Save,
} from "lucide-react";
import {
  getDashboardProjects,
  addDashboardProject,
  updateDashboardProject,
  deleteDashboardProject,
  type ProjectItem,
  type UserProfile,
} from "../../services/api";

interface ProjectsViewProps {
  currentUser?: UserProfile | null;
  onProjectsUpdated?: () => void;
}

export default function ProjectsView({ currentUser, onProjectsUpdated }: ProjectsViewProps) {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [technologies, setTechnologies] = useState("");
  const [status, setStatus] = useState("In Progress");
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [metrics, setMetrics] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const res = await getDashboardProjects();
      setProjects(res.projects);
    } catch (e) {
      console.error("Failed to load projects:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openAddModal = () => {
    setEditingProject(null);
    setName("");
    setDescription("");
    setTechnologies("Python, FastAPI, React");
    setStatus("In Progress");
    setGithubUrl("");
    setLiveUrl("");
    setMetrics("");
    setSuggestions("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: ProjectItem) => {
    setEditingProject(p);
    setName(p.name);
    setDescription(p.description);
    setTechnologies(p.technologies?.join(", ") || "");
    setStatus(p.status || "In Progress");
    setGithubUrl(p.github_url || "");
    setLiveUrl(p.live_url || "");
    setMetrics(p.metrics || "");
    setSuggestions(p.suggestions || "");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this project?")) return;
    try {
      const res = await deleteDashboardProject(id);
      setProjects(res.projects);
      if (onProjectsUpdated) onProjectsUpdated();
    } catch (e) {
      console.error("Failed to delete project:", e);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Project name is required.");
      return;
    }
    if (!description.trim()) {
      setFormError("Project description is required.");
      return;
    }

    setFormLoading(true);
    setFormError(null);

    const techList = technologies.split(",").map((t) => t.trim()).filter(Boolean);

    try {
      if (editingProject) {
        const res = await updateDashboardProject(editingProject.id, {
          name: name.trim(),
          description: description.trim(),
          technologies: techList,
          skills: techList,
          status,
          github_url: githubUrl.trim(),
          live_url: liveUrl.trim(),
          metrics: metrics.trim(),
          suggestions: suggestions.trim(),
        });
        setProjects(res.projects);
      } else {
        const res = await addDashboardProject({
          name: name.trim(),
          description: description.trim(),
          technologies: techList,
          skills: techList,
          status,
          github_url: githubUrl.trim(),
          live_url: liveUrl.trim(),
          metrics: metrics.trim(),
          suggestions: suggestions.trim(),
        });
        setProjects(res.projects);
      }

      setIsModalOpen(false);
      if (onProjectsUpdated) onProjectsUpdated();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Failed to save project.");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <Loader2 size={32} className="animate-spin" color="#ea580c" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Banner */}
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
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <Layers size={22} color="#ea580c" />
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Engineering Projects & Portfolio ({projects.length})
            </h1>
          </div>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Showcase how your practical projects demonstrate career-relevant technical skills for {currentUser?.target_role || "your career path"}.
          </p>
        </div>

        <button
          onClick={openAddModal}
          style={{
            background: "linear-gradient(90deg, #ff5722 0%, #ff7a00 100%)",
            border: "none",
            color: "#ffffff",
            padding: "10px 18px",
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
          <Plus size={16} /> Add New Project
        </button>
      </div>

      {/* Projects Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
        {projects.map((proj) => (
          <div
            key={proj.id}
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "22px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              {/* Header & Status */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  {proj.name}
                </h2>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "10px",
                    background: proj.status === "Completed" ? "#dcfce7" : "#ffedd5",
                    color: proj.status === "Completed" ? "#166534" : "#ea580c",
                  }}
                >
                  {proj.status}
                </span>
              </div>

              <p style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5, margin: "0 0 14px" }}>
                {proj.description}
              </p>

              {/* Technologies */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
                {proj.technologies?.map((tech) => (
                  <span
                    key={tech}
                    style={{
                      background: "#f1f5f9",
                      color: "#334155",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Evaluation Metrics */}
              {proj.metrics && (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "#f8fafc",
                    border: "1px solid #f1f5f9",
                    fontSize: "12px",
                    color: "#334155",
                    marginBottom: "12px",
                  }}
                >
                  <strong>Metrics: </strong> {proj.metrics}
                </div>
              )}

              {/* AI Improvement Suggestions */}
              {proj.suggestions && (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "#fffaf5",
                    border: "1px solid #fed7aa",
                    fontSize: "12px",
                    color: "#9a3412",
                    marginBottom: "16px",
                  }}
                >
                  <Sparkles size={13} color="#ea580c" style={{ display: "inline", marginRight: "4px" }} />
                  <strong>AI Suggestion: </strong> {proj.suggestions}
                </div>
              )}
            </div>

            {/* Links & Actions Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "14px",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <div style={{ display: "flex", gap: "10px" }}>
                {proj.github_url && (
                  <a
                    href={proj.github_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      color: "#0f172a",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    <GitBranch size={14} /> Code
                  </a>
                )}
                {proj.live_url && (
                  <a
                    href={proj.live_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      color: "#ea580c",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    <ExternalLink size={14} /> Live Demo
                  </a>
                )}
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={() => openEditModal(proj)}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 10px",
                    fontSize: "12px",
                    color: "#475569",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  onClick={() => handleDeleteProject(proj.id)}
                  style={{
                    background: "#fee2e2",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 10px",
                    fontSize: "12px",
                    color: "#b91c1c",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Project Modal */}
      {isModalOpen && (
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
              maxWidth: "600px",
              padding: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {editingProject ? "Edit Project" : "Add Engineering Project"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "#fee2e2",
                  color: "#b91c1c",
                  fontSize: "12px",
                  marginBottom: "12px",
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProject} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Project Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Distributed Task Queue"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Description *
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what this system does and the problem it solves."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Technologies (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={technologies}
                    onChange={(e) => setTechnologies(e.target.value)}
                    placeholder="Python, Redis, Docker"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#fff" }}
                  >
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Planned">Planned</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    GitHub Repository URL
                  </label>
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Live Demo URL
                  </label>
                  <input
                    type="text"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    placeholder="https://demo.app..."
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Measurable Results / Metrics
                </label>
                <input
                  type="text"
                  value={metrics}
                  onChange={(e) => setMetrics(e.target.value)}
                  placeholder="e.g. 98.4% accuracy, <50ms response latency"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", fontSize: "12.5px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{
                    background: "#ea580c",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 20px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {formLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
