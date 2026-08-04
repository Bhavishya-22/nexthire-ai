from app.routes import resume
from app.routes import analysis
from fastapi import FastAPI
from app.database import engine, Base
from app import models

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(resume.router, prefix="/resume", tags=["Resume"])
app.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])

@app.get("/")
def root():
    return {"message": "NextHire AI Backend is Running!"}