import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.database import get_db
from app.models import User
from app.auth import get_authenticated_user
from app.services.gemini import generate_json
from app.services.interview_prep import (
    InterviewQuestion,
    InterviewFeedbackRequest,
    InterviewFeedbackData,
    generate_role_questions_with_gemini,
    evaluate_interview_answer_ai,
    get_cached_questions,
    save_cached_questions,
    _normalize_role,
)
from app.services.learning_hub import (
    get_personalized_learning_plan,
    toggle_resource_bookmark,
    toggle_resource_complete,
    get_learning_metrics,
)

router = APIRouter(prefix="/api/dashboard", tags=["Career Dashboard Interactive Modules"])


# =========================================================================
# 1. PROJECTS MODULE (CRUD)
# =========================================================================

class ProjectPayload(BaseModel):
    name: str = Field(..., min_length=2)
    description: str = Field(..., min_length=5)
    technologies: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    status: str = Field(default="In Progress")  # "Completed", "In Progress", "Planned"
    github_url: Optional[str] = ""
    live_url: Optional[str] = ""
    metrics: Optional[str] = ""
    suggestions: Optional[str] = ""


def _get_or_init_projects(user: User) -> List[Dict[str, Any]]:
    profile_data = dict(user.profile_data or {})
    if "user_projects" in profile_data and isinstance(profile_data["user_projects"], list):
        return profile_data["user_projects"]

    # Initialize from resume analysis projects
    raw_projects = profile_data.get("resume_analysis", {}).get("projects", [])
    initial_projects = []
    
    for idx, p in enumerate(raw_projects):
        if isinstance(p, dict):
            p_name = p.get("name") or p.get("title") or f"Project {idx + 1}"
            p_desc = p.get("description") or "Demonstrates practical engineering application."
            p_techs = p.get("technologies") or ["Python", "FastAPI"]
            p_metrics = p.get("metrics") or ""
        else:
            p_str = str(p)
            parts = p_str.split(":", 1)
            p_name = parts[0].strip() if len(parts) > 1 else f"Project {idx + 1}"
            p_desc = parts[1].strip() if len(parts) > 1 else p_str
            p_techs = ["Python", "Machine Learning"]
            p_metrics = "Functional deployment with verified unit tests"

        initial_projects.append({
            "id": f"proj-{uuid.uuid4().hex[:8]}",
            "name": p_name,
            "description": p_desc,
            "technologies": p_techs,
            "skills": [t for t in p_techs],
            "status": "Completed" if idx == 0 else "In Progress",
            "github_url": "https://github.com/example/project",
            "live_url": "",
            "metrics": p_metrics,
            "suggestions": "Add Docker containerization, CI/CD pipeline, and benchmark latency.",
            "created_at": datetime.utcnow().isoformat()
        })

    if not initial_projects:
        # Default placeholder project
        initial_projects.append({
            "id": f"proj-{uuid.uuid4().hex[:8]}",
            "name": "AI Career Intelligence Engine",
            "description": "Full-stack application utilizing RAG, FastAPI, and pgvector embeddings for resume analysis.",
            "technologies": ["Python", "FastAPI", "PostgreSQL", "React", "Gemini API"],
            "skills": ["Vector Search", "API Design", "Prompt Engineering"],
            "status": "In Progress",
            "github_url": "https://github.com/Bhavishya-22/nexthire-ai",
            "live_url": "",
            "metrics": "Sub-100ms vector retrieval, 98% accuracy on parsed fields",
            "suggestions": "Deploy on cloud infrastructure with automated unit testing.",
            "created_at": datetime.utcnow().isoformat()
        })

    profile_data["user_projects"] = initial_projects
    user.profile_data = profile_data
    return initial_projects


