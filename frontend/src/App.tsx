import { useState, useEffect } from "react";
import "./App.css";
import SignIn from "./pages/SignIn";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import ResumeUpload from "./components/ResumeUpload";
import CareerAssistant from "./components/CareerAssistant";
import {
  getCurrentUser,
  getUserProfile,
  logoutUser,
  type UserProfile,
  type AnalysisResponse,
} from "./services/api";

const LATEST_ANALYSIS_KEY = "nexthire_latest_analysis";
const LATEST_FILENAME_KEY = "nexthire_latest_filename";

// Flow: Page 1 (signin) -> Page 2 (onboarding) -> Page 3 (dashboard)
type ViewMode = "signin" | "onboarding" | "dashboard" | "assistant" | "upload";

function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>("signin");
  const [isInitializing, setIsInitializing] = useState(true);

  // Stored analysis data for the dashboard
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

  // Check auth session on startup: Page 1 (Sign In) is default if not logged in
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser(user);
          // If onboarding is incomplete, route to Page 2 (onboarding)
          if (!user.onboarding_completed) {
            setCurrentView("onboarding");
          } else {
            // If onboarding is complete, sync profile from backend and go to Page 3 (dashboard)
            const profileRes = await getUserProfile();
            if (profileRes?.has_profile && profileRes.analysis_data) {
              const rawBundle = profileRes.analysis_data as any;
              const dataToSet = rawBundle.data || rawBundle;
              setLatestAnalysis(dataToSet);
              setLatestFilename(profileRes.resume_filename || "");
              try {
                localStorage.setItem(LATEST_ANALYSIS_KEY, JSON.stringify(dataToSet));
                localStorage.setItem(LATEST_FILENAME_KEY, profileRes.resume_filename || "");
              } catch {}
            }
            setCurrentView("dashboard");
          }
        } else {
          // Logged-out user defaults directly to Page 1: Sign In
          setCurrentUser(null);
          setCurrentView("signin");
        }
      } catch {
        setCurrentUser(null);
        setCurrentView("signin");
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, []);

  // Post-Sign-In / Post-Registration Routing
  const handleAuthSuccess = async (user: UserProfile) => {
    setCurrentUser(user);
    if (!user.onboarding_completed) {
      // Incomplete onboarding -> Page 2: Resume Onboarding
      setCurrentView("onboarding");
    } else {
      // Completed onboarding -> Page 3: Career Intelligence Dashboard
      const profileRes = await getUserProfile();
      if (profileRes?.has_profile && profileRes.analysis_data) {
        const rawBundle = profileRes.analysis_data as any;
        const dataToSet = rawBundle.data || rawBundle;
        setLatestAnalysis(dataToSet);
        setLatestFilename(profileRes.resume_filename || "");
        try {
          localStorage.setItem(LATEST_ANALYSIS_KEY, JSON.stringify(dataToSet));
          localStorage.setItem(LATEST_FILENAME_KEY, profileRes.resume_filename || "");
        } catch {}
      }
      setCurrentView("dashboard");
    }
  };

  // Onboarding Complete Handler -> Page 3: Dashboard
  const handleOnboardingComplete = (data: AnalysisResponse["data"], filename: string) => {
    setLatestAnalysis(data);
    setLatestFilename(filename);
    try {
      localStorage.setItem(LATEST_ANALYSIS_KEY, JSON.stringify(data));
      localStorage.setItem(LATEST_FILENAME_KEY, filename);
    } catch {}

    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        onboarding_completed: true,
        has_profile: true,
        resume_filename: filename,
      });
    }

    // Direct transition to Page 3
    setCurrentView("dashboard");
  };

  const handleAnalysisSuccess = (data: AnalysisResponse["data"], filename: string) => {
    setLatestAnalysis(data);
    setLatestFilename(filename);
    try {
      localStorage.setItem(LATEST_ANALYSIS_KEY, JSON.stringify(data));
      localStorage.setItem(LATEST_FILENAME_KEY, filename);
    } catch {}
    setCurrentView("dashboard");
  };

  // Sign out clears auth and returns user directly to Page 1: Sign In
  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setLatestAnalysis(null);
    setLatestFilename("");
    try {
      localStorage.removeItem(LATEST_ANALYSIS_KEY);
      localStorage.removeItem(LATEST_FILENAME_KEY);
    } catch {}
    setCurrentView("signin");
  };

  // Loading splash on startup
  if (isInitializing) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fffaf5",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid #ea580c",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
            marginBottom: "16px",
          }}
        />
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#ea580c" }}>
          NextHire AI
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // --- ACCESS CONTROL & ROUTING ---
  // If not logged in, ALWAYS render Page 1: Sign In
  if (!currentUser || currentView === "signin") {
    return <SignIn onAuthSuccess={handleAuthSuccess} />;
  }

  // If logged in but onboarding is incomplete, ALWAYS render Page 2: Resume Onboarding
  if (!currentUser.onboarding_completed || currentView === "onboarding") {
    return (
      <Onboarding
        currentUser={currentUser}
        onOnboardingComplete={handleOnboardingComplete}
        onLogout={handleLogout}
      />
    );
  }

  // If logged in and onboarding is complete:
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* PAGE 3: Career Intelligence Dashboard */}
      {currentView === "dashboard" && (
        <Dashboard
          currentUser={currentUser}
          analysisData={latestAnalysis}
          filename={latestFilename}
          onStartUpload={() => setCurrentView("upload")}
          onAskAssistant={() => setCurrentView("assistant")}
          onViewChange={(view) => setCurrentView(view as ViewMode)}
          onLogout={handleLogout}
        />
      )}

      {/* Auxiliary protected routes */}
      {currentView === "assistant" && (
        <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
          <div
            style={{
              padding: "12px 24px",
              background: "#ffffff",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => setCurrentView("dashboard")}
              style={{
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                color: "#ea580c",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              ← Back to Career Dashboard
            </button>
            <button
              onClick={handleLogout}
              style={{
                background: "none",
                border: "none",
                color: "#64748b",
                fontSize: "13px",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Sign Out
            </button>
          </div>
          <CareerAssistant
            currentUser={currentUser}
            onOpenAuth={() => setCurrentView("signin")}
            onStartUpload={() => setCurrentView("upload")}
          />
        </div>
      )}

      {currentView === "upload" && (
        <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "20px" }}>
          <ResumeUpload
            onBack={() => setCurrentView("dashboard")}
            onAnalysisSuccess={handleAnalysisSuccess}
            onAskAssistant={() => setCurrentView("assistant")}
          />
        </div>
      )}
    </div>
  );
}

export default App;