import re
from typing import Dict, Any, Optional, List
from backend.config import load_settings

# Domain to clean company name mapping
KNOWN_DOMAINS = {
    "knackconsulting.com": "Knack Consulting",
    "sgurrenergy.com": "SgurrEnergy",
    "ust.com": "UST",
    "northern-base.com": "Northern Base",
    "firsthive.com": "FirstHive",
    "gammaedge.io": "GammaEdge Technologies",
    "gammaedge.com": "GammaEdge Technologies",
    "google.com": "Google",
    "microsoft.com": "Microsoft",
    "amazon.com": "Amazon",
    "tcs.com": "TCS",
    "infosys.com": "Infosys",
    "wipro.com": "Wipro",
    "accenture.com": "Accenture",
    "cognizant.com": "Cognizant",
    "capgemini.com": "Capgemini",
    "deloitte.com": "Deloitte"
}

ROLE_KEYWORDS = [
    ("Full Stack Developer", ["full stack", "fullstack", "react.js and java", "java and react"]),
    ("Gen AI Engineer", ["gen ai", "generative ai", "llm", "rag architecture", "agentic ai"]),
    ("Data Science Engineer", ["data science", "data scientist", "machine learning", "ml models"]),
    ("Python Developer", ["python developer", "python engineer", "fastapi", "flask"]),
    ("Backend Developer", ["backend developer", "backend engineer", "api development"]),
    ("Frontend Developer", ["frontend developer", "frontend engineer", "react developer"]),
    ("Software Engineer", ["software engineer", "software developer", "sde"])
]

GENERIC_EMAIL_NAMES = {
    "careers", "jobs", "hiring", "hr", "business", "contact", "info", "apply", 
    "recruitment", "talent", "acquisition", "talentacquisition", "admin", "support", 
    "people", "team", "campus", "resume", "resumes", "cv", "office", "mail",
    "engineering", "dev", "developer", "developers"
}

PUBLIC_EMAIL_PROVIDERS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "live.com", 
    "icloud.com", "aol.com", "rediffmail.com", "protonmail.com", "msn.com", "ymail.com"
}

def extract_all_emails(text: str) -> List[str]:
    cleaned = re.sub(r'mailto:', '', text, flags=re.IGNORECASE)
    matches = re.findall(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9_.-]+\.[a-zA-Z0-9-.]+', cleaned)
    unique_emails = []
    for m in matches:
        cleaned_m = m.strip(".").strip().lower()
        if not any(dummy in cleaned_m for dummy in ["example.com", "yourdomain.com", "noreply", "no-reply"]):
            if cleaned_m not in unique_emails:
                unique_emails.append(cleaned_m)
    return unique_emails

def extract_email(text: str) -> Optional[str]:
    emails = extract_all_emails(text)
    return emails[0] if emails else None

def infer_company_from_email(email: str) -> str:
    if not email or "@" not in email:
        return "your organization"
    domain = email.split("@")[-1].lower()
    if domain in KNOWN_DOMAINS:
        return KNOWN_DOMAINS[domain]
    if domain in PUBLIC_EMAIL_PROVIDERS:
        return "your organization"
    
    parts = domain.split(".")
    if len(parts) >= 2:
        name_part = parts[-2] if parts[-1] in ["com", "in", "org", "co", "io", "ai", "net", "sa"] and len(parts) > 2 and parts[-2] in ["co", "com"] else parts[0]
        # Replace hyphens and underscores
        name = name_part.replace("-", " ").replace("_", " ").title()
        return name
    return "your organization"

def extract_company(text: str, email: Optional[str] = None) -> str:
    for domain, name in KNOWN_DOMAINS.items():
        if name.lower() in text.lower():
            return name
        if email and domain in email.lower():
            return name

    patterns = [
        r"((?:[A-Z][A-Za-z0-9&]+[\s-]*){1,3})\s+is\s+(?:looking|hiring)",
        r"✨\s*Why\s+((?:[A-Z][A-Za-z0-9&]+[\s-]*){1,3})\?",
        r"(?:at|join|with)\s+([A-Z][A-Za-z0-9&.\s]{1,25}?)(?:\s+(?:in|for|Pvt|Ltd|Team|\.|\,|!|\n))",
        r"(?:opportunities|openings)\s+at\s+([A-Z][A-Za-z0-9&.\s]{2,25})"
    ]
    for p in patterns:
        m = re.search(p, text)
        if m:
            comp = m.group(1).strip()
            if comp.lower() not in ["our", "the", "a", "an", "this", "bangalore", "noida", "gurgaon", "hyderabad", "onsite", "remote", "we"]:
                return comp

    if email:
        return infer_company_from_email(email)

    return "your esteemed organization"

