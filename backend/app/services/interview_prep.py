"""
NextHire AI - Role-Specific Interview Preparation Engine
Handles:
1. Dynamic, role-aware interview question generation across 4 categories:
   - Technical Interview (domain-specific, tailored to target role and experience level)
   - Project Deep Dive (grounded in candidate's actual projects, resume, and contributions)
   - HR & Behavioral (situational, role-specific interpersonal & leadership scenarios)
   - Full Mock Simulation (end-to-end holistic practical interview scenario)
2. Role-specific Gemini prompt construction and response schema validation.
3. High-fidelity, domain-adapted fallback question generation for ANY role (AI, Legal, Data, Backend, Finance, Product, Custom).
4. Role-appropriate AI answer evaluation with tailored rubrics, missing concepts, strengths, model answers, and practical depth.
5. Role-aware and category-aware question caching and user-isolated interview history persistence.
"""

import re
import uuid
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.models import User
from app.services.gemini import generate_json

logger = logging.getLogger(__name__)


# =========================================================================
# SCHEMAS & CONTRACTS
# =========================================================================

class InterviewQuestion(BaseModel):
    question_id: str
    question: str
    category: str  # "Technical", "Project", "HR", "Mock"
    target_role: str
    difficulty: str  # "Foundational", "Intermediate", "Advanced"
    relevant_skills: List[str] = Field(default_factory=list)
    evaluation_criteria: str
    expected_concepts: List[str] = Field(default_factory=list)


class InterviewQuestionsResponse(BaseModel):
    success: bool
    target_role: str
    category: Optional[str] = None
    questions: List[InterviewQuestion]
    total: int
    is_cached: bool = False


class InterviewFeedbackRequest(BaseModel):
    question_id: Optional[str] = None
    question: str = Field(..., min_length=5)
    answer: str = Field(..., min_length=5)
    category: str = Field(default="Technical")
    target_role: Optional[str] = ""
    expected_concepts: Optional[List[str]] = Field(default_factory=list)
    evaluation_criteria: Optional[str] = ""


class InterviewFeedbackData(BaseModel):
    technical_correctness: int = 80
    answer_completeness: int = 80
    relevance: int = 85
    communication_clarity: int = 80
    practical_depth: int = 75
    overall_score: int = 80
    rubric_breakdown: Dict[str, Any] = Field(default_factory=dict)
    strengths: List[str] = Field(default_factory=list)
    concepts_covered: List[str] = Field(default_factory=list)
    missing_concepts: List[str] = Field(default_factory=list)
    suggested_improvements: str = ""
    model_answer_outline: str = ""
    summary: str = ""


# =========================================================================
# ROLE ARCHETYPE IDENTIFIER & DOMAIN KNOWLEDGE
# =========================================================================

def _normalize_role(role: Optional[str]) -> str:
    if not role or not role.strip():
        return "AI Engineer"
    return role.strip()


def _classify_role_archetype(role: str) -> str:
    """
    Classifies a role into a primary archetype for fine-tuned domain guidance and rubrics.
    """
    r = role.lower()
    if any(k in r for k in ["legal", "lawyer", "attorney", "counsel", "compliance", "regulatory", "jurist"]):
        return "legal"
    elif any(k in r for k in ["generative ai", "genai", "llm", "rag", "agent", "prompt", "ai engineer"]):
        return "genai"
    elif any(k in r for k in ["machine learning", "mle", "deep learning", "nlp", "computer vision", "mlops"]):
        return "ml"
    elif any(k in r for k in ["data scientist", "data science", "statistician", "applied scientist"]):
        return "data_science"
    elif any(k in r for k in ["data analyst", "business intelligence", "bi analyst", "analytics engineer"]):
        return "data_analytics"
    elif any(k in r for k in ["backend", "python developer", "java developer", "api developer", "systems engineer", "go developer", "node"]):
        return "backend"
    elif any(k in r for k in ["full stack", "fullstack", "web developer", "software engineer", "swe"]):
        return "fullstack"
    elif any(k in r for k in ["devops", "cloud", "sre", "platform engineer", "infrastructure", "kubernetes", "aws"]):
        return "devops"
    elif any(k in r for k in ["cybersecurity", "security analyst", "soc", "infosec", "penetration tester"]):
        return "cybersecurity"
    elif any(k in r for k in ["financial analyst", "finance", "investment banking", "equity research", "accounting", "actuary"]):
        return "finance"
    elif any(k in r for k in ["product manager", "pm", "business analyst", "product owner", "scrum master"]):
        return "product"
    return "custom"


# =========================================================================
# DOMAIN-ADAPTED FALLBACK QUESTIONS GENERATOR
# Used when Gemini encounters network, rate-limit, or quota errors.
# Guarantees that every target role gets genuinely different, category-adapted questions!
# =========================================================================

