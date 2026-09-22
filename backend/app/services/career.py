from app.services.gemini import client, MODEL_NAME, get_client
from app.schemas.analysis import JobMatchResult
from app.services.cri import calculate_cri as compute_cri
from google.genai import types


def match_job(
    resume_text: str,
    job_description: str
) -> JobMatchResult:

    prompt = f"""
You are NextHire AI, an AI career intelligence assistant.

Compare the candidate's resume against the provided job description.

Evaluate:

1. Overall compatibility.
2. Matching skills.
3. Missing skills.
4. Relevant projects.
5. Candidate strengths.
6. Recommendations.

Do not invent information.

Resume:

-------------------------
{resume_text}
-------------------------

Job Description:

-------------------------
{job_description}
-------------------------
"""

    cli = get_client()

    response = cli.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=JobMatchResult,
        ),
    )

    if not response.text:
        raise RuntimeError("Gemini returned an empty response")

    return JobMatchResult.model_validate_json(response.text)


def calculate_cri(
    ats_score: int,
    skill_match_score: int,
    project_score: int,
    experience_score: int
) -> int:
    """
    Legacy 4-factor CRI helper for backward compatibility.
    """
    cri = (
        ats_score * 0.25
        + skill_match_score * 0.30
        + project_score * 0.25
        + experience_score * 0.20
    )

    return round(cri)