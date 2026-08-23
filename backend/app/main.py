from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.analyze import router as analyze_router
from app.routes.resume import router as resume_router
from app.routes.job_match import router as job_match_router
from app.routes.cri import router as cri_router
from app.routes.full_analysis import router as full_analysis_router
from app.routes.resume_analysis import router as resume_analysis_router


app = FastAPI(
    title="NextHire AI",
    description="AI-powered Career Intelligence Platform",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(analyze_router)
app.include_router(resume_router)
app.include_router(job_match_router)
app.include_router(cri_router)
app.include_router(full_analysis_router)
app.include_router(resume_analysis_router)


@app.get("/")
def root():
    return {
        "message": "NextHire AI Backend is running",
        "status": "success"
    }