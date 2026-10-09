import { useState, useEffect } from "react";
import {
  Briefcase,
  Plus,
  ExternalLink,
  MapPin,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import {
  getDashboardJobs,
  addDashboardJob,
  updateDashboardJobStatus,
  deleteDashboardJob,
  type JobOpportunityItem,
  type UserProfile,
} from "../../services/api";

interface JobOpportunitiesViewProps {
  currentUser?: UserProfile | null;
  onJobsUpdated?: () => void;
}

export default function JobOpportunitiesView({ currentUser, onJobsUpdated }: JobOpportunitiesViewProps) {
  const [jobs, setJobs] = useState<JobOpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("All");

  // Modal State for New Job
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("Bengaluru / Remote");
  const [jobType, setJobType] = useState("Full-time");
  const [experienceReq, setExperienceReq] = useState("0-2 Years");
  const [requiredSkills, setRequiredSkills] = useState("Python, FastAPI, Docker, SQL");
  const [jobUrl, setJobUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await getDashboardJobs();
      setJobs(res.jobs);
    } catch (e) {
      console.error("Failed to load jobs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      const res = await updateDashboardJobStatus(jobId, newStatus);
      setJobs(res.jobs);
      if (onJobsUpdated) onJobsUpdated();
    } catch (e) {
      console.error("Failed to update job status:", e);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm("Remove this tracked job opportunity?")) return;
    try {
      const res = await deleteDashboardJob(jobId);
      setJobs(res.jobs);
      if (onJobsUpdated) onJobsUpdated();
    } catch (e) {
      console.error("Failed to delete job:", e);
    }
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim()) return;

    setFormLoading(true);
    const skillsList = requiredSkills.split(",").map((s) => s.trim()).filter(Boolean);

    try {
      const res = await addDashboardJob({
        title: title.trim(),
        company: company.trim(),
        location: location.trim(),
        job_type: jobType,
        experience_req: experienceReq,
        required_skills: skillsList,
        job_url: jobUrl.trim(),
        status: "Saved",
        notes: notes.trim(),
      });
      setJobs(res.jobs);
      setIsModalOpen(false);
      setTitle("");
      setCompany("");
      setJobUrl("");
      setNotes("");
      if (onJobsUpdated) onJobsUpdated();
    } catch (e) {
      console.error("Failed to add job:", e);
    } finally {
      setFormLoading(false);
    }
  };

  const filteredJobs = filterStatus === "All"
    ? jobs
    : jobs.filter((j) => j.status === filterStatus);

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
            <Briefcase size={22} color="#ea580c" />
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Job Opportunities & Pipeline Tracker ({jobs.length})
            </h1>
          </div>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Compare your profile match score against requirements and track your interview applications for {currentUser?.target_role || "your target role"}.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
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
          <Plus size={16} /> Track New Job Opening
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
        {["All", "Saved", "Applied", "Interview", "Offer", "Rejected"].map((status) => {
          const count = status === "All" ? jobs.length : jobs.filter((j) => j.status === status).length;
          const isActive = filterStatus === status;

          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
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
              }}
            >
              <span>{status}</span>
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

      {/* Job Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
        {filteredJobs.map((job) => (
          <div
            key={job.id}
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
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    {job.title}
                  </h2>
                  <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#ea580c", marginTop: "2px" }}>
                    {job.company}
                  </div>
                </div>

                <div
                  style={{
                    background: job.match_score >= 80 ? "#dcfce7" : "#ffedd5",
                    color: job.match_score >= 80 ? "#166534" : "#c2410c",
                    fontSize: "12px",
                    fontWeight: 800,
                    padding: "4px 10px",
                    borderRadius: "12px",
                  }}
                >
                  {job.match_score}% Match
                </div>
              </div>

              {/* Badges: Location & Type */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "#64748b", marginBottom: "14px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <MapPin size={13} /> {job.location}
                </span>
                <span>•</span>
                <span>{job.job_type}</span>
                <span>•</span>
                <span>{job.experience_req}</span>
              </div>

              {/* Matched vs Missing Skills */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
                {job.matching_skills && job.matching_skills.length > 0 && (
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>
                      Matched Skills:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                      {job.matching_skills.map((s) => (
                        <span key={s} style={{ background: "#f0fdf4", color: "#166534", fontSize: "11px", padding: "2px 6px", borderRadius: "6px" }}>
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {job.missing_skills && job.missing_skills.length > 0 && (
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#ef4444", textTransform: "uppercase" }}>
                      Missing Skills:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                      {job.missing_skills.map((s) => (
                        <span key={s} style={{ background: "#fef2f2", color: "#b91c1c", fontSize: "11px", padding: "2px 6px", borderRadius: "6px" }}>
                          ! {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {job.notes && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "#f8fafc",
                    fontSize: "12px",
                    color: "#475569",
                    marginBottom: "14px",
                  }}
                >
                  <strong>Notes: </strong> {job.notes}
                </div>
              )}
            </div>

            {/* Status Selector & Actions Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "14px",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 600 }}>Status:</span>
                <select
                  value={job.status}
                  onChange={(e) => handleStatusChange(job.id, e.target.value)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    background: "#ffffff",
                    fontWeight: 600,
                  }}
                >
                  <option value="Saved">Saved</option>
                  <option value="Applied">Applied</option>
                  <option value="Interview">Interview</option>
                  <option value="Offer">Offer</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {job.job_url && (
                  <a
                    href={job.job_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      fontSize: "12px",
                      color: "#ea580c",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    Listing <ExternalLink size={12} />
                  </a>
                )}
                <button
                  onClick={() => handleDeleteJob(job.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "2px",
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Job Modal */}
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
              maxWidth: "540px",
              padding: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Track Job Opportunity
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddJob} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Job Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AI Engineer, Associate ML Scientist"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Company Name *
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google, Microsoft, Infosys"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Bengaluru, Remote"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Job Type
                  </label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#fff" }}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Experience Requirements
                </label>
                <input
                  type="text"
                  value={experienceReq}
                  onChange={(e) => setExperienceReq(e.target.value)}
                  placeholder="e.g. 0-2 Years, Student / Fresher"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Required Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  placeholder="Python, PyTorch, Docker, SQL"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Job URL / Portal Link
                </label>
                <input
                  type="text"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://careers.google.com/..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Notes / Interview Round Details
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Applied via referral, round 1 prep required."
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
                  }}
                >
                  {formLoading ? <Loader2 size={14} className="animate-spin" /> : "Save Opportunity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