def generate_fallback_questions(
    role: str,
    category: str,
    projects: List[Dict[str, Any]],
    skills: List[str],
    experience_level: str = "Mid-Level"
) -> List[InterviewQuestion]:
    """
    Generates rich, role-specific questions for any role and category.
    Never returns AI Engineer questions for a Legal Advisor or Data Scientist!
    """
    archetype = _classify_role_archetype(role)
    primary_project = projects[0]["name"] if projects else "Primary Capstone Project"
    project_desc = projects[0].get("description", "") if projects else ""
    secondary_project = projects[1]["name"] if len(projects) > 1 else primary_project

    # Top technical skills
    top_skills = [s for s in skills if s][:4]
    skill_str = ", ".join(top_skills) if top_skills else role

    questions_by_category: Dict[str, List[Dict[str, Any]]] = {}

    # 1. LEGAL ADVISOR / COUNSEL
    if archetype == "legal":
        questions_by_category["Technical"] = [
            {
                "question": f"In drafting enterprise service agreements for {role}, how do you structure indemnification and limitation of liability clauses to effectively manage third-party intellectual property infringement risks?",
                "difficulty": "Intermediate",
                "relevant_skills": ["Contract Law", "Indemnification", "Risk Mitigation", "IP Licensing"],
                "evaluation_criteria": "Evaluates understanding of direct vs consequential damages, liability caps, carve-outs for gross negligence/willful misconduct, and IP indemnification defense obligations.",
                "expected_concepts": ["Liability caps", "Carve-outs for IP infringement", "Defense vs indemnification", "Consequential damages waiver", "Jurisdictional enforceability"]
            },
            {
                "question": f"How do you evaluate cross-border data transfer compliance under GDPR and applicable data privacy regimes for multi-jurisdictional business operations in {role}?",
                "difficulty": "Advanced",
                "relevant_skills": ["Data Privacy Law", "GDPR", "Cross-Border Transfers", "Standard Contractual Clauses"],
                "evaluation_criteria": "Evaluates knowledge of Standard Contractual Clauses (SCCs), Data Transfer Impact Assessments (DTIAs), adequacy decisions, and regulatory enforcement precedents.",
                "expected_concepts": ["Standard Contractual Clauses (SCCs)", "Data Transfer Impact Assessment", "Schrems II implications", "Sub-processor obligations", "Data subject rights"]
            },
            {
                "question": f"When conducting legal due diligence for an acquisition or material partnership, what systematic checklist and risk matrix do you use to uncover regulatory, compliance, and employment liabilities?",
                "difficulty": "Intermediate",
                "relevant_skills": ["Legal Due Diligence", "Compliance Audit", "Risk Assessment", "Corporate Governance"],
                "evaluation_criteria": "Assesses structured due diligence methodology, material breach thresholds, disclosure schedules, and post-closing indemnification escrow.",
                "expected_concepts": ["Material adverse change (MAC)", "Regulatory filings", "Employment & IP assignment audits", "Litigation exposure", "Representations and warranties insurance"]
            },
            {
                "question": f"Explain your approach to statutory interpretation when statutory language is ambiguous or when regulatory agency guidance conflicts with emerging business practices in {role}.",
                "difficulty": "Foundational",
                "relevant_skills": ["Statutory Interpretation", "Legal Research", "Administrative Law", "Regulatory Strategy"],
                "evaluation_criteria": "Assesses knowledge of canons of construction, legislative history, deference doctrines, and practical risk-tolerance counseling.",
                "expected_concepts": ["Plain meaning canon", "Legislative intent", "Canons of construction", "Regulatory guidance weight", "Pragmatic business risk counseling"]
            }
        ]
        questions_by_category["Project"] = [
            {
                "question": f"In your project '{primary_project}', walk through the legal and regulatory compliance architecture you established. What were the most complex contractual or jurisdictional challenges you negotiated?",
                "difficulty": "Advanced",
                "relevant_skills": ["Legal Strategy", "Contract Negotiation", "Compliance Frameworks"],
                "evaluation_criteria": "Assesses practical execution of legal advice in real business scenarios, conflict resolution, and measurable risk reduction.",
                "expected_concepts": ["Risk allocation", "Regulatory alignment", "Stakeholder negotiation", "Audit trails", "Measurable risk mitigation"]
            },
            {
                "question": f"Reflecting on '{secondary_project}', how did you balance legal exposure against commercial speed and client demands? Where did you draw the non-negotiable boundary?",
                "difficulty": "Intermediate",
                "relevant_skills": ["Commercial Law", "Executive Counseling", "Risk Management"],
                "evaluation_criteria": "Evaluates commercial pragmatism, ethical guardrails, executive communication, and boundary setting.",
                "expected_concepts": ["Risk vs commercial reward", "Non-negotiable statutory redlines", "Executive escalation protocol", "Fallback negotiation positions"]
            },
            {
                "question": f"If regulatory authorities initiated a formal compliance inquiry into '{primary_project}', what evidentiary documentation, policies, and audit logs would you rely upon to substantiate compliance?",
                "difficulty": "Advanced",
                "relevant_skills": ["Regulatory Audits", "Compliance Documentation", "Evidentiary Standards"],
                "evaluation_criteria": "Evaluates preparedness for regulatory audits, document retention policies, and formal investigation response protocols.",
                "expected_concepts": ["Audit logs and version control", "Document retention schedules", "Legal hold protocols", "Clear policy dissemination evidence"]
            }
        ]
        questions_by_category["HR"] = [
            {
                "question": f"Tell me about a time when business leaders or executive stakeholders pushed back against your legal guidance for {role} to close a deal faster. How did you navigate the conversation without compromising compliance?",
                "difficulty": "Intermediate",
                "relevant_skills": ["Stakeholder Management", "Executive Communication", "Ethical Integrity", "Persuasion"],
                "evaluation_criteria": "Evaluates diplomatic communication, ability to reframe legal counsel into business enablement, and ethical steadfastness.",
                "expected_concepts": ["STAR format", "Re-framing risk as brand protection", "Constructive compromise", "Executive escalation when required"]
            },
            {
                "question": f"How do you stay abreast of rapidly evolving statutory changes and judicial precedents relevant to {role} while managing high-volume day-to-day contract reviews?",
                "difficulty": "Foundational",
                "relevant_skills": ["Continuous Learning", "Time Management", "Legal Research"],
                "evaluation_criteria": "Assesses professional development habits, prioritization frameworks, and proactive risk anticipation.",
                "expected_concepts": ["Legal alert aggregators", "Prioritization matrices", "Playbook updating", "Proactive business advisory"]
            },
            {
                "question": f"Describe a situation in your legal career where you identified an unforeseen loophole or compliance risk before it escalated into litigation. What specific steps did you initiate?",
                "difficulty": "Intermediate",
                "relevant_skills": ["Proactive Problem Solving", "Risk Spotting", "Remediation"],
                "evaluation_criteria": "Evaluates analytical rigor, initiative, cross-functional collaboration, and effective remediation.",
                "expected_concepts": ["Issue spotting", "Immediate containment", "Policy overhaul", "Stakeholder debrief"]
            }
        ]
        questions_by_category["Mock"] = [
            {
                "question": f"Full Legal Simulation: A strategic enterprise client demands an uncapped indemnification clause for third-party IP claims, while your company is licensing open-source and third-party SaaS components. How do you structure your risk analysis, counter-proposal, and negotiation strategy for {role}?",
                "difficulty": "Advanced",
                "relevant_skills": ["Contract Negotiation", "IP Indemnity", "Commercial Risk Allocation", "Executive Advisory"],
                "evaluation_criteria": "Holistic assessment of legal reasoning, negotiation tactics, compromise structuring (e.g. super-caps), and executive risk briefing.",
                "expected_concepts": ["Super-cap proposal", "Carve-out qualification", "Defense control condition", "Third-party dependency warranty limits", "Executive risk sign-off"]
            },
            {
                "question": f"Full Crisis Simulation: Your company experiences an unauthorized data breach affecting user records across two distinct jurisdictions. Walk through your first 72 hours of legal response, regulatory notification triggers, and containment protocols.",
                "difficulty": "Advanced",
                "relevant_skills": ["Incident Response", "Data Breach Notification", "Regulatory Defense", "Privilege Maintenance"],
                "evaluation_criteria": "Evaluates adherence to 72-hour regulatory notification deadlines, attorney-client privilege protection for forensics, and public disclosure coordination.",
                "expected_concepts": ["72-hour GDPR/statutory clock", "Privileged forensic investigation", "Law enforcement engagement", "Notice to affected data subjects", "Board reporting"]
            }
        ]

    # 2. GENERATIVE AI & LLM ENGINEER
    elif archetype == "genai":
        questions_by_category["Technical"] = [
            {
                "question": f"How would you design an enterprise Retrieval-Augmented Generation (RAG) pipeline for {role} that maintains sub-200ms latency, high retrieval precision, and reliable source attribution?",
                "difficulty": "Intermediate",
                "relevant_skills": ["RAG Architecture", "Vector Databases", "Embeddings", "Retrieval Evaluation"],
                "evaluation_criteria": "Assesses chunking strategies (semantic, sliding window), vector indexing (HNSW), hybrid search (BM25 + Dense), reranking (Cross-Encoder), and context compression.",
                "expected_concepts": ["Hybrid retrieval (BM25 + Vector)", "Cross-encoder reranking", "HNSW indexing", "Semantic chunking with overlap", "Context window optimization"]
            },
            {
                "question": f"Explain your methodology for evaluating and mitigating LLM hallucinations in production applications. What quantitative metrics and guardrail architectures do you implement?",
                "difficulty": "Advanced",
                "relevant_skills": ["Hallucination Detection", "Guardrails", "LLM Evaluation", "Faithfulness Metrics"],
                "evaluation_criteria": "Assesses knowledge of RAGAS metrics (faithfulness, answer relevance), NeMo/Llama Guard guardrails, structured JSON validation, and self-consistency checking.",
                "expected_concepts": ["Faithfulness & answer relevance", "SelfCheckGPT / consistency voting", "Guardrail frameworks (NeMo / Llama-Guard)", "Deterministic schema enforcement", "Citation ground truth validation"]
            },
            {
                "question": f"When building an autonomous tool-calling AI agent, how do you handle tool execution failures, cycle loops, prompt injection attacks, and permission boundaries?",
                "difficulty": "Advanced",
                "relevant_skills": ["AI Agents", "Tool Calling", "Prompt Injection Defense", "ReAct Framework"],
                "evaluation_criteria": "Evaluates ReAct loop control, max-iteration safeguards, input sanitization, least-privilege tool execution, and human-in-the-loop triggers.",
                "expected_concepts": ["ReAct loop limits", "Indirect prompt injection sanitization", "Scoped API tokens / least privilege", "Human-in-the-loop escalation", "Idempotent tool calls"]
            },
            {
                "question": f"Compare fine-tuning (LoRA / QLoRA) versus Retrieval-Augmented Generation (RAG) for adapting foundation models in {role}. When is each approach preferred?",
                "difficulty": "Intermediate",
                "relevant_skills": ["LoRA / QLoRA", "Fine-Tuning vs RAG", "Model Adaptation", "Quantization"],
                "evaluation_criteria": "Evaluates understanding of knowledge recency, domain style vs factual recall, parameter efficiency, catastrophic forgetting, and operational maintenance costs.",
                "expected_concepts": ["Factual grounding vs stylistic tone", "LoRA rank and alpha adaptation", "Dynamic knowledge update latency", "Compute and inference cost trade-offs", "Catastrophic forgetting risks"]
            }
        ]
        questions_by_category["Project"] = [
            {
                "question": f"In your project '{primary_project}', walk through your LLM and vector retrieval design. What specific embedding models and chunking parameters did you benchmark, and how did you measure retrieval accuracy?",
                "difficulty": "Advanced",
                "relevant_skills": ["Embeddings Benchmarking", "Chunking Strategies", "Retrieval Evaluation"],
                "evaluation_criteria": "Assesses empirical benchmarking, embedding dimension selection, chunk overlap trade-offs, and MRR/Hit Rate measurement.",
                "expected_concepts": ["Hit Rate / MRR metrics", "Chunk size vs context dilution", "Embedding model benchmarking", "Latency overhead breakdown"]
            },
            {
                "question": f"In '{secondary_project}', how did you handle rate limits, context window overflow, and latency spikes when invoking external LLM APIs under production workloads?",
                "difficulty": "Intermediate",
                "relevant_skills": ["API Reliability", "Token Management", "Caching", "Exponential Backoff"],
                "evaluation_criteria": "Assesses semantic caching, token estimation, queueing, fallback models, and exponential backoff strategies.",
                "expected_concepts": ["Semantic cache (Redis/GPTCache)", "Exponential backoff with jitter", "Secondary fallback model tiering", "Streaming response UX"]
            },
            {
                "question": f"If you needed to migrate '{primary_project}' from cloud-hosted proprietary APIs (e.g. OpenAI/Gemini) to an on-premise open-source LLM (e.g. Llama-3/Mistral), what quantization, vLLM serving, and GPU sizing would you plan?",
                "difficulty": "Advanced",
                "relevant_skills": ["vLLM Serving", "Open-Source LLMs", "AWQ / GGUF Quantization", "GPU Memory Sizing"],
                "evaluation_criteria": "Assesses KV-cache memory estimation, PagedAttention, AWQ/GPTQ quantization impact, and tokens-per-second throughput optimization.",
                "expected_concepts": ["vLLM and PagedAttention", "KV-cache VRAM calculation", "AWQ / 4-bit quantization throughput", "Continuous batching benefits"]
            }
        ]
        questions_by_category["HR"] = [
            {
                "question": f"How do you evaluate and communicate the ethical risks of deploying generative AI models—such as bias, data leakage, and copyright concerns—to non-technical product leadership in {role}?",
                "difficulty": "Intermediate",
                "relevant_skills": ["AI Ethics", "Stakeholder Communication", "Risk Management"],
                "evaluation_criteria": "Evaluates balanced judgment between innovation and safety, clear layperson communication, and proactive risk mitigation.",
                "expected_concepts": ["STAR format", "Data privacy in model training/inference", "Clear risk matrices", "Collaborative safety guardrails"]
            },
            {
                "question": f"Describe a situation where a generative AI prototype worked well in demos but failed on edge cases during real user testing. How did you diagnose the root cause and pivot your architecture?",
                "difficulty": "Intermediate",
                "relevant_skills": ["Debugging LLMs", "Resilience", "Iterative Engineering"],
                "evaluation_criteria": "Assesses root cause diagnosis (prompt drift, distribution shift, retrieval failures) and systematic engineering fixes.",
                "expected_concepts": ["Empirical error analysis", "Systematic test dataset creation", "Prompt/retrieval isolation", "Measurable validation post-fix"]
            },
            {
                "question": f"Given the rapid pace of open-source and commercial LLM releases, how do you prevent your engineering team from chasing shiny new models at the expense of shipping core business features?",
                "difficulty": "Intermediate",
                "relevant_skills": ["Engineering Prioritization", "Pragmatism", "Technology Evaluation"],
                "evaluation_criteria": "Evaluates evaluation frameworks, benchmarking gates, and business-value focus.",
                "expected_concepts": ["Standardized benchmark suite", "ROI on model replacement", "Decoupled abstraction layers", "Delivering customer value"]
            }
        ]
        questions_by_category["Mock"] = [
            {
                "question": f"Full Generative AI Simulation: Architect a multi-tenant enterprise knowledge assistant for {role} supporting 50,000 internal users. Detail: (1) Vector database partitioning for strict tenant isolation, (2) Hybrid search and reranking, (3) Real-time token streaming, and (4) Cost-optimization strategies.",
                "difficulty": "Advanced",
                "relevant_skills": ["System Design", "Multi-Tenancy", "Enterprise RAG", "Cost Optimization"],
                "evaluation_criteria": "Comprehensive architectural review covering security metadata filtering, latency budgets, semantic caching, and token budget policies.",
                "expected_concepts": ["Tenant ID metadata pre-filtering", "Semantic caching layer", "Hybrid BM25 + dense retrieval", "vLLM streaming architecture", "Cost monitoring dashboards"]
            }
        ]

    # 3. MACHINE LEARNING ENGINEER
    elif archetype == "ml":
        questions_by_category["Technical"] = [
            {
                "question": f"Explain data leakage in machine learning pipelines for {role}. Provide three subtle real-world examples (e.g. preprocessing, target leakage, temporal leakage) and how you architect pipelines to prevent them.",
                "difficulty": "Intermediate",
                "relevant_skills": ["Data Leakage", "Feature Engineering", "Validation Strategies"],
                "evaluation_criteria": "Assesses understanding of train/test contamination, time-series split methodology, fit_transform placement, and target proxy variables.",
                "expected_concepts": ["Temporal data splitting", "Fit-transform on training fold only", "Target proxy features", "Cross-validation isolation", "Pipeline serialization (scikit-learn/MLflow)"]
            },
            {
                "question": f"How do you detect and mitigate covariate shift and concept drift in production ML models? Describe your monitoring architecture and automated retraining triggers.",
                "difficulty": "Advanced",
                "relevant_skills": ["Model Monitoring", "Concept Drift", "Evidently AI / Great Expectations", "MLOps"],
                "evaluation_criteria": "Assesses statistical distance tests (KS test, Wasserstein, PSI), ground-truth feedback loops, and safe shadow/canary retraining deployment.",
                "expected_concepts": ["Population Stability Index (PSI)", "Kolmogorov-Smirnov test", "Delayed ground truth tracking", "Shadow model deployment", "Automated rollback thresholds"]
            },
            {
                "question": f"How do you choose between tree-based ensembles (XGBoost, LightGBM) and deep neural architectures for tabular datasets with high-cardinality categorical features?",
                "difficulty": "Intermediate",
                "relevant_skills": ["Model Selection", "Tabular Learning", "Categorical Embeddings", "XGBoost/LightGBM"],
                "evaluation_criteria": "Assesses understanding of inductive biases, target encoding vs entity embeddings, training efficiency, interpretability, and missing value handling.",
                "expected_concepts": ["Target encoding vs entity embeddings", "Inductive biases on tabular manifolds", "LightGBM native categorical handling", "Inference latency and hardware requirements"]
            },
            {
                "question": f"Explain model quantization (PTQ vs QAT) and how you optimize inference latency for deep learning models deployed on resource-constrained environments in {role}.",
                "difficulty": "Advanced",
                "relevant_skills": ["Quantization", "ONNX Runtime", "TensorRT", "Inference Optimization"],
                "evaluation_criteria": "Assesses post-training quantization vs quantization-aware training, FP16/INT8 calibration, and hardware acceleration libraries.",
                "expected_concepts": ["INT8 symmetric vs asymmetric quantization", "Calibration datasets in PTQ", "Quantization-Aware Training (QAT)", "ONNX / TensorRT graph optimization"]
            }
        ]
        questions_by_category["Project"] = [
            {
                "question": f"In your project '{primary_project}', walk through your end-to-end model training and evaluation pipeline. How did you validate that your offline validation metrics correlated with production business impact?",
                "difficulty": "Advanced",
                "relevant_skills": ["Pipeline Design", "Offline-to-Online Correlation", "Validation Design"],
                "evaluation_criteria": "Assesses disciplined offline validation, metric alignment with business KPIs, and rigorous testing.",
                "expected_concepts": ["Offline metric selection (AUC-ROC, F1, Log-Loss)", "Stratified/temporal cross-validation", "Online A/B testing correlation", "Error slice analysis"]
            },
            {
                "question": f"In '{secondary_project}', what were the most significant feature engineering decisions you made? Which candidate features did you discard, and what feature importance metrics guided that choice?",
                "difficulty": "Intermediate",
                "relevant_skills": ["Feature Engineering", "SHAP Values", "Feature Selection"],
                "evaluation_criteria": "Assesses feature ablation studies, SHAP/Permutation importance, multicollinearity detection (VIF), and domain feature construction.",
                "expected_concepts": ["SHAP / TreeSHAP values", "Permutation importance vs default gain", "Variance Inflation Factor (VIF)", "Feature interaction terms"]
            },
            {
                "question": f"How did you manage model versioning, artifact tracking, and experiment reproducibility in '{primary_project}' across different runs and dataset revisions?",
                "difficulty": "Intermediate",
                "relevant_skills": ["MLflow / DVC", "Experiment Tracking", "Reproducibility"],
                "evaluation_criteria": "Assesses usage of DVC, MLflow, deterministic random seeds, containerized training environments, and metadata lineage.",
                "expected_concepts": ["DVC data hash versioning", "MLflow artifact and metric logging", "Deterministic seeds and environment lockfiles", "Model registry staging transitions"]
            }
        ]
        questions_by_category["HR"] = [
            {
                "question": f"Describe a project in {role} where a complex model was marginally more accurate than a simple baseline, but significantly more expensive to serve. How did you communicate this trade-off to engineering and business partners?",
                "difficulty": "Intermediate",
                "relevant_skills": ["Pragmatism", "Trade-Off Communication", "Production Mindset"],
                "evaluation_criteria": "Assesses engineering pragmatism (Occam's razor), cost-benefit analysis, and cross-functional clarity.",
                "expected_concepts": ["STAR format", "Inference latency and cloud cost quantification", "Complexity tax on maintenance", "Collaborative decision making"]
            },
            {
                "question": f"Tell me about a time when an ML model degraded unexpectedly in production after deployment. How did you triage the root cause under pressure?",
                "difficulty": "Intermediate",
                "relevant_skills": ["Incident Response", "Debugging Production ML", "Root Cause Analysis"],
                "evaluation_criteria": "Assesses systematic triage (data pipeline vs model vs upstream schema), fast rollback, and blameless post-mortem.",
                "expected_concepts": ["Immediate rollback/fallback activation", "Input distribution inspection", "Upstream API schema shift diagnosis", "Blameless post-mortem and permanent test guardrails"]
            },
            {
                "question": f"How do you collaborate with data engineers and backend software engineers to ensure ML models are reliably integrated into production microservices?",
                "difficulty": "Foundational",
                "relevant_skills": ["Cross-Functional Collaboration", "API Contracts", "Production Readiness"],
                "evaluation_criteria": "Assesses API contracts (schemas, latency SLAs, serialization), CI/CD handoffs, and team alignment.",
                "expected_concepts": ["Pydantic schema definitions", "Batch vs real-time feature parity", "Latency SLAs", "Shared ownership of deployment pipelines"]
            }
        ]
        questions_by_category["Mock"] = [
            {
                "question": f"Full Machine Learning Simulation: Design a real-time fraud detection service for {role} processing 10,000 events/second. Specify: (1) Low-latency feature lookup (Feature Store), (2) Streaming ingestion and model inference pipeline, (3) Asymmetric cost loss function, and (4) Canary rollout strategy.",
                "difficulty": "Advanced",
                "relevant_skills": ["System Design", "Real-Time ML", "Feature Store (Feast)", "Kafka/Redis"],
                "evaluation_criteria": "Holistic evaluation of sub-50ms inference, streaming event processing (Kafka/Flink), Feast feature store, and weighted loss optimization.",
                "expected_concepts": ["Feature store online/offline sync (Feast/Redis)", "Kafka streaming ingestion", "Asymmetric cost matrix / cost-sensitive learning", "Canary routing with shadow inference", "Alerting on anomalous fraud score distributions"]
            }
        ]

    # 4. DATA SCIENTIST
    elif archetype == "data_science":
        questions_by_category["Technical"] = [
            {
                "question": f"Explain statistical hypothesis testing, Type I and Type II errors, and statistical power in the context of designing an A/B test for {role}. How do you calculate required sample size?",
                "difficulty": "Intermediate",
                "relevant_skills": ["Hypothesis Testing", "A/B Testing", "Statistical Power", "Sample Size Calculation"],
                "evaluation_criteria": "Assesses knowledge of alpha/beta levels, minimum detectable effect (MDE), baseline variance, sample size formulas, and Bonferroni corrections for multiple testing.",
                "expected_concepts": ["Type I error (False Positive) & Type II error (False Negative)", "Statistical power (1 - Beta)", "Minimum Detectable Effect (MDE)", "Bonferroni / FDR correction", "Sample size estimation formula"]
            },
            {
                "question": f"When building a classification model on severely imbalanced data (e.g. 99.5% negative, 0.5% positive), why is ROC-AUC misleading, and which evaluation metrics and resampling strategies do you use instead?",
                "difficulty": "Intermediate",
                "relevant_skills": ["Imbalanced Classification", "Precision-Recall AUC", "Cost-Sensitive Learning", "SMOTE"],
                "evaluation_criteria": "Assesses why false positive rate remains artificially low with large negative classes, superiority of PR-AUC, threshold tuning, and focal loss/class weights.",
                "expected_concepts": ["Precision-Recall AUC vs ROC-AUC", "True Negative count skew on FPR", "Threshold tuning on cost matrix", "Class weighting vs SMOTE", "F-beta score weighting"]
            },
            {
                "question": f"Explain the difference between correlation, association, and causation. What quasi-experimental techniques (e.g. Difference-in-Differences, Instrumental Variables, Propensity Score Matching) do you use when randomized experiments are unethical or impossible?",
                "difficulty": "Advanced",
                "relevant_skills": ["Causal Inference", "Quasi-Experiments", "Propensity Score Matching", "Difference-in-Differences"],
                "evaluation_criteria": "Assesses understanding of confounding variables, counterfactual thinking, parallel trends assumption in DiD, and balance checking in PSM.",
                "expected_concepts": ["Confounding bias", "Parallel trends assumption (DiD)", "Propensity Score Matching (PSM)", "Instrumental Variables (IV) validity", "Synthetic control methods"]
            },
            {
                "question": f"How do you diagnose and handle multi-collinearity, heteroscedasticity, and non-normality of residuals in linear regression models for {role}?",
                "difficulty": "Foundational",
                "relevant_skills": ["Regression Diagnostics", "VIF", "Heteroscedasticity", "Residual Analysis"],
                "evaluation_criteria": "Assesses residual plots, Breusch-Pagan test, Variance Inflation Factor (VIF), Ridge/Lasso regularization, and Box-Cox transformations.",
                "expected_concepts": ["Variance Inflation Factor (VIF > 5)", "Residual vs fitted plots", "Breusch-Pagan / White test", "Log/Box-Cox transformations", "L2 Ridge shrinkage"]
            }
        ]
        questions_by_category["Project"] = [
            {
                "question": f"In your project '{primary_project}', what was the primary analytical hypothesis you tested? How did you validate data integrity and deal with missing values and outliers before drawing conclusions?",
                "difficulty": "Intermediate",
                "relevant_skills": ["Exploratory Data Analysis", "Data Cleaning", "Hypothesis Formulation"],
                "evaluation_criteria": "Assesses data provenance, imputation strategy rationale (KNN/MICE vs median), outlier handling (Winsorizing/IQR), and hypothesis validation.",
                "expected_concepts": ["MCAR vs MAR vs MNAR missingness", "Winsorizing / IQR bounds", "Exploratory distribution analysis", "Actionable business insight derived"]
            },
            {
                "question": f"In '{secondary_project}', walk through your experimental design or modeling methodology. What counter-factuals or sensitivity analyses did you execute to stress-test your findings?",
                "difficulty": "Advanced",
                "relevant_skills": ["Sensitivity Analysis", "Experimental Rigor", "Model Validation"],
                "evaluation_criteria": "Assesses robustness testing, bootstrapping confidence intervals, sensitivity to hyperparameters, and boundary testing.",
                "expected_concepts": ["Bootstrapped confidence intervals", "Sensitivity analysis on assumptions", "Segment-level slice evaluation", "Executive presentation of findings"]
            },
            {
                "question": f"How did you translate the quantitative model outputs in '{primary_project}' into actionable operational decisions for non-data stakeholders?",
                "difficulty": "Intermediate",
                "relevant_skills": ["Data Storytelling", "Executive Translation", "Business Impact"],
                "evaluation_criteria": "Assesses storytelling with data, translating probability scores into dollars/conversion rates, and establishing monitoring metrics.",
                "expected_concepts": ["Business metric translation (ROI/Lift)", "Actionable decision thresholds", "Interactive dashboards / reporting", "Ongoing feedback loops"]
            }
        ]
        questions_by_category["HR"] = [
            {
                "question": f"Tell me about a time when your analytical findings contradicted the intuitive opinion or preferred strategy of senior management in {role}. How did you present your analysis effectively?",
                "difficulty": "Intermediate",
                "relevant_skills": ["Data Advocacy", "Influencing Without Authority", "Stakeholder Management"],
                "evaluation_criteria": "Assesses diplomacy, grounding arguments in empirical data, acknowledging limitations, and focusing on business outcomes.",
                "expected_concepts": ["STAR format", "Objective data presentation", "Focusing on shared company goals", "Inviting collaborative sensitivity checks"]
            },
            {
                "question": f"How do you prioritize your time between deep exploratory data research and quick analytical answers when business teams demand rapid turnarounds?",
                "difficulty": "Foundational",
                "relevant_skills": ["Time Management", "Pragmatism", "Stakeholder Expectations"],
                "evaluation_criteria": "Assesses 80/20 rule application, phased delivery (MVP insight first), and managing technical debt in analysis.",
                "expected_concepts": ["80/20 exploratory threshold", "Phased insight milestones", "Setting clear SLA expectations", "Documenting caveats transparently"]
            },
            {
                "question": f"Describe a project where you realized midway through that the underlying dataset was fundamentally biased or flawed. What did you do?",
                "difficulty": "Intermediate",
                "relevant_skills": ["Integrity", "Problem Solving", "Data Validation"],
                "evaluation_criteria": "Assesses scientific integrity, immediate communication of issues, and proactive pivoting.",
                "expected_concepts": ["Early identification of sampling bias", "Transparent communication of delay", "Corrective data acquisition", "Post-mortem data validation checklist"]
            }
        ]
        questions_by_category["Mock"] = [
            {
                "question": f"Full Data Science Simulation: A subscription product experiences an 8% increase in 30-day user churn. As the Lead Data Scientist for {role}, formulate: (1) Your diagnostic exploration plan, (2) Survival analysis / hazard modeling approach, (3) Churn early-warning classification model, and (4) An intervention A/B test strategy.",
                "difficulty": "Advanced",
                "relevant_skills": ["Full Problem Solving", "Survival Analysis", "A/B Testing", "Churn Modeling"],
                "evaluation_criteria": "Holistic evaluation of analytical methodology, survival modeling (Cox Proportional Hazards), cohort slicing, and randomized intervention testing.",
                "expected_concepts": ["Cohort segmentation analysis", "Kaplan-Meier / Cox Proportional Hazards", "Feature generation on user engagement telemetry", "Uplift modeling / intervention targeting", "Controlled A/B test with pre-registered metrics"]
            }
        ]

    # 5. BACKEND DEVELOPER / SOFTWARE ENGINEER
    elif archetype in ["backend", "fullstack"]:
        questions_by_category["Technical"] = [
            {
                "question": f"How would you design a scalable REST / gRPC API for {role} supporting millions of daily requests? Explain your database indexing, connection pooling, and caching strategy.",
                "difficulty": "Intermediate",
                "relevant_skills": ["API Design", "PostgreSQL Indexing", "Connection Pooling", "Redis Caching"],
                "evaluation_criteria": "Assesses understanding of B-Tree/GIN indexing, explain analyze, pgbouncer connection pooling, cache-aside patterns, and pagination.",
                "expected_concepts": ["B-tree and composite indexing", "EXPLAIN ANALYZE query planning", "Cache-aside with TTL and invalidation", "Connection pooling (Hikari/PgBouncer)", "Keyset pagination vs offset"]
            },
            {
                "question": f"Explain database transaction isolation levels (Read Uncommitted, Read Committed, Repeatable Read, Serializable) and the concurrency anomalies they prevent (Dirty Read, Non-repeatable Read, Phantom Read, Serialization Anomaly).",
                "difficulty": "Intermediate",
                "relevant_skills": ["Database Concurrency", "ACID", "Transaction Isolation", "PostgreSQL / MySQL"],
                "evaluation_criteria": "Assesses deep relational database mechanics, MVCC, row-level locks, and optimistic vs pessimistic locking.",
                "expected_concepts": ["Dirty reads, Non-repeatable reads, Phantom reads", "MVCC implementation", "Optimistic vs Pessimistic locking (SELECT FOR UPDATE)", "Serializable snapshot isolation (SSI)"]
            },
            {
                "question": f"How do you implement distributed rate limiting and concurrency throttling across multiple backend microservice instances in {role}?",
                "difficulty": "Advanced",
                "relevant_skills": ["Rate Limiting", "Distributed Systems", "Redis", "Token Bucket Algorithm"],
                "evaluation_criteria": "Assesses Token Bucket, Leaky Bucket, Sliding Window Log in Redis with Lua scripts to prevent race conditions.",
                "expected_concepts": ["Token bucket / Sliding window counter", "Atomic Redis Lua scripts", "HTTP 429 Retry-After headers", "Distributed locks with Redlock / lease times"]
            },
            {
                "question": f"How do you architect asynchronous task execution, background worker queues, and dead-letter queue (DLQ) retry policies for high-volume jobs?",
                "difficulty": "Intermediate",
                "relevant_skills": ["Async Processing", "Celery / BullMQ", "Message Queues", "Idempotency"],
                "evaluation_criteria": "Assesses message broker integration (RabbitMQ/SQS), idempotency keys, exponential retry backoff, and DLQ alerting.",
                "expected_concepts": ["Idempotency keys on consumer processing", "Exponential backoff with jitter", "Dead Letter Queue (DLQ) triage", "At-least-once delivery guarantees"]
            }
        ]
        questions_by_category["Project"] = [
            {
                "question": f"In your project '{primary_project}', walk through the core backend architecture and database schema. What were the hardest latency or concurrency bottlenecks you encountered?",
                "difficulty": "Advanced",
                "relevant_skills": ["System Architecture", "Database Schema", "Bottleneck Triage"],
                "evaluation_criteria": "Assesses practical architecture choices, normalized vs denormalized schemas, query optimization, and latency profiling.",
                "expected_concepts": ["Database schema normalization vs performance", "N+1 query elimination", "Profiling tools and benchmarks", "Microservice / modular monolith trade-offs"]
            },
            {
                "question": f"Reflecting on '{secondary_project}', how did you handle user authentication, authorization, and secure session management?",
                "difficulty": "Intermediate",
                "relevant_skills": ["Authentication", "JWT / OAuth2", "Security", "RBAC"],
                "evaluation_criteria": "Assesses password hashing (bcrypt/argon2), JWT signing, refresh token rotation, and Role-Based Access Control (RBAC).",
                "expected_concepts": ["Bcrypt / Argon2 password hashing", "Short-lived JWTs with refresh token rotation", "RBAC middleware / dependency injection", "Protection against CSRF and XSS"]
            },
            {
                "question": f"If '{primary_project}' experienced a sudden 50x surge in concurrent traffic, what component would fail first, and how would you redesign it for high availability?",
                "difficulty": "Advanced",
                "relevant_skills": ["Scalability", "High Availability", "Load Balancing", "Failover"],
                "evaluation_criteria": "Assesses database connection saturation, stateless service replication, read replicas, and caching layers.",
                "expected_concepts": ["Stateless horizontal service scaling", "Read-replica database distribution", "Caching hot database queries", "Graceful degradation / circuit breakers"]
            }
        ]
        questions_by_category["HR"] = [
            {
                "question": f"Describe a situation in {role} where you inherited legacy code or technical debt that caused frequent bugs. How did you balance refactoring with ongoing feature requests?",
                "difficulty": "Intermediate",
                "relevant_skills": ["Tech Debt Management", "Refactoring", "Prioritization"],
                "evaluation_criteria": "Assesses incremental refactoring (Strangler Fig pattern), unit test safety nets, and business value alignment.",
                "expected_concepts": ["STAR format", "Automated test coverage before refactoring", "Strangler Fig / incremental migration", "Transparent communication with product managers"]
            },
            {
                "question": f"Tell me about a high-severity production outage or critical bug you were responsible for resolving. How did you diagnose the issue and communicate during the incident?",
                "difficulty": "Intermediate",
                "relevant_skills": ["Incident Management", "Production Debugging", "Post-Mortem Culture"],
                "evaluation_criteria": "Assesses calm under pressure, systematic log/metrics analysis, status page communication, and blameless post-mortem.",
                "expected_concepts": ["Immediate rollback / containment", "Log correlation (Datadog/Prometheus)", "Stakeholder updates", "Blameless post-mortem and regression prevention"]
            },
            {
                "question": f"How do you conduct thorough code reviews for your engineering peers to ensure code quality without causing friction or slowing down delivery?",
                "difficulty": "Foundational",
                "relevant_skills": ["Code Review", "Team Collaboration", "Constructive Feedback"],
                "evaluation_criteria": "Assesses constructive commenting, automated linting/CI checks, differentiating nits from blocking bugs, and knowledge sharing.",
                "expected_concepts": ["Automating style enforcement via CI", "Separating architectural blockers from non-blocking nits", "Empathetic code feedback", "Pair programming on complex changes"]
            }
        ]
        questions_by_category["Mock"] = [
            {
                "question": f"Full Backend Simulation: Design an idempotent payment processing and order fulfillment API for {role} handling flash-sale volumes. Detail: (1) Idempotency key implementation, (2) Two-phase commit vs Saga pattern for distributed transactions, (3) Optimistic inventory deduction, and (4) Webhook delivery guarantees.",
                "difficulty": "Advanced",
                "relevant_skills": ["System Design", "Distributed Transactions", "Saga Pattern", "Idempotency"],
                "evaluation_criteria": "Comprehensive architectural walkthrough of atomic transactions, Saga orchestrators, outbox pattern, and exponential retry webhooks.",
                "expected_concepts": ["Idempotency key storage in Redis/DB with unique constraints", "Saga pattern with compensating transactions", "Transactional outbox pattern for events", "Optimistic concurrency versioning (version column)", "HMAC signed webhooks with exponential retry"]
            }
        ]

    # 6. GENERIC / CUSTOM ROLE ARCHETYPE
    else:
        questions_by_category["Technical"] = [
            {
                "question": f"In your role as {role}, what core professional methodologies, industry standards, and analytical frameworks do you systematically apply to achieve high-quality outcomes?",
                "difficulty": "Intermediate",
                "relevant_skills": top_skills or [role, "Domain Methodology", "Analysis"],
                "evaluation_criteria": f"Evaluates mastery of core principles, industry frameworks, and structured problem-solving specific to {role}.",
                "expected_concepts": ["Standard industry methodologies", "Quality control and validation", "Domain terminology accuracy", "Risk mitigation techniques", "Performance measurement"]
            },
            {
                "question": f"How do you identify, analyze, and mitigate critical operational and domain-specific risks within {role} under resource or time constraints?",
                "difficulty": "Advanced",
                "relevant_skills": [role, "Risk Management", "Operational Excellence"],
                "evaluation_criteria": f"Assesses structured risk identification, prioritization matrices, contingency planning, and stakeholder advisory for {role}.",
                "expected_concepts": ["Root cause analysis", "Severity vs likelihood matrix", "Contingency protocols", "Cross-functional impact analysis", "Documentation and tracking"]
            },
            {
                "question": f"What quantitative metrics, KPIs, or qualitative benchmarks do you track to evaluate the success and efficiency of your deliverables as {role}?",
                "difficulty": "Foundational",
                "relevant_skills": [role, "KPI Tracking", "Performance Metrics", "Deliverable Quality"],
                "evaluation_criteria": f"Assesses understanding of outcome metrics versus output metrics, SLA adherence, and deliverable excellence for {role}.",
                "expected_concepts": ["Outcome vs output metrics", "Efficiency indicators", "Benchmarking standards", "Continuous quality feedback", "Executive reporting"]
            },
            {
                "question": f"Explain how emerging technologies, regulatory shifts, or modern digital tools are impacting the responsibilities and workflow of {role}.",
                "difficulty": "Intermediate",
                "relevant_skills": [role, "Industry Trends", "Digital Tools", "Adaptability"],
                "evaluation_criteria": f"Evaluates forward-looking domain perspective, modern tool adoption, and adaptability for {role}.",
                "expected_concepts": ["Emerging industry trends", "Modern software/tool adoption", "Workflow efficiency gains", "Compliance with new standards", "Future-readiness"]
            }
        ]
        questions_by_category["Project"] = [
            {
                "question": f"In your project '{primary_project}', walk through the core execution strategy and key decisions you made for {role}. What were the most demanding trade-offs or constraints you navigated?",
                "difficulty": "Advanced",
                "relevant_skills": [role, "Project Leadership", "Trade-Off Analysis"],
                "evaluation_criteria": f"Assesses authentic project execution, critical decision-making, stakeholder alignment, and measurable results for {role}.",
                "expected_concepts": ["Initial project scope and objectives", "Key execution decisions", "Navigating resource or time constraints", "Measurable outcomes achieved"]
            },
            {
                "question": f"Reflecting on '{secondary_project}', how did you measure success, validate deliverable accuracy, and incorporate user or stakeholder feedback?",
                "difficulty": "Intermediate",
                "relevant_skills": [role, "Validation", "Stakeholder Feedback", "Quality Assurance"],
                "evaluation_criteria": f"Assesses quality assurance, feedback loops, and iterative refinement within {role}.",
                "expected_concepts": ["Validation mechanisms", "User/client feedback integration", "Iterative milestone delivery", "Post-implementation review"]
            },
            {
                "question": f"If you had to execute '{primary_project}' again with twice the scope or half the timeline, what strategic changes would you implement in your workflow for {role}?",
                "difficulty": "Intermediate",
                "relevant_skills": [role, "Strategic Planning", "Optimization", "Process Improvement"],
                "evaluation_criteria": f"Assesses reflective learning, process optimization, delegation, and strategic resource allocation.",
                "expected_concepts": ["Process automation or streamlining", "Scope prioritization", "Resource reallocation", "Risk mitigation lessons"]
            }
        ]
        questions_by_category["HR"] = [
            {
                "question": f"Tell me about a time as {role} when you faced competing deadlines from different stakeholders. How did you prioritize deliverables and manage expectations?",
                "difficulty": "Intermediate",
                "relevant_skills": ["Time Management", "Stakeholder Communication", "Prioritization"],
                "evaluation_criteria": "Assesses structured prioritization (Eisenhower matrix, business value), transparent communication, and boundary management.",
                "expected_concepts": ["STAR format", "Value-based prioritization", "Transparent stakeholder updates", "Delivering committed quality on time"]
            },
            {
                "question": f"Describe a situation where a project or initiative you were leading for {role} encountered an unexpected roadblock. How did you keep the team aligned and pivot toward a solution?",
                "difficulty": "Intermediate",
                "relevant_skills": ["Problem Solving", "Resilience", "Leadership"],
                "evaluation_criteria": "Assesses resilience, root cause diagnosis, team morale maintenance, and constructive problem-solving.",
                "expected_concepts": ["Rapid problem diagnosis", "Collaborative solution brainstorming", "Clear role assignment", "Successful milestone delivery"]
            },
            {
                "question": f"Why are you specifically passionate about advancing your career as a {role}, and what personal strengths distinguish your approach in this field?",
                "difficulty": "Foundational",
                "relevant_skills": ["Self-Awareness", "Career Alignment", "Professional Motivation"],
                "evaluation_criteria": f"Assesses genuine enthusiasm, clear career alignment, self-awareness, and articulation of unique value proposition for {role}.",
                "expected_concepts": ["Authentic career narrative", "Core distinguishing strengths", "Commitment to mastery in the domain", "Value contributed to organizations"]
            }
        ]
        questions_by_category["Mock"] = [
            {
                "question": f"Full Professional Simulation: You are appointed as the Lead {role} on a flagship mission-critical initiative with high executive visibility, cross-functional dependencies, and strict delivery milestones. Walk through your first 30-day roadmap, risk management framework, and stakeholder communication strategy.",
                "difficulty": "Advanced",
                "relevant_skills": ["Strategic Leadership", "Roadmap Planning", "Risk Management", "Executive Communication"],
                "evaluation_criteria": f"Comprehensive evaluation of leadership, structured planning, dependency management, and executive reporting for {role}.",
                "expected_concepts": ["30-day assessment & alignment plan", "Key dependency mapping", "Proactive risk mitigation matrix", "Regular executive dashboard cadence", "Early measurable win delivery"]
            }
        ]

    # Convert to InterviewQuestion objects with unique IDs
    target_category = category if category in questions_by_category else "Technical"
    raw_list = questions_by_category.get(target_category, questions_by_category.get("Technical", []))
    
    questions: List[InterviewQuestion] = []
    clean_role_slug = re.sub(r'[^a-zA-Z0-9]', '-', role.lower())[:15]
    
    for idx, item in enumerate(raw_list):
        q_id = f"q-{clean_role_slug}-{target_category.lower()}-{idx + 1}"
        questions.append(InterviewQuestion(
            question_id=q_id,
            question=item["question"],
            category=target_category,
            target_role=role,
            difficulty=item.get("difficulty", "Intermediate"),
            relevant_skills=item.get("relevant_skills", [role]),
            evaluation_criteria=item.get("evaluation_criteria", f"Evaluates domain competence in {role}"),
            expected_concepts=item.get("expected_concepts", [role])
        ))

    return questions


