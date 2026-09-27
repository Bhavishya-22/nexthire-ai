import os
import sys
import json
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, init_db
from app.models import User, CareerDocument, CareerKnowledgeChunk

# Ensure tables exist
init_db()

client = TestClient(app)

results = {}

print("==================================================")
print("NEXTHIRE AI - FULL REGRESSION TEST (21 ITEMS)")
print("==================================================")

SAMPLE_PDF_PATH = os.path.join("uploads", "073a6383-d06a-4ac1-81d3-e9c97e24c55a.pdf")
if not os.path.exists(SAMPLE_PDF_PATH):
    pdf_files = [f for f in os.listdir("uploads") if f.endswith(".pdf")]
    if pdf_files:
        SAMPLE_PDF_PATH = os.path.join("uploads", pdf_files[0])

print(f"Using sample resume PDF: {SAMPLE_PDF_PATH}")
assert os.path.exists(SAMPLE_PDF_PATH), f"Sample PDF not found at {SAMPLE_PDF_PATH}"

USER_A_EMAIL = "regression_v2_a@nexthire.ai"
USER_A_PWD = "SecurePassword2026!"
USER_B_EMAIL = "regression_v2_b@nexthire.ai"
USER_B_PWD = "DifferentPassword2026!"

db = SessionLocal()
for em in [USER_A_EMAIL, USER_B_EMAIL]:
    u = db.query(User).filter(User.email == em).first()
    if u:
        db.delete(u)
db.commit()
db.close()

# ----------------------------------------------------------------
# TEST 1: User Registration
# ----------------------------------------------------------------
print("\n--- Running Test 1: User Registration ---")
try:
    reg_res = client.post("/api/auth/register", json={
        "full_name": "Bhavishya Sarvani",
        "email": USER_A_EMAIL,
        "password": USER_A_PWD
    })
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    reg_json = reg_res.json()
    assert reg_json.get("success") is True
    assert "access_token" in reg_json
    token_a = reg_json["access_token"]
    user_a_id = reg_json["user"]["id"]
    results["1. Registration"] = {"status": "PASS", "details": f"Registered user ID {user_a_id}"}
    print("[PASS] 1. Registration")
