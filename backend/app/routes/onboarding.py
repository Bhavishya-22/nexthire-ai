import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.auth import get_authenticated_user, _serialize_user
from app.services.pdf import extract_text_from_pdf
from app.services.gemini import analyze_resume, analyze_job_match
from app.services.cri import calculate_cri as compute_cri
from app.services.rag import index_resume_profile, index_generic_document
from app.schemas.analysis import ResumeAnalysis, JobMatchResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["User Onboarding & Profile"])

MAX_PDF_SIZE = 10 * 1024 * 1024  # 10MB


class ConfirmProfileRequest(BaseModel):
    full_name: str = Field(..., min_length=2)
    target_role: Optional[str] = ""
    filename: Optional[str] = "Uploaded Resume"
    resume_text: str = ""
    profile: ResumeAnalysis


@router.post("/onboarding/parse-resume")
async def onboarding_parse_resume(
    file: UploadFile = File(...),
    full_name: str = Form(""),
    target_role: str = Form(""),
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    """
    Onboarding Step 1: Uploads and parses the candidate's PDF resume.
    Extracts structured career profile (education, skills, technologies,
    projects, experience, certifications, achievements, ats_score).
    Returns data for user review and correction before final confirmation.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF documents are supported for resume onboarding")

    try:
        file_bytes = await file.read()

        if len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded PDF file is empty")

        if len(file_bytes) > MAX_PDF_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 10MB")

        resume_text = extract_text_from_pdf(file_bytes)

        if not resume_text or not resume_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract readable text from PDF. The document may be an image-only scan or password protected."
            )

        # Call existing Gemini analysis service
        resume_analysis = analyze_resume(resume_text)

        effective_name = full_name.strip() if full_name and full_name.strip() else current_user.full_name
        effective_role = target_role.strip() if target_role and target_role.strip() else ""

        return {
            "success": True,
            "filename": file.filename,
            "full_name": effective_name,
            "target_role": effective_role,
            "extracted_profile": resume_analysis,
            "resume_text": resume_text,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Onboarding resume parsing failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Resume parsing and analysis failed: {str(e)}"
        )


@router.post("/onboarding/confirm-profile")
def onboarding_confirm_profile(
    request: ConfirmProfileRequest,
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    """
    Onboarding Step 2: Saves reviewed/corrected profile, computes composite CRI,
    stores onboarding completion against the user, and auto-indexes into the user's
    isolated Career Knowledge Base (RAG).
    """
    try:
        profile = request.profile
        skills_count = len(profile.skills)
        projects_count = len(profile.projects)
        ats_score = profile.ats_score

        job_match = None
        target_role = request.target_role.strip() if request.target_role else ""

        # Calculate role compatibility if target role provided
        if target_role and request.resume_text:
            try:
                job_match = analyze_job_match(
                    request.resume_text,
                    f"Target Position / Career Goal: {target_role}"
                )
            except Exception as match_err:
                logger.warning(f"Could not compute target role job match: {match_err}")

        # Compute CRI
        if job_match:
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
                missing_skills_count=len(profile.missing_skills),
            )

        analysis_bundle = {
            "resume_text_length": len(request.resume_text),
            "resume_analysis": profile.model_dump(),
            "job_match": job_match.model_dump() if job_match else None,
            "cri": cri,
            "target_role": target_role,
            "filename": request.filename or "Uploaded Resume"
        }

        # Update user profile in database
        current_user.full_name = request.full_name.strip()
        current_user.target_role = target_role
        current_user.resume_filename = request.filename or "Uploaded Resume"
        current_user.profile_data = analysis_bundle
        current_user.onboarding_completed = True

        db.add(current_user)
        db.commit()
        db.refresh(current_user)

        # Auto-index into RAG Career Knowledge Base
        try:
            index_resume_profile(
                db=db,
                user_id=current_user.id,
                resume_analysis=profile,
                raw_resume_text=request.resume_text if request.resume_text else profile.summary,
                filename=request.filename or "Confirmed Resume Profile"
            )

            if target_role:
                index_generic_document(
                    db=db,
                    user_id=current_user.id,
                    title=f"Target Career Role: {target_role}",
                    doc_type="career_goal",
                    content=f"User Target Career Role and Direction: {target_role}\nPrimary skills: {', '.join(profile.skills[:10])}",
                    metadata={"source": "onboarding"}
                )
        except Exception as rag_err:
            logger.warning(f"Failed to auto-index onboarding profile into RAG: {rag_err}")

        return {
            "success": True,
            "message": "Career profile confirmed and saved successfully",
            "user": _serialize_user(current_user),
            "data": analysis_bundle
        }

    except Exception as e:
        logger.error(f"Failed to confirm onboarding profile: {e}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save career profile: {str(e)}"
        )


@router.get("/profile")
def get_user_profile(
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    """
    Fetches the authenticated user's persisted career profile and onboarding state.
    """
    has_profile = bool(current_user.onboarding_completed and current_user.profile_data)
    return {
        "success": True,
        "has_profile": has_profile,
        "onboarding_completed": bool(current_user.onboarding_completed),
        "target_role": current_user.target_role,
        "resume_filename": current_user.resume_filename,
        "user": _serialize_user(current_user),
        "analysis_data": current_user.profile_data if has_profile else None
    }


@router.post("/onboarding/analyze-and-onboard")
async def onboarding_analyze_and_onboard(
    file: UploadFile = File(...),
    full_name: str = Form(...),
    target_role: str = Form(""),
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    """
    Direct single-step onboarding:
    1. Validates and extracts PDF resume via PyMuPDF.
    2. Runs Gemini resume analysis.
    3. Computes job match against target role and composite CRI.
    4. Persists profile and onboarding completion against user.
    5. Auto-indexes into RAG.
    6. Returns confirmed analysis bundle.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF documents are supported for resume onboarding")

    try:
        file_bytes = await file.read()

        if len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded PDF file is empty")

        if len(file_bytes) > MAX_PDF_SIZE:
            raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 10MB")

        resume_text = extract_text_from_pdf(file_bytes)

        if not resume_text or not resume_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract readable text from PDF. The document may be an image-only scan or password protected."
            )

        # Call existing Gemini analysis service
        resume_analysis = analyze_resume(resume_text)

        effective_name = full_name.strip() if full_name and full_name.strip() else current_user.full_name
        effective_role = target_role.strip() if target_role and target_role.strip() else ""

        # Compute role compatibility if target role provided
        job_match = None
        if effective_role:
            try:
                job_match = analyze_job_match(
                    resume_text,
                    f"Target Position / Career Goal: {effective_role}"
                )
            except Exception as match_err:
                logger.warning(f"Could not compute target role job match: {match_err}")

        # Compute CRI
        skills_count = len(resume_analysis.skills)
        projects_count = len(resume_analysis.projects)
        ats_score = resume_analysis.ats_score

        if job_match:
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

        analysis_bundle = {
            "resume_text_length": len(resume_text),
            "resume_analysis": resume_analysis.model_dump(),
            "job_match": job_match.model_dump() if job_match else None,
            "cri": cri,
            "target_role": effective_role,
            "filename": file.filename or "Uploaded Resume"
        }

        # Update user profile in database
        current_user.full_name = effective_name
        current_user.target_role = effective_role
        current_user.resume_filename = file.filename or "Uploaded Resume"
        current_user.profile_data = analysis_bundle
        current_user.onboarding_completed = True

        db.add(current_user)
        db.commit()
        db.refresh(current_user)

        # Auto-index into RAG Career Knowledge Base
        try:
            index_resume_profile(
                db=db,
                user_id=current_user.id,
                resume_analysis=resume_analysis,
                raw_resume_text=resume_text,
                filename=file.filename or "Uploaded Resume"
            )

            if effective_role:
                index_generic_document(
                    db=db,
                    user_id=current_user.id,
                    title=f"Target Career Role: {effective_role}",
                    doc_type="career_goal",
                    content=f"User Target Career Role and Direction: {effective_role}\nPrimary skills: {', '.join(resume_analysis.skills[:10])}",
                    metadata={"source": "onboarding"}
                )
        except Exception as rag_err:
            logger.warning(f"Failed to auto-index onboarding profile into RAG: {rag_err}")

        return {
            "success": True,
            "message": "Career profile analyzed and onboarding completed successfully",
            "user": _serialize_user(current_user),
            "data": analysis_bundle
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Onboarding analysis failed: {e}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Resume analysis failed: {str(e)}"
        )

