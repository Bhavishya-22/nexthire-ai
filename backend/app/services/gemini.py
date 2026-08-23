import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

from app.schemas.analysis import ResumeAnalysis, JobMatchResult


load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set in the .env file")


client = genai.Client(api_key=GEMINI_API_KEY)


def analyze_resume(resume_text: str) -> ResumeAnalysis:

    prompt = f"""
You are NextHire AI, an AI-powered Career Intelligence system.

Your task is to analyze a candidate's resume and produce structured career
intelligence.

Analyze ONLY the information present in the resume.

Do NOT invent:
- skills
- projects
- companies
- job titles
- education
- certifications
- experience

If information is not present, return an empty list.

### ANALYSIS REQUIREMENTS

1. SUMMARY
Create a concise professional summary of the candidate.

2. SKILLS
Extract technical and professional skills explicitly mentioned in the resume.

3. PROJECTS
Extract the important projects mentioned in the resume.

4. EXPERIENCE
Extract internships, jobs, research experience, or relevant practical experience.

5. EDUCATION
Extract degrees, institutions, fields of study, and relevant academic information.

6. STRENGTHS
Identify the strongest aspects of the candidate's profile.

7. MISSING SKILLS
Identify skills that appear weak or absent based ONLY on the candidate's
current profile.

8. IMPROVEMENT SUGGESTIONS
Give practical suggestions for improving the resume and career profile.

9. ATS SCORE
Give an estimated ATS compatibility score from 0 to 100.

Consider:
- clear formatting
- relevant keywords
- measurable achievements
- section completeness
- technical skill visibility
- experience/project descriptions
- readability
- standard resume sections

The ATS score is an estimate, not a score from a specific company's ATS.

### RESUME

-------------------------
{resume_text}
-------------------------

Return the result according to the ResumeAnalysis schema.
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ResumeAnalysis,
        ),
    )

    if not response.text:
        raise RuntimeError("Gemini returned an empty response")

    return ResumeAnalysis.model_validate_json(response.text)


def analyze_job_match(
    resume_text: str,
    job_description: str
) -> JobMatchResult:

    prompt = f"""
You are NextHire AI, an AI-powered job matching system.

Compare the candidate's resume against the provided job description.

Do not invent information.

Analyze:

1. Overall match score from 0 to 100
2. Skills that appear in both the resume and job description
3. Important skills required by the job but missing from the resume
4. Resume projects relevant to the job
5. Candidate strengths for this specific role
6. Specific recommendations to improve the candidate's match

The match score should consider:
- required technical skills
- preferred skills
- relevant projects
- relevant experience
- education when relevant
- overall alignment with the role

### RESUME

-------------------------
{resume_text}
-------------------------

### JOB DESCRIPTION

-------------------------
{job_description}
-------------------------

Return the result according to the JobMatchResult schema.
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=JobMatchResult,
        ),
    )

    if not response.text:
        raise RuntimeError("Gemini returned an empty response")

    return JobMatchResult.model_validate_json(response.text)