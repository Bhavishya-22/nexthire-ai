import CareerDashboard from "../components/CareerDashboard";
import type { AnalysisResponse } from "../services/api";

interface DashboardProps {
  analysisData: AnalysisResponse["data"] | null;
  filename?: string;
  onStartUpload?: () => void;
  onAskAssistant?: () => void;
}

export default function Dashboard({
  analysisData,
  filename,
  onStartUpload,
  onAskAssistant,
}: DashboardProps) {
  return (
    <div
      style={{
        maxWidth: "1150px",
        margin: "0 auto",
        padding: "36px 20px 80px",
        minHeight: "82vh",
      }}
    >
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#1e293b", margin: 0 }}>
          Career Intelligence Dashboard
        </h1>
        <p style={{ color: "#64748b", margin: "6px 0 0", fontSize: "15px" }}>
          Comprehensive view of your Career Readiness Index, ATS score, identified skills, and extracted projects.
        </p>
      </div>

      <CareerDashboard
        analysisData={analysisData}
        filename={filename}
        onStartUpload={onStartUpload}
        onAskAssistant={onAskAssistant}
      />
    </div>
  );
}