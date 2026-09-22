import { useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ResumeUpload from "./components/ResumeUpload";
import Footer from "./components/Footer";

function App() {
  const [showUpload, setShowUpload] = useState(false);

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
        onHomeClick={() => setShowUpload(false)}
        onUploadClick={() => setShowUpload(true)}
        isUploadActive={showUpload}
      />

      <div style={{ flex: 1 }}>
        {!showUpload ? (
          <Home onStartUpload={() => setShowUpload(true)} />
        ) : (
          <ResumeUpload onBack={() => setShowUpload(false)} />
        )}
      </div>

      <Footer />
    </div>
  );
}

export default App;