# =========================================================================
# GEMINI DYNAMIC QUESTION GENERATION
# =========================================================================

def generate_role_questions_with_gemini(
    role: str,
    category: str,
    projects: List[Dict[str, Any]],
    skills: List[str],
    experience_level: str = "Mid-Level",
    job_description: Optional[str] = None,
    previously_answered: Optional[List[str]] = None
) -> List[InterviewQuestion]:
    """
    Invokes Gemini to generate completely unique, role-aware questions tailored
    to the candidate's actual projects, skills, experience, and target job role.
    Falls back gracefully to the domain archetype generator on any error.
    """
    clean_role = _normalize_role(role)
    clean_category = category if category in ["Technical", "Project", "HR", "Mock"] else "Technical"

    # Summarize real user projects
    project_context = ""
    if projects:
        lines = []
        for p in projects[:3]:
            p_name = p.get("name", "Project")
            p_desc = p.get("description", "")
            p_tech = ", ".join(p.get("technologies", []))
            lines.append(f"- Project '{p_name}': {p_desc} (Technologies/Tools: {p_tech})")
        project_context = "\n".join(lines)
    else:
        project_context = "No specific projects recorded yet in candidate profile."

    skills_context = ", ".join(skills[:15]) if skills else "Relevant domain skills"
    prev_context = "\n".join([f"- {q}" for q in (previously_answered or [])[:5]])

    prompt = f"""
You are an expert hiring manager and technical interviewer conducting an interview for the target role: "{clean_role}".

Generate 4 high-quality, distinctive interview questions for the "{clean_category}" category.

### CANDIDATE CONTEXT
- Target Job Role: {clean_role}
- Experience Level: {experience_level}
- Extracted Skills: {skills_context}
- Candidate Actual Projects:
{project_context}
- Optional Job Description: {job_description or "General industry hiring expectations for " + clean_role}
- Previously Answered Questions to Avoid:
{prev_context if prev_context else "None"}

### CATEGORY SPECIFIC INSTRUCTIONS:
- Category is "{clean_category}":
  * If "Technical": Questions MUST strictly test the core domain competencies, foundational principles, and responsibilities of the target role "{clean_role}". For example, for "Data Scientist": questions MUST test statistical hypothesis testing, experimental A/B testing, regression diagnostics, data leakage, and metrics. For "Legal Advisor": questions MUST test contract law, indemnification, liability caps, compliance, and regulatory risk. For "Backend Developer": questions MUST test REST/gRPC API scalability, database indexing, transaction isolation, caching, and concurrency. For "AI Engineer": questions MUST test RAG, embeddings, vector indexing, hallucination mitigation, and agent architectures. Never ask RAG or vector retrieval questions for Data Scientist, Backend Developer, or Legal Advisor!
  * If "Project": Ground questions in the candidate's actual projects listed above (refer to the project name directly). Ask about architectural trade-offs, constraints, validation, latency, and measurable results. DO NOT invent fake projects that are not listed above! If no projects are listed, ask practical scenario questions about a project appropriate for {clean_role}.
  * If "HR": Generate role-appropriate behavioral and leadership questions (e.g. conflict resolution, communicating complex constraints to stakeholders, navigating tight deadlines in {clean_role}).
  * If "Mock": Generate a multi-part, coherent real-world simulation scenario testing end-to-end practical mastery in {clean_role}.

Return ONLY valid JSON matching this exact structure:
{{
    "questions": [
        {{
            "question_id": "q-1",
            "question": "Full question text here",
            "category": "{clean_category}",
            "target_role": "{clean_role}",
            "difficulty": "Intermediate",
            "relevant_skills": ["Skill 1", "Skill 2"],
            "evaluation_criteria": "Specific criteria an evaluator should use to grade the candidate's answer",
            "expected_concepts": ["Concept A", "Concept B", "Concept C"]
        }}
    ]
}}
Generate exactly 4 questions. Difficulty should be one of "Foundational", "Intermediate", or "Advanced".
"""

    try:
        raw_json = generate_json(prompt)
        raw_questions = raw_json.get("questions", [])
        if not raw_questions or not isinstance(raw_questions, list):
            raise ValueError("Gemini returned invalid questions structure")

        clean_role_slug = re.sub(r'[^a-zA-Z0-9]', '-', clean_role.lower())[:15]
        parsed_questions: List[InterviewQuestion] = []

        for idx, item in enumerate(raw_questions):
            q_text = str(item.get("question", "")).strip()
            if not q_text or len(q_text) < 10:
                continue

            q_id = f"q-{clean_role_slug}-{clean_category.lower()}-{uuid.uuid4().hex[:6]}"
            parsed_questions.append(InterviewQuestion(
                question_id=q_id,
                question=q_text,
                category=clean_category,
                target_role=clean_role,
                difficulty=item.get("difficulty") if item.get("difficulty") in ["Foundational", "Intermediate", "Advanced"] else "Intermediate",
                relevant_skills=item.get("relevant_skills") or [clean_role],
                evaluation_criteria=item.get("evaluation_criteria") or f"Evaluates competency in {clean_role}",
                expected_concepts=item.get("expected_concepts") or [clean_role]
            ))

        if len(parsed_questions) >= 2:
            return parsed_questions

        # Fallback if too few valid questions
        logger.warning(f"Gemini returned only {len(parsed_questions)} questions, supplementing with fallback")
        return generate_fallback_questions(clean_role, clean_category, projects, skills, experience_level)

    except Exception as e:
        logger.warning(f"Gemini question generation failed for role '{clean_role}': {e}. Using high-quality domain fallback.")
        return generate_fallback_questions(clean_role, clean_category, projects, skills, experience_level)


