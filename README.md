# 🚀 NextHire AI

### AI-Powered Career Intelligence Platform with Personalized RAG

NextHire AI is a full-stack **AI-powered Career Intelligence Platform** that helps students and job seekers understand their career readiness through intelligent resume analysis, ATS evaluation, skill-gap detection, job matching, and a **Personalized Career Knowledge Base powered by RAG (Retrieval-Augmented Generation)**.

The platform analyzes a user's resume, extracts relevant skills and projects, compares the profile with job requirements, identifies missing skills, generates a **Career Readiness Index (CRI)**, and indexes the candidate's career data into an isolated vector database so candidates can query their career intelligence assistant with zero hallucination.

---

## 🎯 Problem Statement

Job seekers often struggle to understand whether their resume is ATS-friendly, how well their skills match a specific job, and which skills they need to improve. Furthermore, general-purpose AI chat assistants lack personalized, verified context about a candidate's actual projects, coursework, and career goals, leading to generic advice or fabricated details.

**NextHire AI** brings resume intelligence, skill-gap detection, job matching, and a **private Career Knowledge Base (RAG)** together into a single, cohesive platform.

---

## 💡 Solution & Complete Pipeline

NextHire AI follows an intelligent career analysis and knowledge pipeline:

```text
User Career Data (Resume / Target Job / Goals)
                  │
                  ▼
          PyMuPDF Extraction
                  │
                  ▼
          Structured AI Analysis
  (Skills, Projects, Experience, ATS, CRI)
                  │
                  ▼
         Semantic Chunking Engine
                  │
                  ▼
   Gemini Embeddings (gemini-embedding-001)
                  │
                  ▼
   PostgreSQL / Supabase pgvector Store
                  │
       ┌──────────┴──────────┐
       │   Semantic Search   │ (Top-K Cosine Distance)
       └──────────┬──────────┘
                  │
                  ▼
       Relevant Context Retrieval
                  │
                  ▼
     Gemini Grounded Assistant
     (Strict Anti-Hallucination + Source Citations)
                  │
                  ▼
Personalized Career Intelligence & Interactive Dashboard
```

---

## ⭐ Implemented Features

* 🔐 **User Registration & Login**: PBKDF2-HMAC-SHA256 password hashing.
* 🔑 **JWT Authentication**: HS256 JWT tokens isolating each user's career data.
* 📄 **Resume PDF Upload**: Drag-and-drop / file selector with format validation.
* 📝 **Resume Text Extraction**: High-fidelity multi-page parsing via PyMuPDF (`fitz`).
* 🤖 **AI-Powered Resume Analysis**: Structured profile extraction powered by Google Gemini.
* 🧠 **Skill & Project Extraction**: Technical skills, soft skills, projects, and work history.
* 📊 **ATS Score**: Parseability assessment and keyword optimization feedback.
* 🧩 **Skill Gap Detection**: Highlighting missing technical competencies for target roles.
* 💡 **AI-Based Improvement Suggestions**: Actionable recommendations.
* 💼 **Job Description Matching**: Comparing resumes against target job descriptions.
* 🎯 **Career Readiness Index (CRI)**: 5-factor weighted algorithm (ATS, Job Match, Skills volume, Projects volume, Skill coverage).
* 🗂️ **Personalized Career Knowledge Base (RAG)**:
  * Automatic indexing of analyzed resumes and target job descriptions for authenticated users.
  * Manual ingestion of career goals, notes, certifications, and target jobs.
  * 768-dimensional vector embeddings with isolated user tenancy.
  * Document and vector chunk deletion with cascading database cleanup.
* 💬 **AI Career Assistant (RAG Chat)**:
  * Grounded question-answering based strictly on user's stored career data.
  * **Anti-Hallucination Guardrails**: Explicitly refuses to invent or fabricate information if details are absent from the knowledge base.
  * **Source Citations**: Displays exact source documents, sections, and similarity scores.

---

## 🛠️ Tech Stack

### Frontend
* React 19, TypeScript, Vite
* Framer Motion, Lucide React, Axios

### Backend
* Python 3.10+, FastAPI, Uvicorn
* SQLAlchemy 2.0 ORM

### Database & Vector Store
* **PostgreSQL + pgvector** (Production on Supabase)
* SQLite fallback for local development / testing

### AI, Embeddings & RAG
* **Google Gemini API** (`google-genai` SDK)
* **Generation Model**: `gemini-3.8-flash` (fallback: `gemini-3.5-flash-lite`, `gemini-flash-latest`)
* **Embedding Model**: `gemini-embedding-001` (768 dimensions)
* **Vector Index**: HNSW cosine distance (`vector_cosine_ops`)

### PDF Processing
* PyMuPDF (`pymupdf`)

### Deployment Ready
* **Frontend**: Vercel (`vercel.json`)
* **Backend**: Render (`render.yaml`, `Procfile`)
* **Database**: Supabase PostgreSQL (`database/schema.sql`)

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

```env
# Gemini API Key (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# Gemini Generation Model
GEMINI_MODEL=gemini-3.8-flash

# Gemini Embedding Model & Vector Dimension
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
EMBEDDING_DIMENSION=768

# Database URL (PostgreSQL / Supabase; falls back to sqlite:///./nexthire.db if omitted)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# CORS Allowed Origins (comma-separated URLs)
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://your-frontend.vercel.app

# JWT Authentication Secret
JWT_SECRET_KEY=your_super_secret_jwt_key_here
```

### Frontend (`frontend/.env`)

```env
# Backend API Base URL
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## 🚀 API Endpoints

### Authentication
* `POST /api/auth/register` — Create user account & return JWT.
* `POST /api/auth/login` — Sign in & return JWT.
* `GET /api/auth/me` — Get profile for authenticated user.

### Resume Intelligence
* `POST /api/resume/analyze` — Upload PDF resume & optional target job description. Evaluates ATS, skills, gaps, CRI, and auto-indexes into the user's Career Knowledge Base when authenticated.

### Career Knowledge Base & RAG
* `POST /api/rag/chat` — Ask the grounded Career Intelligence Assistant with semantic vector retrieval & source citations.
* `POST /api/rag/documents` — Ingest career documents, goals, certifications, notes, or job descriptions.
* `GET /api/rag/documents` — List user's indexed career documents and chunk counts.
* `DELETE /api/rag/documents/{id}` — Delete a career document and cascade delete its vector chunks.

---

## ⚙️ Local Installation & Run

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # On Windows
# source venv/bin/activate  # On macOS/Linux

pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## ☁️ Production Deployment Guide

| Component | Platform | Configuration File |
| :--- | :--- | :--- |
| **Frontend** | Vercel | [`frontend/vercel.json`](./frontend/vercel.json) |
| **Backend** | Render | [`render.yaml`](./render.yaml), [`backend/Procfile`](./backend/Procfile) |
| **Database + pgvector** | Supabase | [`database/schema.sql`](./database/schema.sql) |

1. **Supabase**: Open the SQL editor in Supabase and run `database/schema.sql`. Copy your connection URI into Render's `DATABASE_URL`.
2. **Render**: Connect the repo to Render. Set environment variables (`GEMINI_API_KEY`, `DATABASE_URL`, `JWT_SECRET_KEY`).
3. **Vercel**: Deploy the `frontend/` directory with `VITE_API_BASE_URL` pointing to your Render backend URL.

---

## 👨‍💻 Author

**P. Bhavishya Laxmi Sarvani**  
B.Tech CSE - Artificial Intelligence and Machine Learning
