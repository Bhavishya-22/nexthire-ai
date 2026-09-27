-- NextHire AI - Production PostgreSQL + pgvector Schema (Supabase / Render)
-- Run this in your Supabase SQL Editor or PostgreSQL database console.

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. Career Documents Table (Parent documents: resumes, notes, goals, job descriptions)
CREATE TABLE IF NOT EXISTS career_documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    doc_type VARCHAR(50) NOT NULL, -- 'resume', 'job_description', 'career_goal', 'certification', 'note'
    content TEXT NOT NULL,
    doc_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_career_docs_user_id ON career_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_career_docs_type ON career_documents(doc_type);

-- 4. Career Knowledge Chunks Table (Vector-embedded chunks for semantic search)
CREATE TABLE IF NOT EXISTS career_knowledge_chunks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id INTEGER NOT NULL REFERENCES career_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL DEFAULT 0,
    chunk_text TEXT NOT NULL,
    chunk_metadata JSONB DEFAULT '{}'::jsonb, -- contains category ('skills', 'projects', 'experience', etc.), title, tags
    embedding vector(768),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_career_chunks_user_id ON career_knowledge_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_career_chunks_document_id ON career_knowledge_chunks(document_id);

-- 5. HNSW Vector Index for fast semantic similarity search (Cosine Distance)
CREATE INDEX IF NOT EXISTS idx_career_chunks_embedding_hnsw 
ON career_knowledge_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
