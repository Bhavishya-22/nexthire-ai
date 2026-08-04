import "./Hero.css";

export default function Hero() {
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
          Analyze resumes, calculate Career Readiness,
          discover skill gaps, prepare for interviews,
          and accelerate your career journey.
        </p>

        <div className="buttons">
          <button className="primary">
            Upload Resume
          </button>

          <button className="secondary">
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