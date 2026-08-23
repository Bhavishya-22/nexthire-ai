from fastapi import APIRouter, HTTPException

from app.schemas.analysis import JobMatchRequest
from app.services.gemini import generate_json


router = APIRouter(
    prefix="/api/job",
    tags=["Job Matching"]
)


@router.post("/match")
async def job_match(
    request: JobMatchRequest
):

    try:

        prompt = f"""
You are an AI career matching engine for ELEVIQ.

Compare the candidate's resume with the job description.

RESUME:
{request.resume_text}

JOB DESCRIPTION:
{request.job_description}

Return ONLY valid JSON in exactly this format:

{{
    "match_score": 0,
    "matching_skills": [],
    "missing_skills": [],
    "matching_projects": [],
    "strengths": [],
    "recommendations": []
}}

Rules:

1. match_score must be an integer from 0 to 100.
2. matching_skills must contain skills present
   in both the resume and job description.
3. missing_skills must contain important job skills
   missing from the resume.
4. matching_projects should contain relevant projects
   from the resume.
5. strengths should explain why the candidate fits.
6. recommendations should explain how to improve the match.
7. Do not invent experience or projects.
8. Return JSON only.
"""

        result = generate_json(prompt)

        return {
            "success": True,
            "data": result
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Job matching failed: {str(e)}"
        )