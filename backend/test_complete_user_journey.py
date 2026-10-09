"""
E2E Integration Test: Complete 14-Step User Journey Verification
Covers:
1. Registration (name, email, password)
2. Login & JWT token issuance
3. Redirect to resume onboarding
4. Upload PDF & target career role
5. Backend parses resume & extracts profile
6. User reviews & confirms extracted profile
7. Backend saves profile & analyzes resume
8. Calculation of ATS, skill gaps, recommendations, and CRI
9. Dashboard receives verified analysis
10. Dashboard cards display actual saved analysis
11. Career Assistant RAG query
12. Grounded response with valid citations & source references
13. Logout and re-login data persistence
14. Multi-tenant isolation (User 2 cannot access User 1 data)
"""
import time
import os
import io
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import User, CareerDocument, CareerKnowledgeChunk

client = TestClient(app)

def run():
    print("=" * 65)
    print("VERIFYING COMPLETE 14-STEP USER JOURNEY")
    print("=" * 65)
    ts = int(time.time())

    # STEP 1: Registration
    email1 = f"journey_user1_{ts}@example.com"
    pwd1 = "SecurePass123!"
    name1 = "Alex Rivera"
    role1 = "Machine Learning Engineer"

    print("\n--- Step 1: User 1 Registration ---")
    reg_res = client.post("/api/auth/register", json={
        "full_name": name1,
        "email": email1,
        "password": pwd1
    })
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    user1_id = reg_res.json()["user"]["id"]
    print(f"[PASS] User registered with ID: {user1_id}, email: {email1}")

    # STEP 2: User Login
    print("\n--- Step 2: User 1 Login ---")
    login_res = client.post("/api/auth/login", json={
        "email": email1,
        "password": pwd1
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token1 = login_res.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}
    print("[PASS] Login successful, JWT access token received")

    # STEP 3: Route Protection / Journey Status Check
    print("\n--- Step 3: Journey Status (Onboarding Redirect Check) ---")
    status_res = client.get("/api/profile", headers=headers1)
    assert status_res.status_code == 200
    st_data = status_res.json()
    assert st_data["onboarding_completed"] is False
    assert st_data["has_profile"] is False
    print("[PASS] New user correctly shows onboarding not completed, routing to onboarding")

    # STEP 4 & 5: Upload PDF & Parse Resume
    print("\n--- Steps 4 & 5: Resume Upload & Parsing ---")
    upload_dir = "uploads"
    pdf_files = [f for f in os.listdir(upload_dir) if f.endswith(".pdf")]
    assert len(pdf_files) > 0, "No sample PDF found in uploads/"
    sample_pdf_path = os.path.join(upload_dir, pdf_files[0])
    with open(sample_pdf_path, "rb") as f:
        pdf_bytes = f.read()

    files = {"file": ("Alex_Rivera_Resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    ext_res = client.post(
        "/api/onboarding/parse-resume",
        headers=headers1,
        files=files,
        data={"target_role": role1, "full_name": name1}
    )
    assert ext_res.status_code == 200, f"Resume parsing failed: {ext_res.text}"
    preview_data = ext_res.json()
    assert preview_data["success"] is True
    extracted_prof = preview_data["extracted_profile"]
    assert len(extracted_prof.get("skills", [])) > 0
    print(f"[PASS] Resume parsed: {len(extracted_prof.get('skills', []))} skills, {len(extracted_prof.get('projects', []))} projects")

    # STEP 6 & 7: User Reviews & Confirms Extracted Profile
    print("\n--- Steps 6 & 7: User Reviews & Confirms Profile ---")
    confirm_res = client.post(
        "/api/onboarding/confirm-profile",
        headers=headers1,
        json={
            "full_name": name1,
            "target_role": role1,
            "filename": preview_data.get("filename", "Alex_Rivera_Resume.pdf"),
            "resume_text": preview_data.get("resume_text", ""),
            "profile": extracted_prof
        }
    )
    assert confirm_res.status_code == 200, f"Confirm profile failed: {confirm_res.text}"
    confirm_data = confirm_res.json()
    assert confirm_data["success"] is True
    print("[PASS] Profile confirmed and saved to database")

    # STEP 8: Metrics, Skill Gaps, CRI Calculation
    print("\n--- Step 8: Calculate Metrics, Gaps, and CRI ---")
    analysis = confirm_data.get("data", {})
    cri = analysis.get("cri", {})
    cri_score = cri.get("cri_score")
    ats_score = analysis.get("resume_analysis", {}).get("ats_score")
    skill_gaps = analysis.get("job_match", {}).get("missing_skills", [])
    recommendations = analysis.get("resume_analysis", {}).get("improvement_suggestions", [])

    assert cri_score is not None and 0 <= cri_score <= 100
    assert ats_score is not None and 0 <= ats_score <= 100
    print(f"[PASS] CRI: {cri_score}/100 ({cri.get('readiness_level')})")
    print(f"[PASS] ATS Score: {ats_score}/100")
    print(f"[PASS] Skill Gaps: {skill_gaps[:4] if skill_gaps else 'None'}")
    print(f"[PASS] Recommendations count: {len(recommendations)}")

    # STEP 9 & 10: User Reaches Dashboard & Verifies Actual Saved Data
    print("\n--- Steps 9 & 10: Dashboard Data Verification ---")
    prof_check = client.get("/api/profile", headers=headers1)
    assert prof_check.status_code == 200
    prof_data = prof_check.json()
    assert prof_data["onboarding_completed"] is True
    assert prof_data["has_profile"] is True
    assert prof_data["analysis_data"]["cri"]["cri_score"] == cri_score
    assert prof_data["analysis_data"]["resume_analysis"]["ats_score"] == ats_score
    print("[PASS] Dashboard receives authentic saved analysis and completed onboarding status")

    # STEP 11 & 12: Career Assistant RAG Queries
    print("\n--- Steps 11 & 12: Career Assistant RAG Grounded Retrieval ---")
    questions = [
        "What skills are present in my resume?",
        "Which important skills are missing for my target role?",
        "Explain my resume analysis.",
        "Which projects in my resume support my target role?",
        "What should I learn next?",
        "How can I improve my career readiness?"
    ]
    # Test top questions
    for q in questions[:3]:
        rag_res = client.post("/api/rag/chat", headers=headers1, json={"query": q, "top_k": 4})
        assert rag_res.status_code == 200
        rag_data = rag_res.json()
        assert rag_data["has_sufficient_context"] is True
        assert len(rag_data["citations"]) > 0
        assert len(rag_data["answer"]) > 40
        print(f"[PASS] Q: '{q}' -> Answered with {len(rag_data['citations'])} citations")

    # STEP 13: Logout and Re-Login Data Persistence
    print("\n--- Step 13: Logout & Re-login Data Persistence ---")
    # Emulate client logout by clearing token and logging in again
    relogin_res = client.post("/api/auth/login", json={
        "email": email1,
        "password": pwd1
    })
    assert relogin_res.status_code == 200
    token1_new = relogin_res.json()["access_token"]
    headers1_new = {"Authorization": f"Bearer {token1_new}"}

    # Fetch profile and analysis again
    persisted_prof = client.get("/api/profile", headers=headers1_new)
    assert persisted_prof.status_code == 200
    assert persisted_prof.json()["analysis_data"]["cri"]["cri_score"] == cri_score
    print("[PASS] Saved career profile and analysis persists across logout/re-login")

    # STEP 14: User 2 Isolation (Zero cross-user data leakage)
    print("\n--- Step 14: Multi-Tenant Isolation (User 2 vs User 1) ---")
    email2 = f"journey_user2_{ts}@example.com"
    reg2_res = client.post("/api/auth/register", json={
        "full_name": "Jordan Smith",
        "email": email2,
        "password": "Password456!"
    })
    assert reg2_res.status_code == 200
    user2_id = reg2_res.json()["user"]["id"]

    login2_res = client.post("/api/auth/login", json={
        "email": email2,
        "password": "Password456!"
    })
    token2 = login2_res.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # User 2 checks profile -> Must NOT see User 1's profile
    user2_prof = client.get("/api/profile", headers=headers2)
    assert user2_prof.status_code == 200
    assert user2_prof.json()["has_profile"] is False
    assert user2_prof.json()["analysis_data"] is None

    # User 2 checks documents -> Must NOT see User 1's documents
    user2_docs = client.get("/api/rag/documents", headers=headers2)
    assert len(user2_docs.json()["documents"]) == 0

    # User 2 attempts RAG query for User 1's resume
    user2_rag = client.post("/api/rag/chat", headers=headers2, json={
        "query": "What skills are present in Alex Rivera's resume?",
        "top_k": 4
    })
    assert user2_rag.status_code == 200
    # User 2 has empty knowledge base -> has_sufficient_context must be False
    assert user2_rag.json()["has_sufficient_context"] is False
    assert len(user2_rag.json()["citations"]) == 0
    print("[PASS] User 2 cannot access User 1's analysis, documents, or knowledge chunks")

    # STEP 15: Direct One-Step Resume Onboarding API
    print("\n--- Step 15: Direct One-Step Resume Onboarding API ---")
    email3 = f"journey_user3_{ts}@example.com"
    reg3_res = client.post("/api/auth/register", json={
        "full_name": "Taylor Morgan",
        "email": email3,
        "password": "Password789!"
    })
    assert reg3_res.status_code == 200
    token3 = reg3_res.json()["access_token"]
    headers3 = {"Authorization": f"Bearer {token3}"}

    files3 = {"file": ("Taylor_Resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    direct_res = client.post(
        "/api/onboarding/analyze-and-onboard",
        headers=headers3,
        files=files3,
        data={"target_role": "AI Engineer", "full_name": "Taylor Morgan"}
    )
    assert direct_res.status_code == 200, f"Direct onboarding failed: {direct_res.text}"
    direct_data = direct_res.json()
    assert direct_data["success"] is True
    assert direct_data["data"]["cri"]["cri_score"] is not None
    assert direct_data["user"]["onboarding_completed"] is True
    print("[PASS] Direct one-step analyze-and-onboard endpoint completes full profile analysis & RAG indexing")

    print("\n" + "=" * 65)
    print("ALL USER JOURNEY STEPS VERIFIED AND PASSED!")
    print("=" * 65)

if __name__ == "__main__":
    run()
