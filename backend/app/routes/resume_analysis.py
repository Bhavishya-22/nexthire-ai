from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.services.pdf import extract_text_from_pdf
from app.services.gemini import analyze_resume, analyze_job_match
from app.services.cri import calculate_cri as compute_cri


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

        if not resume_text or not resume_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from PDF. The document may be empty or an image-only scan."
            )

        resume_analysis = analyze_resume(resume_text)

        skills_count = len(resume_analysis.skills)
        projects_count = len(resume_analysis.projects)
        ats_score = resume_analysis.ats_score

        job_match = None

        if job_description and job_description.strip():
            job_match = analyze_job_match(
                resume_text,
                job_description.strip()
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
            "filename": file.filename,
            "data": {
                "resume_text_length": len(resume_text),
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
            detail=f"Resume analysis failed: {str(e)}"
        )