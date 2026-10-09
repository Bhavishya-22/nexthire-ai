import os
import sys
import io
import json
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, init_db
from app.models import User, CareerDocument, CareerKnowledgeChunk
from app.services.embedding import generate_embedding, EMBEDDING_DIM
from app.services.rag import retrieve_relevant_chunks, answer_with_rag, index_generic_document

init_db()
client = TestClient(app)

print("=" * 65)
print("AUDITING & TESTING PRODUCTION RAG IMPLEMENTATION (9 SUITES)")
print("=" * 65)

SAMPLE_PDF_PATH = os.path.join("uploads", "073a6383-d06a-4ac1-81d3-e9c97e24c55a.pdf")
if not os.path.exists(SAMPLE_PDF_PATH):
    pdf_files = [f for f in os.listdir("uploads") if f.endswith(".pdf")]
    if pdf_files:
        SAMPLE_PDF_PATH = os.path.join("uploads", pdf_files[0])

assert os.path.exists(SAMPLE_PDF_PATH), f"Sample PDF not found at {SAMPLE_PDF_PATH}"

# Test Candidate Accounts
USER_RAG_A = "rag_test_alice@gmail.com"
USER_RAG_B = "rag_test_bob@gmail.com"
TEST_PWD = "SecurePassword2026!"

db = SessionLocal()
for em in [USER_RAG_A, USER_RAG_B]:
    u = db.query(User).filter(User.email == em).first()
    if u:
        db.delete(u)
db.commit()
db.close()

results = {}

def run_test(name, func):
    print(f"\n---> Running: {name}")
    try:
        func()
        results[name] = "PASS"
        print(f"[PASS] {name}")
    except Exception as e:
        results[name] = f"FAIL: {e}"
        print(f"[FAIL] {name}: {e}")
        raise

# Setup users
token_a = None
user_a_id = None
token_b = None
user_b_id = None

def setup_users():
    global token_a, user_a_id, token_b, user_b_id
    r_a = client.post("/api/auth/register", json={
        "full_name": "Alice Developer",
        "email": USER_RAG_A,
        "password": TEST_PWD
    })
    assert r_a.status_code == 200, f"Register Alice failed: {r_a.text}"
    token_a = r_a.json()["access_token"]
    user_a_id = r_a.json()["user"]["id"]

    r_b = client.post("/api/auth/register", json={
        "full_name": "Bob Architect",
        "email": USER_RAG_B,
        "password": TEST_PWD
    })
    assert r_b.status_code == 200, f"Register Bob failed: {r_b.text}"
    token_b = r_b.json()["access_token"]
    user_b_id = r_b.json()["user"]["id"]

run_test("0. User Setup", setup_users)

