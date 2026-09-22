import json
import logging
import os
import time
from typing import Any, List, Optional

from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import ServerError, ClientError

from app.schemas.analysis import ResumeAnalysis, JobMatchResult

load_dotenv()

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

# Candidate fallback models in case the primary encounters temporary demand spikes
FALLBACK_MODELS = [
    MODEL_NAME,
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
]
# Remove duplicates while preserving order
FALLBACK_MODELS = list(dict.fromkeys(FALLBACK_MODELS))


def get_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your .env file."
        )
    return genai.Client(api_key=api_key)


# Initialize client for backward compatibility
client: Optional[genai.Client] = None
if GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        logger.warning(f"Could not pre-initialize Gemini client: {e}")


def _execute_with_retry_and_fallback(contents: str, config: types.GenerateContentConfig):
    """
    Executes Gemini content generation with retry on transient server errors
    and graceful fallback to secondary flash models if needed.
    """
    cli = get_client()
    last_error = None

    for model in FALLBACK_MODELS:
        for attempt in range(2):
            try:
                response = cli.models.generate_content(
                    model=model,
                    contents=contents,
                    config=config,
                )
                if response and response.text:
                    return response
            except (ServerError, Exception) as e:
                last_error = e
                # If error is a temporary 503 or transient failure, wait briefly and retry
                time.sleep(1.5)
                continue

    raise RuntimeError(
        f"Gemini API request failed across all candidate models ({', '.join(FALLBACK_MODELS)}): {last_error}"
    )


def analyze_resume(resume_text: str) -> ResumeAnalysis:
    prompt = f"""
You are NextHire AI, an AI-powered Career Intelligence system.

Your task is to analyze a candidate's resume and produce structured career intelligence.

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
Identify skills that appear weak or absent based ONLY on the candidate's current profile.

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

    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=ResumeAnalysis,
    )

    response = _execute_with_retry_and_fallback(prompt, config)

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

    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=JobMatchResult,
    )

    response = _execute_with_retry_and_fallback(prompt, config)

    if not response.text:
        raise RuntimeError("Gemini returned an empty response")

    return JobMatchResult.model_validate_json(response.text)


def generate_json(prompt: str) -> dict:
    """
    Generates arbitrary structured JSON response for custom prompts.
    """
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
    )

    response = _execute_with_retry_and_fallback(prompt, config)

    if not response.text:
        raise RuntimeError("Gemini returned an empty response")

    return json.loads(response.text)