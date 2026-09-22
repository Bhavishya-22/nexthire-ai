interface NavbarProps {
  onUploadClick: () => void;
  onHomeClick: () => void;
  isUploadActive: boolean;
}

export default function Navbar({
  onUploadClick,
  onHomeClick,
  isUploadActive,
}: NavbarProps) {
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
        onClick={onHomeClick}
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

      <nav style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <button
          onClick={onHomeClick}
          style={{
            background: "none",
            border: "none",
            fontSize: "15px",
            fontWeight: 600,
            color: !isUploadActive ? "#ff6b00" : "#64748b",
            cursor: "pointer",
            padding: "8px 12px",
            borderRadius: "8px",
          }}
        >
          Home
        </button>

        <button
          onClick={onUploadClick}
          style={{
            background: isUploadActive
              ? "linear-gradient(90deg, #ff6b00, #ff3d00)"
              : "#fff7ed",
            color: isUploadActive ? "white" : "#ff6b00",
            border: "1px solid #ff6b00",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
            padding: "9px 20px",
            borderRadius: "10px",
            boxShadow: isUploadActive ? "0 4px 14px rgba(255,107,0,0.3)" : "none",
            transition: "all 0.2s ease",
          }}
        >
          Analyze Resume
        </button>
      </nav>
    </header>
  );
}
