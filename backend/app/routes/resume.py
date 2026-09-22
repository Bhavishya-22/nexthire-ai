import os
import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.pdf import extract_text_from_pdf
from app.services.gemini import analyze_resume


router = APIRouter(
    prefix="/api/resume",
    tags=["Resume"]
)


UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):

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

        return {
            "success": True,
            "filename": file.filename,
            "data": analysis
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Resume processing failed: {str(e)}"
        )