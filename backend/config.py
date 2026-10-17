import os
import json
from pathlib import Path
from typing import Dict, Any

BASE_DIR = Path(__file__).resolve().parent.parent
SETTINGS_FILE = BASE_DIR / "settings.json"
RESUMES_DIR = BASE_DIR / "resumes"
DEFAULT_RESUME_NAME = "HarshKumarSingh_Resume.pdf"

DEFAULT_SETTINGS: Dict[str, Any] = {
    "sender_name": "Harsh Kumar Singh",
    "sender_email": "harsh19singh98@gmail.com",
    "sender_phone": "",
    "linkedin_url": "",
    "smtp_server": "smtp.gmail.com",
    "smtp_port": 587,
    "gmail_app_password": "",
    "current_company": "Software Engineering",
    "current_experience": "1+ years",
    "education": "B.Tech in Computer Science",
    "certifications": [],
    "core_skills": [
        "Python",
        "FastAPI",
        "JavaScript",
        "React.js",
        "Node.js",
        "SQL",
        "Generative AI",
        "LLMs",
        "RAG",
        "LangChain",
        "Cloud Technologies",
        "API Integration"
    ],
    "resume_filename": DEFAULT_RESUME_NAME,
    "default_job_role": "Software Engineer"
}

def load_settings() -> Dict[str, Any]:
    settings = DEFAULT_SETTINGS.copy()
    if SETTINGS_FILE.exists():
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
                settings.update(saved)
        except Exception as e:
            print(f"Error reading {SETTINGS_FILE}: {e}")

    # Check /tmp/settings.json on Vercel for any runtime updates
    if os.getenv("VERCEL"):
        tmp_settings = Path("/tmp/settings.json")
        if tmp_settings.exists():
            try:
                with open(tmp_settings, "r", encoding="utf-8") as f:
                    saved = json.load(f)
                    settings.update(saved)
            except Exception as e:
                print(f"Error reading {tmp_settings}: {e}")

    env_pwd = os.getenv("GMAIL_APP_PASSWORD")
    if env_pwd:
        settings["gmail_app_password"] = env_pwd

    env_email = os.getenv("SENDER_EMAIL")
    if env_email:
        settings["sender_email"] = env_email

    return settings

def save_settings(new_settings: Dict[str, Any]) -> Dict[str, Any]:
    current = load_settings()
    current.update(new_settings)
    target_file = Path("/tmp/settings.json") if os.getenv("VERCEL") else SETTINGS_FILE
    target_file.parent.mkdir(parents=True, exist_ok=True)
    with open(target_file, "w", encoding="utf-8") as f:
        json.dump(current, f, indent=2)
    return current

def get_resume_path() -> Path:
    settings = load_settings()
    filename = settings.get("resume_filename", DEFAULT_RESUME_NAME)
    
    if os.getenv("VERCEL"):
        tmp_resume = Path("/tmp/resumes") / filename
        if tmp_resume.exists():
            return tmp_resume

    resume_path = RESUMES_DIR / filename
    if not resume_path.exists():
        pdfs = list(RESUMES_DIR.glob("*.pdf"))
        if pdfs:
            return pdfs[0]
    return resume_path
