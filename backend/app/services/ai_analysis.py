from app.services.pdf_reader import extract_text
import google.generativeai as genai
import os


genai.configure(
api_key=os.getenv(
"GEMINI_API_KEY"
)
)



model=genai.GenerativeModel(
"gemini-1.5-flash"
)



def analyze_resume(text):


    prompt=f"""

Analyze this resume.

Give:

1. Skills
2. Experience
3. Projects
4. Missing skills
5. Resume score


Resume:

{text}

"""


    response=model.generate_content(
        prompt
    )


    return response.text