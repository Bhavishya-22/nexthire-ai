import React, { useState, useEffect } from "react";
import {
  askCareerAssistant,
  getCareerDocuments,
  addCareerDocument,
  deleteCareerDocument,
  type RAGQueryResponse,
  type CareerDocumentItem,
  type UserProfile,
} from "../services/api";

interface CareerAssistantProps {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onStartUpload: () => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  citations?: RAGQueryResponse["citations"];
  hasContext?: boolean;
  timestamp: string;
}

const SUGGESTED_PROMPTS = [
  "What are my top technical skills and core strengths?",
  "How should I explain my primary project in an interview?",
  "What critical skill gaps should I focus on closing next?",
  "Draft a tailored 60-second career pitch based on my experience.",
];

export default function CareerAssistant({
  currentUser,
  onOpenAuth,
  onStartUpload,
}: CareerAssistantProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "knowledge">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedCitationId, setExpandedCitationId] = useState<string | null>(null);

  // Knowledge Base State
  const [documents, setDocuments] = useState<CareerDocumentItem[]>([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [showAddDocForm, setShowAddDocForm] = useState(false);

  // Form State
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("career_goal");
  const [docContent, setDocContent] = useState("");
  const [submittingDoc, setSubmittingDoc] = useState(false);
  const [docFeedback, setDocFeedback] = useState("");

  useEffect(() => {
    if (currentUser) {
      loadDocuments();
      if (messages.length === 0) {
        setMessages([
          {
            id: "welcome",
            sender: "assistant",
            text: `Hello ${currentUser.full_name}! I am your AI Career Intelligence Assistant. I have access to your personal Career Knowledge Base. Ask me anything about your skills, projects, resume optimization, or target job compatibility!`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            hasContext: true,
          },
        ]);
      }
    } else {
      setDocuments([]);
      setTotalChunks(0);
      setMessages([
        {
          id: "guest-intro",
          sender: "assistant",
          text: "Welcome to the NextHire AI Career Intelligence Assistant! To query your personal career knowledge base with full vector retrieval and anti-hallucination citations, please sign in or create an account.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          hasContext: false,
        },
      ]);
    }
  }, [currentUser]);

  const loadDocuments = async () => {
    if (!currentUser) return;
    setLoadingDocs(true);
    try {
      const res = await getCareerDocuments();
      setDocuments(res.documents || []);
      setTotalChunks(res.total_chunks || 0);
    } catch (err) {
      console.error("Failed to load career documents:", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const query = (queryText || inputQuery).trim();
    if (!query) return;

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const res = await askCareerAssistant(query, 5);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: res.answer,
        citations: res.citations,
        hasContext: res.has_sufficient_context,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail ||
        "Could not generate an answer right now. Please verify backend connection and try again.";
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: `⚠️ ${errorMsg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          hasContext: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim()) return;

    setSubmittingDoc(true);
    setDocFeedback("");

    try {
      await addCareerDocument(docTitle.trim(), docType, docContent.trim());
      setDocFeedback("Document indexed and embedded successfully into your knowledge base!");
      setDocTitle("");
      setDocContent("");
      setShowAddDocForm(false);
      loadDocuments();
    } catch (err: any) {
      setDocFeedback(err.response?.data?.detail || "Failed to index document.");
    } finally {
      setSubmittingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId: number, docTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${docTitle}" from your Career Knowledge Base?`)) {
      return;
    }

    try {
      await deleteCareerDocument(docId);
      loadDocuments();
    } catch (err: any) {
      alert("Failed to delete document: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div
      style={{
        maxWidth: "1150px",
        margin: "0 auto",
        padding: "36px 20px 80px",
        minHeight: "82vh",
      }}
    >
      {/* Top Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                padding: "4px 10px",
                borderRadius: "20px",
                background: "#ffedd5",
                color: "#c2410c",
              }}
            >
              🧠 Production RAG Architecture
            </span>
            {currentUser && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "20px",
                  background: "#f0fdf4",
                  color: "#166534",
                }}
              >
                🔒 Knowledge Base: Isolated to {currentUser.full_name}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#1e293b", margin: 0 }}>
            Career Intelligence Assistant
          </h1>
          <p style={{ color: "#64748b", margin: "6px 0 0", fontSize: "15px" }}>
            Ground your career questions in your personal knowledge base using semantic vector retrieval & Gemini.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {!currentUser ? (
            <button
              onClick={onOpenAuth}
              style={{
                background: "linear-gradient(90deg, #ff6b00, #ff3d00)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(255, 107, 0, 0.3)",
              }}
            >
              Sign In to Unlock RAG
            </button>
          ) : (
            <button
              onClick={onStartUpload}
              style={{
                background: "white",
                color: "#ff6b00",
                border: "1px solid #fed7aa",
                borderRadius: "10px",
                padding: "10px 18px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Upload & Index Resume
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #e2e8f0",
          marginBottom: "24px",
          gap: "8px",
        }}
      >
        <button
          onClick={() => setActiveTab("chat")}
          style={{
            padding: "12px 24px",
            border: "none",
            background: "none",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            color: activeTab === "chat" ? "#ff6b00" : "#64748b",
            borderBottom: activeTab === "chat" ? "3px solid #ff6b00" : "3px solid transparent",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>💬</span> Assistant Chat
        </button>
        <button
          onClick={() => {
            setActiveTab("knowledge");
            if (currentUser) loadDocuments();
          }}
          style={{
            padding: "12px 24px",
            border: "none",
            background: "none",
            fontSize: "15px",
            fontWeight: 700,
            cursor: "pointer",
            color: activeTab === "knowledge" ? "#ff6b00" : "#64748b",
            borderBottom: activeTab === "knowledge" ? "3px solid #ff6b00" : "3px solid transparent",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>🗂️</span> Knowledge Base
          {currentUser && (
            <span
              style={{
                background: "#fed7aa",
                color: "#9a3412",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "12px",
              }}
            >
              {documents.length} docs ({totalChunks} chunks)
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ASSISTANT CHAT */}
      {activeTab === "chat" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Unauthenticated Alert */}
          {!currentUser && (
            <div
              style={{
                background: "#fffaf5",
                border: "1px solid #fed7aa",
                borderRadius: "14px",
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <strong style={{ color: "#c2410c", display: "block", marginBottom: "4px" }}>
                  💡 Sign in to query your own career data
                </strong>
                <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                  When logged in, your uploaded resumes, skills, and target job descriptions are securely indexed into PostgreSQL pgvector for grounded answers.
                </p>
              </div>
              <button
                onClick={onOpenAuth}
                style={{
                  background: "#ea580c",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 18px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Sign In / Register
              </button>
            </div>
          )}

          {/* Quick Prompts */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
                style={{
                  background: "white",
                  border: "1px solid #fed7aa",
                  borderRadius: "20px",
                  padding: "8px 14px",
                  fontSize: "13px",
                  color: "#9a3412",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                ⚡ {prompt}
              </button>
            ))}
          </div>

          {/* Chat Stream Window */}
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
              minHeight: "440px",
              maxHeight: "580px",
              overflowY: "auto",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    borderRadius: "16px",
                    padding: "16px 20px",
                    background:
                      msg.sender === "user"
                        ? "linear-gradient(90deg, #ff6b00, #ff5500)"
                        : "#f8fafc",
                    color: msg.sender === "user" ? "white" : "#1e293b",
                    border: msg.sender === "user" ? "none" : "1px solid #e2e8f0",
                    fontSize: "14px",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      marginBottom: "6px",
                      opacity: 0.8,
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>
                      {msg.sender === "user" ? "You" : "🤖 NextHire Career Assistant"}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div>{msg.text}</div>

                  {/* Anti-Hallucination Context Badge */}
                  {msg.sender === "assistant" && msg.citations && msg.citations.length > 0 && (
                    <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px dashed #cbd5e1" }}>
                      <div
                        onClick={() =>
                          setExpandedCitationId(
                            expandedCitationId === msg.id ? null : msg.id
                          )
                        }
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#ea580c",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span>📑 Cited Sources ({msg.citations.length})</span>
                        <span>{expandedCitationId === msg.id ? "▲ Hide" : "▼ View"}</span>
                      </div>

                      {expandedCitationId === msg.id && (
                        <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                          {msg.citations.map((c, cIdx) => (
                            <div
                              key={cIdx}
                              style={{
                                background: "#fffaf5",
                                border: "1px solid #fed7aa",
                                borderRadius: "8px",
                                padding: "8px 12px",
                                fontSize: "12px",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                <span style={{ fontWeight: 700, color: "#c2410c" }}>
                                  [Source #{cIdx + 1}: {c.document_title}] • {c.category}
                                </span>
                                <span style={{ color: "#059669", fontWeight: 600 }}>
                                  Sim: {(c.similarity * 100).toFixed(1)}%
                                </span>
                              </div>
                              <p style={{ margin: 0, color: "#64748b", fontStyle: "italic" }}>
                                "{c.snippet}"
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ea580c", fontSize: "14px" }}>
                <span>⚡</span>
                <span>Searching Career Knowledge Base & generating grounded response...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              background: "white",
              borderRadius: "16px",
              padding: "8px 12px 8px 18px",
              border: "1px solid #fdba74",
              boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                currentUser
                  ? "Ask anything about your skills, resume, target roles, or interview prep..."
                  : "Sign in to query your career knowledge base..."
              }
              disabled={loading}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "15px",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputQuery.trim()}
              style={{
                background:
                  loading || !inputQuery.trim()
                    ? "#cbd5e1"
                    : "linear-gradient(90deg, #ff6b00, #ff3d00)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: loading || !inputQuery.trim() ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              Ask Assistant
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: KNOWLEDGE BASE MANAGER */}
      {activeTab === "knowledge" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Knowledge Base Overview Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            <div style={{ background: "white", padding: "20px", borderRadius: "16px", border: "1px solid #fed7aa" }}>
              <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Indexed Documents</span>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#ea580c" }}>{documents.length}</div>
            </div>
            <div style={{ background: "white", padding: "20px", borderRadius: "16px", border: "1px solid #bfdbfe" }}>
              <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Vector Chunks Embedded</span>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#2563eb" }}>{totalChunks}</div>
            </div>
            <div style={{ background: "white", padding: "20px", borderRadius: "16px", border: "1px solid #bbf7d0" }}>
              <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Embedding Model</span>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#16a34a" }}>gemini-embedding-001</div>
              <span style={{ fontSize: "12px", color: "#64748b" }}>768-dimensional pgvector</span>
            </div>
          </div>

          {/* Action Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <h3 style={{ margin: 0, color: "#1e293b", fontSize: "18px" }}>
              Stored Career Documents & Goals
            </h3>
            <button
              onClick={() => setShowAddDocForm(!showAddDocForm)}
              style={{
                background: showAddDocForm ? "#f1f5f9" : "linear-gradient(90deg, #ff6b00, #ff3d00)",
                color: showAddDocForm ? "#475569" : "white",
                border: "none",
                borderRadius: "10px",
                padding: "10px 18px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {showAddDocForm ? "Cancel" : "+ Add Goal / Target Job / Note"}
            </button>
          </div>

          {/* Add Document Inline Form */}
          {showAddDocForm && (
            <form
              onSubmit={handleAddDocument}
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "24px",
                border: "1px solid #fdba74",
                boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <h4 style={{ margin: 0, color: "#1e293b" }}>Index New Career Document</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                    Document Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Target Job: Senior Full-Stack Engineer"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                    Category
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "white",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="career_goal">Career Goal</option>
                    <option value="job_description">Job Description</option>
                    <option value="certification">Certification / Course</option>
                    <option value="project_notes">Project Notes</option>
                    <option value="note">General Note</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                  Content (will be chunked and embedded into pgvector)
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Paste job description requirements, project milestones, or specific career goals..."
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {docFeedback && (
                <div style={{ fontSize: "13px", color: docFeedback.includes("success") ? "#16a34a" : "#dc2626" }}>
                  {docFeedback}
                </div>
              )}

              <button
                type="submit"
                disabled={submittingDoc}
                style={{
                  alignSelf: "flex-start",
                  background: "linear-gradient(90deg, #ff6b00, #ff3d00)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 24px",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: submittingDoc ? "not-allowed" : "pointer",
                }}
              >
                {submittingDoc ? "Generating Embeddings..." : "Save & Embed Document"}
              </button>
            </form>
          )}

          {/* Document List */}
          {loadingDocs ? (
            <p style={{ color: "#64748b" }}>Loading your career knowledge base...</p>
          ) : documents.length === 0 ? (
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "36px",
                textAlign: "center",
                border: "1px dashed #cbd5e1",
              }}
            >
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>📂</div>
              <h4 style={{ margin: "0 0 6px", color: "#1e293b" }}>Your Knowledge Base is Empty</h4>
              <p style={{ color: "#64748b", margin: "0 0 16px", fontSize: "14px" }}>
                Upload your resume or add custom career documents to enable grounded RAG answering.
              </p>
              <button
                onClick={onStartUpload}
                style={{
                  background: "#ea580c",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Upload Resume Now
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    background: "white",
                    borderRadius: "14px",
                    padding: "18px 24px",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div style={{ maxWidth: "75%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "16px" }}>
                        {doc.title}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          background: doc.doc_type === "resume" ? "#ffedd5" : "#eff6ff",
                          color: doc.doc_type === "resume" ? "#c2410c" : "#1d4ed8",
                        }}
                      >
                        {doc.doc_type}
                      </span>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        • {doc.chunk_count} vector chunks
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                      {doc.content_preview}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>{doc.created_at}</span>
                    <button
                      onClick={() => handleDeleteDocument(doc.id, doc.title)}
                      style={{
                        background: "#fef2f2",
                        border: "1px solid #fee2e2",
                        color: "#dc2626",
                        borderRadius: "8px",
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
