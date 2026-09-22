from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.cri import calculate_cri as compute_cri


router = APIRouter(
    prefix="/api",
    tags=["Career Readiness"]
)


class CRIRequest(BaseModel):
    ats_score: int = Field(ge=0, le=100)
    job_match_score: int = Field(ge=0, le=100)
    skills_count: int = Field(ge=0)
    projects_count: int = Field(ge=0)
    missing_skills_count: int = Field(default=0, ge=0)


@router.post("/cri")
def calculate_cri(request: CRIRequest):
    result = compute_cri(
        ats_score=request.ats_score,
        job_match_score=request.job_match_score,
        skills_count=request.skills_count,
        projects_count=request.projects_count,
        missing_skills_count=request.missing_skills_count,
    )

    return {
        "success": True,
        "data": result,
    }