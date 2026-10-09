import CareerDashboard from "../components/CareerDashboard";
import type { AnalysisResponse, UserProfile } from "../services/api";

interface DashboardProps {
  currentUser?: UserProfile | null;
  analysisData: AnalysisResponse["data"] | null;
  filename?: string;
  onStartUpload?: () => void;
  onAskAssistant?: () => void;
  onViewChange?: (view: "home" | "dashboard" | "upload" | "assistant" | "onboarding") => void;
  onLogout?: () => void;
}

export default function Dashboard({
  currentUser,
  analysisData,
  filename,
  onStartUpload,
  onAskAssistant,
  onViewChange,
  onLogout,
}: DashboardProps) {
  return (
    <CareerDashboard
      currentUser={currentUser}
      analysisData={analysisData}
      filename={filename}
      onStartUpload={onStartUpload}
      onAskAssistant={onAskAssistant}
      onViewChange={onViewChange}
      onLogout={onLogout}
    />
  );
}