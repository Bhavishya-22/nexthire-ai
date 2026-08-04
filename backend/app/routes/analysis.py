from fastapi import APIRouter
from app.services.ai_analysis import analyze_resume



router=APIRouter(
prefix="/analysis"
)


@router.post("/")
def analysis(data:dict):


    resume=data["text"]


    result=analyze_resume(
        resume
    )


    return {

        "analysis":result

    }