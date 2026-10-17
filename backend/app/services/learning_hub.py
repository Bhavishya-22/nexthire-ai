"""
NextHire AI - Production-Quality Learning Hub Service
Generates evidence-based, role-aware personalized learning plans using verified authentic
educational resources, tracks persistent completion, and connects directly to career profile data.
"""

import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

# =========================================================================
# 1. ROLE ARCHETYPE CLASSIFICATION
# =========================================================================

ROLE_ARCHETYPES = {
    "legal": ["legal", "law", "attorney", "counsel", "paralegal", "compliance", "regulatory", "contracts", "jurist"],
    "data_science": ["data scientist", "data science", "data analyst", "business intelligence", "statistician", "analytics"],
    "ai_ml": ["ai", "artificial intelligence", "machine learning", "ml", "genai", "deep learning", "llm", "nlp", "computer vision"],
    "backend": ["backend", "back-end", "api", "distributed systems", "cloud engineer", "golang", "microservices"],
    "frontend": ["frontend", "front-end", "ui", "ux", "react", "vue", "web developer"],
    "fullstack": ["fullstack", "full stack", "software engineer", "software developer"],
    "devops": ["devops", "sre", "site reliability", "infrastructure", "platform engineer", "kubernetes"],
    "cybersecurity": ["security", "cyber", "infosec", "penetration", "soc"],
    "product": ["product manager", "product owner", "scrum master", "project manager"]
}

def detect_role_archetype(role_str: str) -> str:
    r = (role_str or "").lower().strip()
    for archetype, keywords in ROLE_ARCHETYPES.items():
        if any(kw in r for kw in keywords):
            return archetype
    return "fullstack"


# =========================================================================
# 2. VERIFIED AUTHENTIC LEARNING RESOURCES REPOSITORY
# Official docs, established platforms (Coursera, edX, MIT OCW, LeetCode, Hugging Face, etc.)
# Never fabricate course titles, fake certificates, or dead URLs.
# =========================================================================

