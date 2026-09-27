import { useState, useEffect } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ResumeUpload from "./components/ResumeUpload";
import CareerAssistant from "./components/CareerAssistant";
import AuthModal from "./components/AuthModal";
import Footer from "./components/Footer";
import { getCurrentUser, logoutUser, type UserProfile, type AnalysisResponse } from "./services/api";

const LATEST_ANALYSIS_KEY = "nexthire_latest_analysis";
const LATEST_FILENAME_KEY = "nexthire_latest_filename";

function App() {
  const [currentView, setCurrentView] = useState<"home" | "dashboard" | "upload" | "assistant">("home");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Dynamic analysis data for Dashboard and Upload
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResponse["data"] | null>(() => {
    try {
      const saved = localStorage.getItem(LATEST_ANALYSIS_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [latestFilename, setLatestFilename] = useState<string>(() => {
    try {
      return localStorage.getItem(LATEST_FILENAME_KEY) || "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) setCurrentUser(user);
    });
  }, []);

  const handleAnalysisSuccess = (data: AnalysisResponse["data"], filename: string) => {
    setLatestAnalysis(data);
    setLatestFilename(filename);
    try {
      localStorage.setItem(LATEST_ANALYSIS_KEY, JSON.stringify(data));
      localStorage.setItem(LATEST_FILENAME_KEY, filename);
    } catch {}
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "#fff7ed",
      }}
    >
      <Navbar
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        onHomeClick={() => setCurrentView("home")}
        onUploadClick={() => setCurrentView("upload")}
        isUploadActive={currentView === "upload"}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <div style={{ flex: 1 }}>
        {currentView === "home" && (
          <Home onStartUpload={() => setCurrentView("upload")} />
        )}

        {currentView === "dashboard" && (
          <Dashboard
            analysisData={latestAnalysis}
            filename={latestFilename}
            onStartUpload={() => setCurrentView("upload")}
            onAskAssistant={() => setCurrentView("assistant")}
          />
        )}

        {currentView === "upload" && (
          <ResumeUpload
            onBack={() => setCurrentView("home")}
            onAnalysisSuccess={handleAnalysisSuccess}
            onAskAssistant={() => setCurrentView("assistant")}
          />
        )}

        {currentView === "assistant" && (
          <CareerAssistant
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onStartUpload={() => setCurrentView("upload")}
          />
        )}
      </div>

      <Footer />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    </div>
  );
}

export default App;