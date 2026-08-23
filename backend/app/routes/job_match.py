from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.gemini import analyze_job_match


router = APIRouter(
    prefix="/api",
    tags=["Job Matching"]
)


class JobMatchRequest(BaseModel):
    resume_text: str
    job_description: str


@router.post("/job-match")
def job_match(request: JobMatchRequest):

    if not request.resume_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Resume text cannot be empty"
        )

    if not request.job_description.strip():
        raise HTTPException(
            status_code=400,
            detail="Job description cannot be empty"
        )

    try:
        result = analyze_job_match(
            request.resume_text,
            request.job_description
        )

        return {
            "success": True,
            "data": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Job matching failed: {str(e)}"
        )