from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.gemini import analyze_resume, analyze_job_match
from app.services.cri import calculate_cri as compute_cri


router = APIRouter(
    prefix="/api",
    tags=["Complete Analysis"]
)


class FullAnalysisRequest(BaseModel):
    resume_text: str
    job_description: str | None = None


@router.post("/full-analysis")
def full_analysis(request: FullAnalysisRequest):

    if not request.resume_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Resume text cannot be empty"
        )

    try:
        resume_analysis = analyze_resume(request.resume_text)

        job_match = None
        skills_count = len(resume_analysis.skills)
        projects_count = len(resume_analysis.projects)
        ats_score = resume_analysis.ats_score

        if request.job_description and request.job_description.strip():
            job_match = analyze_job_match(
                request.resume_text,
                request.job_description
            )
            cri = compute_cri(
                ats_score=ats_score,
                job_match_score=job_match.match_score,
                skills_count=skills_count,
                projects_count=projects_count,
                missing_skills_count=len(job_match.missing_skills),
            )
        else:
            cri = compute_cri(
                ats_score=ats_score,
                job_match_score=ats_score,
                skills_count=skills_count,
                projects_count=projects_count,
                missing_skills_count=len(resume_analysis.missing_skills),
            )

        return {
            "success": True,
            "data": {
                "resume_analysis": resume_analysis,
                "job_match": job_match,
                "cri": cri,
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Complete analysis failed: {str(e)}"
        )