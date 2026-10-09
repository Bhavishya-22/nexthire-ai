import os
import sys
import io
import json
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, init_db
from app.models import User, CareerDocument, CareerKnowledgeChunk

# Ensure database tables and columns are up to date
init_db()

client = TestClient(app)

print("=" * 60)
print("TESTING FIRST-TIME USER JOURNEY & ONBOARDING PIPELINE")
print("=" * 60)

SAMPLE_PDF_PATH = os.path.join("uploads", "073a6383-d06a-4ac1-81d3-e9c97e24c55a.pdf")
if not os.path.exists(SAMPLE_PDF_PATH):
    pdf_files = [f for f in os.listdir("uploads") if f.endswith(".pdf")]
    if pdf_files:
        SAMPLE_PDF_PATH = os.path.join("uploads", pdf_files[0])

assert os.path.exists(SAMPLE_PDF_PATH), f"Sample PDF not found at {SAMPLE_PDF_PATH}"
print(f"Sample PDF resume: {SAMPLE_PDF_PATH} ({os.path.getsize(SAMPLE_PDF_PATH)} bytes)")

# Clean up test candidate accounts if they exist
USER_A_EMAIL = "alex.rivera.ai@gmail.com"
USER_A_PWD = "SecurePassword2026!"
USER_B_EMAIL = "sara.connor.dev@gmail.com"
USER_B_PWD = "DifferentPassword2026!"

db = SessionLocal()
for em in [USER_A_EMAIL, USER_B_EMAIL]:
    u = db.query(User).filter(User.email == em).first()
    if u:
        db.delete(u)
db.commit()
db.close()

test_results = {}

def run_test(name, func):
    print(f"\n---> Running: {name}")
    try:
        func()
        test_results[name] = "PASS"
        print(f"[PASS] {name}")
    except Exception as e:
        test_results[name] = f"FAIL: {e}"
        print(f"[FAIL] {name}: {e}")
        raise

# -------------------------------------------------------------
# 1. Validation & Error Handling on Registration & Login
# -------------------------------------------------------------
def test_auth_validation():
    # Invalid email format
    r1 = client.post("/api/auth/register", json={
        "full_name": "Test User",
        "email": "not-an-email",
        "password": "validpassword123"
    })
    assert r1.status_code == 400, f"Expected 400 for bad email, got {r1.status_code}"

    # Short password
    r2 = client.post("/api/auth/register", json={
        "full_name": "Test User",
        "email": "valid@gmail.com",
        "password": "123"
    })
    assert r2.status_code == 400, f"Expected 400 for short password, got {r2.status_code}"

    # Invalid login credentials
    r3 = client.post("/api/auth/login", json={
        "email": "nonexistent@gmail.com",
        "password": "wrongpassword"
    })
    assert r3.status_code == 401, f"Expected 401 for wrong login, got {r3.status_code}"

run_test("1. Auth Validation & Error Handling", test_auth_validation)

# -------------------------------------------------------------
# 2. Registration with Gmail & Token Issuance
# -------------------------------------------------------------
token_a = None
user_a_id = None

def test_gmail_registration():
    global token_a, user_a_id
    res = client.post("/api/auth/register", json={
        "full_name": "Alex Rivera",
        "email": USER_A_EMAIL,
        "password": USER_A_PWD
    })
    assert res.status_code == 200, f"Registration failed: {res.text}"
    data = res.json()
    assert data["success"] is True
    assert "access_token" in data
    token_a = data["access_token"]
    user = data["user"]
    user_a_id = user["id"]
    assert user["email"] == USER_A_EMAIL
    assert user["onboarding_completed"] is False
    assert user["has_profile"] is False

    # Prevent duplicate registration
    dup_res = client.post("/api/auth/register", json={
        "full_name": "Alex Rivera",
        "email": USER_A_EMAIL,
        "password": USER_A_PWD
    })
    assert dup_res.status_code == 400, "Expected duplicate email rejection"

run_test("2. Registration with Gmail & Initial Onboarding State", test_gmail_registration)