# -------------------------------------------------------------
# 1. Resume Indexing After Analysis
# -------------------------------------------------------------
def test_resume_indexing():
    headers_a = {"Authorization": f"Bearer {token_a}"}
    with open(SAMPLE_PDF_PATH, "rb") as f:
        pdf_bytes = f.read()

    res = client.post(
        "/api/resume/analyze",
        headers=headers_a,
        files={"file": ("Alice_Resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        data={"job_description": "Senior Python & AI Engineer requiring FastAPI, Docker, and PyTorch"}
    )
    assert res.status_code == 200, f"Analyze resume failed: {res.text}"
    data = res.json()
    assert data["indexed_to_knowledge_base"] is True

    # Verify chunks in database
    db_s = SessionLocal()
    docs = db_s.query(CareerDocument).filter(CareerDocument.user_id == user_a_id).all()
    assert len(docs) >= 1, "Expected at least 1 CareerDocument for Alice"
    resume_doc = [d for d in docs if d.doc_type == "resume"][0]
    chunks = db_s.query(CareerKnowledgeChunk).filter(CareerKnowledgeChunk.document_id == resume_doc.id).all()
    assert len(chunks) >= 8, f"Expected semantic chunks for resume, got {len(chunks)}"

    categories = [c.chunk_metadata.get("category") for c in chunks if c.chunk_metadata]
    print(f"   Indexed categories: {set(categories)}")
    assert "skills" in categories
    assert "projects" in categories
    assert "summary" in categories
    db_s.close()

run_test("1. Resume Indexing After Analysis", test_resume_indexing)

# -------------------------------------------------------------
# 2. Embedding Correctness & Dimensions
# -------------------------------------------------------------
def test_embedding_correctness():
    emb = generate_embedding("NextHire AI career intelligence platform")
    assert isinstance(emb, list)
    assert len(emb) == EMBEDDING_DIM
    assert len(emb) == 768, f"Expected 768 dimensions, got {len(emb)}"
    print(f"   Generated embedding: 768-dim vector, sample values: {emb[:3]}")

run_test("2. Embedding Dimensions & Configuration", test_embedding_correctness)

# -------------------------------------------------------------
# 3. Relevant Retrieval & Vector Similarity
# -------------------------------------------------------------
def test_relevant_retrieval():
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Query 1: Skills present in resume
    q1 = client.post("/api/rag/chat", headers=headers_a, json={
        "query": "What skills are present in my resume?",
        "top_k": 5
    })
    assert q1.status_code == 200, f"RAG query failed: {q1.text}"
    body1 = q1.json()
    assert body1["has_sufficient_context"] is True
    assert len(body1["citations"]) > 0
    assert len(body1["answer"]) > 50
    print(f"   Q1 Answer excerpt: {body1['answer'][:120]}...")
    print(f"   Q1 Citations count: {len(body1['citations'])}")

    # Query 2: Projects
    q2 = client.post("/api/rag/chat", headers=headers_a, json={
        "query": "Which projects in my resume support my career goals?",
        "top_k": 4
    })
    assert q2.status_code == 200
    body2 = q2.json()
    assert body2["has_sufficient_context"] is True
    print(f"   Q2 Citation categories: {[c['category'] for c in body2['citations']]}")
    assert len(body2["citations"]) > 0
    # Projects or experience/skills are career background chunks
    assert any(c["category"] in ["projects", "experience", "summary", "strengths_and_gaps"] for c in body2["citations"])

run_test("3. Relevant Retrieval & Vector Similarity", test_relevant_retrieval)

# -------------------------------------------------------------
# 4. Citation Correctness
# -------------------------------------------------------------
def test_citation_correctness():
    headers_a = {"Authorization": f"Bearer {token_a}"}
    res = client.post("/api/rag/chat", headers=headers_a, json={
        "query": "Explain my academic background and education",
        "top_k": 3
    })
    assert res.status_code == 200
    body = res.json()
    citations = body["citations"]
    assert len(citations) > 0
    for c in citations:
        assert "document_id" in c
        assert "document_title" in c
        assert "doc_type" in c
        assert "category" in c
        assert "snippet" in c
        assert 0.0 <= c["similarity"] <= 1.0
        print(f"   Citation: Doc #{c['document_id']} ({c['document_title']}) - Section: {c['category']} - Similarity: {c['similarity']}")

run_test("4. Citation Correctness & Integrity", test_citation_correctness)

# -------------------------------------------------------------
# 5. No Relevant Context (Honest Insufficient Context)
# -------------------------------------------------------------
def test_no_relevant_context():
    headers_a = {"Authorization": f"Bearer {token_a}"}
    res = client.post("/api/rag/chat", headers=headers_a, json={
        "query": "What is the secret recipe for baking a traditional chocolate croissant in Paris?",
        "top_k": 5
    })
    assert res.status_code == 200
    body = res.json()
    print(f"   Out-of-domain query response: has_sufficient_context={body['has_sufficient_context']}")
    print(f"   Answer: {body['answer'][:120]}...")
    assert body["has_sufficient_context"] is False
    assert len(body["citations"]) == 0
    assert "could not find relevant information" in body["answer"].lower() or "empty" in body["answer"].lower()

run_test("5. Honest Insufficient-Context Response", test_no_relevant_context)

# -------------------------------------------------------------
# 6. User Isolation (User A vs User B Zero Leakage)
# -------------------------------------------------------------
def test_user_isolation():
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Bob ingests a highly unique secret certification with an unguessable passkey
    secret_passkey = "PASSKEY-SECRET-99998888"
    doc_b_res = client.post("/api/rag/documents", headers=headers_b, json={
        "title": "Bob Proprietary Secret Certification",
        "doc_type": "certification",
        "content": f"Bob holds the UltraRareSecretQuantumCloudKubernetesMaster certification with confidential passkey {secret_passkey}."
    })
    assert doc_b_res.status_code == 200
    bob_doc_id = doc_b_res.json()["document"]["id"]

    # Alice queries for Bob's secret
    headers_a = {"Authorization": f"Bearer {token_a}"}
    leak_check = client.post("/api/rag/chat", headers=headers_a, json={
        "query": "What is the confidential passkey for Bob's UltraRareSecretQuantumCloudKubernetesMaster certification?",
        "top_k": 5
    })
    assert leak_check.status_code == 200
    leak_data = leak_check.json()
    
    # Alice must NOT receive Bob's document or citations
    for c in leak_data["citations"]:
        assert "Bob" not in c["document_title"]
        assert secret_passkey not in c["snippet"]

    # Alice's answer must NEVER reveal Bob's confidential passkey
    assert secret_passkey not in leak_data["answer"]

    # Cross-tenant attack: Alice attempts to delete Bob's document directly
    unauth_delete = client.delete(f"/api/rag/documents/{bob_doc_id}", headers=headers_a)
    assert unauth_delete.status_code in [403, 404], f"Expected 403/404, got {unauth_delete.status_code}"

    # Cross-tenant attack: Alice lists documents, Bob's document must not appear
    alice_docs = client.get("/api/rag/documents", headers=headers_a).json()["documents"]
    assert all(d["id"] != bob_doc_id for d in alice_docs)

    print("   User A cannot access, query, or delete User B's documents (Verified 0% leakage)")

run_test("6. User A vs User B Data Isolation", test_user_isolation)

# -------------------------------------------------------------
# 7. Document Deletion Cascades & Vector Cleanup
# -------------------------------------------------------------
def test_document_deletion():
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # List Bob's documents
    docs_list = client.get("/api/rag/documents", headers=headers_b).json()
    bob_docs = docs_list["documents"]
    assert len(bob_docs) >= 1
    doc_to_delete = bob_docs[0]
    doc_id = doc_to_delete["id"]

    db_s = SessionLocal()
    chunks_before = db_s.query(CareerKnowledgeChunk).filter(CareerKnowledgeChunk.document_id == doc_id).count()
    assert chunks_before > 0, "Expected chunks for Bob's doc before deletion"
    db_s.close()

    # Delete document
    del_res = client.delete(f"/api/rag/documents/{doc_id}", headers=headers_b)
    assert del_res.status_code == 200

    # Verify chunks deleted in database
    db_s = SessionLocal()
    chunks_after = db_s.query(CareerKnowledgeChunk).filter(CareerKnowledgeChunk.document_id == doc_id).count()
    doc_after = db_s.query(CareerDocument).filter(CareerDocument.id == doc_id).first()
    assert chunks_after == 0, "Chunks were not deleted with document!"
    assert doc_after is None, "Document record was not deleted!"
    db_s.close()

    # Verify subsequent query returns empty
    sub_res = client.post("/api/rag/chat", headers=headers_b, json={
        "query": "What is my UltraRareSecretQuantumCloudKubernetesMaster certification?"
    })
    assert sub_res.status_code == 200
    assert sub_res.json()["has_sufficient_context"] is False
    print("   Document and all vector chunks deleted cleanly, cannot be retrieved.")

run_test("7. Document Deletion Cascades & Vector Cleanup", test_document_deletion)

# -------------------------------------------------------------
# 8. Security & Unauthorized Access Enforcement
# -------------------------------------------------------------
def test_security_authorization():
    # Unauthenticated chat -> 401
    r1 = client.post("/api/rag/chat", json={"query": "test"})
    assert r1.status_code == 401

    # Unauthenticated document list -> 401
    r2 = client.get("/api/rag/documents")
    assert r2.status_code == 401

    # Unauthenticated document ingest -> 401
    r3 = client.post("/api/rag/documents", json={"title": "T", "doc_type": "note", "content": "test text"})
    assert r3.status_code == 401

    # Bob attempting to delete Alice's document -> 404 (access denied)
    db_s = SessionLocal()
    alice_doc = db_s.query(CareerDocument).filter(CareerDocument.user_id == user_a_id).first()
    db_s.close()
    assert alice_doc is not None

    headers_b = {"Authorization": f"Bearer {token_b}"}
    cross_del = client.delete(f"/api/rag/documents/{alice_doc.id}", headers=headers_b)
    assert cross_del.status_code == 404, "Bob was able to delete Alice's document!"

    print("   Protected routes return 401, Cross-tenant deletion returns 404.")

run_test("8. Security & Unauthorized Access Enforcement", test_security_authorization)

# -------------------------------------------------------------
# 9. Embedding & Error Handling Validation
# -------------------------------------------------------------
def test_embedding_error_handling():
    try:
        generate_embedding("")
        assert False, "Expected ValueError for empty string"
    except ValueError:
        pass

    try:
        generate_embedding("   ")
        assert False, "Expected ValueError for whitespace string"
    except ValueError:
        pass

    print("   Empty embedding input rejected with ValueError.")

run_test("9. Embedding Input Validation", test_embedding_error_handling)

print("\n" + "=" * 65)
print("ALL 9 RAG AUDIT TESTS COMPLETED:")
for k, v in results.items():
    print(f"  {k}: {v}")
print("=" * 65)
