import os
import uuid
import logging
from typing import Optional

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.auth import get_optional_user
from app.services.pdf import extract_text_from_pdf
from app.services.gemini import analyze_resume
from app.services.rag import index_resume_profile

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/resume",
    tags=["Resume"]
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )

    file_id = str(uuid.uuid4())
    file_path = os.path.join(
        UPLOAD_DIR,
        f"{file_id}.pdf"
    )

    try:
        contents = await file.read()

        with open(file_path, "wb") as f:
            f.write(contents)

        resume_text = extract_text_from_pdf(file_path)

        if not resume_text:
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the PDF"
            )

        analysis = analyze_resume(resume_text)

        indexed_to_knowledge_base = False
        if current_user:
            try:
                index_resume_profile(
                    db=db,
                    user_id=current_user.id,
                    resume_analysis=analysis,
                    raw_resume_text=resume_text,
                    filename=file.filename or "Uploaded Resume"
                )
                indexed_to_knowledge_base = True
            except Exception as index_err:
                logger.warning(f"Could not auto-index resume into RAG knowledge base: {index_err}")

        return {
            "success": True,
            "filename": file.filename,
            "indexed_to_knowledge_base": indexed_to_knowledge_base,
            "data": analysis
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Resume processing failed: {str(e)}"
        )