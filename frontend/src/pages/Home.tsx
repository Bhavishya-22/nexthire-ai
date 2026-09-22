import Hero from "../components/Hero";
import Features from "../components/Features";

interface HomeProps {
  onStartUpload: () => void;
}

export default function Home({ onStartUpload }: HomeProps) {
  return (
    <main>
      <Hero onStartUpload={onStartUpload} />
      <Features onFeatureClick={onStartUpload} />
    </main>
  );
}
