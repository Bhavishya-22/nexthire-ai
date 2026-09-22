from typing import Dict, Any


def calculate_cri(
    ats_score: int,
    job_match_score: int,
    skills_count: int,
    projects_count: int,
    missing_skills_count: int = 0
) -> Dict[str, Any]:
    """
    Calculates the Career Readiness Index (CRI) based on:
    - ATS Score (30%)
    - Job Match Score (30%)
    - Skills Volume Score (20%)
    - Projects Volume Score (10%)
    - Skill Coverage Ratio (10%)
    """
    ats = max(0, min(100, int(ats_score)))
    job_match = max(0, min(100, int(job_match_score)))

    # Skills score capped at 100 (10 skills = 100%)
    skills_score = min(max(0, skills_count) * 10, 100)

    # Projects score capped at 100 (5 projects = 100%)
    projects_score = min(max(0, projects_count) * 20, 100)

    # Skill coverage ratio
    total_skills = max(0, skills_count) + max(0, missing_skills_count)
    if total_skills == 0:
        skill_coverage = 0.0
    else:
        skill_coverage = (max(0, skills_count) / total_skills) * 100.0

    # Weighted CRI calculation
    cri_score = round(
        ats * 0.30
        + job_match * 0.30
        + skills_score * 0.20
        + projects_score * 0.10
        + skill_coverage * 0.10
    )

    cri_score = max(0, min(100, cri_score))

    if cri_score >= 80:
        readiness_level = "Excellent"
    elif cri_score >= 65:
        readiness_level = "Good"
    elif cri_score >= 50:
        readiness_level = "Developing"
    else:
        readiness_level = "Needs Improvement"

    return {
        "cri_score": cri_score,
        "readiness_level": readiness_level,
        "breakdown": {
            "ats_score": ats,
            "job_match_score": job_match,
            "skills_score": round(skills_score),
            "projects_score": round(projects_score),
            "skill_coverage": round(skill_coverage)
        }
    }