except Exception as e:
    results["1. Registration"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 1. Registration: {e}")

# ----------------------------------------------------------------
# TEST 2: User Login
# ----------------------------------------------------------------
print("\n--- Running Test 2: User Login ---")
try:
    login_res = client.post("/api/auth/login", json={
        "email": USER_A_EMAIL,
        "password": USER_A_PWD
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    login_json = login_res.json()
    assert login_json.get("success") is True
    assert "access_token" in login_json
    token_a = login_json["access_token"]
    results["2. Login"] = {"status": "PASS", "details": "JWT token issued"}
    print("[PASS] 2. Login")
except Exception as e:
    results["2. Login"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 2. Login: {e}")

# ----------------------------------------------------------------
# TEST 3: JWT Authentication
# ----------------------------------------------------------------
print("\n--- Running Test 3: JWT Authentication ---")
try:
    auth_headers_a = {"Authorization": f"Bearer {token_a}"}
    me_res = client.get("/api/auth/me", headers=auth_headers_a)
    assert me_res.status_code == 200, f"Me query failed: {me_res.text}"
    assert me_res.json()["user"]["id"] == user_a_id

    # Rejection of invalid token
    bad_res = client.get("/api/auth/me", headers={"Authorization": "Bearer bad_token"})
    assert bad_res.status_code == 401
    results["3. JWT"] = {"status": "PASS", "details": "Bearer token authenticated and verified"}
    print("[PASS] 3. JWT")
except Exception as e:
    results["3. JWT"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 3. JWT: {e}")

# ----------------------------------------------------------------
# TEST 4: Resume PDF Upload & Pipeline Execution
# ----------------------------------------------------------------
print("\n--- Running Test 4: PDF Upload & Analysis ---")
analysis_data = None
try:
    TARGET_JOB_DESCRIPTION = """
    Machine Learning Engineer position.
    Requirements:
    - Strong Python skills, PyTorch / TensorFlow, Scikit-learn
    - Experience in NLP and LLMs
    - FastAPI or Flask REST API development
    - PostgreSQL, Docker, Git
    """
    with open(SAMPLE_PDF_PATH, "rb") as f:
        file_bytes = f.read()

    files = {"file": ("sample_resume.pdf", file_bytes, "application/pdf")}
    data = {"job_description": TARGET_JOB_DESCRIPTION}

    upload_res = client.post("/api/resume/analyze", headers=auth_headers_a, files=files, data=data)
    assert upload_res.status_code == 200, f"Upload analysis failed: {upload_res.text}"
    upload_json = upload_res.json()
    assert upload_json.get("success") is True
    analysis_data = upload_json["data"]
    results["4. PDF upload"] = {"status": "PASS", "details": f"Uploaded {len(file_bytes)} bytes"}
    print("[PASS] 4. PDF upload")
except Exception as e:
    results["4. PDF upload"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 4. PDF upload: {e}")

# ----------------------------------------------------------------
# TEST 5: PyMuPDF Text Extraction
# ----------------------------------------------------------------
print("\n--- Running Test 5: PyMuPDF Text Extraction ---")
try:
    from app.services.pdf import extract_text_from_pdf
    extracted_text = extract_text_from_pdf(SAMPLE_PDF_PATH)
    assert extracted_text and len(extracted_text) > 500
    assert "BHAVISHYA" in extracted_text.upper()
    results["5. PDF extraction"] = {"status": "PASS", "details": f"Extracted {len(extracted_text)} chars"}
    print(f"[PASS] 5. PDF extraction: {len(extracted_text)} chars")
except Exception as e:
    results["5. PDF extraction"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 5. PDF extraction: {e}")

# ----------------------------------------------------------------
# TEST 6: Gemini Resume Analysis
# ----------------------------------------------------------------
print("\n--- Running Test 6: Gemini Resume Analysis ---")
try:
    resume_analysis = analysis_data["resume_analysis"]
    assert "summary" in resume_analysis and len(resume_analysis["summary"]) > 20
    results["6. Gemini analysis"] = {"status": "PASS", "details": f"Summary: {resume_analysis['summary'][:80]}..."}
    print("[PASS] 6. Gemini analysis")
except Exception as e:
    results["6. Gemini analysis"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 6. Gemini analysis: {e}")

# ----------------------------------------------------------------
# TEST 7: Skills Extraction
# ----------------------------------------------------------------
print("\n--- Running Test 7: Skills Extraction ---")
try:
    skills = resume_analysis.get("skills", [])
    assert len(skills) > 0
    results["7. Skills"] = {"status": "PASS", "details": f"{len(skills)} skills extracted: {skills[:4]}"}
    print(f"[PASS] 7. Skills: {len(skills)} skills")
except Exception as e:
    results["7. Skills"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 7. Skills: {e}")

# ----------------------------------------------------------------
# TEST 8: Projects Extraction
# ----------------------------------------------------------------
print("\n--- Running Test 8: Projects Extraction ---")
try:
    projects = resume_analysis.get("projects", [])
    assert len(projects) > 0
    results["8. Projects"] = {"status": "PASS", "details": f"{len(projects)} projects extracted: {projects[:2]}"}
    print(f"[PASS] 8. Projects: {len(projects)} projects")
except Exception as e:
    results["8. Projects"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 8. Projects: {e}")

# ----------------------------------------------------------------
# TEST 9: Experience Extraction
# ----------------------------------------------------------------
print("\n--- Running Test 9: Experience Extraction ---")
try:
    experience = resume_analysis.get("experience", [])
    education = resume_analysis.get("education", [])
    assert isinstance(experience, list) and isinstance(education, list)
    results["9. Experience"] = {"status": "PASS", "details": f"Experience: {len(experience)} items, Education: {len(education)} items"}
    print(f"[PASS] 9. Experience: {len(experience)} exp items, {len(education)} edu items")
except Exception as e:
    results["9. Experience"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 9. Experience: {e}")

# ----------------------------------------------------------------
# TEST 10: ATS Scoring
# ----------------------------------------------------------------
print("\n--- Running Test 10: ATS Scoring ---")
try:
    ats_score = resume_analysis.get("ats_score")
    assert isinstance(ats_score, int) and 0 <= ats_score <= 100
    results["10. ATS"] = {"status": "PASS", "details": f"ATS Score: {ats_score}/100"}
    print(f"[PASS] 10. ATS: {ats_score}/100")
except Exception as e:
    results["10. ATS"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 10. ATS: {e}")

# ----------------------------------------------------------------
# TEST 11: Job Description Matching
# ----------------------------------------------------------------
print("\n--- Running Test 11: Job Matching ---")
try:
    job_match = analysis_data.get("job_match")
    assert job_match is not None
    assert 0 <= job_match["match_score"] <= 100
    results["11. Job matching"] = {"status": "PASS", "details": f"Match Score: {job_match['match_score']}/100, Matching Skills: {job_match.get('matching_skills', [])[:3]}"}
    print(f"[PASS] 11. Job matching: {job_match['match_score']}% fit")
except Exception as e:
    results["11. Job matching"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 11. Job matching: {e}")

# ----------------------------------------------------------------
# TEST 12: Skill Gaps
# ----------------------------------------------------------------
print("\n--- Running Test 12: Skill Gaps ---")
try:
    missing_job = job_match.get("missing_skills", [])
    missing_resume = resume_analysis.get("missing_skills", [])
    assert len(missing_job) > 0 or len(missing_resume) > 0
    results["12. Skill gaps"] = {"status": "PASS", "details": f"Gaps identified: {missing_job[:4]}"}
    print(f"[PASS] 12. Skill gaps: {missing_job[:4]}")
except Exception as e:
    results["12. Skill gaps"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 12. Skill gaps: {e}")

# ----------------------------------------------------------------
# TEST 13: Improvement Suggestions
# ----------------------------------------------------------------
print("\n--- Running Test 13: Improvement Suggestions ---")
try:
    suggestions = resume_analysis.get("improvement_suggestions", [])
    assert len(suggestions) > 0
    results["13. Suggestions"] = {"status": "PASS", "details": f"{len(suggestions)} suggestions: {suggestions[0][:80]}..."}
    print(f"[PASS] 13. Suggestions: {len(suggestions)} suggestions")
except Exception as e:
    results["13. Suggestions"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 13. Suggestions: {e}")

# ----------------------------------------------------------------
# TEST 14: CRI Calculation
# ----------------------------------------------------------------
print("\n--- Running Test 14: CRI Calculation ---")
try:
    cri = analysis_data.get("cri")
    assert cri is not None
    assert 0 <= cri["cri_score"] <= 100
    assert "breakdown" in cri
    results["14. CRI"] = {"status": "PASS", "details": f"CRI: {cri['cri_score']}/100 ({cri['readiness_level']})"}
    print(f"[PASS] 14. CRI: {cri['cri_score']}/100 ({cri['readiness_level']})")
except Exception as e:
    results["14. CRI"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 14. CRI: {e}")

# ----------------------------------------------------------------
# TEST 15: Dashboard (Component, Rendering & Routing)
# ----------------------------------------------------------------
print("\n--- Running Test 15: Dashboard Verification ---")
try:
    with open("../frontend/src/components/CareerDashboard.tsx", "r", encoding="utf-8") as f:
        cd_code = f.read()

    with open("../frontend/src/pages/Dashboard.tsx", "r", encoding="utf-8") as f:
        d_code = f.read()

    with open("../frontend/src/App.tsx", "r", encoding="utf-8") as f:
        app_code = f.read()

    # Verify no hardcoded score in Dashboard
    assert "75/100" not in d_code, "Found hardcoded 75/100 in Dashboard.tsx!"
    assert "CareerDashboard" in d_code, "Dashboard.tsx does not use CareerDashboard"
    assert "currentView === \"dashboard\"" in app_code or "currentView === 'dashboard'" in app_code, "Dashboard not routed in App.tsx"
    
    # Verify dynamic rendering of CRI, ATS, Skills, Projects, Experience, Suggestions
    assert "cri.cri_score" in cd_code, "CRI score missing from CareerDashboard"
    assert "resume_analysis.ats_score" in cd_code, "ATS score missing from CareerDashboard"
    assert "resume_analysis.skills" in cd_code, "Skills missing from CareerDashboard"
    assert "resume_analysis.projects" in cd_code, "Projects missing from CareerDashboard"
    assert "resume_analysis.experience" in cd_code, "Experience missing from CareerDashboard"
    assert "resume_analysis.improvement_suggestions" in cd_code, "Suggestions missing from CareerDashboard"

    results["15. Dashboard"] = {"status": "PASS", "details": "CareerDashboard dynamically renders CRI, ATS, Skills, Projects, Experience, Suggestions, and is routed in App.tsx"}
    print("[PASS] 15. Dashboard: Dynamic CareerDashboard component & routing verified")
except Exception as e:
    results["15. Dashboard"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 15. Dashboard: {e}")

# ----------------------------------------------------------------
# TEST 16: Automatic RAG Indexing
# ----------------------------------------------------------------
print("\n--- Running Test 16: Automatic RAG Indexing ---")
try:
    assert upload_json.get("indexed_to_knowledge_base") is True
    db = SessionLocal()
    docs = db.query(CareerDocument).filter(CareerDocument.user_id == user_a_id).all()
    assert len(docs) >= 1
    chunks = db.query(CareerKnowledgeChunk).filter(CareerKnowledgeChunk.user_id == user_a_id).all()
    assert len(chunks) >= 4
    db.close()
    results["16. Automatic RAG indexing"] = {"status": "PASS", "details": f"Indexed {len(docs)} documents with {len(chunks)} vector chunks"}
    print(f"[PASS] 16. Automatic RAG indexing: {len(docs)} docs, {len(chunks)} chunks")
except Exception as e:
    results["16. Automatic RAG indexing"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 16. Automatic RAG indexing: {e}")

# ----------------------------------------------------------------
# TEST 17: RAG Assistant
# ----------------------------------------------------------------
print("\n--- Running Test 17: RAG Assistant ---")
rag_data = None
try:
    rag_res = client.post("/api/rag/chat", headers=auth_headers_a, json={
        "query": "What are my core machine learning skills and web technologies mentioned in my resume?",
        "top_k": 4
    })
    assert rag_res.status_code == 200, f"RAG chat failed: {rag_res.text}"
    rag_data = rag_res.json()
    assert rag_data.get("success") is True
    answer = rag_data.get("answer", "")
    assert len(answer) > 20
    results["17. RAG Assistant"] = {"status": "PASS", "details": f"Answer: {answer[:90]}..."}
    print("[PASS] 17. RAG Assistant")
except Exception as e:
    results["17. RAG Assistant"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 17. RAG Assistant: {e}")

# ----------------------------------------------------------------
# TEST 18: RAG Citations
# ----------------------------------------------------------------
print("\n--- Running Test 18: RAG Citations ---")
try:
    citations = rag_data.get("citations", [])
    assert len(citations) > 0
    top_c = citations[0]
    assert "document_title" in top_c and "similarity" in top_c
    results["18. RAG citations"] = {"status": "PASS", "details": f"Returned {len(citations)} citations. Top similarity: {top_c['similarity']}"}
    print(f"[PASS] 18. RAG citations: {len(citations)} citations")
except Exception as e:
    results["18. RAG citations"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 18. RAG citations: {e}")

# ----------------------------------------------------------------
# TEST 19: User Isolation
# ----------------------------------------------------------------
print("\n--- Running Test 19: User Isolation ---")
try:
    # Register User B
    reg_b = client.post("/api/auth/register", json={
        "full_name": "Bob Cybersecurity",
        "email": USER_B_EMAIL,
        "password": USER_B_PWD
    })
    token_b = reg_b.json()["access_token"]
    user_b_id = reg_b.json()["user"]["id"]
    auth_headers_b = {"Authorization": f"Bearer {token_b}"}

    # Query User A info from User B session
    b_query = client.post("/api/rag/chat", headers=auth_headers_b, json={
        "query": "Tell me about Bhavishya's resume projects and skills.",
        "top_k": 5
    })
    assert b_query.status_code == 200
    b_cits = b_query.json().get("citations", [])
    assert len(b_cits) == 0, "User B retrieved User A's chunks!"
    results["19. User isolation"] = {"status": "PASS", "details": "0% data leakage across user accounts"}
    print("[PASS] 19. User isolation")
except Exception as e:
    results["19. User isolation"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 19. User isolation: {e}")

# ----------------------------------------------------------------
# TEST 20: Anti-Hallucination
# ----------------------------------------------------------------
print("\n--- Running Test 20: Anti-Hallucination ---")
try:
    absent_res = client.post("/api/rag/chat", headers=auth_headers_a, json={
        "query": "How many years of experience do I have piloting Boeing 747 aircraft across the Atlantic?",
        "top_k": 3
    })
    assert absent_res.status_code == 200
    absent_ans = absent_res.json()["answer"].lower()
    anti_hallucination_indicators = [
        "not have information", "not available", "knowledge base", 
        "do not have", "no information", "no mention", "not mentioned",
        "does not indicate", "does not contain", "no evidence", "unmentioned"
    ]
    assert any(ind in absent_ans for ind in anti_hallucination_indicators), f"Expected refusal, got: {absent_ans}"
    results["20. Anti-hallucination"] = {"status": "PASS", "details": f"Refused to fabricate absent experience: {absent_ans[:60]}..."}
    print("[PASS] 20. Anti-hallucination")
except Exception as e:
    results["20. Anti-hallucination"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 20. Anti-hallucination: {e}")

# ----------------------------------------------------------------
# TEST 21: Document Deletion
# ----------------------------------------------------------------
print("\n--- Running Test 21: Document Deletion ---")
try:
    # Ingest document for User B and then delete it
    ingest_b = client.post("/api/rag/documents", headers=auth_headers_b, json={
        "title": "Bob CISSP Certification",
        "doc_type": "certification",
        "content": "Certified Information Systems Security Professional (CISSP) credential."
    })
    doc_b_id = ingest_b.json()["document"]["id"]

    del_res = client.delete(f"/api/rag/documents/{doc_b_id}", headers=auth_headers_b)
    assert del_res.status_code == 200

    db = SessionLocal()
    chunks_left = db.query(CareerKnowledgeChunk).filter(CareerKnowledgeChunk.document_id == doc_b_id).count()
    assert chunks_left == 0, f"Expected 0 chunks remaining, found {chunks_left}"
    db.close()

    results["21. Document deletion"] = {"status": "PASS", "details": "Document and all vector chunks deleted cleanly"}
    print("[PASS] 21. Document deletion")
except Exception as e:
    results["21. Document deletion"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 21. Document deletion: {e}")

# Final DB Cleanup
db = SessionLocal()
for em in [USER_A_EMAIL, USER_B_EMAIL]:
    u = db.query(User).filter(User.email == em).first()
    if u:
        db.delete(u)
db.commit()
db.close()

print("\n==================================================")
print("REGRESSION TEST RESULTS (21 OF 21)")
print("==================================================")
all_passed = True
for k, v in results.items():
    print(f"{k}: {v['status']} - {v.get('details', v.get('error'))}")
    if v['status'] != "PASS":
        all_passed = False

with open("regression_results_v2.json", "w", encoding="utf-8") as out:
    json.dump(results, out, indent=2)

if all_passed:
    print("\n>>> ALL 21 REGRESSION TESTS PASSED WITH 100% SUCCESS! <<<")
else:
    print("\n>>> SOME TESTS FAILED <<<")
