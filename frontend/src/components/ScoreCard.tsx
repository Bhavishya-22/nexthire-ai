interface ScoreCardProps {
  title: string;
  score: number;
  maxScore?: number;
  subtitle?: string;
  badgeText?: string;
  color?: "orange" | "green" | "blue" | "purple";
}

export default function ScoreCard({
  title,
  score,
  maxScore = 100,
  subtitle,
  badgeText,
  color = "orange",
}: ScoreCardProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((score / maxScore) * 100)));

  const colorStyles = {
    orange: {
      bar: "linear-gradient(90deg, #ff9f1c, #ff6b00)",
      text: "#ff6b00",
      bg: "rgba(255, 107, 0, 0.08)",
      border: "rgba(255, 107, 0, 0.2)",
    },
    green: {
      bar: "linear-gradient(90deg, #10b981, #059669)",
      text: "#059669",
      bg: "rgba(16, 185, 129, 0.08)",
      border: "rgba(16, 185, 129, 0.2)",
    },
    blue: {
      bar: "linear-gradient(90deg, #3b82f6, #2563eb)",
      text: "#2563eb",
      bg: "rgba(37, 99, 235, 0.08)",
      border: "rgba(37, 99, 235, 0.2)",
    },
    purple: {
      bar: "linear-gradient(90deg, #a855f7, #7c3aed)",
      text: "#7c3aed",
      bg: "rgba(124, 58, 237, 0.08)",
      border: "rgba(124, 58, 237, 0.2)",
    },
  };

  const style = colorStyles[color];

  return (
    <div
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "20px 24px",
        border: `1px solid ${style.border}`,
        boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h4 style={{ margin: 0, fontSize: "15px", color: "#666", fontWeight: 600 }}>
          {title}
        </h4>
        {badgeText && (
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "20px",
              background: style.bg,
              color: style.text,
            }}
          >
            {badgeText}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
        <span style={{ fontSize: "36px", fontWeight: 800, color: "#222" }}>
          {score}
        </span>
        <span style={{ fontSize: "16px", color: "#888", fontWeight: 500 }}>
          / {maxScore}
        </span>
      </div>

      <div
        style={{
          width: "100%",
          height: "8px",
          background: "#f1f5f9",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${percentage}%`,
            background: style.bar,
            borderRadius: "8px",
            transition: "width 0.8s ease-in-out",
          }}
        />
      </div>

      {subtitle && (
        <p style={{ margin: 0, fontSize: "13px", color: "#777" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
