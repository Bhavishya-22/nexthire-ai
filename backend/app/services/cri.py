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

    # 7-factor detailed intelligence breakdown (ELEVIQ specification)
    resume_int = min(max(1, round((ats / 100.0) * 20)), 20)
    skill_int = min(max(1, round((skills_score / 100.0) * 20)), 20)
    project_int = min(max(1, round((projects_score / 100.0) * 20)), 20)
    interview_int = min(max(1, round((job_match / 100.0) * 15)), 15)
    deployment_int = min(max(1, round((projects_score / 100.0) * 10)), 10)
    goal_int = min(max(1, round((skill_coverage / 100.0) * 10)), 10)
    learning_int = min(max(1, round((skills_score / 100.0) * 5)), 5)

    return {
        "cri_score": cri_score,
        "readiness_level": readiness_level,
        "breakdown": {
            "ats_score": ats,
            "job_match_score": job_match,
            "skills_score": round(skills_score),
            "projects_score": round(projects_score),
            "skill_coverage": round(skill_coverage)
        },
        "factors_7": {
            "resume_intelligence": {"score": resume_int, "max": 20, "label": "Resume Intelligence"},
            "skill_intelligence": {"score": skill_int, "max": 20, "label": "Skill Intelligence"},
            "project_intelligence": {"score": project_int, "max": 20, "label": "Project Intelligence"},
            "interview_readiness": {"score": interview_int, "max": 15, "label": "Interview Readiness"},
            "deployment_readiness": {"score": deployment_int, "max": 10, "label": "Deployment Readiness"},
            "career_goal_alignment": {"score": goal_int, "max": 10, "label": "Career Goal Alignment"},
            "continuous_learning": {"score": learning_int, "max": 5, "label": "Continuous Learning"}
        }
    }

