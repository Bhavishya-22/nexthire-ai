import "./Hero.css";

interface HeroProps {
  onStartUpload?: () => void;
}

export default function Hero({ onStartUpload }: HeroProps) {
  return (
    <section className="hero">
      <div className="hero-left">
        <span className="badge">
          🚀 AI Career Intelligence Platform
        </span>

        <h1>
          Build Your Career
          <br />
          <span>Powered by AI</span>
        </h1>

        <p>
          Analyze resumes, calculate Career Readiness Index (CRI),
          discover skill gaps, match with job descriptions,
          and accelerate your career trajectory.
        </p>

        <div className="buttons">
          <button
            type="button"
            className="primary"
            onClick={onStartUpload}
          >
            Upload Resume
          </button>

          <button
            type="button"
            className="secondary"
            onClick={onStartUpload}
          >
            Start Free Analysis
          </button>
        </div>
      </div>

      <div className="hero-right">
        <div className="circle">
          🚀
        </div>
      </div>
    </section>
  );
}