@router.get("/projects")
def get_user_projects(
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    projects = _get_or_init_projects(current_user)
    db.add(current_user)
    db.commit()
    return {"success": True, "projects": projects}


@router.post("/projects")
def add_user_project(
    payload: ProjectPayload,
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    projects = _get_or_init_projects(current_user)
    new_proj = {
        "id": f"proj-{uuid.uuid4().hex[:8]}",
        "name": payload.name.strip(),
        "description": payload.description.strip(),
        "technologies": [t.strip() for t in payload.technologies if t.strip()],
        "skills": [s.strip() for s in payload.skills if s.strip()] or [t.strip() for t in payload.technologies if t.strip()],
        "status": payload.status,
        "github_url": (payload.github_url or "").strip(),
        "live_url": (payload.live_url or "").strip(),
        "metrics": (payload.metrics or "").strip(),
        "suggestions": (payload.suggestions or "").strip(),
        "created_at": datetime.utcnow().isoformat()
    }
    projects.insert(0, new_proj)

    profile_data = dict(current_user.profile_data or {})
    profile_data["user_projects"] = projects
    current_user.profile_data = profile_data
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return {"success": True, "message": "Project added successfully", "project": new_proj, "projects": projects}


@router.put("/projects/{project_id}")
def update_user_project(
    project_id: str,
    payload: ProjectPayload,
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    projects = _get_or_init_projects(current_user)
    found = False
    updated_proj = None

    for p in projects:
        if p["id"] == project_id:
            p["name"] = payload.name.strip()
            p["description"] = payload.description.strip()
            p["technologies"] = [t.strip() for t in payload.technologies if t.strip()]
            p["skills"] = [s.strip() for s in payload.skills if s.strip()] or p["technologies"]
            p["status"] = payload.status
            p["github_url"] = (payload.github_url or "").strip()
            p["live_url"] = (payload.live_url or "").strip()
            p["metrics"] = (payload.metrics or "").strip()
            p["suggestions"] = (payload.suggestions or "").strip()
            updated_proj = p
            found = True
            break

    if not found:
        raise HTTPException(status_code=404, detail="Project not found")

    profile_data = dict(current_user.profile_data or {})
    profile_data["user_projects"] = projects
    current_user.profile_data = profile_data
    db.add(current_user)
    db.commit()

    return {"success": True, "message": "Project updated successfully", "project": updated_proj, "projects": projects}


@router.delete("/projects/{project_id}")
def delete_user_project(
    project_id: str,
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    projects = _get_or_init_projects(current_user)
    initial_len = len(projects)
    projects = [p for p in projects if p["id"] != project_id]

    if len(projects) == initial_len:
        raise HTTPException(status_code=404, detail="Project not found")

    profile_data = dict(current_user.profile_data or {})
    profile_data["user_projects"] = projects
    current_user.profile_data = profile_data
    db.add(current_user)
    db.commit()

    return {"success": True, "message": "Project deleted successfully", "projects": projects}


# =========================================================================
# 2. ROADMAP MODULE (WEEKLY GOALS, DAILY TASKS & PERSISTENCE)
# =========================================================================

def _get_or_init_roadmap(user: User) -> Dict[str, Any]:
    profile_data = dict(user.profile_data or {})
    if "roadmap" in profile_data and isinstance(profile_data["roadmap"], dict):
        return profile_data["roadmap"]

    role = user.target_role or "AI Engineer"
    missing = profile_data.get("resume_analysis", {}).get("missing_skills", [])
    primary_missing = missing[0] if missing else "System Design"
    secondary_missing = missing[1] if len(missing) > 1 else "Deployment & Docker"
    tertiary_missing = missing[2] if len(missing) > 2 else "MLOps & Evaluation"

    weeks = [
        {
            "week_number": 1,
            "title": f"Core Foundations & {primary_missing}",
            "description": f"Solidify fundamental architecture patterns and close the {primary_missing} gap for {role}.",
            "milestone": f"Complete foundational {primary_missing} implementation & review exercises.",
            "tasks": [
                {"id": "t-1-1", "title": f"Study {primary_missing} architectural principles", "duration": "3 hrs", "completed": True, "category": "Theory"},
                {"id": "t-1-2", "title": f"Build prototype microservice using {primary_missing}", "duration": "4 hrs", "completed": True, "category": "Project"},
                {"id": "t-1-3", "title": "Implement error handling and edge cases", "duration": "2 hrs", "completed": False, "category": "Practice"},
                {"id": "t-1-4", "title": "Review benchmark and performance latency", "duration": "2 hrs", "completed": False, "category": "Evaluation"},
            ]
        },
        {
            "week_number": 2,
            "title": f"Advanced {secondary_missing} & Integration",
            "description": f"Bridge {secondary_missing} to demonstrate production-grade readiness.",
            "milestone": f"Integrate {secondary_missing} containerization with automated health checks.",
            "tasks": [
                {"id": "t-2-1", "title": f"Containerize backend application with Docker", "duration": "3 hrs", "completed": False, "category": "Deployment"},
                {"id": "t-2-2", "title": f"Set up environment configurations and secret management", "duration": "2 hrs", "completed": False, "category": "DevOps"},
                {"id": "t-2-3", "title": f"Build end-to-end integration tests for {role} workflows", "duration": "4 hrs", "completed": False, "category": "Testing"},
            ]
        },
        {
            "week_number": 3,
            "title": f"Specialized Engineering & {tertiary_missing}",
            "description": f"Master {tertiary_missing} and prepare portfolio presentation.",
            "milestone": f"Deliver a deployed project demonstrating {tertiary_missing}.",
            "tasks": [
                {"id": "t-3-1", "title": f"Implement {tertiary_missing} pipeline with metric tracking", "duration": "4 hrs", "completed": False, "category": "Project"},
                {"id": "t-3-2", "title": "Write comprehensive technical documentation and README", "duration": "2 hrs", "completed": False, "category": "Documentation"},
                {"id": "t-3-3", "title": "Conduct code quality audit and eliminate bottlenecks", "duration": "3 hrs", "completed": False, "category": "Refactoring"},
            ]
        },
        {
            "week_number": 4,
            "title": "Interview Readiness & Portfolio Polish",
            "description": f"Simulate rigorous technical interviews and finalize resume impact metrics for {role}.",
            "milestone": f"Pass 2 full mock interview simulations with >= 85% composite readiness.",
            "tasks": [
                {"id": "t-4-1", "title": f"Practice Top 10 Technical Questions for {role}", "duration": "3 hrs", "completed": False, "category": "Interview"},
                {"id": "t-4-2", "title": "Structure STAR format responses for all resume projects", "duration": "3 hrs", "completed": False, "category": "HR/Behavioral"},
                {"id": "t-4-3", "title": "Complete 1 full mock interview simulation", "duration": "2 hrs", "completed": False, "category": "Mock"},
            ]
        }
    ]

    total_tasks = sum(len(w["tasks"]) for w in weeks)
    completed_tasks = sum(sum(1 for t in w["tasks"] if t["completed"]) for w in weeks)
    pct = round((completed_tasks / total_tasks * 100)) if total_tasks else 0

    roadmap = {
        "target_role": role,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "progress_percentage": pct,
        "weeks": weeks
    }
    profile_data["roadmap"] = roadmap
    user.profile_data = profile_data
    return roadmap


@router.get("/roadmap")
def get_user_roadmap(
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    roadmap = _get_or_init_roadmap(current_user)
    db.add(current_user)
    db.commit()
    return {"success": True, "roadmap": roadmap}


class TaskTogglePayload(BaseModel):
    completed: bool


@router.put("/roadmap/tasks/{task_id}")
def toggle_roadmap_task(
    task_id: str,
    payload: TaskTogglePayload,
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    roadmap = _get_or_init_roadmap(current_user)
    task_found = False

    for w in roadmap.get("weeks", []):
        for t in w.get("tasks", []):
            if t["id"] == task_id:
                t["completed"] = payload.completed
                task_found = True
                break
        if task_found:
            break

    if not task_found:
        raise HTTPException(status_code=404, detail="Roadmap task not found")

    total_tasks = sum(len(w["tasks"]) for w in roadmap.get("weeks", []))
    completed_tasks = sum(sum(1 for t in w["tasks"] if t["completed"]) for w in roadmap.get("weeks", []))
    roadmap["total_tasks"] = total_tasks
    roadmap["completed_tasks"] = completed_tasks
    roadmap["progress_percentage"] = round((completed_tasks / total_tasks * 100)) if total_tasks else 0

    profile_data = dict(current_user.profile_data or {})
    profile_data["roadmap"] = roadmap
    current_user.profile_data = profile_data
    db.add(current_user)
    db.commit()

    return {"success": True, "message": "Task status updated", "roadmap": roadmap}


# =========================================================================
# 3. INTERVIEW PREPARATION MODULE (ROLE-AWARE QUESTIONS & EVALUATION)
# =========================================================================

class QuestionQueryPayload(BaseModel):
    category: Optional[str] = "Technical"
    target_role: Optional[str] = None
    refresh: bool = False


@router.get("/interview/questions")
def get_interview_questions(
    category: Optional[str] = "Technical",
    target_role: Optional[str] = None,
    refresh: bool = False,
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    """
    Returns role-specific and category-specific interview questions.
    Checks role-aware cache first unless refresh=True is requested.
    Extracts real projects, skills, and experience from user's profile.
    """
    role = _normalize_role(target_role or current_user.target_role)
    cat = category if category in ["Technical", "Project", "HR", "Mock"] else "Technical"

    # Check cache if not forcing refresh
    if not refresh:
        cached = get_cached_questions(current_user, role, cat)
        if cached:
            return {
                "success": True,
                "target_role": role,
                "category": cat,
                "questions": [q.model_dump() for q in cached],
                "total": len(cached),
                "is_cached": True
            }

    # Gather user context
    user_projects = _get_or_init_projects(current_user)
    profile_data = current_user.profile_data or {}
    skills = profile_data.get("resume_analysis", {}).get("skills", [])
    prefs = profile_data.get("preferences", {})
    exp_level = prefs.get("experience_level", "Mid-Level")
    job_desc = profile_data.get("job_description")
    
    # Gather previously answered questions to avoid duplicates
    history = profile_data.get("interview_history", [])
    prev_questions = [h.get("question") for h in history if h.get("target_role", "").lower() == role.lower() and h.get("category") == cat]

    questions = generate_role_questions_with_gemini(
        role=role,
        category=cat,
        projects=user_projects,
        skills=skills,
        experience_level=exp_level,
        job_description=job_desc,
        previously_answered=prev_questions
    )

    # Save to user's role-specific cache
    save_cached_questions(current_user, role, cat, questions)
    db.add(current_user)
    db.commit()

    return {
        "success": True,
        "target_role": role,
        "category": cat,
        "questions": [q.model_dump() for q in questions],
        "total": len(questions),
        "is_cached": False
    }


@router.post("/interview/questions")
def post_interview_questions(
    payload: QuestionQueryPayload,
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    return get_interview_questions(
        category=payload.category,
        target_role=payload.target_role,
        refresh=payload.refresh,
        current_user=current_user,
        db=db
    )


@router.post("/interview/feedback")
def evaluate_interview_answer(
    request: InterviewFeedbackRequest,
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    """
    Evaluates candidate interview answer using role-specific AI criteria and rubrics.
    Provides structured feedback on technical/domain correctness, completeness, relevance,
    clarity, practical depth, missing concepts, strengths, model answer outline, and rubric breakdown.
    Persists attempt to user's isolated interview history.
    """
    role = _normalize_role(request.target_role or current_user.target_role)
    cat = request.category if request.category in ["Technical", "Project", "HR", "Mock"] else "Technical"

    feedback_data = evaluate_interview_answer_ai(
        role=role,
        category=cat,
        question=request.question,
        answer=request.answer,
        expected_concepts=request.expected_concepts,
        evaluation_criteria=request.evaluation_criteria
    )

    feedback_dict = feedback_data.model_dump()

    # Record interview attempt in user profile
    profile_data = dict(current_user.profile_data or {})
    history = list(profile_data.get("interview_history", []))
    history.append({
        "id": f"int-{uuid.uuid4().hex[:8]}",
        "question_id": request.question_id or f"q-{uuid.uuid4().hex[:6]}",
        "question": request.question,
        "answer": request.answer,
        "category": cat,
        "target_role": role,
        "overall_score": feedback_dict.get("overall_score", 80),
        "technical_correctness": feedback_dict.get("technical_correctness", 80),
        "answer_completeness": feedback_dict.get("answer_completeness", 80),
        "relevance": feedback_dict.get("relevance", 80),
        "communication_clarity": feedback_dict.get("communication_clarity", 80),
        "practical_depth": feedback_dict.get("practical_depth", 80),
        "strengths": feedback_dict.get("strengths", []),
        "missing_concepts": feedback_dict.get("missing_concepts", []),
        "suggested_improvements": feedback_dict.get("suggested_improvements", ""),
        "model_answer_outline": feedback_dict.get("model_answer_outline", ""),
        "summary": feedback_dict.get("summary", ""),
        "created_at": datetime.utcnow().isoformat()
    })
    profile_data["interview_history"] = history
    current_user.profile_data = profile_data
    db.add(current_user)
    db.commit()

    return {
        "success": True,
        "feedback": feedback_dict,
        "history_count": len(history)
    }


@router.get("/interview/history")
def get_interview_history(
    target_role: Optional[str] = None,
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    """
    Returns authenticated user's interview history, optionally filtered by target_role.
    """
    profile_data = current_user.profile_data or {}
    history = profile_data.get("interview_history", [])
    if target_role:
        history = [h for h in history if h.get("target_role", "").lower() == target_role.strip().lower()]
    return {
        "success": True,
        "history": history,
        "total": len(history)
    }


# =========================================================================
# 4. LEARNING HUB MODULE (PERSONALIZED RECOMMENDATIONS & PROGRESS PERSISTENCE)
# =========================================================================

class LearningBookmarkPayload(BaseModel):
    resource_id: str


class LearningCompletePayload(BaseModel):
    resource_id: str
    hours: Optional[float] = 3.0


@router.get("/learning/recommendations")
def get_learning_recommendations(
    category: Optional[str] = None,
    target_role: Optional[str] = None,
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    profile_data = dict(current_user.profile_data or {})
    role = target_role or current_user.target_role or "AI Engineer"
    recommendations = get_personalized_learning_plan(
        user_profile=profile_data,
        target_role=role,
        filter_category=category
    )
    metrics = get_learning_metrics(profile_data)
    return {
        "success": True,
        "target_role": role,
        "recommendations": recommendations,
        "metrics": metrics,
        "total": len(recommendations)
    }


@router.post("/learning/toggle-bookmark")
def handle_toggle_bookmark(
    payload: LearningBookmarkPayload,
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    profile_data = dict(current_user.profile_data or {})
    res = toggle_resource_bookmark(profile_data, payload.resource_id)
    current_user.profile_data = profile_data
    flag_modified(current_user, "profile_data")
    db.add(current_user)
    db.commit()
    return {"success": True, "data": res}


@router.post("/learning/toggle-complete")
def handle_toggle_complete(
    payload: LearningCompletePayload,
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    profile_data = dict(current_user.profile_data or {})
    res = toggle_resource_complete(profile_data, payload.resource_id, payload.hours or 3.0)
    current_user.profile_data = profile_data
    flag_modified(current_user, "profile_data")
    db.add(current_user)
    db.commit()
    return {"success": True, "data": res}


@router.get("/learning/progress")
def get_learning_progress(
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    profile_data = dict(current_user.profile_data or {})
    metrics = get_learning_metrics(profile_data)
    return {"success": True, "metrics": metrics}


# =========================================================================
# 5. PROGRESS TRACKER (AGGREGATE REAL METRICS)
# =========================================================================

@router.get("/progress")
def get_user_progress(
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    profile_data = dict(current_user.profile_data or {})
    
    # 1. Roadmap progress
    roadmap = _get_or_init_roadmap(current_user)
    total_tasks = roadmap.get("total_tasks", 0)
    completed_tasks = roadmap.get("completed_tasks", 0)
    roadmap_pct = roadmap.get("progress_percentage", 0)

    # 2. Genuine Learning Hub progress & hours
    learning_metrics = get_learning_metrics(profile_data)
    learning_completed_count = learning_metrics["total_completed"]
    learning_hours_genuine = learning_metrics["total_hours"]

    # Base hours from user preferences plus genuine completed activities
    prefs = profile_data.get("preferences", {})
    base_hours = prefs.get("learning_hours_per_week", 10)
    hours_logged = (completed_tasks * 2.5) + learning_hours_genuine + (base_hours * 0.2)

    # 3. Mock interviews completed
    interview_history = profile_data.get("interview_history", [])
    mock_count = len(interview_history)

    # 4. Skills assessed
    skills = profile_data.get("resume_analysis", {}).get("skills", [])
    skills_count = len(skills)

    # 5. Portfolio projects
    user_projects = _get_or_init_projects(current_user)
    projects_count = len(user_projects)

    # 6. Recent activity timeline
    activities = [
        {"title": "Profile & Resume Analysis confirmed", "timestamp": "Onboarding", "type": "analysis"},
    ]
    if completed_tasks > 0:
        activities.append({"title": f"Completed {completed_tasks} learning roadmap tasks", "timestamp": "This week", "type": "roadmap"})
    if learning_completed_count > 0:
        activities.append({"title": f"Completed {learning_completed_count} verified Learning Hub modules ({learning_hours_genuine} hrs logged)", "timestamp": "Recent", "type": "learning"})
    if mock_count > 0:
        activities.append({"title": f"Practiced {mock_count} interview questions with AI evaluation", "timestamp": "Recent", "type": "interview"})
    if projects_count > 0:
        activities.append({"title": f"Built & tracked {projects_count} portfolio engineering projects", "timestamp": "Recent", "type": "project"})

    db.add(current_user)
    db.commit()

    return {
        "success": True,
        "progress": {
            "roadmap_completion_percentage": roadmap_pct,
            "tasks_completed": completed_tasks,
            "total_tasks": total_tasks,
            "learning_hours_logged": round(hours_logged, 1),
            "learning_modules_completed": learning_completed_count,
            "mock_interviews_completed": mock_count,
            "skills_assessed": skills_count,
            "projects_count": projects_count,
            "recent_activity": activities,
            "weekly_goals": [
                {"goal": f"Complete Week {min(4, (completed_tasks // 3) + 1)} roadmap milestone", "completed": completed_tasks >= 3},
                {"goal": "Practice 2 technical mock questions", "completed": mock_count >= 2},
                {"goal": "Build and document 1 portfolio project", "completed": projects_count >= 1},
            ]
        }
    }
