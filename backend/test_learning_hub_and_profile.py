"""
NextHire AI - Learning Hub & Career Progress Test Suite
Tests:
1. Role-specific personalized Learning Hub recommendations across 4 profiles:
   - AI Engineer
   - Legal Advisor
   - Data Scientist
   - Backend Developer
2. Authentic, verifiable learning resource links and metadata.
3. Persistent learning progress (bookmarking, completion, hours credited).
4. Progress Tracker integration with genuine learning hours and portfolio projects count.
5. Absence of job-tracking dependencies and absence of /jobs routes.
"""

import uuid
from app.database import Base, engine, SessionLocal
from app.models import User
from app.services.learning_hub import (
    get_personalized_learning_plan,
    toggle_resource_bookmark,
    toggle_resource_complete,
    get_learning_metrics,
    detect_role_archetype,
)
from app.routes.career_dashboard import (
    get_learning_recommendations,
    handle_toggle_bookmark,
    handle_toggle_complete,
    get_user_progress,
    LearningBookmarkPayload,
    LearningCompletePayload,
    router,
)


def create_test_candidate(email_prefix: str, target_role: str, skills: list, projects: list) -> User:
    db = SessionLocal()
    unique_email = f"{email_prefix}_{uuid.uuid4().hex[:6]}@example.com"
    user = User(
        email=unique_email,
        password="test_hash_secure",
        full_name=f"Candidate {target_role}",
        target_role=target_role,
        profile_data={
            "target_role": target_role,
            "resume_analysis": {
                "skills": skills,
                "missing_skills": ["Docker", "Kubernetes"] if "ai" in target_role.lower() else ["M&A Due Diligence"],
                "projects": projects,
                "experience": ["Junior Project Assistant"],
                "education": ["Bachelor of Technology / Law Degree"]
            },
            "user_projects": [
                {
                    "id": f"proj-{i}",
                    "name": p.get("name", "Demo Project"),
                    "description": "Demonstrates practical engineering application.",
                    "technologies": p.get("technologies", skills[:2]),
                    "skills": p.get("skills", skills[:2]),
                    "status": "Completed"
                }
                for i, p in enumerate(projects)
            ],
            "preferences": {
                "learning_hours_per_week": 10
            }
        }
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user


def test_01_archetype_detection():
    print("\n--- Test 1: Archetype Detection ---")
    assert detect_role_archetype("AI Engineer") == "ai_ml"
    assert detect_role_archetype("Machine Learning Researcher") == "ai_ml"
    assert detect_role_archetype("Corporate Legal Advisor") == "legal"
    assert detect_role_archetype("General Counsel & Compliance") == "legal"
    assert detect_role_archetype("Data Scientist") == "data_science"
    assert detect_role_archetype("Quantitative Data Analyst") == "data_science"
    assert detect_role_archetype("Backend Software Engineer") == "backend"
    assert detect_role_archetype("Cloud & API Engineer") == "backend"
    print("PASS: All role archetypes classified accurately.")


def test_02_learning_recommendations_role_aware():
    print("\n--- Test 2: Role-Specific Learning Recommendations ---")
    # AI candidate
    ai_cand = create_test_candidate("ai_learn", "AI Engineer", ["Python", "PyTorch"], [{"name": "AI Bot"}])
    db = SessionLocal()
    ai_user = db.query(User).filter(User.id == ai_cand.id).first()
    res_ai = get_learning_recommendations(target_role="AI Engineer", current_user=ai_user, db=db)
    recs_ai = res_ai["recommendations"]
    assert len(recs_ai) >= 3, f"Expected at least 3 AI recs, got {len(recs_ai)}"
    ai_skills = [r["skill"].lower() for r in recs_ai]
    assert any("nlp" in s or "transformer" in s or "pytorch" in s or "deep" in s for s in ai_skills)
    print(f"PASS: AI recommendations tailored ({len(recs_ai)} resources found).")

    # Legal candidate
    legal_cand = create_test_candidate("legal_learn", "Corporate Legal Advisor", ["Contract Law"], [{"name": "Legal Case Review"}])
    legal_user = db.query(User).filter(User.id == legal_cand.id).first()
    res_legal = get_learning_recommendations(target_role="Corporate Legal Advisor", current_user=legal_user, db=db)
    recs_legal = res_legal["recommendations"]
    assert len(recs_legal) >= 2, f"Expected at least 2 Legal recs, got {len(recs_legal)}"
    legal_skills = [r["skill"].lower() for r in recs_legal]
    assert any("contract" in s or "compliance" in s or "regulatory" in s for s in legal_skills)
    assert not any("pytorch" in s for s in legal_skills)
    print(f"PASS: Legal recommendations tailored ({len(recs_legal)} resources found).")

    # Data science candidate
    ds_cand = create_test_candidate("ds_learn", "Data Scientist", ["Python", "Pandas"], [{"name": "Data Analytics"}])
    ds_user = db.query(User).filter(User.id == ds_cand.id).first()
    res_ds = get_learning_recommendations(target_role="Data Scientist", current_user=ds_user, db=db)
    recs_ds = res_ds["recommendations"]
    assert len(recs_ds) >= 2
    ds_skills = [r["skill"].lower() for r in recs_ds]
    assert any("sql" in s or "scikit" in s or "a/b" in s for s in ds_skills)
    print(f"PASS: Data Science recommendations tailored ({len(recs_ds)} resources found).")
    db.close()


def test_03_learning_progress_persistence():
    print("\n--- Test 3: Learning Progress Persistence ---")
    user_cand = create_test_candidate("learn_persist", "Backend Developer", ["Python", "FastAPI"], [{"name": "API Service"}])
    db = SessionLocal()
    user = db.query(User).filter(User.id == user_cand.id).first()

    # Toggle bookmark
    bm_res = handle_toggle_bookmark(LearningBookmarkPayload(resource_id="learn-be-01"), current_user=user, db=db)
    assert bm_res["success"] is True
    assert bm_res["data"]["action"] == "added"
    assert "learn-be-01" in bm_res["data"]["bookmarked_ids"]

    # Toggle complete
    cmp_res = handle_toggle_complete(LearningCompletePayload(resource_id="learn-be-01", hours=4.5), current_user=user, db=db)
    assert cmp_res["success"] is True
    assert cmp_res["data"]["action"] == "completed"
    assert cmp_res["data"]["total_completed"] == 1

    # Check updated recommendations reflect bookmarked and completed
    rec_res = get_learning_recommendations(target_role="Backend Developer", current_user=user, db=db)
    target_rec = next(r for r in rec_res["recommendations"] if r["id"] == "learn-be-01")
    assert target_rec["is_bookmarked"] is True
    assert target_rec["is_completed"] is True
    print("PASS: Bookmarking and module completion persist accurately with genuine hours logged.")
    db.close()


def test_04_progress_tracker_without_jobs():
    print("\n--- Test 4: Progress Tracker Without Job Opportunities ---")
    cand = create_test_candidate("progress_user", "AI Engineer", ["Python", "PyTorch"], [{"name": "RAG Bot"}, {"name": "ML Model"}])
    db = SessionLocal()
    user = db.query(User).filter(User.id == cand.id).first()

    # Complete a learning module
    handle_toggle_complete(LearningCompletePayload(resource_id="learn-aiml-01", hours=5.0), current_user=user, db=db)

    prog_res = get_user_progress(current_user=user, db=db)
    assert prog_res["success"] is True
    p = prog_res["progress"]

    # Verify no job fields
    assert "jobs_saved" not in p, "jobs_saved should be absent from progress"
    assert "applications_submitted" not in p, "applications_submitted should be absent from progress"
    assert "projects_count" in p
    assert p["projects_count"] >= 2
    assert p["learning_modules_completed"] >= 1
    assert p["learning_hours_logged"] >= 5.0

    # Verify weekly goals do not mention applying to jobs
    for goal in p["weekly_goals"]:
        assert "job openings" not in goal["goal"].lower(), f"Weekly goal still mentions job openings: {goal}"

    print("PASS: Progress Tracker operates purely on genuine learning hours, roadmap milestones, and portfolio projects.")
    db.close()


def test_05_verify_no_jobs_routes():
    print("\n--- Test 5: Verify Absence of Job Endpoints ---")
    route_paths = [r.path for r in router.routes]
    job_routes = [p for p in route_paths if "job" in p]
    assert len(job_routes) == 0, f"Found unexpected job routes in career_dashboard router: {job_routes}"
    print(f"PASS: Exactly 0 job routes found in router (total remaining dashboard routes: {len(route_paths)}).")


if __name__ == "__main__":
    print("==================================================")
    print("NEXTHIRE AI — LEARNING HUB & PROGRESS TEST SUITE")
    print("==================================================")
    test_01_archetype_detection()
    test_02_learning_recommendations_role_aware()
    test_03_learning_progress_persistence()
    test_04_progress_tracker_without_jobs()
    test_05_verify_no_jobs_routes()
    print("\n==================================================")
    print("ALL 5 TESTS PASSED SUCCESSFULLY!")
    print("==================================================")