VERIFIED_LEARNING_CATALOGUE: Dict[str, List[Dict[str, Any]]] = {
    "ai_ml": [
        {
            "id": "learn-aiml-01",
            "title": "Hugging Face NLP & Transformer Course",
            "skill": "NLP & Transformers",
            "provider": "Hugging Face",
            "url": "https://huggingface.co/learn/nlp-course",
            "resource_type": "Course",
            "difficulty": "Intermediate",
            "duration": "14 hrs",
            "is_free": True,
            "category": "High-Priority Role",
            "why_matters": "Core foundation for LLM application engineering, tokenization, and transfer learning in modern AI positions.",
            "expected_outcome": "Understand transformer architectures, fine-tune pretrained models, and deploy Hugging Face pipelines.",
            "practical_exercise": "Fine-tune a DistilBERT text classification model and evaluate accuracy on a custom domain dataset."
        },
        {
            "id": "learn-aiml-02",
            "title": "Deep Learning with PyTorch: 60-Minute Blitz",
            "skill": "PyTorch",
            "provider": "PyTorch Official Documentation",
            "url": "https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html",
            "resource_type": "Tutorial",
            "difficulty": "Beginner",
            "duration": "3 hrs",
            "is_free": True,
            "category": "Foundation",
            "why_matters": "Industry-standard tensor computing and autograd framework required for building and training neural networks.",
            "expected_outcome": "Master Tensors, computational graphs, loss functions, and backpropagation in PyTorch.",
            "practical_exercise": "Build and train a 3-layer convolutional neural network to classify fashion items from scratch."
        },
        {
            "id": "learn-aiml-03",
            "title": "FastAPI Official Interactive Tutorial & Dependency Injection",
            "skill": "FastAPI",
            "provider": "FastAPI Documentation",
            "url": "https://fastapi.tiangolo.com/tutorial/",
            "resource_type": "Documentation",
            "difficulty": "Beginner",
            "duration": "4 hrs",
            "is_free": True,
            "category": "Critical Gaps",
            "why_matters": "The primary asynchronous Python web framework for serving production ML and RAG inference APIs.",
            "expected_outcome": "Build robust RESTful endpoints with Pydantic schema validation and automatic OpenAPI documentation.",
            "practical_exercise": "Deploy a REST API that accepts user text, runs sentiment inference, and returns structured JSON responses."
        },
        {
            "id": "learn-aiml-04",
            "title": "LangChain & Vector Databases for Retrieval-Augmented Generation",
            "skill": "Vector Databases & RAG",
            "provider": "DeepLearning.AI / Coursera",
            "url": "https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/",
            "resource_type": "Course",
            "difficulty": "Intermediate",
            "duration": "5 hrs",
            "is_free": True,
            "category": "Critical Gaps",
            "why_matters": "Essential for building context-aware AI systems that ground generation on proprietary company documents.",
            "expected_outcome": "Implement chunking, vector embeddings, similarity search, and conversational memory.",
            "practical_exercise": "Build a RAG system over PDF documents using ChromaDB or pgvector with hallucination guardrails."
        },
        {
            "id": "learn-aiml-05",
            "title": "Docker Containerization Essentials for ML Engineers",
            "skill": "Docker",
            "provider": "Docker Official Docs",
            "url": "https://docs.docker.com/get-started/",
            "resource_type": "Documentation",
            "difficulty": "Beginner",
            "duration": "3 hrs",
            "is_free": True,
            "category": "Hands-on Projects",
            "why_matters": "Ensures reproducible model environments and reliable cloud deployment across development and production.",
            "expected_outcome": "Write multi-stage Dockerfiles, configure Docker Compose, and manage environment secrets.",
            "practical_exercise": "Containerize a FastAPI model inference service with a pinned CUDA/CPU environment."
        },
        {
            "id": "learn-aiml-06",
            "title": "LeetCode Top Interview 150 & Algorithm Patterns",
            "skill": "Problem Solving",
            "provider": "LeetCode",
            "url": "https://leetcode.com/studyplan/top-interview-150/",
            "resource_type": "Practice",
            "difficulty": "Intermediate",
            "duration": "20 hrs",
            "is_free": True,
            "category": "Interview Preparation",
            "why_matters": "Mandatory technical screening benchmark across AI and software engineering screening rounds.",
            "expected_outcome": "Confidently solve dynamic programming, graph traversal, and two-pointer algorithmic challenges.",
            "practical_exercise": "Complete 5 Two-Pointer and 5 Tree Traversal problems under timed 25-minute interview constraints."
        }
    ],
    "legal": [
        {
            "id": "learn-legal-01",
            "title": "Commercial Contracts: Principles of Drafting & Negotiation",
            "skill": "Contract Drafting",
            "provider": "Harvard Law School / edX",
            "url": "https://online.law.harvard.edu/",
            "resource_type": "Course",
            "difficulty": "Intermediate",
            "duration": "10 hrs",
            "is_free": True,
            "category": "Critical Gaps",
            "why_matters": "Essential corporate legal skill for drafting enforceable indemnities, warranties, and liability limitations.",
            "expected_outcome": "Draft clear covenants, structure dispute resolution mechanisms, and identify ambiguous language.",
            "practical_exercise": "Review a Master Services Agreement (MSA) and redline clauses relating to indemnification and data breach liability."
        },
        {
            "id": "learn-legal-02",
            "title": "GDPR & Digital Data Privacy Compliance Framework",
            "skill": "Privacy & Compliance",
            "provider": "International Association of Privacy Professionals (IAPP)",
            "url": "https://iapp.org/resources/topics/gdpr/",
            "resource_type": "Documentation",
            "difficulty": "Intermediate",
            "duration": "8 hrs",
            "is_free": True,
            "category": "High-Priority Role",
            "why_matters": "High-demand compliance requirement for cross-border digital transactions, cloud platforms, and data transfers.",
            "expected_outcome": "Analyze lawful bases of processing, data subject rights, and cross-border transfer requirements.",
            "practical_exercise": "Conduct a mock Data Protection Impact Assessment (DPIA) for a healthcare mobile application."
        },
        {
            "id": "learn-legal-03",
            "title": "Cornell Legal Information Institute: Statutory & Case Law Research",
            "skill": "Legal Research",
            "provider": "Cornell Law School (LII)",
            "url": "https://www.law.cornell.edu/",
            "resource_type": "Practice",
            "difficulty": "Beginner",
            "duration": "5 hrs",
            "is_free": True,
            "category": "Foundation",
            "why_matters": "Primary method for finding binding judicial precedents, statutory amendments, and legal interpretations.",
            "expected_outcome": "Navigate legal taxonomy, cite relevant authority, and synthesize multi-jurisdiction precedents.",
            "practical_exercise": "Draft a 2-page judicial bench memo addressing liability under digital electronic contract execution statutes."
        },
        {
            "id": "learn-legal-04",
            "title": "WIPO Academy: Intellectual Property & Tech Licensing Essentials",
            "skill": "Intellectual Property",
            "provider": "World Intellectual Property Organization (WIPO)",
            "url": "https://www.wipo.int/academy/en/",
            "resource_type": "Course",
            "difficulty": "Intermediate",
            "duration": "12 hrs",
            "is_free": True,
            "category": "Hands-on Projects",
            "why_matters": "Required to protect software assets, negotiate SaaS agreements, and manage patent/trademark portfolios.",
            "expected_outcome": "Structure software license agreements, trade secret policies, and open-source compliance guidelines.",
            "practical_exercise": "Draft an Open Source Software (OSS) policy document and a proprietary software end-user license agreement (EULA)."
        },
        {
            "id": "learn-legal-05",
            "title": "Corporate Due Diligence & M&A Transactional Audit",
            "skill": "Due Diligence",
            "provider": "Corporate Finance Institute (CFI)",
            "url": "https://corporatefinanceinstitute.com/resources/commercial-lending/due-diligence/",
            "resource_type": "Tutorial",
            "difficulty": "Advanced",
            "duration": "6 hrs",
            "is_free": True,
            "category": "Interview Preparation",
            "why_matters": "Standard testing topic in elite law firm and in-house corporate legal interview assessments.",
            "expected_outcome": "Identify undisclosed liabilities, audit cap tables, and prepare due diligence red-flag summaries.",
            "practical_exercise": "Complete a sample 10-point corporate compliance audit checklist for a pre-Series A venture acquisition."
        }
    ],
    "data_science": [
        {
            "id": "learn-ds-01",
            "title": "Statistical Thinking for Data Science and Analytics",
            "skill": "Statistics & Probability",
            "provider": "Columbia University / edX",
            "url": "https://www.edx.org/course/statistical-thinking-for-data-science-and-analytics",
            "resource_type": "Course",
            "difficulty": "Beginner",
            "duration": "10 hrs",
            "is_free": True,
            "category": "Foundation",
            "why_matters": "Theoretical bedrock for hypothesis testing, confidence intervals, and avoiding model p-hacking.",
            "expected_outcome": "Formulate null hypotheses, calculate p-values, and conduct paired t-tests and ANOVA.",
            "practical_exercise": "Perform a two-tailed hypothesis test comparing user conversion rates across two website variants."
        },
        {
            "id": "learn-ds-02",
            "title": "PostgreSQL Tutorial: Advanced Joins, Window Functions & CTEs",
            "skill": "SQL",
            "provider": "PostgreSQL Tutorial",
            "url": "https://www.postgresqltutorial.com/",
            "resource_type": "Documentation",
            "difficulty": "Intermediate",
            "duration": "6 hrs",
            "is_free": True,
            "category": "Critical Gaps",
            "why_matters": "SQL is the #1 tested skill across all commercial data science and quantitative analytics interviews.",
            "expected_outcome": "Write complex analytical queries using window functions (`ROW_NUMBER()`, `LEAD()`, `LAG()`) and CTEs.",
            "practical_exercise": "Write a SQL query calculating month-over-month customer retention cohorts and rolling 7-day revenue averages."
        },
        {
            "id": "learn-ds-03",
            "title": "Scikit-Learn Official User Guide & Practical Machine Learning",
            "skill": "Machine Learning",
            "provider": "Scikit-Learn Documentation",
            "url": "https://scikit-learn.org/stable/user_guide.html",
            "resource_type": "Documentation",
            "difficulty": "Intermediate",
            "duration": "8 hrs",
            "is_free": True,
            "category": "High-Priority Role",
            "why_matters": "Standard production toolset for feature scaling, pipeline construction, cross-validation, and metrics.",
            "expected_outcome": "Build leak-free ML pipelines using ColumnTransformer, GridSearchCV, and ROC-AUC evaluation.",
            "practical_exercise": "Build an end-to-end customer churn classification pipeline with hyperparameter tuning."
        },
        {
            "id": "learn-ds-04",
            "title": "A/B Testing: Principles and Practical Experimentation",
            "skill": "A/B Testing",
            "provider": "Google / Udacity",
            "url": "https://www.udacity.com/course/ab-testing--ud257",
            "resource_type": "Course",
            "difficulty": "Intermediate",
            "duration": "8 hrs",
            "is_free": True,
            "category": "Hands-on Projects",
            "why_matters": "Crucial for tech company data scientists driving product decisions and measuring feature impact.",
            "expected_outcome": "Determine sample size, minimum detectable effect (MDE), and guardrail metrics.",
            "practical_exercise": "Calculate required sample size and statistical power for a pricing tier experiment."
        }
    ],
    "backend": [
        {
            "id": "learn-be-01",
            "title": "System Design Primer & Scalable Architecture",
            "skill": "System Design",
            "provider": "GitHub Open Source",
            "url": "https://github.com/donnemartin/system-design-primer",
            "resource_type": "Tutorial",
            "difficulty": "Intermediate",
            "duration": "16 hrs",
            "is_free": True,
            "category": "Critical Gaps",
            "why_matters": "Required to design scalable, distributed, highly available backends and pass senior SWE technical rounds.",
            "expected_outcome": "Master caching strategies, database sharding, asynchronous message queues, and load balancing.",
            "practical_exercise": "Design a high-scale URL shortener with rate limiting, Redis caching, and relational database sharding."
        },
        {
            "id": "learn-be-02",
            "title": "PostgreSQL Indexing & Query Performance Optimization",
            "skill": "Database Optimization",
            "provider": "Use The Index, Luke",
            "url": "https://use-the-index-luke.com/",
            "resource_type": "Tutorial",
            "difficulty": "Intermediate",
            "duration": "6 hrs",
            "is_free": True,
            "category": "High-Priority Role",
            "why_matters": "Dramatically improves database response times and prevents production deadlocks under heavy load.",
            "expected_outcome": "Understand B-Tree indexes, EXPLAIN ANALYZE execution plans, and partial/composite indexes.",
            "practical_exercise": "Analyze a slow query execution plan with EXPLAIN ANALYZE and optimize it from 800ms down to 12ms."
        },
        {
            "id": "learn-be-03",
            "title": "Docker & Kubernetes Architecture for Microservices",
            "skill": "Containers & Orchestration",
            "provider": "Kubernetes Official Docs",
            "url": "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
            "resource_type": "Documentation",
            "difficulty": "Intermediate",
            "duration": "7 hrs",
            "is_free": True,
            "category": "Hands-on Projects",
            "why_matters": "Standard industry deployment environment for cloud-native backend applications.",
            "expected_outcome": "Deploy Pods, Services, Ingress controllers, and manage rolling updates without downtime.",
            "practical_exercise": "Deploy a multi-tier microservice with an API gateway, backend worker, and Redis queue on Minikube."
        }
    ]
}


