import { type UserProfile } from "../services/api";

interface NavbarProps {
  currentView?: "home" | "dashboard" | "upload" | "assistant";
  onViewChange?: (view: "home" | "dashboard" | "upload" | "assistant") => void;
  onUploadClick?: () => void;
  onHomeClick?: () => void;
  isUploadActive?: boolean;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

export default function Navbar({
  currentView = "home",
  onViewChange,
  onUploadClick,
  onHomeClick,
  isUploadActive,
  currentUser,
  onOpenAuth,
  onLogout,
}: NavbarProps) {
  // Support both new view switcher and legacy onHomeClick/onUploadClick
  const activeView = isUploadActive !== undefined ? (isUploadActive ? "upload" : "home") : currentView;

  const navigateTo = (view: "home" | "dashboard" | "upload" | "assistant") => {
    if (onViewChange) {
      onViewChange(view);
    } else {
      if (view === "home" && onHomeClick) onHomeClick();
      if (view === "upload" && onUploadClick) onUploadClick();
    }
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255, 107, 0, 0.15)",
        padding: "16px 8%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div
        onClick={() => navigateTo("home")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #ff6b00, #ff9f1c)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            color: "white",
            boxShadow: "0 4px 12px rgba(255,107,0,0.3)",
          }}
        >
          🚀
        </div>
        <span
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: "#1e293b",
            letterSpacing: "-0.5px",
          }}
        >
          NextHire <span style={{ color: "#ff6b00" }}>AI</span>
        </span>
      </div>

      <nav style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <button
          onClick={() => navigateTo("home")}
          style={{
            background: "none",
            border: "none",
            fontSize: "15px",
            fontWeight: 600,
            color: activeView === "home" ? "#ff6b00" : "#64748b",
            cursor: "pointer",
            padding: "8px 12px",
            borderRadius: "8px",
          }}
        >
          Home
        </button>

        <button
          onClick={() => navigateTo("dashboard")}
          style={{
            background: activeView === "dashboard" ? "#fff7ed" : "none",
            border: activeView === "dashboard" ? "1px solid #fed7aa" : "none",
            fontSize: "15px",
            fontWeight: 600,
            color: activeView === "dashboard" ? "#ea580c" : "#64748b",
            cursor: "pointer",
            padding: "8px 12px",
            borderRadius: "8px",
          }}
        >
          Dashboard
        </button>

        <button
          onClick={() => navigateTo("assistant")}
          style={{
            background: activeView === "assistant" ? "#fff7ed" : "none",
            border: activeView === "assistant" ? "1px solid #fed7aa" : "none",
            fontSize: "15px",
            fontWeight: 600,
            color: activeView === "assistant" ? "#ea580c" : "#64748b",
            cursor: "pointer",
            padding: "8px 14px",
            borderRadius: "8px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>🧠</span> AI Assistant (RAG)
        </button>

        <button
          onClick={() => navigateTo("upload")}
          style={{
            background: activeView === "upload"
              ? "linear-gradient(90deg, #ff6b00, #ff3d00)"
              : "#fff7ed",
            color: activeView === "upload" ? "white" : "#ff6b00",
            border: "1px solid #ff6b00",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            padding: "9px 18px",
            borderRadius: "10px",
            boxShadow: activeView === "upload" ? "0 4px 14px rgba(255,107,0,0.3)" : "none",
            transition: "all 0.2s ease",
          }}
        >
          Analyze Resume
        </button>

        {/* User Auth Status */}
        {currentUser ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "8px" }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#334155",
                background: "#f1f5f9",
                padding: "6px 12px",
                borderRadius: "20px",
              }}
            >
              👤 {currentUser.full_name}
            </span>
            {onLogout && (
              <button
                onClick={onLogout}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "13px",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                Sign Out
              </button>
            )}
          </div>
        ) : onOpenAuth ? (
          <button
            onClick={onOpenAuth}
            style={{
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              color: "#334155",
              fontSize: "14px",
              fontWeight: 600,
              padding: "8px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              marginLeft: "6px",
            }}
          >
            Sign In
          </button>
        ) : null}
      </nav>
    </header>
  );
}
