# 🚀 NextHire AI — AI Career Intelligence Platform

**Your AI-powered career intelligence platform that analyzes your resume, evaluates your career readiness, identifies skill gaps, and helps you move toward your target role.**

NextHire AI combines Generative AI, resume intelligence, personalized recommendations, and Retrieval-Augmented Generation (RAG) to help users understand their current skills and make informed career decisions.

🔗 **GitHub Repository:** [Bhavishya-22/nexthire-ai](https://github.com/Bhavishya-22/nexthire-ai)

---

## 📌 Overview

Choosing the right career path requires more than simply uploading a resume. Candidates need to understand their strengths, identify missing skills, evaluate their readiness for a target role, and determine what to learn next.

NextHire AI addresses these challenges through an AI-powered career intelligence platform that transforms resume data into actionable career insights.

The application follows a simple, personalized workflow:

**Sign In → Resume Onboarding → Career Intelligence Dashboard**

1. **Sign In:** Authenticate using your email address and password.
2. **Resume Onboarding:** Enter your name and target job role, then upload your resume in PDF format.
3. **AI Resume Analysis:** Extract relevant career information and analyze skills, projects, education, and experience.
4. **Career Intelligence Dashboard:** Explore your Career Readiness Index (CRI), skill gaps, resume insights, and recommendations.
5. **AI Career Assistant:** Ask questions about your career profile and retrieve relevant information from your personal career knowledge base.

Returning users can access their existing dashboard after signing in, provided their profile and onboarding are complete.

---

## ✨ Key Features

### 🔐 1. User Authentication

* Email and password-based authentication.
* User registration and sign-in.
* Secure password hashing and JWT-based authentication.
* Protected application routes.
* Personalized user profiles and sign-out functionality.

### 📄 2. Resume Upload and AI Analysis

* Upload resumes in PDF format.
* Extract resume text using PyMuPDF.
* Analyze resume content using Google's Gemini models.
* Identify relevant skills, projects, education, and work experience where available.
* Generate structured resume insights.
* Save resume analysis results for personalized career tracking.

### 🎯 3. Career Readiness Index (CRI)

The Career Readiness Index provides an overview of a user's preparedness for their target career.

The existing CRI calculation considers factors such as:

* ATS score
* Job match score
* Skills volume
* Projects volume
* Skill coverage

The dashboard presents career-readiness information to help users understand their strengths and areas for improvement.

### 🧠 4. Skill Gap Analysis

* Identify skills relevant to the target role.
* Highlight missing or underrepresented skills.
* Provide AI-generated suggestions to address skill gaps.
* Help users prioritize their career development efforts.

### 💼 5. Job Description Matching

* Compare resume information with a job description.
* Identify relevant skills and potential gaps.
* Evaluate alignment between a candidate's profile and job requirements.
* Use matching insights to support more targeted preparation.

### 🤖 6. AI Career Assistant — RAG

NextHire AI incorporates Retrieval-Augmented Generation (RAG) to provide context-aware responses grounded in a user's career documents.

Key capabilities include:

* Ingest career documents into a personal knowledge base.
* Generate semantic embeddings for document chunks.
* Retrieve relevant information using vector similarity search.
* Answer career-related questions using retrieved context.
* Provide source citations where supported.
* Maintain user-level separation when retrieving career information.
* Support document listing and deletion.

The RAG architecture uses PostgreSQL with pgvector for vector storage and Google's embedding models for semantic retrieval.

### 📊 7. Personalized Career Dashboard

The dashboard brings career insights together in one place, including:

* Personalized welcome and target role.
* Career Readiness Index.
* Resume analysis results.
* Skills and project insights.
* Skill-gap recommendations.
* Job matching information.
* Career development suggestions.
* Access to the AI Career Assistant.

Dashboard sections should reflect actual saved user data and available functionality rather than fabricated scores or sample progress.

---

## 🛠️ Tech Stack

| Layer             | Technologies                             |
| ----------------- | ---------------------------------------- |
| Frontend          | React, TypeScript, Vite                  |
| UI and Styling    | Tailwind CSS, Framer Motion, Lucide      |
| API Communication | Axios                                    |
| Backend           | Python, FastAPI                          |
| Authentication    | JWT, PBKDF2-HMAC-SHA256 password hashing |
| Database          | PostgreSQL, SQLAlchemy                   |
| Vector Database   | pgvector                                 |
| AI and LLM        | Google Gemini API                        |
| Embeddings        | `gemini-embedding-001`                   |
| Resume Processing | PyMuPDF                                  |
| Deployment        | Vercel, Render, Supabase                 |

The project also supports an SQLite fallback for local development, subject to the existing database configuration.

---

## 🏗️ Architecture

```text
                         NextHire AI
                              |
                              v
                    User Authentication
                              |
                              v
                       Resume Onboarding
                  (Name + Target Role + PDF)
                              |
                              v
                       FastAPI Backend
                              |
                 +------------+------------+
                 |            |            |
                 v            v            v
          PDF Extraction   Gemini AI    Database
                 |            |            |
                 +------------+------------+
                              |
                              v
                     Resume Intelligence
                              |
                 +------------+------------+
                 |            |            |
                 v            v            v
                CRI       Skill Gaps    Job Matching
                 |            |            |
                 +------------+------------+
                              |
                              v
                   Career Intelligence
                         Dashboard
                              |
                              v
                    AI Career Assistant
                              |
                              v
                     RAG Retrieval Layer
                              |
                              v
                    PostgreSQL + pgvector
```

---

## 📂 Project Structure

The repository is organized into frontend, backend, and database-related components.

```text
nexthire-ai/
├── backend/
│   ├── app/
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
├── database/
├── .gitignore
├── README.md
└── render.yaml
```

*Note: The structure above is representative. Refer to the actual repository for the complete list of files and modules.*

---

## ⚙️ Getting Started

Follow these steps to run the project locally.

### Prerequisites

Install the following:

* Python
* Node.js and npm
* Git
* A Google Gemini API key
* PostgreSQL with pgvector for the PostgreSQL-backed configuration

### 1. Clone the Repository

```bash
git clone https://github.com/Bhavishya-22/nexthire-ai.git
cd nexthire-ai
```

### 2. Set Up the Backend

Open a terminal in the project directory.

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create or update the backend `.env` file using the variables supported by your current implementation:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_supported_gemini_model
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
EMBEDDING_DIMENSION=768
DATABASE_URL=your_database_connection_url
ALLOWED_ORIGINS=http://localhost:5173
JWT_SECRET_KEY=your_secure_random_secret
```

Replace the example values with your actual configuration. Use the exact model name and database URL supported by your project.

Start the backend:

```powershell
uvicorn app.main:app --reload
```

The backend should be available at:

`http://127.0.0.1:8000`

FastAPI's interactive API documentation is available at:

`http://127.0.0.1:8000/docs`

### 3. Set Up the Frontend

Open a second terminal from the project root.

```powershell
cd frontend
npm install
```

Create the frontend `.env` file:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start the development server:

```powershell
npm run dev
```

Open the local URL displayed by Vite, typically:

`http://localhost:5173`

### 4. Configure the Database

Configure `DATABASE_URL` to point to your selected database.

For PostgreSQL-backed deployments, ensure PostgreSQL and the pgvector extension are available and that the required tables and schema are initialized according to the existing backend implementation.

Do not commit database credentials, API keys, or JWT secrets to GitHub.

---

## 🔌 API Endpoints

The backend README documents the following API endpoints.

| Method | Endpoint                  | Purpose                                       |
| ------ | ------------------------- | --------------------------------------------- |
| POST   | `/api/auth/register`      | Register a user                               |
| POST   | `/api/auth/login`         | Authenticate a user                           |
| GET    | `/api/auth/me`            | Retrieve the authenticated user's information |
| POST   | `/api/resume/analyze`     | Analyze resume content                        |
| POST   | `/api/rag/documents`      | Add a document to the RAG knowledge base      |
| GET    | `/api/rag/documents`      | List knowledge-base documents                 |
| DELETE | `/api/rag/documents/{id}` | Delete a knowledge-base document              |
| POST   | `/api/rag/chat`           | Ask questions using RAG                       |

Actual request fields, response schemas, and authentication requirements should be verified against the backend API documentation.

---

## 🔒 Security and Data Privacy

Security is an important part of a personalized career intelligence system.

The project includes or is designed to use:

* Password hashing rather than plaintext password storage.
* JWT-based authentication.
* Protected backend endpoints.
* User-specific career documents and retrieval.
* Environment variables for sensitive configuration.
* User-level access checks for career knowledge-base operations.

All document retrieval, deletion, and AI-assisted responses should enforce ownership checks so that one user cannot access another user's private career information.

---

## 🚀 Deployment

The project is designed around the following deployment options:

* **Frontend:** Vercel
* **Backend:** Render
* **Database and Vector Storage:** Supabase PostgreSQL with pgvector

Before deployment:

1. Configure the production database and required schema.
2. Add backend environment variables in the hosting provider.
3. Set the frontend API base URL to the deployed backend.
4. Configure allowed CORS origins.
5. Use a strong, unique JWT secret.
6. Verify authentication, PDF upload, resume analysis, CRI calculation, and RAG retrieval in the deployed environment.
7. Confirm user isolation and document ownership checks.

Deployment configuration files may be present in the repository, but successful deployment depends on the actual hosting configuration and environment variables.

---

## 🔮 Future Enhancements

Potential improvements to the platform include:

* Personalized learning roadmaps based on skill gaps.
* More detailed career-readiness analytics.
* Enhanced job recommendation workflows.
* Career progress tracking over time.
* Interview preparation using resume-specific context.
* Expanded AI career assistance and agent-based workflows.
* Improved evaluation of resume quality and job alignment.

These are future possibilities and should not be interpreted as completed features unless implemented in the repository.

---

## 🎯 Project Goal

The goal of NextHire AI is to move beyond traditional resume screening by helping users understand their career readiness, discover actionable skill gaps, and make better-informed career development decisions through AI-powered insights.

Rather than simply evaluating a resume, the platform aims to connect a candidate's existing experience with the requirements of their target role.

---

## 👩‍💻 Author

**P. Bhavishya Laxmi Sarvani**

* GitHub: [Bhavishya-22](https://github.com/Bhavishya-22)
* Portfolio: [bhavishya-22.github.io/bhavishya-portfolio](https://bhavishya-22.github.io/bhavishya-portfolio/)

---

⭐ If you find this project interesting, consider starring the repository!

**NextHire AI — Understand your readiness. Identify your gaps. Build your future.**