# =========================================================================
# 3. PERSONALIZED LEARNING PLAN GENERATION
# Built completely independently from target role, resume skills, and gaps
# =========================================================================

def get_personalized_learning_plan(
    user_profile: Dict[str, Any],
    target_role: Optional[str] = None,
    filter_category: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Builds an evidence-based personalized learning plan using user's real
    resume skills, missing skills, target role, and career goals.
    Completely independent of external job listings or job-tracking endpoints.
    """
    effective_role = (target_role or user_profile.get("target_role") or "AI Engineer").lower()
    resume_analysis = user_profile.get("resume_analysis", {})
    user_skills = resume_analysis.get("skills", [])
    missing_skills = resume_analysis.get("missing_skills", [])
    learning_progress = user_profile.get("learning_progress", {})
    bookmarked_ids = learning_progress.get("bookmarked_ids", [])
    completed_dict = learning_progress.get("completed_resources", {})

    archetype = detect_role_archetype(effective_role)
    resources = list(VERIFIED_LEARNING_CATALOGUE.get(archetype) or VERIFIED_LEARNING_CATALOGUE["ai_ml"])

    annotated = []
    for idx, item in enumerate(resources):
        res_id = item["id"]
        res_skill = item["skill"]
        is_bookmarked = res_id in bookmarked_ids
        is_completed = res_id in completed_dict

        category = item.get("category", "High-Priority Role")

        # Check if skill addresses an identified gap in candidate profile
        is_profile_gap = any(m.lower() in res_skill.lower() or res_skill.lower() in m.lower() for m in missing_skills)

        if is_profile_gap:
            category = "Critical Gaps"
            gap_source = f"Identified in resume skill-gap analysis for {effective_role.title()}"
        elif any(s.lower() in res_skill.lower() for s in user_skills):
            category = "Advanced / Deepening"
            gap_source = "Expands evidenced competency in your current profile"
        else:
            gap_source = f"Standard foundational competency for {effective_role.title()} positions"

        # Filter by category if requested
        if filter_category and filter_category != "All":
            if filter_category == "Bookmarked" and not is_bookmarked:
                continue
            if filter_category == "Completed" and not is_completed:
                continue
            if filter_category not in ["Bookmarked", "Completed"] and category != filter_category:
                continue

        annotated.append({
            "id": res_id,
            "title": item["title"],
            "skill": res_skill,
            "provider": item["provider"],
            "url": item["url"],
            "resource_type": item["resource_type"],
            "difficulty": item["difficulty"],
            "duration": item["duration"],
            "is_free": item["is_free"],
            "category": category,
            "why_matters": item["why_matters"],
            "expected_outcome": item["expected_outcome"],
            "gap_source": gap_source,
            "practical_exercise": item["practical_exercise"],
            "is_bookmarked": is_bookmarked,
            "is_completed": is_completed,
            "completed_at": completed_dict.get(res_id, {}).get("completed_at") if is_completed else None,
            "learning_order": idx + 1
        })

    # Priority sorting
    priority_order = {
        "Critical Gaps": 1,
        "High-Priority Role": 2,
        "Foundation": 3,
        "Hands-on Projects": 4,
        "Advanced / Deepening": 5,
        "Interview Preparation": 6
    }
    annotated.sort(key=lambda r: priority_order.get(r["category"], 99))
    return annotated


# =========================================================================
# 4. PROGRESS TRACKING & PERSISTENCE HELPERS
# =========================================================================

def toggle_resource_bookmark(user_profile: Dict[str, Any], resource_id: str) -> Dict[str, Any]:
    learning_progress = dict(user_profile.get("learning_progress") or {})
    bookmarks = list(learning_progress.get("bookmarked_ids", []))

    if resource_id in bookmarks:
        bookmarks.remove(resource_id)
        action = "removed"
    else:
        bookmarks.append(resource_id)
        action = "added"

    learning_progress["bookmarked_ids"] = bookmarks
    user_profile["learning_progress"] = learning_progress
    return {
        "action": action,
        "resource_id": resource_id,
        "total_bookmarked": len(bookmarks),
        "bookmarked_ids": bookmarks
    }


def toggle_resource_complete(
    user_profile: Dict[str, Any],
    resource_id: str,
    hours_to_credit: float = 3.0
) -> Dict[str, Any]:
    learning_progress = dict(user_profile.get("learning_progress") or {})
    completed_dict = dict(learning_progress.get("completed_resources", {}))

    if resource_id in completed_dict:
        del completed_dict[resource_id]
        action = "unmarked"
    else:
        completed_dict[resource_id] = {
            "completed_at": datetime.utcnow().isoformat(),
            "hours_credited": hours_to_credit
        }
        action = "completed"

    learning_progress["completed_resources"] = completed_dict
    user_profile["learning_progress"] = learning_progress
    return {
        "action": action,
        "resource_id": resource_id,
        "total_completed": len(completed_dict),
        "completed_resources": completed_dict
    }


def get_learning_metrics(user_profile: Dict[str, Any]) -> Dict[str, Any]:
    learning_progress = user_profile.get("learning_progress", {})
    completed_dict = learning_progress.get("completed_resources", {})
    bookmarked_ids = learning_progress.get("bookmarked_ids", [])

    total_hours = sum(v.get("hours_credited", 3.0) for v in completed_dict.values())

    return {
        "total_completed": len(completed_dict),
        "total_hours": round(total_hours, 1),
        "total_bookmarked": len(bookmarked_ids),
        "completed_ids": list(completed_dict.keys()),
        "bookmarked_ids": bookmarked_ids
    }
