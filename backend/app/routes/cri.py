from fastapi import APIRouter
from pydantic import BaseModel, Field


router = APIRouter(
    prefix="/api",
    tags=["Career Readiness"]
)


class CRIRequest(BaseModel):
    ats_score: int = Field(ge=0, le=100)
    job_match_score: int = Field(ge=0, le=100)
    skills_count: int = Field(ge=0)
    projects_count: int = Field(ge=0)
    missing_skills_count: int = Field(ge=0)


@router.post("/cri")
def calculate_cri(request: CRIRequest):

    skills_score = min(request.skills_count * 10, 100)

    projects_score = min(request.projects_count * 20, 100)

    if request.skills_count + request.missing_skills_count == 0:
        skill_coverage = 0
    else:
        skill_coverage = (
            request.skills_count
            / (
                request.skills_count
                + request.missing_skills_count
            )
        ) * 100

    cri_score = (
        request.ats_score * 0.30
        + request.job_match_score * 0.30
        + skills_score * 0.20
        + projects_score * 0.10
        + skill_coverage * 0.10
    )

    cri_score = round(cri_score)

    if cri_score >= 80:
        readiness_level = "Excellent"

    elif cri_score >= 65:
        readiness_level = "Good"

    elif cri_score >= 50:
        readiness_level = "Developing"

    else:
        readiness_level = "Needs Improvement"

    return {
        "success": True,
        "data": {
            "cri_score": cri_score,
            "readiness_level": readiness_level,
            "breakdown": {
                "ats_score": request.ats_score,
                "job_match_score": request.job_match_score,
                "skills_score": round(skills_score),
                "projects_score": round(projects_score),
                "skill_coverage": round(skill_coverage)
            }
        }
    }