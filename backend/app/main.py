import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from app.routes.analyze import router as analyze_router
from app.routes.resume import router as resume_router
from app.routes.job_match import router as job_match_router
from app.routes.cri import router as cri_router
from app.routes.full_analysis import router as full_analysis_router
from app.routes.resume_analysis import router as resume_analysis_router
from app.routes.job import router as job_router
from app.auth import router as auth_router


app = FastAPI(
    title="NextHire AI",
    description="AI-powered Career Intelligence Platform",
    version="1.0.0"
)

# Configure CORS origins from environment variable or standard local dev ports
allowed_origins_raw = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
)
allowed_origins = [
    origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if "*" not in allowed_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(resume_analysis_router)
app.include_router(analyze_router)
app.include_router(resume_router)
app.include_router(job_match_router)
app.include_router(cri_router)
app.include_router(full_analysis_router)
app.include_router(job_router)
app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "NextHire AI Backend is running",
        "status": "success",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "NextHire AI API"
    }