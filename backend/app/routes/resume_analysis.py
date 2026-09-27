import logging
from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.auth import get_optional_user
from app.services.pdf import extract_text_from_pdf
from app.services.gemini import analyze_resume, analyze_job_match
from app.services.cri import calculate_cri as compute_cri
from app.services.rag import index_resume_profile, index_generic_document

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api",
    tags=["Resume Analysis"]
)


@router.post("/resume/analyze")
async def analyze_resume_file(
    file: UploadFile = File(...),
    job_description: str = Form(""),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
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

        # Requirement 11: Auto-index into Career Knowledge Base if user is authenticated
        indexed_to_knowledge_base = False
        if current_user:
            try:
                index_resume_profile(
                    db=db,
                    user_id=current_user.id,
                    resume_analysis=resume_analysis,
                    raw_resume_text=resume_text,
                    filename=file.filename or "Uploaded Resume"
                )
                if job_description and job_description.strip():
                    index_generic_document(
                        db=db,
                        user_id=current_user.id,
                        title="Target Job Description",
                        doc_type="job_description",
                        content=job_description.strip(),
                        metadata={"source": "resume_analysis_session"}
                    )
                indexed_to_knowledge_base = True
            except Exception as index_err:
                logger.warning(f"Could not auto-index resume into RAG knowledge base: {index_err}")

        return {
            "success": True,
            "filename": file.filename,
            "indexed_to_knowledge_base": indexed_to_knowledge_base,
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