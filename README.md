# 🚀 NextHire AI

### AI-Powered Career Intelligence Platform

NextHire AI is a full-stack **AI-powered Career Intelligence Platform** that helps students and job seekers understand their career readiness through intelligent resume analysis, ATS evaluation, skill-gap detection, and job matching.

The platform analyzes a user's resume, extracts relevant skills and projects, compares the profile with job requirements, identifies missing skills, and generates a **Career Readiness Index (CRI)** through an interactive dashboard.

---

## 🎯 Problem Statement

Job seekers often struggle to understand whether their resume is ATS-friendly, how well their skills match a specific job, and which skills they need to improve.

Traditional resume screening tools often focus only on ATS scores without providing a complete view of a candidate's career readiness.

**NextHire AI** brings resume intelligence, AI-powered analysis, skill-gap detection, and job matching together into a single platform.

---

## 💡 Solution

NextHire AI follows an intelligent career analysis workflow:

**Resume Upload → PDF Text Extraction → AI Analysis → Skills & Projects Extraction → ATS Analysis → Skill Gap Detection → Job Matching → Career Readiness Index → Dashboard**

---

## ⭐ MVP Features

* 🔐 User Registration & Login
* 🔑 JWT Authentication
* 📄 Resume PDF Upload
* 📝 Resume Text Extraction
* 🤖 AI-Powered Resume Analysis
* 🧠 Skill & Project Extraction
* 📊 ATS Score
* 🧩 Skill Gap Detection
* 💡 AI-Based Improvement Suggestions
* 💼 Job Description Matching
* 🎯 Career Readiness Index (CRI)
* 📈 Career Dashboard
* 👤 Profile Management
* ⚙️ User Settings

---

## 🖥️ Core Modules

| Module                 | Description                                   |
| ---------------------- | --------------------------------------------- |
| 📄 Resume Intelligence | Analyze resume and generate ATS score         |
| 🧠 Skill Gap AI        | Identify missing skills and improvement areas |
| 🎯 Career Readiness    | Calculate and track CRI                       |
| 💼 Job Match           | Compare resume with job descriptions          |

---

## 🔄 How It Works

### 1. Resume Upload

The user uploads their resume in PDF format.

### 2. PDF Processing

**PyMuPDF** extracts the textual content from the uploaded resume.

### 3. AI Analysis

The extracted resume content is analyzed using **Gemini API** and NLP techniques.

### 4. Profile Extraction

The system identifies important information such as:

* Skills
* Projects
* Experience
* Career-related information

### 5. ATS Analysis

The resume is evaluated and an **ATS score** is generated.

### 6. Skill Gap Detection

The platform identifies missing skills and provides AI-powered improvement suggestions.

### 7. Job Matching

The resume is compared with a provided Job Description to identify:

* Matching skills
* Missing skills
* Job compatibility

### 8. Career Readiness Index

The platform calculates a **Career Readiness Index (CRI)** based on the analyzed profile.

### 9. Dashboard

All major career insights are presented through a centralized dashboard.

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* TypeScript
* Tailwind CSS
* React Router
* Axios
* Framer Motion
* Lucide React

### Backend

* Python
* FastAPI
* SQLAlchemy

### Database

* PostgreSQL
* Supabase PostgreSQL

### Authentication

* JWT

### AI & NLP

* Gemini API
* NLP
* Semantic Analysis
* Embeddings
* RAG

### PDF Processing

* PyMuPDF

### Deployment

* Vercel
* Render
* Supabase

### Development

* Git
* GitHub
* VS Code

---

## 🏗️ Architecture

```text
                    ┌──────────────────┐
                    │      User        │
                    └────────┬─────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │   React Frontend    │
                  │ Vite + TypeScript   │
                  │   Tailwind CSS      │
                  └─────────┬───────────┘
                            │
                       REST API
                            │
                            ▼
                  ┌─────────────────────┐
                  │   FastAPI Backend   │
                  │       Python        │
                  └─────────┬───────────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
        ┌─────────┐   ┌──────────┐   ┌────────────┐
        │ PyMuPDF │   │  Gemini  │   │ PostgreSQL │
        │   PDF   │   │   API    │   │  Database  │
        └─────────┘   └──────────┘   └────────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │ Career Intelligence  │
                 │                      │
                 │ • ATS Score          │
                 │ • Skills             │
                 │ • Skill Gaps         │
                 │ • Job Match          │
                 │ • CRI                │
                 └──────────────────────┘
```

---

## 📊 Key Outputs

NextHire AI transforms a resume into actionable career insights:

**Resume →**

📄 Resume Analysis
↓
📊 ATS Score
↓
🧠 Extracted Skills & Projects
↓
🧩 Skill Gaps
↓
💼 Job Compatibility
↓
🎯 Career Readiness Index
↓
📈 Career Dashboard

---

## ⚙️ Installation

### Prerequisites

* Node.js
* Python 3.10+
* PostgreSQL
* Git

### Clone the Repository

```bash
git clone https://github.com/your-username/NextHire-AI.git
cd NextHire-AI
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend

python -m venv venv
```

Activate the virtual environment:

**Windows**

```bash
venv\Scripts\activate
```

**macOS/Linux**

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the backend:

```bash
uvicorn app.main:app --reload
```

---

## 🔑 Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL=your_postgresql_database_url
JWT_SECRET_KEY=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
```

> ⚠️ Never commit API keys, passwords, or `.env` files to GitHub.

---

## ☁️ Deployment

| Component | Platform            |
| --------- | ------------------- |
| Frontend  | Vercel              |
| Backend   | Render              |
| Database  | Supabase PostgreSQL |

---

## 🎯 Project Goal

The goal of NextHire AI is to go beyond traditional resume screening by providing a complete **career intelligence layer** that helps users understand:

* How ATS-ready their resume is
* What skills they currently have
* What skills they are missing
* How well they match a target job
* Their overall Career Readiness Index

---

## 🚀 Future Scope

The current project focuses on the **MVP**. Future versions can introduce:

* 🤖 AI Career Coach
* 📚 Personalized Learning Roadmaps
* 🎤 AI Interview Preparation
* 🗂️ Career Knowledge Base
* 🔎 Advanced RAG-based Career Assistant
* 📈 Continuous Career Readiness Tracking

---

## 👨‍💻 Author

**P. Bhavishya Laxmi Sarvani**
B.Tech CSE - Artificial Intelligence and Machine Learning

> **NextHire AI is a full-stack AI Career Intelligence Platform built with React, TypeScript, FastAPI, PostgreSQL, Gemini, NLP, Embeddings, and RAG to analyze resumes, evaluate ATS compatibility, identify skill gaps, match job descriptions, and measure career readiness.**
