import os
import sys
import json
import numpy as np
from sqlalchemy import text
from app.database import engine, SessionLocal, is_postgres, init_db
from app.models import User, CareerDocument, CareerKnowledgeChunk, EMBEDDING_DIM
from app.services.embedding import generate_embedding
from app.services.rag import (
    index_generic_document,
    index_resume_profile,
    retrieve_relevant_chunks,
    answer_with_rag
)

print("=" * 60)
print("NEXTHIRE AI - SUPABASE POSTGRESQL + PGVECTOR VERIFICATION")
print("=" * 60)

results = {}

# Ensure init_db executes against PostgreSQL
init_db()

db = SessionLocal()

# Cleanup previous test users
TEST_USER_A_EMAIL = "pg_test_alice@nexthire.ai"
TEST_USER_B_EMAIL = "pg_test_bob@nexthire.ai"

for em in [TEST_USER_A_EMAIL, TEST_USER_B_EMAIL]:
    existing_u = db.query(User).filter(User.email == em).first()
    if existing_u:
        db.delete(existing_u)
db.commit()

# ------------------------------------------------------------------
# 1. PostgreSQL connection works
# ------------------------------------------------------------------
print("\n--- 1. Testing PostgreSQL connection ---")
try:
    assert is_postgres() is True, "Database is not configured as PostgreSQL!"
    with engine.connect() as conn:
        res = conn.execute(text("SELECT version(), current_database(), current_user;")).fetchone()
        version_str = res[0]
        db_name = res[1]
        user_name = res[2]
        assert "PostgreSQL" in version_str
        results["1. PostgreSQL connection works"] = {
            "status": "PASS",
            "details": f"Connected to Supabase ({user_name}@{db_name}): {version_str[:40]}..."
        }
        print(f"[PASS] 1. PostgreSQL connection works: {version_str[:50]}")