# =========================================================================
# ROLE-SPECIFIC ANSWER EVALUATION ENGINE
# =========================================================================

def evaluate_interview_answer_ai(
    role: str,
    category: str,
    question: str,
    answer: str,
    expected_concepts: Optional[List[str]] = None,
    evaluation_criteria: Optional[str] = None
) -> InterviewFeedbackData:
    """
    Evaluates candidate answer against the actual question and role-appropriate criteria.
    Never evaluates a Legal Advisor using a generic software technical rubric!
    """
    clean_role = _normalize_role(role)
    archetype = _classify_role_archetype(clean_role)
    concepts_list = expected_concepts or []
    criteria_text = evaluation_criteria or f"Evaluate domain depth, clarity, and practical mastery in {clean_role}"

    prompt = f"""
You are an expert interview evaluator specializing in hiring for the role of "{clean_role}".
You are evaluating a candidate's answer for an interview question in the "{category}" category.

Candidate Target Role: {clean_role} (Archetype: {archetype})
Interview Category: {category}
Question:
{question}

Expected Concepts to Address:
{', '.join(concepts_list) if concepts_list else 'Core domain competencies, standard practices, and methodology relevant to ' + clean_role}

Evaluation Criteria:
{criteria_text}

Candidate Submitted Answer:
\"\"\"{answer}\"\"\"

### ROLE-SPECIFIC EVALUATION GUIDANCE:
Evaluate the answer specifically for the role of "{clean_role}":
- If this is a legal role (e.g. Legal Advisor): Evaluate legal reasoning, jurisdictional precision, issue identification, statutory/contractual principles, liability allocation, and risk mitigation.
- If this is a software/AI/ML engineering role: Evaluate technical correctness, architectural trade-offs, algorithms, latency, edge cases, and code/system design.
- If this is a data science/analytics role: Evaluate statistical rigor, metric selection, data validity, experimental design, and actionable business insights.
- If this is a finance or product role: Evaluate financial logic, commercial acumen, prioritization frameworks, and stakeholder alignment.
- If this is an HR/Behavioral question: Evaluate delivery structure (STAR method), leadership, self-awareness, conflict resolution, and cultural alignment.

Return ONLY a valid JSON object matching this exact schema:
{{
    "overall_score": 85,
    "technical_correctness": 85,
    "answer_completeness": 80,
    "relevance": 90,
    "communication_clarity": 85,
    "practical_depth": 80,
    "rubric_breakdown": {{
        "domain_competence": "Specific critique of domain/technical knowledge displayed",
        "methodology_and_depth": "Critique of practical depth, trade-offs, or analysis",
        "communication_and_structure": "Critique of clarity and answer organization"
    }},
    "strengths": [
        "Identified key domain factors accurately",
        "Structured points clearly with sound reasoning"
    ],
    "concepts_covered": [
        "Concept 1 mentioned and explained well",
        "Concept 2 addressed effectively"
    ],
    "missing_concepts": [
        "Omitted concept X",
        "Did not discuss trade-off or risk Y"
    ],
    "suggested_improvements": "Actionable, concrete suggestions to elevate this answer to top-tier quality.",
    "model_answer_outline": "A high-scoring model answer outline illustrating how a senior candidate in this role would answer.",
    "summary": "Concise 2-3 sentence assessment summary tailored to {clean_role}."
}}
Score integers must be between 0 and 100. Be honest and rigorous. Do not give 100 to brief or superficial answers.
"""

    try:
        raw_feedback = generate_json(prompt)
        
        # Validate scores
        overall = int(raw_feedback.get("overall_score", 80))
        tech = int(raw_feedback.get("technical_correctness", overall))
        complete = int(raw_feedback.get("answer_completeness", overall))
        relev = int(raw_feedback.get("relevance", overall))
        comm = int(raw_feedback.get("communication_clarity", 80))
        depth = int(raw_feedback.get("practical_depth", 75))

        return InterviewFeedbackData(
            technical_correctness=max(0, min(100, tech)),
            answer_completeness=max(0, min(100, complete)),
            relevance=max(0, min(100, relev)),
            communication_clarity=max(0, min(100, comm)),
            practical_depth=max(0, min(100, depth)),
            overall_score=max(0, min(100, overall)),
            rubric_breakdown=raw_feedback.get("rubric_breakdown") or {
                "domain_competence": f"Evaluated against {clean_role} standards.",
                "methodology_and_depth": "Practical reasoning and depth.",
                "communication_and_structure": "Clarity of delivery."
            },
            strengths=raw_feedback.get("strengths") or ["Addresses the core question directly."],
            concepts_covered=raw_feedback.get("concepts_covered") or [],
            missing_concepts=raw_feedback.get("missing_concepts") or ["Consider citing specific measurable outcomes or trade-offs."],
            suggested_improvements=raw_feedback.get("suggested_improvements") or "Structure your answer using concrete examples and quantifiable metrics.",
            model_answer_outline=raw_feedback.get("model_answer_outline") or f"A top-tier answer in {clean_role} addresses the core principles, acknowledges operational trade-offs, and details measurable outcomes.",
            summary=raw_feedback.get("summary") or f"Answer evaluated against {clean_role} standards."
        )

    except Exception as e:
        logger.warning(f"Gemini answer evaluation failed: {e}. Executing role-aware heuristic fallback.")
        return _heuristic_role_evaluation(clean_role, category, question, answer, concepts_list)


