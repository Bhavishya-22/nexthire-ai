import "./Features.css";

const features = [
  {
    icon: "📄",
    title: "Resume Intelligence",
    desc: "ATS Score & Resume Analysis powered by Gemini AI",
  },
  {
    icon: "🧠",
    title: "Skill Gap AI",
    desc: "Find Missing Skills & Actionable Recommendations",
  },
  {
    icon: "🎯",
    title: "Career Readiness",
    desc: "Track and measure your composite CRI score",
  },
  {
    icon: "💼",
    title: "Job Match",
    desc: "Compare your resume against any Job Description",
  },
  {
    icon: "🎤",
    title: "Interview Prep",
    desc: "Understand high-yield questions for your skill profile",
  },
  {
    icon: "📚",
    title: "Learning Roadmap",
    desc: "Targeted skill development roadmap for dream jobs",
  },
];

interface FeaturesProps {
  onFeatureClick?: () => void;
}

export default function Features({ onFeatureClick }: FeaturesProps) {
  return (
    <section className="features">
      {features.map((item) => (
        <button
          className="card"
          key={item.title}
          onClick={onFeatureClick}
          type="button"
        >
          <div className="icon">{item.icon}</div>
          <h3>{item.title}</h3>
          <p>{item.desc}</p>
        </button>
      ))}
    </section>
  );
}