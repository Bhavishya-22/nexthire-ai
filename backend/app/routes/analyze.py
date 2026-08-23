from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.gemini import analyze_resume


router = APIRouter(
    prefix="/api",
    tags=["AI Analysis"]
)


class AnalyzeRequest(BaseModel):
    resume_text: str


@router.post("/analyze")
def analyze(request: AnalyzeRequest):

    if not request.resume_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Resume text cannot be empty"
        )

    try:
        result = analyze_resume(request.resume_text)

        return {
            "success": True,
            "data": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Resume analysis failed: {str(e)}"
        )