# -------------------------------------------------------------
# 3. Login with Gmail & Password Verification
# -------------------------------------------------------------
def test_gmail_login():
    res = client.post("/api/auth/login", json={
        "email": USER_A_EMAIL,
        "password": USER_A_PWD
    })
    assert res.status_code == 200, f"Login failed: {res.text}"
    data = res.json()
    assert data["success"] is True
    assert "access_token" in data
    assert data["user"]["onboarding_completed"] is False

run_test("3. Login with Gmail & Password Verification", test_gmail_login)

# -------------------------------------------------------------
# 4. Protected Routes & Initial First-Time User Status
# -------------------------------------------------------------
def test_protected_routes():
    # Without token -> 401
    unauth = client.get("/api/auth/me")
    assert unauth.status_code == 401, "Expected 401 without token"

    unauth_prof = client.get("/api/profile")
    assert unauth_prof.status_code == 401, "Expected 401 for /api/profile without token"

    # With valid token
    headers = {"Authorization": f"Bearer {token_a}"}
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    user_data = me_res.json()["user"]
    assert user_data["onboarding_completed"] is False
    assert user_data["has_profile"] is False

    prof_res = client.get("/api/profile", headers=headers)
    assert prof_res.status_code == 200
    prof_data = prof_res.json()
    assert prof_data["onboarding_completed"] is False
    assert prof_data["has_profile"] is False
    assert prof_data["analysis_data"] is None

run_test("4. Protected Routes & Initial Profile Status", test_protected_routes)

# -------------------------------------------------------------
# 5. Resume Onboarding File Validation
# -------------------------------------------------------------
def test_resume_upload_validation():
    headers = {"Authorization": f"Bearer {token_a}"}

    # Reject non-PDF
    bad_file = io.BytesIO(b"This is a text file")
    res1 = client.post(
        "/api/onboarding/parse-resume",
        headers=headers,
        files={"file": ("resume.txt", bad_file, "text/plain")},
        data={"full_name": "Alex Rivera", "target_role": "Full Stack Engineer"}
    )
    assert res1.status_code == 400, f"Expected 400 for non-PDF, got {res1.status_code}"
    assert "Only PDF" in res1.json()["detail"]

    # Reject empty file
    empty_file = io.BytesIO(b"")
    res2 = client.post(
        "/api/onboarding/parse-resume",
        headers=headers,
        files={"file": ("resume.pdf", empty_file, "application/pdf")},
        data={"full_name": "Alex Rivera", "target_role": "Full Stack Engineer"}
    )
    assert res2.status_code == 400, f"Expected 400 for empty PDF, got {res2.status_code}"

run_test("5. Resume Onboarding Validation (Reject non-PDF & Empty)", test_resume_upload_validation)

# -------------------------------------------------------------
# 6. Resume Parsing & Career Intelligence Extraction
# -------------------------------------------------------------
extracted_profile = None
extracted_resume_text = None

def test_resume_parsing_extraction():
    global extracted_profile, extracted_resume_text
    headers = {"Authorization": f"Bearer {token_a}"}

    with open(SAMPLE_PDF_PATH, "rb") as f:
        file_bytes = f.read()

    res = client.post(
        "/api/onboarding/parse-resume",
        headers=headers,
        files={"file": ("Alex_Rivera_Resume.pdf", io.BytesIO(file_bytes), "application/pdf")},
        data={"full_name": "Alex Rivera", "target_role": "Senior AI / Full-Stack Engineer"}
    )
    assert res.status_code == 200, f"Parsing failed: {res.text}"
    body = res.json()
    assert body["success"] is True
    assert body["full_name"] == "Alex Rivera"
    assert body["target_role"] == "Senior AI / Full-Stack Engineer"
    assert len(body["resume_text"]) > 100
    extracted_resume_text = body["resume_text"]

    profile = body["extracted_profile"]
    extracted_profile = profile

    # Verify all required fields from prompt
    print(f"   Summary: {profile.get('summary')[:80]}...")
    print(f"   Skills count: {len(profile.get('skills', []))}")
    print(f"   Technologies count: {len(profile.get('technologies', []))}")
    print(f"   Projects count: {len(profile.get('projects', []))}")
    print(f"   Experience count: {len(profile.get('experience', []))}")
    print(f"   Education count: {len(profile.get('education', []))}")
    print(f"   Certifications count: {len(profile.get('certifications', []))}")
    print(f"   Achievements count: {len(profile.get('achievements', []))}")
    print(f"   ATS score: {profile.get('ats_score')}")

    assert "skills" in profile and isinstance(profile["skills"], list)
    assert "technologies" in profile and isinstance(profile["technologies"], list)
    assert "projects" in profile and isinstance(profile["projects"], list)
    assert "experience" in profile and isinstance(profile["experience"], list)
    assert "education" in profile and isinstance(profile["education"], list)
    assert "certifications" in profile and isinstance(profile["certifications"], list)
    assert "achievements" in profile and isinstance(profile["achievements"], list)
    assert "ats_score" in profile and isinstance(profile["ats_score"], int)

