export default function Footer() {
  return (
    <footer
      style={{
        background: "#18181b",
        color: "#a1a1aa",
        padding: "48px 8% 32px",
        marginTop: "auto",
        borderTop: "1px solid #27272a",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "32px",
          marginBottom: "32px",
        }}
      >
        <div style={{ maxWidth: "380px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <span style={{ fontSize: "22px" }}>🚀</span>
            <span
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: "white",
              }}
            >
              NextHire <span style={{ color: "#ff6b00" }}>AI</span>
            </span>
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.6 }}>
            AI-powered Career Intelligence Platform that continuously analyzes,
            predicts, explains, and improves your career readiness.
          </p>
        </div>

        <div>
          <h4 style={{ color: "white", marginBottom: "12px", fontSize: "15px" }}>
            Platform Modules
          </h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "14px", lineHeight: 2 }}>
            <li>📄 Resume Intelligence & ATS Scoring</li>
            <li>🧠 Skill Gap AI Detection</li>
            <li>💼 Job Description Compatibility</li>
            <li>🎯 Career Readiness Index (CRI)</li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: "white", marginBottom: "12px", fontSize: "15px" }}>
            Tech Stack
          </h4>
          <p style={{ fontSize: "14px", lineHeight: 1.8, maxWidth: "260px" }}>
            React 19 • Vite • FastAPI • Gemini AI • PyMuPDF • SQLAlchemy
          </p>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid #27272a",
          paddingTop: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          fontSize: "13px",
        }}
      >
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} NextHire AI. All rights reserved.
        </p>
        <p style={{ margin: 0 }}>
          Designed & Built for Career Intelligence
        </p>
      </div>
    </footer>
  );
}
