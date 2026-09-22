from pydantic import BaseModel, Field


class JobMatchRequest(BaseModel):
    resume_text: str
    job_description: str


class ResumeAnalysis(BaseModel):
    summary: str = Field(
        description="A concise professional summary of the candidate."
    )

    skills: list[str] = Field(
        default_factory=list,
        description="Technical and professional skills found in the resume."
    )

    projects: list[str] = Field(
        default_factory=list,
        description="Important projects mentioned in the resume."
    )

    experience: list[str] = Field(
        default_factory=list,
        description="Work experience, internships, or relevant practical experience."
    )

    education: list[str] = Field(
        default_factory=list,
        description="Education details found in the resume."
    )

    strengths: list[str] = Field(
        default_factory=list,
        description="Strong points of the candidate based on the resume."
    )

    missing_skills: list[str] = Field(
        default_factory=list,
        description="Skills that appear important but are missing or weak in the resume."
    )

    improvement_suggestions: list[str] = Field(
        default_factory=list,
        description="Specific actionable suggestions to improve the resume."
    )

    ats_score: int = Field(
        default=0,
        ge=0,
        le=100,
        description="Estimated ATS compatibility score from 0 to 100."
    )


class JobMatchResult(BaseModel):
    match_score: int = Field(
        default=0,
        ge=0,
        le=100
    )

    matching_skills: list[str] = Field(
        default_factory=list
    )

    missing_skills: list[str] = Field(
        default_factory=list
    )

    matching_projects: list[str] = Field(
        default_factory=list
    )

    strengths: list[str] = Field(
        default_factory=list
    )

    recommendations: list[str] = Field(
        default_factory=list
    )


class CompleteAnalysis(BaseModel):
    resume_analysis: ResumeAnalysis
    job_match: JobMatchResult | None = None
    cri: dict | None = None