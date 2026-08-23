import { useState } from "react";
import "./App.css";
import ResumeUpload from "./components/ResumeUpload";

const features = [
  {
    icon: "📄",
    title: "Resume Intelligence",
    desc: "ATS Score & Resume Analysis",
  },
  {
    icon: "🧠",
    title: "Skill Gap AI",
    desc: "Find Missing Skills",
  },
  {
    icon: "🎯",
    title: "Career Readiness",
    desc: "Track Your CRI",
  },
  {
    icon: "💼",
    title: "Job Match",
    desc: "Resume vs Job Description",
  },
  {
    icon: "🎤",
    title: "Interview Prep",
    desc: "AI Mock Interviews",
  },
  {
    icon: "📚",
    title: "Learning Roadmap",
    desc: "Personalized Growth Plan",
  },
];

function App() {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <>
      <div className="profile-container">
        <button className="profile-btn">
          <div className="profile-avatar">👤</div>
          <span>Profile</span>
        </button>
      </div>

      {!showUpload ? (
        <>
          <section className="hero">
            <div className="hero-left">
              <span className="badge">
                🚀 ELEVIQ : NextHire AI
              </span>

              <h1>
                Build Your Career
                <br />
                <span>Powered by AI</span>
              </h1>

              <p>
                Your AI-powered Career Intelligence Platform that continuously
                analyzes, predicts, explains, and improves your career readiness
                and helps you land your dream job faster.
              </p>

              <div className="hero-buttons">
                <button
                  className="primary-btn"
                  onClick={() => setShowUpload(true)}
                >
                  Upload Resume
                </button>

                <button className="secondary-btn">
                  Start Free Analysis
                </button>
              </div>
            </div>

            <div className="hero-right">
              <div className="rocket">🚀</div>
            </div>
          </section>

          <section className="features">
            {features.map((feature) => (
              <button className="card" key={feature.title}>
                <div className="icon">{feature.icon}</div>

                <h3>{feature.title}</h3>

                <p>{feature.desc}</p>
              </button>
            ))}
          </section>
        </>
      ) : (
        <ResumeUpload />
      )}
    </>
  );
}

export default App;