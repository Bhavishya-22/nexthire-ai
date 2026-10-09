import React, { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { loginUser, registerUser, type UserProfile } from "../services/api";

interface SignInProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export default function SignIn({ onAuthSuccess }: SignInProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Field Validations
    if (!email.trim()) {
      setError("Please enter your email or Gmail address.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address (e.g., alex@gmail.com).");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (mode === "register") {
      if (!fullName.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please re-enter.");
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "register") {
        const res = await registerUser(fullName.trim(), email.trim(), password);
        onAuthSuccess(res.user);
      } else {
        const res = await loginUser(email.trim(), password);
        onAuthSuccess(res.user);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        (err.message?.includes("Network Error")
          ? "Network error: Unable to connect to backend server. Please check if the API is running."
          : "Invalid email or password. Please verify your credentials.");
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #fffaf5 0%, #fff2e5 50%, #fed7aa 100%)",
        padding: "24px 16px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            background: "#ffffff",
            padding: "8px 18px",
            borderRadius: "30px",
            border: "1px solid #fed7aa",
            boxShadow: "0 4px 14px rgba(254, 215, 170, 0.4)",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #ff5722, #ff7a00)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <path
                d="M17.5 3L6 18H16L14 29L26 14H16L17.5 3Z"
                fill="#ffffff"
              />
            </svg>
          </div>
          <div style={{ textAlign: "left" }}>
            <span style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.3px" }}>
              ELEVIQ
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#ea580c", marginLeft: "6px" }}>
              NextHire AI
            </span>
          </div>
        </div>

        <h1
          style={{
            fontSize: "28px",
            fontWeight: 900,
            color: "#0f172a",
            margin: "0 0 8px",
            letterSpacing: "-0.5px",
          }}
        >
          {mode === "login" ? "Sign In to NextHire AI" : "Create Your Career Profile"}
        </h1>
        <p style={{ margin: 0, color: "#64748b", fontSize: "14.5px", maxWidth: "380px" }}>
          AI-Powered Career Intelligence, ATS Resume Analysis & Tailored Job Growth.
        </p>
      </div>

      {/* Main SaaS Auth Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "#ffffff",
          borderRadius: "24px",
          padding: "36px 32px",
          boxShadow: "0 20px 45px -12px rgba(234, 88, 12, 0.15), 0 4px 16px rgba(0,0,0,0.03)",
          border: "1px solid #ffedd5",
        }}
      >
        {/* Mode Selector Tabs */}
        <div
          style={{
            display: "flex",
            background: "#fff7ed",
            borderRadius: "14px",
            padding: "4px",
            marginBottom: "26px",
            border: "1px solid #fed7aa",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              borderRadius: "10px",
              background: mode === "login" ? "#ffffff" : "transparent",
              color: mode === "login" ? "#ea580c" : "#64748b",
              fontWeight: 700,
              fontSize: "13.5px",
              cursor: "pointer",
              boxShadow: mode === "login" ? "0 2px 8px rgba(234,88,12,0.12)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
            }}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              borderRadius: "10px",
              background: mode === "register" ? "#ffffff" : "transparent",
              color: mode === "register" ? "#ea580c" : "#64748b",
              fontWeight: 700,
              fontSize: "13.5px",
              cursor: "pointer",
              boxShadow: mode === "register" ? "0 2px 8px rgba(234,88,12,0.12)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fee2e2",
              borderRadius: "12px",
              padding: "12px 14px",
              color: "#b91c1c",
              fontSize: "13px",
              marginBottom: "20px",
              lineHeight: 1.45,
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "16px" }}>⚠️</span>
            <div style={{ flex: 1 }}>{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {mode === "register" && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                Full Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <User
                  size={17}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 42px",
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                    color: "#0f172a",
                    transition: "border 0.15s, box-shadow 0.15s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#f97316";
                    e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#cbd5e1";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 700,
                color: "#334155",
                marginBottom: "6px",
              }}
            >
              Email or Gmail Address <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={17}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                type="email"
                placeholder="alex.rivera@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 42px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  color: "#0f172a",
                  transition: "border 0.15s, box-shadow 0.15s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#f97316";
                  e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#cbd5e1";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 700,
                color: "#334155",
                marginBottom: "6px",
              }}
            >
              Password <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={17}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px 42px 12px 42px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  color: "#0f172a",
                  transition: "border 0.15s, box-shadow 0.15s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#f97316";
                  e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#cbd5e1";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                Confirm Password <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={17}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 42px",
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                    color: "#0f172a",
                    transition: "border 0.15s, box-shadow 0.15s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#f97316";
                    e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#cbd5e1";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "8px",
              background: loading
                ? "#fdba74"
                : "linear-gradient(90deg, #ff5722 0%, #ff7a00 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              padding: "14px 20px",
              fontSize: "14.5px",
              fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 6px 18px rgba(255, 87, 34, 0.28)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {loading ? (
              <>
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    border: "2px solid #ffffff",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>{mode === "login" ? "Sign In & Continue" : "Create Account & Get Started"}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Bottom Switcher */}
        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "13px", color: "#64748b" }}>
          {mode === "login" ? (
            <span>
              New to NextHire AI?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ea580c",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                Create an account
              </button>
            </span>
          ) : (
            <span>
              Already registered?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ea580c",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                Sign in to your account
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Security note */}
      <div
        style={{
          marginTop: "24px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          color: "#94a3b8",
          fontSize: "12px",
        }}
      >
        <ShieldCheck size={14} color="#16a34a" />
        <span>JWT Secured Authentication • Tenant Isolated Knowledge Base</span>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
