import { useState } from "react";
import { analyzeResume } from "../services/api";

function ResumeUpload() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      setSelectedFile(null);
      return;
    }

    setError("");
    setSelectedFile(file);
    setResult(null);
  }

  async function handleAnalyze() {
    if (!selectedFile) {
      setError("Please upload a PDF resume.");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);

    try {
      const response = await analyzeResume(
        selectedFile,
        jobDescription
      );

      console.log("Complete analysis:", response);

      setResult(response.data);
    } catch (err: any) {
      console.error("Resume analysis failed:", err);

      setError(
        err.response?.data?.detail ||
          "Resume analysis failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Upload Resume</h2>

      <input
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        disabled={loading}
      />

      {selectedFile && (
        <p>
          <strong>Selected file:</strong>{" "}
          {selectedFile.name}
        </p>
      )}

      <div>
        <h3>Job Description</h3>

        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here..."
          rows={8}
          disabled={loading}
        />
      </div>

      <button
        type="button"
        onClick={handleAnalyze}
        disabled={loading || !selectedFile}
      >
        {loading ? "Analyzing..." : "Analyze Resume"}
      </button>

      {loading && (
        <p>
          Analyzing resume with AI. Please wait...
        </p>
      )}

      {error && <p>{error}</p>}

      {result && (
        <div>
          <h3>Resume Analysis</h3>

          {result.resume_analysis && (
            <>
              <p>
                <strong>ATS Score:</strong>{" "}
                {result.resume_analysis.ats_score}
              </p>

              <p>
                <strong>Summary:</strong>{" "}
                {result.resume_analysis.summary}
              </p>

              <h4>Skills</h4>

              <ul>
                {result.resume_analysis.skills?.map(
                  (skill: string, index: number) => (
                    <li key={index}>{skill}</li>
                  )
                )}
              </ul>

              <h4>Projects</h4>

              <ul>
                {result.resume_analysis.projects?.map(
                  (project: string, index: number) => (
                    <li key={index}>{project}</li>
                  )
                )}
              </ul>

              <h4>Missing Skills</h4>

              <ul>
                {result.resume_analysis.missing_skills?.map(
                  (skill: string, index: number) => (
                    <li key={index}>{skill}</li>
                  )
                )}
              </ul>

              <h4>Improvement Suggestions</h4>

              <ul>
                {result.resume_analysis.improvement_suggestions?.map(
                  (
                    suggestion: string,
                    index: number
                  ) => (
                    <li key={index}>{suggestion}</li>
                  )
                )}
              </ul>
            </>
          )}

          {result.job_match && (
            <div>
              <h3>Job Match</h3>

              <p>
                <strong>Match Score:</strong>{" "}
                {result.job_match.match_score}
              </p>

              <h4>Matching Skills</h4>

              <ul>
                {result.job_match.matching_skills?.map(
                  (skill: string, index: number) => (
                    <li key={index}>{skill}</li>
                  )
                )}
              </ul>

              <h4>Missing Skills</h4>

              <ul>
                {result.job_match.missing_skills?.map(
                  (skill: string, index: number) => (
                    <li key={index}>{skill}</li>
                  )
                )}
              </ul>

              <h4>Recommendations</h4>

              <ul>
                {result.job_match.recommendations?.map(
                  (
                    recommendation: string,
                    index: number
                  ) => (
                    <li key={index}>
                      {recommendation}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {result.cri && (
            <div>
              <h3>Career Readiness Index</h3>

              <p>
                <strong>CRI Score:</strong>{" "}
                {result.cri.cri_score}
              </p>

              <p>
                <strong>Readiness Level:</strong>{" "}
                {result.cri.readiness_level}
              </p>

              <h4>CRI Breakdown</h4>

              <ul>
                <li>
                  ATS Score:{" "}
                  {result.cri.breakdown.ats_score}
                </li>

                <li>
                  Job Match Score:{" "}
                  {result.cri.breakdown.job_match_score}
                </li>

                <li>
                  Skills Score:{" "}
                  {result.cri.breakdown.skills_score}
                </li>

                <li>
                  Projects Score:{" "}
                  {result.cri.breakdown.projects_score}
                </li>

                <li>
                  Skill Coverage:{" "}
                  {result.cri.breakdown.skill_coverage}
                </li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ResumeUpload;