run_test("6. Resume Parsing & Career Intelligence Extraction", test_resume_parsing_extraction)

# -------------------------------------------------------------
# 7. User Review, Correction & Profile Confirmation
# -------------------------------------------------------------
def test_profile_confirmation():
    headers = {"Authorization": f"Bearer {token_a}"}

    # Simulate user adding a verified skill and technology during review
    reviewed_profile = dict(extracted_profile)
    reviewed_skills = list(reviewed_profile.get("skills", []))
    if "FastAPI" not in reviewed_skills:
        reviewed_skills.append("FastAPI")
    reviewed_profile["skills"] = reviewed_skills

    reviewed_techs = list(reviewed_profile.get("technologies", []))
    if "PostgreSQL" not in reviewed_techs:
        reviewed_techs.append("PostgreSQL")
    reviewed_profile["technologies"] = reviewed_techs

    confirm_payload = {
        "full_name": "Alex Rivera",
        "target_role": "Senior AI / Full-Stack Engineer",
        "filename": "Alex_Rivera_Resume.pdf",
        "resume_text": extracted_resume_text,
        "profile": reviewed_profile
    }

    res = client.post("/api/onboarding/confirm-profile", headers=headers, json=confirm_payload)
    assert res.status_code == 200, f"Confirmation failed: {res.text}"
    body = res.json()
    assert body["success"] is True
    assert body["user"]["onboarding_completed"] is True
    assert body["user"]["target_role"] == "Senior AI / Full-Stack Engineer"

    # Verify CRI composite calculation
    data = body["data"]
    assert "cri" in data
    cri = data["cri"]
    print(f"   Composite CRI Score: {cri.get('cri_score')}")
    print(f"   CRI Readiness Level: {cri.get('readiness_level')}")
    assert "cri_score" in cri
    assert "readiness_level" in cri
    assert "breakdown" in cri

    # Verify persistence via GET /api/profile
    prof_res = client.get("/api/profile", headers=headers)
    assert prof_res.status_code == 200
    prof = prof_res.json()
    assert prof["onboarding_completed"] is True
    assert prof["has_profile"] is True
    assert prof["target_role"] == "Senior AI / Full-Stack Engineer"
    assert prof["resume_filename"] == "Alex_Rivera_Resume.pdf"
    assert prof["analysis_data"] is not None
    assert "FastAPI" in prof["analysis_data"]["resume_analysis"]["skills"]

run_test("7. User Review, Profile Confirmation & Persistence", test_profile_confirmation)

# -------------------------------------------------------------
# 8. User Isolation Check
# -------------------------------------------------------------
def test_user_isolation():
    # Register User B
    res_b = client.post("/api/auth/register", json={
        "full_name": "Sara Connor",
        "email": USER_B_EMAIL,
        "password": USER_B_PWD
    })
    assert res_b.status_code == 200
    token_b = res_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Verify User B does not see User A's profile
    prof_b = client.get("/api/profile", headers=headers_b).json()
    assert prof_b["onboarding_completed"] is False
    assert prof_b["has_profile"] is False
    assert prof_b["analysis_data"] is None

run_test("8. Multi-User Isolation & Ownership Enforcement", test_user_isolation)

print("\n" + "=" * 60)
print("ALL TESTS COMPLETED:")
for k, v in test_results.items():
    print(f"  {k}: {v}")
print("=" * 60)
