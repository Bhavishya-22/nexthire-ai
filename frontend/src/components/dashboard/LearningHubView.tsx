import { useState } from "react";
import {
  GraduationCap,
  ExternalLink,
  Bookmark,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { type AnalysisResponse, type UserProfile } from "../../services/api";

interface LearningHubViewProps {
  currentUser?: UserProfile | null;
  analysisData?: AnalysisResponse["data"] | null;
}

interface ResourceItem {
  id: string;
  title: string;
  skill: string;
  type: "Course" | "Documentation" | "Practice" | "Tutorial";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  url: string;
  source: string;
  isFree: boolean;
  duration: string;
  description: string;
}

export default function LearningHubView({ currentUser, analysisData }: LearningHubViewProps) {
  const targetRole = currentUser?.target_role || (analysisData as any)?.target_role || "AI Engineer";

  const [selectedSkill, setSelectedSkill] = useState<string>("All");
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  // Verified real learning resources
  const resources: ResourceItem[] = [
    {
      id: "res-1",
      title: "FastAPI Official Interactive Tutorial & Guide",
      skill: "FastAPI",
      type: "Documentation",
      difficulty: "Beginner",
      url: "https://fastapi.tiangolo.com/tutorial/",
      source: "FastAPI Docs",
      isFree: true,
      duration: "4 hrs",
      description: "Step-by-step guide to building production REST APIs, dependency injection, and Pydantic validation.",
    },
    {
      id: "res-2",
      title: "System Design Primer & Architectural Patterns",
      skill: "System Design",
      type: "Tutorial",
      difficulty: "Intermediate",
      url: "https://github.com/donnemartin/system-design-primer",
      source: "GitHub Open Source",
      isFree: true,
      duration: "15 hrs",
      description: "Comprehensive guide to scaling architectures, microservices, caches, and database sharding.",
    },
    {
      id: "res-3",
      title: "Deep Learning with PyTorch: A 60 Minute Blitz",
      skill: "PyTorch",
      type: "Tutorial",
      difficulty: "Beginner",
      url: "https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html",
      source: "PyTorch Docs",
      isFree: true,
      duration: "3 hrs",
      description: "Hands-on walkthrough of tensors, autograd, neural networks, and training classifiers.",
    },
    {
      id: "res-4",
      title: "Docker Get Started Guide & Container Basics",
      skill: "Docker",
      type: "Documentation",
      difficulty: "Beginner",
      url: "https://docs.docker.com/get-started/",
      source: "Docker Docs",
      isFree: true,
      duration: "2.5 hrs",
      description: "Build images, run multi-container applications with Docker Compose, and isolate backend environments.",
    },
    {
      id: "res-5",
      title: "Hugging Face Deep RL & NLP Course",
      skill: "NLP & LLMs",
      type: "Course",
      difficulty: "Intermediate",
      url: "https://huggingface.co/learn",
      source: "Hugging Face",
      isFree: true,
      duration: "12 hrs",
      description: "Learn transformer models, tokenizers, fine-tuning, and retrieval augmented generation (RAG).",
    },
    {
      id: "res-6",
      title: "LeetCode Top Interview 150 & Algorithms",
      skill: "Problem Solving",
      type: "Practice",
      difficulty: "Intermediate",
      url: "https://leetcode.com/studyplan/top-interview-150/",
      source: "LeetCode",
      isFree: true,
      duration: "20 hrs",
      description: "Targeted algorithm and data structure problems frequently tested in SWE and AI interviews.",
    },
    {
      id: "res-7",
      title: "PostgreSQL Tutorial & Query Optimization",
      skill: "PostgreSQL",
      type: "Documentation",
      difficulty: "Beginner",
      url: "https://www.postgresqltutorial.com/",
      source: "PostgreSQL Tutorial",
      isFree: true,
      duration: "6 hrs",
      description: "Master joins, indexes, transactions, and vector extensions for AI data storage.",
    },
    {
      id: "res-8",
      title: "Full Stack Open: Modern Web Development",
      skill: "React & TypeScript",
      type: "Course",
      difficulty: "Intermediate",
      url: "https://fullstackopen.com/en/",
      source: "University of Helsinki",
      isFree: true,
      duration: "30 hrs",
      description: "Deep dive into React, TypeScript, state management, and connecting backend REST services.",
    },
  ];

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleCompleted = (id: string) => {
    setCompletedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const skillsList = ["All", ...Array.from(new Set(resources.map((r) => r.skill)))];
  const filteredResources = selectedSkill === "All"
    ? resources
    : resources.filter((r) => r.skill === selectedSkill);

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
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <GraduationCap size={22} color="#ea580c" />
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Curated Learning Hub for {targetRole}
          </h1>
        </div>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
          High-yield, verified tutorials, official documentation, and courses directly mapped to your career roadmap.
        </p>
      </div>

      {/* Filter by Skill */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
        {skillsList.map((skill) => {
          const isActive = selectedSkill === skill;
          return (
            <button
              key={skill}
              onClick={() => setSelectedSkill(skill)}
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
                whiteSpace: "nowrap",
              }}
            >
              {skill}
            </button>
          );
        })}
      </div>

      {/* Resources Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        {filteredResources.map((res) => {
          const isBookmarked = bookmarkedIds.includes(res.id);
          const isDone = completedIds.includes(res.id);

          return (
            <div
              key={res.id}
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: isDone ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                padding: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                {/* Header Tags */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <span
                      style={{
                        background: "#ffedd5",
                        color: "#ea580c",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "8px",
                      }}
                    >
                      {res.skill}
                    </span>
                    <span
                      style={{
                        background: "#f1f5f9",
                        color: "#334155",
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "8px",
                      }}
                    >
                      {res.type}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleBookmark(res.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: isBookmarked ? "#ea580c" : "#94a3b8",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <Bookmark size={16} fill={isBookmarked ? "#ea580c" : "none"} />
                  </button>
                </div>

                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: "0 0 6px", lineHeight: 1.4 }}>
                  {res.title}
                </h2>

                <p style={{ fontSize: "12.5px", color: "#64748b", lineHeight: 1.5, margin: "0 0 12px" }}>
                  {res.description}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11.5px", color: "#64748b" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <Clock size={12} /> {res.duration}
                  </span>
                  <span>•</span>
                  <span>{res.difficulty}</span>
                  <span>•</span>
                  <span style={{ color: res.isFree ? "#16a34a" : "#ea580c", fontWeight: 600 }}>
                    {res.isFree ? "Free" : "Paid"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "16px",
                  paddingTop: "12px",
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                <button
                  onClick={() => toggleCompleted(res.id)}
                  style={{
                    background: isDone ? "#dcfce7" : "#f8fafc",
                    border: "1px solid",
                    borderColor: isDone ? "#bbf7d0" : "#cbd5e1",
                    color: isDone ? "#166534" : "#475569",
                    borderRadius: "6px",
                    padding: "5px 10px",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <CheckCircle2 size={13} /> {isDone ? "Completed" : "Mark Done"}
                </button>

                <a
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: "#0f172a",
                    color: "#ffffff",
                    borderRadius: "6px",
                    padding: "5px 12px",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  Open Resource <ExternalLink size={12} />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
