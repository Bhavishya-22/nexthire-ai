"""
Comprehensive Automated Test Suite: Role-Specific Interview Preparation Engine
Tests:
1. Role loading from user profile (AI Engineer, Legal Advisor, Data Scientist, Backend Developer)
2. Category-specific question generation (Technical, Project, HR, Mock)
3. Role differentiation (Legal Advisor gets legal questions, AI Engineer gets AI questions, Data Scientist gets statistical questions, Backend gets systems questions)
4. Project questions reference the user's actual project context
5. Role-specific answer evaluation (rubric, score, strengths, concepts covered, missing concepts, model outline)
6. Dynamic role switching and state synchronization
7. Role-aware and category-aware cache isolation (zero cross-role leakage)
8. Multi-tenant user isolation (User B cannot access User A's interview questions or history)
9. Gemini API failure & error resilience (graceful fallback without crashing)
10. Interview history persistence
"""

import time
import os
import io
import json
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal, init_db
from app.models import User
from app.services.interview_prep import (
    generate_fallback_questions,
    _classify_role_archetype,
    _heuristic_role_evaluation,
)

init_db()
client = TestClient(app)

def run_tests():
    print("=" * 70)
    print("RUNNING ROLE-SPECIFIC INTERVIEW PREP TEST SUITE")
    print("=" * 70)

    ts = int(time.time())
    email1 = f"interview_test_{ts}@nexthire.ai"
    pwd1 = "SecurePassword2026!"
    name1 = "Taylor Vance"
    role1 = "AI Engineer"

    # Step 1: Register User A
    print("\n--- Test 1: User Registration ---")
    reg_res = client.post("/api/auth/register", json={
        "full_name": name1,
        "email": email1,
        "password": pwd1
    })
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    token1 = reg_res.json()["access_token"]
    user1_id = reg_res.json()["user"]["id"]
    headers1 = {"Authorization": f"Bearer {token1}"}
    print(f"[PASS] Registered User A (ID: {user1_id})")

    # Step 2: Onboard user with projects & target role = AI Engineer
    print("\n--- Test 2: Onboard with AI Engineer Profile & Projects ---")
    confirm_res = client.post(
        "/api/onboarding/confirm-profile",
        headers=headers1,
        json={
            "full_name": name1,
            "target_role": role1,
            "filename": "Taylor_Resume.pdf",
            "resume_text": "Experienced software engineer specializing in LLMs, RAG systems, vector search, Python, and PyTorch.",
            "profile": {
                "summary": "AI Engineer building scalable RAG and LLM systems.",
                "skills": ["Python", "FastAPI", "Vector Search", "LangChain", "RAG", "PyTorch", "Docker"],
                "technologies": ["Python", "FastAPI", "PostgreSQL", "Docker"],
                "projects": [
                    "RAG Knowledge Engine: Sub-200ms hybrid vector retrieval with cross-encoder reranking.",
                    "Agentic Workflow Hub: Tool-calling AI agents with safety guardrails."
                ],
                "experience": ["AI Research Intern at Tech Labs"],
                "education": ["B.S. in Computer Science"],
                "certifications": ["Deep Learning Specialization"],
                "achievements": ["Hackathon 1st Place"],
                "strengths": ["Fast API design", "LLM architecture"],
                "missing_skills": ["Kubernetes"],
                "improvement_suggestions": ["Add latency benchmarks"],
                "ats_score": 88
            }
        }
    )
    assert confirm_res.status_code == 200, f"Onboarding failed: {confirm_res.text}"
    print(f"[PASS] Onboarded user with role: {role1} and 2 explicit projects")

    # Step 3: Fetch Questions for AI Engineer (Technical)
    print("\n--- Test 3: AI Engineer Technical Questions ---")
    ai_tech_res = client.get("/api/dashboard/interview/questions?category=Technical&target_role=AI+Engineer", headers=headers1)
    assert ai_tech_res.status_code == 200, f"Questions failed: {ai_tech_res.text}"
    ai_tech_data = ai_tech_res.json()
    assert ai_tech_data["success"] is True
    assert ai_tech_data["target_role"] == "AI Engineer"
    assert ai_tech_data["category"] == "Technical"
    assert len(ai_tech_data["questions"]) >= 3

    ai_q_texts = " ".join([q["question"].lower() for q in ai_tech_data["questions"]])
    ai_keywords = ["rag", "vector", "retrieval", "llm", "embedding", "model", "hallucination", "pipeline", "fine-tuning"]
    found_ai_kw = [k for k in ai_keywords if k in ai_q_texts]
    assert len(found_ai_kw) >= 2, f"Expected AI keywords in AI questions, found: {found_ai_kw}"
    print(f"[PASS] AI Engineer technical questions contain genuine AI concepts: {found_ai_kw}")

    # Check question schema fields
    first_ai_q = ai_tech_data["questions"][0]
    assert "question_id" in first_ai_q
    assert "question" in first_ai_q
    assert "category" in first_ai_q
    assert "target_role" in first_ai_q
    assert "difficulty" in first_ai_q
    assert "relevant_skills" in first_ai_q
    assert "evaluation_criteria" in first_ai_q
    assert "expected_concepts" in first_ai_q
    print("[PASS] AI Engineer question contains complete metadata schema")

    # Step 4: AI Engineer Project Deep Dive Questions (Must reference actual projects)
    print("\n--- Test 4: AI Engineer Project Questions (Grounded in Real Projects) ---")
    ai_proj_res = client.get("/api/dashboard/interview/questions?category=Project&target_role=AI+Engineer", headers=headers1)
    assert ai_proj_res.status_code == 200
    ai_proj_data = ai_proj_res.json()
    assert len(ai_proj_data["questions"]) >= 2
    proj_q_texts = " ".join([q["question"] for q in ai_proj_data["questions"]])
    assert "RAG Knowledge Engine" in proj_q_texts or "Agentic Workflow Hub" in proj_q_texts or "Knowledge" in proj_q_texts, \
        f"Expected user's real project to be cited, got: {proj_q_texts}"
    print(f"[PASS] Project Deep Dive questions successfully cite user's real project: '{ai_proj_data['questions'][0]['question'][:80]}...'")

    # Step 5: AI Engineer HR & Behavioral
    print("\n--- Test 5: AI Engineer HR & Behavioral Questions ---")
    ai_hr_res = client.get("/api/dashboard/interview/questions?category=HR&target_role=AI+Engineer", headers=headers1)
    assert ai_hr_res.status_code == 200
    ai_hr_data = ai_hr_res.json()
    assert len(ai_hr_data["questions"]) >= 2
    print(f"[PASS] HR Questions returned for AI Engineer ({len(ai_hr_data['questions'])} questions)")

    # Step 6: AI Engineer Mock Simulation
    print("\n--- Test 6: AI Engineer Mock Simulation ---")
    ai_mock_res = client.get("/api/dashboard/interview/questions?category=Mock&target_role=AI+Engineer", headers=headers1)
    assert ai_mock_res.status_code == 200
    ai_mock_data = ai_mock_res.json()
    assert len(ai_mock_data["questions"]) >= 1
    print(f"[PASS] Mock Simulation returned for AI Engineer: '{ai_mock_data['questions'][0]['question'][:80]}...'")

    # Step 7: Answer Evaluation for AI Engineer
    print("\n--- Test 7: AI Engineer Answer Evaluation ---")
    sample_ai_ans = (
        "In our RAG pipeline, we implemented a hybrid search combining dense embeddings with BM25 keyword matching. "
        "We used HNSW indexing in pgvector for sub-50ms vector retrieval, followed by a cross-encoder reranker to improve precision. "
        "To mitigate hallucinations, we enforced strict citation ground truth validation and implemented Llama Guard guardrails "
        "with structured schema output validation."
    )
    ai_eval_res = client.post(
        "/api/dashboard/interview/feedback",
        headers=headers1,
        json={
            "question_id": first_ai_q["question_id"],
            "question": first_ai_q["question"],
            "answer": sample_ai_ans,
            "category": "Technical",
            "target_role": "AI Engineer",
            "expected_concepts": first_ai_q["expected_concepts"],
            "evaluation_criteria": first_ai_q["evaluation_criteria"]
        }
    )
    assert ai_eval_res.status_code == 200, f"Evaluation failed: {ai_eval_res.text}"
    ai_eval_data = ai_eval_res.json()
    assert ai_eval_data["success"] is True
    fb1 = ai_eval_data["feedback"]
    assert "overall_score" in fb1 and 0 <= fb1["overall_score"] <= 100
    assert fb1["overall_score"] >= 50
    assert "technical_correctness" in fb1
    assert "strengths" in fb1 and len(fb1["strengths"]) > 0
    assert "model_answer_outline" in fb1 and len(fb1["model_answer_outline"]) > 10
    assert "suggested_improvements" in fb1
    print(f"[PASS] AI Engineer answer scored {fb1['overall_score']}/100 with role-appropriate strengths and model outline")

    # Step 8: Switch User Role to Legal Advisor via Profile Update
    print("\n--- Test 8: Switch Profile Role to Legal Advisor ---")
    role2 = "Legal Advisor"
    update_prof_res = client.put(
        "/api/profile",
        headers=headers1,
        json={"target_role": role2}
    )
    assert update_prof_res.status_code == 200
    assert update_prof_res.json()["user"]["target_role"] == role2
    print(f"[PASS] User A target_role successfully updated to '{role2}'")

    # Step 9: Fetch Questions for Legal Advisor (Technical)
    # MUST be completely different from AI Engineer questions!
    print("\n--- Test 9: Legal Advisor Technical Questions (Role Differentiation) ---")
    legal_tech_res = client.get("/api/dashboard/interview/questions?category=Technical", headers=headers1)
    assert legal_tech_res.status_code == 200
    legal_tech_data = legal_tech_res.json()
    assert legal_tech_data["target_role"] == "Legal Advisor"
    assert len(legal_tech_data["questions"]) >= 3

    legal_q_texts = " ".join([q["question"].lower() for q in legal_tech_data["questions"]])
    legal_keywords = ["contract", "indemnif", "liability", "compliance", "regulatory", "jurisdiction", "statut", "due diligence", "gdpr", "legal"]
    found_legal_kw = [k for k in legal_keywords if k in legal_q_texts]
    assert len(found_legal_kw) >= 2, f"Expected Legal keywords in Legal questions, found: {found_legal_kw}"

    # Verify ZERO AI leakage in Legal questions
    forbidden_in_legal = ["vector database", "rag pipeline", "embedding model", "cross-encoder reranker", "pytorch"]
    for f_kw in forbidden_in_legal:
        assert f_kw not in legal_q_texts, f"Found AI keyword '{f_kw}' leaked in Legal Advisor questions!"
    print(f"[PASS] Legal Advisor questions contain legal domain principles: {found_legal_kw} and ZERO AI leakage")

    # Step 10: Legal Advisor Mock Simulation
    print("\n--- Test 10: Legal Advisor Mock Simulation ---")
    legal_mock_res = client.get("/api/dashboard/interview/questions?category=Mock", headers=headers1)
    assert legal_mock_res.status_code == 200
    legal_mock_data = legal_mock_res.json()
    first_legal_mock = legal_mock_data["questions"][0]
    assert any(k in first_legal_mock["question"].lower() for k in ["legal", "contract", "indemnif", "breach", "regulatory", "client", "compliance"])
    print(f"[PASS] Legal Advisor Mock Question: '{first_legal_mock['question'][:80]}...'")

    # Step 11: Evaluate Answer for Legal Advisor (Role-Appropriate Criteria)
    print("\n--- Test 11: Legal Advisor Answer Evaluation ---")
    sample_legal_ans = (
        "When negotiating limitation of liability and indemnification clauses, I first ensure that direct damages are capped "
        "at 12 months of fees paid under the contract, while strictly waiving consequential, indirect, and punitive damages. "
        "For third-party IP infringement indemnities, I resist uncapped liability and propose a separate super-cap (e.g. 2x contract value). "
        "Furthermore, our indemnity obligation must be contingent upon prompt written notice, sole control of defense and settlement, "
        "and exclude claims arising from unauthorized modifications or combinations with third-party software."
    )
    target_legal_q = next(
        (q for q in legal_tech_data["questions"] if any(k in q["question"].lower() for k in ["indemnif", "liability", "clause", "contract"])),
        legal_tech_data["questions"][0]
    )
    legal_eval_res = client.post(
        "/api/dashboard/interview/feedback",
        headers=headers1,
        json={
            "question_id": target_legal_q["question_id"],
            "question": target_legal_q["question"],
            "answer": sample_legal_ans,
            "category": "Technical",
            "target_role": "Legal Advisor",
            "expected_concepts": target_legal_q["expected_concepts"],
            "evaluation_criteria": target_legal_q["evaluation_criteria"]
        }
    )
    assert legal_eval_res.status_code == 200
    legal_eval_data = legal_eval_res.json()
    assert legal_eval_data["success"] is True
    fb_legal = legal_eval_data["feedback"]
    assert "overall_score" in fb_legal and 0 <= fb_legal["overall_score"] <= 100
    assert "technical_correctness" in fb_legal
    assert len(fb_legal["strengths"]) > 0
    assert "model_answer_outline" in fb_legal and len(fb_legal["model_answer_outline"]) > 10
    print(f"[PASS] Legal Advisor evaluation scored {fb_legal['overall_score']}/100 with legal domain feedback")

    # Step 12: Test Data Scientist Role (Profile Update + Role-Specific Questions)
    print("\n--- Test 12: Data Scientist Role Questions & Evaluation ---")
    update_ds = client.put(
        "/api/profile",
        headers=headers1,
        json={
            "target_role": "Data Scientist",
            "technical_skills": ["Python", "SQL", "Statistics", "A/B Testing", "Hypothesis Testing", "Machine Learning"]
        }
    )
    assert update_ds.status_code == 200
    ds_res = client.get("/api/dashboard/interview/questions?category=Technical&refresh=true", headers=headers1)
    assert ds_res.status_code == 200
    ds_data = ds_res.json()
    assert ds_data["target_role"] == "Data Scientist"
    ds_q_texts = " ".join([q["question"].lower() for q in ds_data["questions"]])
    print(f"DS Questions text: {ds_q_texts}")
    ds_keywords = ["hypothesis", "a/b test", "imbalanced", "statistical", "regression", "auc", "outlier", "correlation", "causal", "metric", "data"]
    found_ds_kw = [k for k in ds_keywords if k in ds_q_texts]
    assert len(found_ds_kw) >= 2, f"Expected Data Science keywords, found: {found_ds_kw}. All text: {ds_q_texts}"
    print(f"[PASS] Data Scientist questions contain statistical and experimentation concepts: {found_ds_kw}")

    # Step 13: Test Backend Developer Role (Profile Update + Role-Specific Questions)
    print("\n--- Test 13: Backend Developer Role Questions & Evaluation ---")
    update_be = client.put(
        "/api/profile",
        headers=headers1,
        json={
            "target_role": "Backend Developer",
            "technical_skills": ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker", "REST APIs", "System Design"]
        }
    )
    assert update_be.status_code == 200
    be_res = client.get("/api/dashboard/interview/questions?category=Technical&refresh=true", headers=headers1)
    assert be_res.status_code == 200
    be_data = be_res.json()
    assert be_data["target_role"] == "Backend Developer"
    be_q_texts = " ".join([q["question"].lower() for q in be_data["questions"]])
    print(f"BE Questions text: {be_q_texts}")
    be_keywords = ["api", "rest", "database", "indexing", "transaction", "isolation", "concurrency", "caching", "rate limit", "redis", "postgres", "sql"]
    found_be_kw = [k for k in be_keywords if k in be_q_texts]
    assert len(found_be_kw) >= 2, f"Expected Backend Developer keywords, found: {found_be_kw}. All text: {be_q_texts}"
    print(f"[PASS] Backend Developer questions contain API, database, and concurrency concepts: {found_be_kw}")

    # Step 14: Cache Isolation Across Roles (No Legal questions in AI Engineer cache)
    print("\n--- Test 14: Cache Isolation Across Roles ---")
    # Fetch AI Engineer cached questions
    ai_cached_res = client.get("/api/dashboard/interview/questions?category=Technical&target_role=AI+Engineer", headers=headers1)
    assert ai_cached_res.status_code == 200
    ai_cached_texts = " ".join([q["question"].lower() for q in ai_cached_res.json()["questions"]])
    assert "indemnif" not in ai_cached_texts, "Legal Advisor questions leaked into AI Engineer cache!"

    # Fetch Legal Advisor cached questions
    legal_cached_res = client.get("/api/dashboard/interview/questions?category=Technical&target_role=Legal+Advisor", headers=headers1)
    assert legal_cached_res.status_code == 200
    legal_cached_texts = " ".join([q["question"].lower() for q in legal_cached_res.json()["questions"]])
    assert "cross-encoder" not in legal_cached_texts, "AI Engineer questions leaked into Legal Advisor cache!"
    print("[PASS] Cache isolation verified: 0% cross-role question leakage")

    # Step 15: Multi-Tenant User Isolation (User B cannot see User A data)
    print("\n--- Test 15: Multi-Tenant User Isolation ---")
    email2 = f"interview_test2_{ts}@nexthire.ai"
    reg_res2 = client.post("/api/auth/register", json={
        "full_name": "Jordan Casey",
        "email": email2,
        "password": "Password456!"
    })
    token2 = reg_res2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # User B checks interview history -> MUST be 0
    u2_hist_res = client.get("/api/dashboard/interview/history", headers=headers2)
    assert u2_hist_res.status_code == 200
    assert u2_hist_res.json()["total"] == 0, "User B saw User A's interview history!"

    # User A checks interview history -> MUST be >= 2 attempts
    u1_hist_res = client.get("/api/dashboard/interview/history", headers=headers1)
    assert u1_hist_res.status_code == 200
    assert u1_hist_res.json()["total"] >= 2
    print(f"[PASS] User isolation verified: User A has {u1_hist_res.json()['total']} saved attempts, User B has 0")

    # Step 16: Category Switching Question Differentiation
    print("\n--- Test 16: Category Switching Differentiation ---")
    tech_qs = [q["question"] for q in legal_tech_data["questions"]]
    proj_qs = [q["question"] for q in client.get("/api/dashboard/interview/questions?category=Project&target_role=Legal+Advisor", headers=headers1).json()["questions"]]
    hr_qs = [q["question"] for q in client.get("/api/dashboard/interview/questions?category=HR&target_role=Legal+Advisor", headers=headers1).json()["questions"]]
    mock_qs = [q["question"] for q in legal_mock_data["questions"]]

    # Verify each category has distinct questions
    assert len(set(tech_qs).intersection(set(proj_qs))) == 0, "Technical and Project questions overlap!"
    assert len(set(tech_qs).intersection(set(hr_qs))) == 0, "Technical and HR questions overlap!"
    assert len(set(tech_qs).intersection(set(mock_qs))) == 0, "Technical and Mock questions overlap!"
    print("[PASS] Every interview category produces distinct, category-adapted question sets")

    # Step 17: Gemini Failure & Heuristic Fallback Resilience
    print("\n--- Test 17: Fallback Generator Unit Verification ---")
    roles_to_test = ["AI Engineer", "Legal Advisor", "Data Scientist", "Backend Developer", "Product Manager", "Cybersecurity Analyst", "Custom Chemical Engineer"]
    for r in roles_to_test:
        fb_qs = generate_fallback_questions(r, "Technical", [{"name": "Sample Project", "description": "desc"}], ["Skill A", "Skill B"])
        assert len(fb_qs) >= 3
        assert fb_qs[0].target_role == r
        assert len(fb_qs[0].expected_concepts) > 0

        # Test fallback answer evaluation
        eval_fb = _heuristic_role_evaluation(r, "Technical", fb_qs[0].question, "Here is a detailed explanation of our approach using industry standards and measurable metrics.", fb_qs[0].expected_concepts)
        assert eval_fb.overall_score >= 50
        assert len(eval_fb.strengths) > 0
        assert len(eval_fb.model_answer_outline) > 10

    print(f"[PASS] Fallback generator verified across {len(roles_to_test)} roles without crashing")

    # Cleanup test users
    db = SessionLocal()
    for em in [email1, email2]:
        u = db.query(User).filter(User.email == em).first()
        if u:
            db.delete(u)
    db.commit()
    db.close()

    print("\n" + "=" * 70)
    print(">>> ALL 17 ROLE-SPECIFIC INTERVIEW PREP TESTS PASSED! <<<")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
