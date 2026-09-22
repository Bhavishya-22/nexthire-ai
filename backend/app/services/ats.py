import re
from typing import Dict, Any


def evaluate_ats_compatibility(resume_text: str) -> Dict[str, Any]:
    """
    Evaluates ATS readability, structural sections, contact info,
    and measurable achievements.
    """
    text = resume_text.lower()
    feedback = []
    score = 50

    # 1. Contact info check
    has_email = bool(re.search(r"[\w\.-]+@[\w\.-]+\.\w+", resume_text))
    has_phone = bool(re.search(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", resume_text))

    if has_email and has_phone:
        score += 15
        feedback.append("Valid contact information (email and phone) detected.")
    elif has_email or has_phone:
        score += 8
        feedback.append("Partial contact information detected.")
    else:
        score -= 10
        feedback.append("Missing clear email or phone contact details.")

    # 2. Key section headings check
    sections = {
        "education": ["education", "academic", "university", "college", "degree"],
        "skills": ["skills", "technical skills", "technologies", "competencies"],
        "experience": ["experience", "employment", "work history", "internship", "projects"],
    }

    found_sections = 0
    for _, keywords in sections.items():
        if any(kw in text for kw in keywords):
            found_sections += 1

    if found_sections == 3:
        score += 20
        feedback.append("Key resume sections (Skills, Experience, Education) are well-organized.")
    elif found_sections >= 2:
        score += 10
        feedback.append("Most essential sections found, but consider standardizing section headers.")
    else:
        feedback.append("Missing standard ATS section headings.")

    # 3. Measurable metrics/quantification check (numbers, percentages)
    quantifiable_matches = re.findall(r"\b\d+([.,]\d+)?%?\b", resume_text)
    if len(quantifiable_matches) >= 5:
        score += 15
        feedback.append("Strong usage of quantifiable metrics and achievements.")
    elif len(quantifiable_matches) >= 2:
        score += 8
        feedback.append("Some quantifiable achievements present; adding more metrics will boost ATS impact.")
    else:
        feedback.append("Add measurable outcomes (e.g. percentages, performance gains, metrics).")

    final_score = max(0, min(100, score))

    return {
        "score": final_score,
        "feedback": feedback,
        "has_email": has_email,
        "has_phone": has_phone,
        "quantifiable_count": len(quantifiable_matches),
    }
