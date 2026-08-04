import "./Features.css";

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
    desc: "Resume vs JD",
  },
  {
    icon: "🎤",
    title: "Interview Prep",
    desc: "Practice AI Interviews",
  },
  {
    icon: "📚",
    title: "Learning Roadmap",
    desc: "Personalized Growth Plan",
  },
];

export default function Features() {
  return (
    <section className="features">

      {features.map((item) => (

        <button
          className="card"
          key={item.title}
        >
          <div className="icon">
            {item.icon}
          </div>

          <h3>{item.title}</h3>

          <p>{item.desc}</p>
        </button>

      ))}

    </section>
  );
}