except Exception as e:
    results["1. PostgreSQL connection works"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 1. PostgreSQL connection works: {e}")

# ------------------------------------------------------------------
# 2. pgvector extension works
# ------------------------------------------------------------------
print("\n--- 2. Testing pgvector extension ---")
try:
    with engine.connect() as conn:
        ext = conn.execute(text("SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';")).fetchone()
        assert ext is not None, "pgvector extension not installed in PostgreSQL!"
        ext_name, ext_version = ext[0], ext[1]
        assert ext_name == "vector"
        
        # Test vector literal in SQL
        v_test = conn.execute(text("SELECT '[1,2,3]'::vector;")).fetchone()
        assert v_test is not None
        
        results["2. pgvector extension works"] = {
            "status": "PASS",
            "details": f"pgvector v{ext_version} installed and operational"
        }
        print(f"[PASS] 2. pgvector extension works: v{ext_version}")
except Exception as e:
    results["2. pgvector extension works"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 2. pgvector extension works: {e}")

# ------------------------------------------------------------------
# Setup Test Users
# ------------------------------------------------------------------
user_a = User(full_name="Alice AI Engineer", email=TEST_USER_A_EMAIL, password="Password123!")
user_b = User(full_name="Bob Data Analyst", email=TEST_USER_B_EMAIL, password="Password456!")
db.add_all([user_a, user_b])
db.commit()
db.refresh(user_a)
db.refresh(user_b)

# ------------------------------------------------------------------
# 3. career_documents table works
# ------------------------------------------------------------------
print("\n--- 3. Testing career_documents table ---")
try:
    doc_a = CareerDocument(
        user_id=user_a.id,
        title="Alice Primary Resume",
        doc_type="resume",
        content="Senior Machine Learning Specialist with 5 years in Python, PyTorch, and NLP Transformers.",
        doc_metadata={"skills": ["Python", "PyTorch", "NLP", "FastAPI"]}
    )
    db.add(doc_a)
    db.commit()
    db.refresh(doc_a)
    assert doc_a.id is not None
    assert doc_a.title == "Alice Primary Resume"
    
    # Query check
    queried_doc = db.query(CareerDocument).filter(CareerDocument.id == doc_a.id).first()
    assert queried_doc is not None
    assert queried_doc.doc_type == "resume"
    assert queried_doc.doc_metadata["skills"] == ["Python", "PyTorch", "NLP", "FastAPI"]
    
    results["3. career_documents table works"] = {
        "status": "PASS",
        "details": f"Document ID {doc_a.id} persisted with JSONB metadata and foreign key"
    }
    print(f"[PASS] 3. career_documents table works: doc_id={doc_a.id}")
except Exception as e:
    results["3. career_documents table works"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 3. career_documents table works: {e}")

# ------------------------------------------------------------------
# 4. career_knowledge_chunks table works
# ------------------------------------------------------------------
print("\n--- 4. Testing career_knowledge_chunks table ---")
try:
    dummy_vec = [0.01 * (i % 50) for i in range(EMBEDDING_DIM)]
    chunk_a = CareerKnowledgeChunk(
        user_id=user_a.id,
        document_id=doc_a.id,
        chunk_index=0,
        chunk_text="Core expertise in PyTorch and transformer fine-tuning for question answering.",
        chunk_metadata={"category": "skills", "source_title": doc_a.title},
        embedding=dummy_vec
    )
    db.add(chunk_a)
    db.commit()
    db.refresh(chunk_a)
    assert chunk_a.id is not None
    
    queried_chunk = db.query(CareerKnowledgeChunk).filter(CareerKnowledgeChunk.id == chunk_a.id).first()
    assert queried_chunk is not None
    assert queried_chunk.chunk_index == 0
    assert "PyTorch" in queried_chunk.chunk_text
    
    results["4. career_knowledge_chunks table works"] = {
        "status": "PASS",
        "details": f"Chunk ID {chunk_a.id} persisted with metadata, vector column and foreign keys"
    }
    print(f"[PASS] 4. career_knowledge_chunks table works: chunk_id={chunk_a.id}")
except Exception as e:
    results["4. career_knowledge_chunks table works"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 4. career_knowledge_chunks table works: {e}")

# ------------------------------------------------------------------
# 5. 768-dimensional embeddings can be stored
# ------------------------------------------------------------------
print("\n--- 5. Testing 768-dimensional embeddings storage ---")
try:
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT id, vector_dims(embedding) FROM career_knowledge_chunks WHERE id = :cid"),
            {"cid": chunk_a.id}
        ).fetchone()
        assert row is not None
        stored_dim = row[1]
        assert stored_dim == 768, f"Expected 768 dimensions, got {stored_dim}"
        
    # Read back via ORM
    db.refresh(chunk_a)
    emb_list = list(chunk_a.embedding)
    assert len(emb_list) == 768
    
    results["5. 768-dimensional embeddings can be stored"] = {
        "status": "PASS",
        "details": f"vector_dims returned {stored_dim} on Supabase pgvector column"
    }
    print(f"[PASS] 5. 768-dimensional embeddings can be stored: exactly {stored_dim} dimensions")
except Exception as e:
    results["5. 768-dimensional embeddings can be stored"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 5. 768-dimensional embeddings can be stored: {e}")

# ------------------------------------------------------------------
# 6. Resume ingestion works
# ------------------------------------------------------------------
print("\n--- 6. Testing resume ingestion with RAG pipeline ---")
try:
    from app.schemas.analysis import ResumeAnalysis
    
    resume_analysis = ResumeAnalysis(
        summary="Lead AI Engineer with 6 years building production LLM and RAG pipelines.",
        skills=["Python", "PyTorch", "LangChain", "PostgreSQL", "Docker", "FastAPI", "Kubernetes"],
        projects=[
            "Real-Time Fraud Detection System: Built with PyTorch and Kafka processing 50k events/sec.",
            "Career Knowledge Base RAG: Implemented pgvector similarity search with Gemini models."
        ],
        experience=[
            "Senior ML Engineer at TechCorp (2022 - Present). Designed scalable embeddings service.",
            "ML Engineer at DataFlow (2019 - 2022). Developed NLP models."
        ],
        education=["B.S. in Computer Science and Engineering, State University"],
        strengths=["Deep Learning Architecture", "Vector Search Engineering"],
        missing_skills=["Rust"],
        improvement_suggestions=["Quantify operational metrics in fraud detection project."],
        ats_score=90
    )
    
    ingested_doc = index_resume_profile(
        db=db,
        user_id=user_a.id,
        resume_analysis=resume_analysis,
        raw_resume_text="Alice AI Engineer Resume text...",
        filename="Alice_AI_Resume.pdf"
    )
    assert ingested_doc.id is not None
    
    # Verify chunks created in Supabase
    chunks_created = db.query(CareerKnowledgeChunk).filter(CareerKnowledgeChunk.document_id == ingested_doc.id).all()
    assert len(chunks_created) >= 5, f"Expected >= 5 chunks, got {len(chunks_created)}"
    for ch in chunks_created:
        assert ch.embedding is not None
        assert len(ch.embedding) == 768
        
    results["6. Resume ingestion works"] = {
        "status": "PASS",
        "details": f"Ingested document ID {ingested_doc.id} with {len(chunks_created)} structured vector chunks in Supabase"
    }
    print(f"[PASS] 6. Resume ingestion works: {len(chunks_created)} chunks indexed in Supabase")
except Exception as e:
    results["6. Resume ingestion works"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 6. Resume ingestion works: {e}")

# ------------------------------------------------------------------
# 7. RAG retrieval works
# ------------------------------------------------------------------
print("\n--- 7. Testing RAG retrieval ---")
try:
    retrieved = retrieve_relevant_chunks(
        db=db,
        user_id=user_a.id,
        query="What projects has Alice developed using PyTorch and Kafka?",
        top_k=3
    )
    assert len(retrieved) > 0, "No chunks retrieved from Supabase!"
    top_chunk, top_sim = retrieved[0]
    assert "Fraud Detection" in top_chunk.chunk_text or "PyTorch" in top_chunk.chunk_text or "Kafka" in top_chunk.chunk_text
    
    results["7. RAG retrieval works"] = {
        "status": "PASS",
        "details": f"Retrieved {len(retrieved)} relevant chunks. Top similarity: {top_sim:.3f}"
    }
    print(f"[PASS] 7. RAG retrieval works: {len(retrieved)} chunks retrieved (score: {top_sim:.3f})")
except Exception as e:
    results["7. RAG retrieval works"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 7. RAG retrieval works: {e}")

# ------------------------------------------------------------------
# 8. Cosine similarity search works
# ------------------------------------------------------------------
print("\n--- 8. Testing Cosine similarity search (Native <=> operator) ---")
try:
    q_emb = generate_embedding("Kubernetes and Docker deployment")
    with engine.connect() as conn:
        raw_res = conn.execute(
            text("""
                SELECT id, chunk_text, 1 - (embedding <=> CAST(:qvec AS vector)) AS sim
                FROM career_knowledge_chunks
                WHERE user_id = :uid
                ORDER BY embedding <=> CAST(:qvec AS vector) ASC
                LIMIT 3;
            """),
            {"qvec": str(q_emb), "uid": user_a.id}
        ).fetchall()
        
        assert len(raw_res) > 0
        top_id, top_text, sim_val = raw_res[0]
        assert 0.0 <= sim_val <= 1.0
        
    results["8. Cosine similarity search works"] = {
        "status": "PASS",
        "details": f"Native pgvector <=> operator executed in Supabase. Similarity score: {sim_val:.3f}"
    }
    print(f"[PASS] 8. Cosine similarity search works: score={sim_val:.3f}")
except Exception as e:
    results["8. Cosine similarity search works"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 8. Cosine similarity search works: {e}")

# ------------------------------------------------------------------
# 9. User isolation works
# ------------------------------------------------------------------
print("\n--- 9. Testing User isolation ---")
try:
    # Query Alice's data as User B (Bob)
    bob_retrieval = retrieve_relevant_chunks(
        db=db,
        user_id=user_b.id,
        query="Tell me about Alice's fraud detection project with Kafka",
        top_k=5
    )
    assert len(bob_retrieval) == 0, f"Data leakage detected! Bob retrieved {len(bob_retrieval)} chunks from Alice!"
    
    # Query via SQL directly with user_id filter
    with engine.connect() as conn:
        b_chunks = conn.execute(
            text("SELECT count(*) FROM career_knowledge_chunks WHERE user_id = :uid;"),
            {"uid": user_b.id}
        ).fetchone()[0]
        assert b_chunks == 0
        
    results["9. User isolation works"] = {
        "status": "PASS",
        "details": "User B retrieved 0 chunks of User A data (100% tenant isolation in Supabase)"
    }
    print("[PASS] 9. User isolation works: 100% isolated")
except Exception as e:
    results["9. User isolation works"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 9. User isolation works: {e}")

# ------------------------------------------------------------------
# 10. Citations work
# ------------------------------------------------------------------
print("\n--- 10. Testing Citations generation ---")
try:
    rag_response = answer_with_rag(
        db=db,
        user_id=user_a.id,
        query="What are my primary machine learning skills?",
        top_k=3
    )
    assert rag_response.has_sufficient_context is True
    assert len(rag_response.citations) > 0
    first_cit = rag_response.citations[0]
    assert first_cit.document_title != ""
    assert first_cit.similarity > 0.0
    assert first_cit.snippet != ""
    
    results["10. Citations work"] = {
        "status": "PASS",
        "details": f"Generated {len(rag_response.citations)} citations referencing {first_cit.document_title} (sim: {first_cit.similarity})"
    }
    print(f"[PASS] 10. Citations work: {len(rag_response.citations)} citations returned")
except Exception as e:
    results["10. Citations work"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 10. Citations work: {e}")

# ------------------------------------------------------------------
# 11. Anti-hallucination works
# ------------------------------------------------------------------
print("\n--- 11. Testing Anti-hallucination guardrails ---")
try:
    absent_response = answer_with_rag(
        db=db,
        user_id=user_a.id,
        query="How many years of experience do I have piloting Boeing 747 aircraft across the Atlantic?",
        top_k=3
    )
    ans_lower = absent_response.answer.lower()
    anti_hallucination_indicators = [
        "not have information", "not available", "knowledge base", 
        "do not have", "no information", "no mention", "not mentioned",
        "does not indicate", "does not contain", "no evidence", "unmentioned"
    ]
    assert any(ind in ans_lower for ind in anti_hallucination_indicators), f"Unexpected response: {absent_response.answer}"
    
    results["11. Anti-hallucination works"] = {
        "status": "PASS",
        "details": f"Refused to fabricate absent experience: {absent_response.answer[:70]}..."
    }
    print("[PASS] 11. Anti-hallucination works: refused to hallucinate")
except Exception as e:
    results["11. Anti-hallucination works"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 11. Anti-hallucination works: {e}")

# ------------------------------------------------------------------
# 12. Document deletion works
# ------------------------------------------------------------------
print("\n--- 12. Testing Document deletion ---")
try:
    temp_doc = CareerDocument(
        user_id=user_b.id,
        title="Temporary Certification",
        doc_type="certification",
        content="AWS Certified Solutions Architect Associate."
    )
    db.add(temp_doc)
    db.commit()
    db.refresh(temp_doc)
    temp_doc_id = temp_doc.id
    
    # Delete document
    db.delete(temp_doc)
    db.commit()
    
    check_doc = db.query(CareerDocument).filter(CareerDocument.id == temp_doc_id).first()
    assert check_doc is None, "Document still exists after deletion!"
    
    results["12. Document deletion works"] = {
        "status": "PASS",
        "details": f"Document ID {temp_doc_id} successfully deleted from Supabase"
    }
    print(f"[PASS] 12. Document deletion works: doc_id={temp_doc_id} deleted")
except Exception as e:
    results["12. Document deletion works"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 12. Document deletion works: {e}")

# ------------------------------------------------------------------
# 13. Cascade deletion works
# ------------------------------------------------------------------
print("\n--- 13. Testing Cascade deletion ---")
try:
    # Create document with chunks, then delete document
    cascade_doc = CareerDocument(
        user_id=user_b.id,
        title="Cascade Test Document",
        doc_type="note",
        content="Test content for cascade deletion testing in Supabase PostgreSQL."
    )
    db.add(cascade_doc)
    db.commit()
    db.refresh(cascade_doc)
    
    c1 = CareerKnowledgeChunk(
        user_id=user_b.id,
        document_id=cascade_doc.id,
        chunk_index=0,
        chunk_text="Chunk 1 for cascade deletion test.",
        embedding=dummy_vec
    )
    c2 = CareerKnowledgeChunk(
        user_id=user_b.id,
        document_id=cascade_doc.id,
        chunk_index=1,
        chunk_text="Chunk 2 for cascade deletion test.",
        embedding=dummy_vec
    )
    db.add_all([c1, c2])
    db.commit()
    
    # Confirm chunks exist in Supabase
    chunks_before = db.query(CareerKnowledgeChunk).filter(CareerKnowledgeChunk.document_id == cascade_doc.id).count()
    assert chunks_before == 2
    
    # Delete parent document
    db.delete(cascade_doc)
    db.commit()
    
    # Verify child chunks automatically deleted via ON DELETE CASCADE
    chunks_after = db.query(CareerKnowledgeChunk).filter(CareerKnowledgeChunk.document_id == cascade_doc.id).count()
    assert chunks_after == 0, f"Expected 0 chunks after cascade deletion, found {chunks_after}!"
    
    results["13. Cascade deletion works"] = {
        "status": "PASS",
        "details": "Foreign key ON DELETE CASCADE deleted 2 associated vector chunks automatically in Supabase"
    }
    print("[PASS] 13. Cascade deletion works: child vector chunks cascade-deleted")
except Exception as e:
    results["13. Cascade deletion works"] = {"status": "FAIL", "error": str(e)}
    print(f"[FAIL] 13. Cascade deletion works: {e}")

# Final cleanup of test users
for em in [TEST_USER_A_EMAIL, TEST_USER_B_EMAIL]:
    u = db.query(User).filter(User.email == em).first()
    if u:
        db.delete(u)
db.commit()
db.close()

print("\n" + "=" * 60)
print("SUPABASE POSTGRESQL VERIFICATION SUMMARY (13 OF 13)")
print("=" * 60)
all_passed = True
for k, v in results.items():
    print(f"{k}: {v['status']} - {v.get('details', v.get('error'))}")
    if v['status'] != "PASS":
        all_passed = False

with open("supabase_verification_results.json", "w", encoding="utf-8") as out:
    json.dump(results, out, indent=2)

if all_passed:
    print("\n>>> ALL 13 SUPABASE POSTGRESQL VERIFICATIONS PASSED! <<<")
else:
    print("\n>>> SOME SUPABASE VERIFICATIONS FAILED <<<")