def extract_recruiter_name(text: str, email: Optional[str] = None) -> str:
    m = re.search(r'(?:Dear|Hi|Hello)\s+([A-Z][a-z]+)', text)
    if m:
        cand = m.group(1).strip().capitalize()
        if cand.lower() not in GENERIC_EMAIL_NAMES and cand.lower() not in ["our", "all", "there", "team", "everyone"]:
            return cand

    m = re.search(r'(?:connect with|contact|share (?:your )?(?:resume|cv) (?:to|at|with))\s+([A-Z][a-z]+)', text, re.IGNORECASE)
    if m:
        name = m.group(1).strip().capitalize()
        if name.lower() not in GENERIC_EMAIL_NAMES and name.lower() not in ["our", "the", "me", "this"]:
            return name

    if email:
        user_part = email.split("@")[0].lower()
        subparts = re.split(r'[._-]', user_part)
        if any(sp in GENERIC_EMAIL_NAMES for sp in subparts):
            return ""
        
        first_name = subparts[0]
        if first_name.isalpha() and len(first_name) >= 3 and first_name not in GENERIC_EMAIL_NAMES:
            return first_name.capitalize()

    return ""

def extract_role(text: str) -> str:
    patterns = [
        r"(?:We’re Hiring|We are Hiring|Hiring)\s*:\s*([A-Za-z\s/]{3,35})(?:\s*[\n\|📍\r])",
        r"Job Title\s*:\s*([A-Za-z\s/]{3,35})(?:\s*[\n\|📍\r])",
        r"Position\s*:\s*([A-Za-z\s/]{3,35})(?:\s*[\n\|📍\r])",
        r"Role\s*:\s*([A-Za-z\s/]{3,35})(?:\s*[\n\|📍\r])"
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            title = m.group(1).strip()
            title = re.sub(r'[\r\n].*', '', title).strip()
            if len(title) > 3 and not title.lower().startswith("now"):
                return title

    lower_text = text.lower()
    for role_name, keywords in ROLE_KEYWORDS:
        if any(kw in lower_text for kw in keywords):
            return role_name

    return "Software Engineer"

def extract_experience_required(text: str) -> Optional[int]:
    m = re.search(r'(?:minimum\s*)?(\d+)\+?\s*years?', text, re.IGNORECASE)
    if m:
        try:
            return int(m.group(1))
        except ValueError:
            pass
    return None

def generate_email_draft(parsed_data: Dict[str, Any]) -> Dict[str, str]:
    settings = load_settings()
    role = parsed_data.get("role") or "Software Engineer"
    company = parsed_data.get("company") or "your esteemed organization"
    recruiter_name = parsed_data.get("recruiter_name") or ""
    years_req = parsed_data.get("years_required")

    if recruiter_name:
        salutation = f"Dear {recruiter_name},"
    elif company and company.lower() not in ["your organization", "your esteemed organization"]:
        salutation = f"Dear {company} Recruitment Team,"
    else:
        salutation = "Dear Hiring Team,"

    role_lower = role.lower()
    
    if any(k in role_lower for k in ["gen ai", "generative ai", "llm", "rag", "agentic"]):
        exp_area = "experience in Python, AI-powered applications, Generative AI, LLMs, RAG, LangChain, API integration, and cloud technologies"
        skills = "Python, FastAPI/Flask, LangChain, LlamaIndex, RAG pipelines, OpenAI/Gemini APIs, and Azure cloud services"
        contribution = (
            "My background in AI application development, Python programming, and problem-solving "
            "would help me contribute to building AI-enabled workflows and intelligent applications."
        )
    elif any(k in role_lower for k in ["data science", "data scientist", "machine learning", "ml"]):
        exp_area = "working with Python, AI-powered applications, Generative AI, LLMs, RAG, API integration, SQL, and cloud technologies"
        skills = "Python, Pandas, NumPy, SQL, machine learning workflows, FastAPI, and LLM integrations"
        contribution = (
            f"With my experience in Python development and Generative AI, I can contribute to building LLM-powered features, "
            f"developing AI APIs, supporting data workflows, and integrating intelligent capabilities into {company}'s solutions."
        )
    elif any(k in role_lower for k in ["full stack", "fullstack", "react", "frontend", "web"]):
        exp_area = "experience in software development, backend APIs, databases, and cloud technologies"
        skills = "JavaScript, React.js, Node.js, Python, and SQL"
        contribution = (
            "I can contribute through my problem-solving skills, full-stack development knowledge, "
            "and ability to learn and adapt to new technologies."
        )
    elif any(k in role_lower for k in ["python", "backend"]):
        exp_area = "working with Python, software development, REST API integration, databases, AI-powered applications, Generative AI, LLMs, RAG, and cloud technologies"
        skills = "Python, software development, REST API integration, databases, AI-powered applications, Generative AI, LLMs, RAG, and cloud technologies"
        contribution = (
            f"With my experience in Python development, AI integration, and cloud technologies, "
            f"I can contribute to building scalable applications, developing APIs, integrating AI capabilities, "
            f"and delivering reliable software solutions. I am eager to learn, take ownership of tasks, and grow with your engineering team."
        )
    else:
        # Default Software Engineer
        exp_area = "working with software development, REST APIs, databases, cloud technologies, and AI-powered solutions"
        skills = "JavaScript, React.js, Node.js, Python, SQL, and Cloud (Azure)"
        contribution = (
            f"With my strong technical foundation, rapid learning ability, and passion for engineering high-quality solutions, "
            f"I am eager to contribute effectively to engineering initiatives at {company}."
        )

    if years_req and years_req > 2:
        exp_ack = (
            f"\n\nAlthough my experience is below the stated requirement for this opening, "
            f"I would appreciate being considered for any suitable junior or mid-level opportunities."
        )
    else:
        exp_ack = ""

    sender_name = settings.get("sender_name", "Harsh Kumar Singh")
    sender_phone = settings.get("sender_phone", "")
    linkedin_url = settings.get("linkedin_url", "")
    curr_comp = settings.get("current_company", "")
    curr_exp = settings.get("current_experience", "1+ years")
    education = settings.get("education", "B.Tech in Computer Science")
    certifications = settings.get("certifications", [])

    if company and company.lower() not in ["your organization", "your esteemed organization"]:
        subject = f"Application for {role} Role - {company}"
    else:
        subject = f"Application for {role} Role - {sender_name}"

    exp_intro = f"I have <b>{curr_exp} of professional experience"
    if curr_comp:
        exp_intro += f" at {curr_comp}"
    exp_intro += f"</b>, working with {skills}."

    edu_paragraph = ""
    edu_parts = []
    if education:
        edu_parts.append(f"I hold a <b>{education}</b>")
    if certifications:
        cert_str = ", ".join(f"<b>{c}</b>" for c in certifications)
        edu_parts.append(f"certifications including {cert_str}")
    if edu_parts:
        edu_paragraph = " and ".join(edu_parts) + ".\n\n"

    sign_off_lines = ["Regards,", f"<b>{sender_name}</b>"]
    if sender_phone:
        sign_off_lines.append(sender_phone)
    if linkedin_url:
        sign_off_lines.append(linkedin_url)
    sign_off = "\n".join(sign_off_lines)

    body = (
        f"{salutation}\n\n"
        f"I am writing to apply for the {role} position at {company}. "
        f"{exp_intro}\n\n"
        f"{edu_paragraph}"
        f"{contribution}{exp_ack}\n\n"
        f"Please find my updated resume attached for your consideration. I would welcome the opportunity to discuss my suitability for this role.\n\n"
        f"{sign_off}"
    )

    return {
        "subject": subject,
        "body": body
    }

def parse_input(raw_input: str) -> Dict[str, Any]:
    text = (raw_input or "").strip()
    settings = load_settings()
    all_emails = extract_all_emails(text)

    # 1. Multi-Email / Bulk Mode Detection
    if len(all_emails) > 1:
        default_role = extract_role(text)
        batch_items = []
        for em in all_emails:
            rec_name = extract_recruiter_name("", em)
            comp = infer_company_from_email(em)
            item_parsed = {
                "recruiter_email": em,
                "recruiter_name": rec_name,
                "company": comp,
                "role": default_role,
                "years_required": 1
            }
            draft = generate_email_draft(item_parsed)
            batch_items.append({
                "recruiter_email": em,
                "recruiter_name": rec_name,
                "company": comp,
                "role": default_role,
                "subject": draft["subject"],
                "body": draft["body"]
            })

        return {
            "mode": "batch",
            "batch_count": len(all_emails),
            "batch_items": batch_items,
            "role": default_role,
            "raw_text": text
        }

    # 2. Single Plain Email Mode
    email_found = all_emails[0] if all_emails else None
    is_plain_email_mode = False
    
    cleaned_wo_email = text
    if email_found:
        cleaned_wo_email = text.replace(email_found, "").replace("mailto:", "").strip(" <>()[]")
    
    if len(cleaned_wo_email) < 15 and email_found:
        is_plain_email_mode = True

    if is_plain_email_mode:
        email = email_found
        company = infer_company_from_email(email)
        recruiter_name = extract_recruiter_name("", email)
        role = settings.get("default_job_role", "Software Engineer")
        years_req = 1
        return {
            "mode": "plain_email",
            "recruiter_email": email,
            "recruiter_name": recruiter_name,
            "company": company,
            "role": role,
            "years_required": years_req,
            "raw_text": text
        }

    # 3. Full Post Single Mode
    email = email_found or ""
    recruiter_name = extract_recruiter_name(text, email)
    company = extract_company(text, email)
    role = extract_role(text)
    years_req = extract_experience_required(text)

    return {
        "mode": "full_post",
        "recruiter_email": email,
        "recruiter_name": recruiter_name,
        "company": company,
        "role": role,
        "years_required": years_req,
        "raw_text": text
    }
