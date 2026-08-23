from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.services.pdf import extract_text_from_pdf
from app.services.gemini import analyze_resume, analyze_job_match


router = APIRouter(
    prefix="/api",
    tags=["Resume Analysis"]
)


@router.post("/resume/analyze")
async def analyze_resume_file(
    file: UploadFile = File(...),
    job_description: str = Form("")
):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file provided"
        )

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )

    try:
        file_bytes = await file.read()

        resume_text = extract_text_from_pdf(file_bytes)

        if not resume_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from PDF"
            )

        resume_analysis = analyze_resume(resume_text)

        job_match = None
        cri = None

        if job_description.strip():

            job_match = analyze_job_match(
                resume_text,
                job_description
            )

            skills_count = len(resume_analysis.skills)
            projects_count = len(resume_analysis.projects)
            missing_skills_count = len(job_match.missing_skills)

            ats_score = resume_analysis.ats_score
            job_match_score = job_match.match_score

            skills_score = min(
                skills_count * 10,
                100
            )

            projects_score = min(
                projects_count * 20,
                100
            )

            if skills_count + missing_skills_count == 0:
                skill_coverage = 0
            else:
                skill_coverage = (
                    skills_count /
                    (
                        skills_count +
                        missing_skills_count
                    )
                ) * 100

            cri_score = round(
                ats_score * 0.30
                + job_match_score * 0.30
                + skills_score * 0.20
                + projects_score * 0.10
                + skill_coverage * 0.10
            )

            if cri_score >= 80:
                readiness_level = "Excellent"
            elif cri_score >= 65:
                readiness_level = "Good"
            elif cri_score >= 50:
                readiness_level = "Developing"
            else:
                readiness_level = "Needs Improvement"

            cri = {
                "cri_score": cri_score,
                "readiness_level": readiness_level,
                "breakdown": {
                    "ats_score": ats_score,
                    "job_match_score": job_match_score,
                    "skills_score": round(skills_score),
                    "projects_score": round(projects_score),
                    "skill_coverage": round(skill_coverage)
                }
            }

        return {
            "success": True,
            "filename": file.filename,
            "data": {
                "resume_text_length": len(resume_text),
                "resume_analysis": resume_analysis,
                "job_match": job_match,
                "cri": cri
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Resume analysis failed: {str(e)}"
        )