def _heuristic_role_evaluation(
    role: str,
    category: str,
    question: str,
    answer: str,
    expected_concepts: List[str]
) -> InterviewFeedbackData:
    """
    Role-aware heuristic evaluation fallback when AI API is unavailable.
    Inspects answer length, concept coverage, and structure.
    """
    words = answer.split()
    word_count = len(words)
    lower_ans = answer.lower()

    # Calculate concept matches
    covered: List[str] = []
    missing: List[str] = []

    for c in expected_concepts:
        # Check if concept words appear in answer
        c_keywords = [w.lower() for w in c.split() if len(w) > 3]
        if any(kw in lower_ans for kw in c_keywords):
            covered.append(c)
        else:
            missing.append(c)

    # Base scoring on depth & concept coverage
    base_score = 60
    if word_count > 30:
        base_score += 10
    if word_count > 70:
        base_score += 10
    if word_count > 120:
        base_score += 5

    coverage_ratio = len(covered) / max(1, len(expected_concepts)) if expected_concepts else 0.7
    concept_bonus = int(coverage_ratio * 15)
    overall = min(92, max(45, base_score + concept_bonus))

    archetype = _classify_role_archetype(role)
    if archetype == "legal":
        strengths = [
            f"Demonstrates practical familiarity with legal reasoning in {role}",
            "Directly engages with the contractual/compliance issue presented"
        ]
        improvements = "Include specific statutory citations, jurisdictional caveats, and clear liability limitation mechanisms."
        model_outline = f"1. Identify primary legal issues and governing jurisdiction. 2. Analyze contractual risk allocation (indemnities, caps, carve-outs). 3. Propose balanced counter-language protecting {role} interests."
    elif archetype in ["genai", "ml"]:
        strengths = [
            f"Highlights core algorithmic and system concepts relevant to {role}",
            "Addresses technical components directly"
        ]
        improvements = "Detail specific latency benchmarks, error metrics (e.g. ROUGE, PR-AUC), and production fallback safeguards."
        model_outline = f"1. High-level architecture overview. 2. Component design (chunking, retrieval, embeddings, model). 3. Latency, evaluation metrics, and failure recovery in {role}."
    elif archetype == "data_science":
        strengths = [
            f"Applies analytical and quantitative framing appropriate for {role}",
            "Considers data-driven implications"
        ]
        improvements = "Detail specific statistical tests (e.g. p-values, power), confidence intervals, and sensitivity checks."
        model_outline = f"1. Hypothesis definition and experimental design. 2. Metric selection and bias mitigation. 3. Statistical validation and operational business recommendations for {role}."
    else:
        strengths = [
            f"Articulates a clear perspective aligned with {role} responsibilities",
            "Answers the prompt directly and logically"
        ]
        improvements = "Use the STAR framework (Situation, Task, Action, Result) to provide concrete measurable evidence."
        model_outline = f"1. Contextualize the challenge in {role}. 2. Walk through specific methodology and trade-offs. 3. Detail measurable business outcomes and lessons learned."

    return InterviewFeedbackData(
        technical_correctness=overall,
        answer_completeness=max(45, overall - 4),
        relevance=min(95, overall + 5),
        communication_clarity=min(90, max(50, 65 + (word_count // 10))),
        practical_depth=max(40, overall - 6),
        overall_score=overall,
        rubric_breakdown={
            "domain_competence": f"Demonstrates solid foundational alignment with {role}.",
            "methodology_and_depth": "Presents structured concepts; expanding on edge cases will increase impact.",
            "communication_and_structure": "Clear delivery and logical organization."
        },
        strengths=strengths,
        concepts_covered=covered if covered else ["Identified primary problem context"],
        missing_concepts=missing if missing else ["Cite specific performance metrics or trade-off comparisons"],
        suggested_improvements=improvements,
        model_answer_outline=model_outline,
        summary=f"Competent and structured response for {role}. Incorporating the missing concepts and specific trade-offs will make this top-tier."
    )


# =========================================================================
# CACHING & USER PERSISTENCE HELPERS
# Role-aware & category-aware caching in user.profile_data
# =========================================================================

def get_cached_questions(user: User, role: str, category: str) -> Optional[List[InterviewQuestion]]:
    """
    Retrieves role-specific and category-specific cached questions from user.profile_data.
    Ensures that questions for 'Legal Advisor' can never be returned for 'AI Engineer'!
    """
    profile_data = user.profile_data or {}
    interview_prep = profile_data.get("interview_prep") or {}
    
    role_key = role.strip().lower()
    cat_key = category.strip().lower()
    cache_key = f"{role_key}_{cat_key}"

    cached_entry = interview_prep.get(cache_key)
    if not cached_entry or not isinstance(cached_entry, dict):
        return None

    # Verify role match explicitly
    cached_role = (cached_entry.get("target_role") or "").strip().lower()
    if cached_role != role_key:
        return None

    raw_list = cached_entry.get("questions") or []
    if not raw_list:
        return None

    try:
        return [InterviewQuestion(**q) for q in raw_list]
    except Exception as e:
        logger.warning(f"Error parsing cached questions: {e}")
        return None


def save_cached_questions(user: User, role: str, category: str, questions: List[InterviewQuestion]):
    """
    Saves role-specific and category-specific questions in user.profile_data.
    """
    profile_data = dict(user.profile_data or {})
    interview_prep = dict(profile_data.get("interview_prep") or {})

    role_key = role.strip().lower()
    cat_key = category.strip().lower()
    cache_key = f"{role_key}_{cat_key}"

    interview_prep[cache_key] = {
        "target_role": role,
        "category": category,
        "questions": [q.model_dump() for q in questions],
        "cached_at": datetime.utcnow().isoformat()
    }

    profile_data["interview_prep"] = interview_prep
    user.profile_data = profile_data
