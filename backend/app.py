from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from pathlib import Path
import shutil
import time

from backend.config import load_settings, save_settings, get_resume_path, RESUMES_DIR
from backend.generator import parse_input, generate_email_draft
from backend.mailer import test_smtp_connection, send_application_email
from backend.database import (
    init_db, log_email, get_history, delete_log, clear_history, cancel_scheduled_email
)
from backend.scheduler import start_scheduler, get_next_10am_str

app = FastAPI(title="LinkedIn Job Mail Automator", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

import os

@app.on_event("startup")
def startup_event():
    init_db()
    if not os.getenv("VERCEL"):
        start_scheduler()

# --- Request Models ---
class ParseRequest(BaseModel):
    text: str

class GenerateCustomRequest(BaseModel):
    recruiter_name: Optional[str] = ""
    recruiter_email: Optional[str] = ""
    company: Optional[str] = ""
    role: Optional[str] = "Software Engineer"
    years_required: Optional[int] = None

class SendEmailRequest(BaseModel):
    to_email: str
    recruiter_name: Optional[str] = ""
    company: Optional[str] = ""
    role: Optional[str] = ""
    subject: str
    body: str

class ScheduleEmailRequest(BaseModel):
    to_email: str
    recruiter_name: Optional[str] = ""
    company: Optional[str] = ""
    role: Optional[str] = ""
    subject: str
    body: str
    scheduled_for: str  # Format: "YYYY-MM-DD HH:MM:SS"

class BatchItem(BaseModel):
    to_email: str
    recruiter_name: Optional[str] = ""
    company: Optional[str] = ""
    role: Optional[str] = ""
    subject: str
    body: str

class BatchSendRequest(BaseModel):
    items: List[BatchItem]

class BatchScheduleRequest(BaseModel):
    items: List[BatchItem]
    scheduled_for: str

class TestSmtpRequest(BaseModel):
    sender_email: Optional[str] = None
    gmail_app_password: Optional[str] = None

class SettingsUpdateRequest(BaseModel):
    sender_name: Optional[str] = None
    sender_email: Optional[str] = None
    sender_phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    gmail_app_password: Optional[str] = None
    default_job_role: Optional[str] = None
    current_company: Optional[str] = None
    current_experience: Optional[str] = None

# --- API Endpoints ---

@app.post("/api/parse")
def api_parse_and_draft(req: ParseRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Input text cannot be empty.")
    
    parsed = parse_input(text)
    
    resume_path = get_resume_path()
    resume_info = {
        "filename": resume_path.name if resume_path else "Not found",
        "exists": resume_path.exists() if resume_path else False,
        "size_kb": round(resume_path.stat().st_size / 1024, 1) if (resume_path and resume_path.exists()) else 0
    }
    
    # If single mode, generate draft
    draft = None
    if parsed.get("mode") != "batch":
        draft = generate_email_draft(parsed)

    return {
        "status": "success",
        "parsed": parsed,
        "draft": draft,
        "resume": resume_info,
        "next_10am": get_next_10am_str()
    }

@app.get("/api/default-schedule-time")
def api_default_schedule_time():
    return {"next_10am": get_next_10am_str()}

@app.post("/api/generate-custom")
def api_generate_custom(req: GenerateCustomRequest):
    parsed = {
        "recruiter_name": req.recruiter_name,
        "recruiter_email": req.recruiter_email,
        "company": req.company,
        "role": req.role,
        "years_required": req.years_required
    }
    draft = generate_email_draft(parsed)
    return {
        "status": "success",
        "draft": draft
    }

@app.post("/api/send")
def api_send_email(req: SendEmailRequest):
    if not req.to_email or "@" not in req.to_email:
        raise HTTPException(status_code=400, detail="Invalid recipient email address.")
    if not req.subject.strip():
        raise HTTPException(status_code=400, detail="Subject line cannot be empty.")
    if not req.body.strip():
        raise HTTPException(status_code=400, detail="Email body cannot be empty.")

    success, msg = send_application_email(
        to_email=req.to_email,
        subject=req.subject,
        body_text=req.body
    )

    status_str = "SENT" if success else "FAILED"
    log_id = log_email(
        recruiter_name=req.recruiter_name or "",
        recruiter_email=req.to_email,
        company=req.company or "",
        role=req.role or "",
        subject=req.subject,
        body=req.body,
        status=status_str,
        error_message="" if success else msg
    )

    return {
        "success": success,
        "message": msg,
        "log_id": log_id
    }

@app.post("/api/schedule")
def api_schedule_email(req: ScheduleEmailRequest):
    if not req.to_email or "@" not in req.to_email:
        raise HTTPException(status_code=400, detail="Invalid recipient email address.")
    if not req.scheduled_for:
        raise HTTPException(status_code=400, detail="Scheduled date/time is required.")

    log_id = log_email(
        recruiter_name=req.recruiter_name or "",
        recruiter_email=req.to_email,
        company=req.company or "",
        role=req.role or "",
        subject=req.subject,
        body=req.body,
        status="SCHEDULED",
        scheduled_for=req.scheduled_for
    )

    return {
        "success": True,
        "message": f"Application successfully scheduled for {req.scheduled_for}!",
        "log_id": log_id
    }

@app.post("/api/batch-send")
def api_batch_send(req: BatchSendRequest):
    results = []
    for item in req.items:
        success, msg = send_application_email(
            to_email=item.to_email,
            subject=item.subject,
            body_text=item.body
        )
        status_str = "SENT" if success else "FAILED"
        log_id = log_email(
            recruiter_name=item.recruiter_name or "",
            recruiter_email=item.to_email,
            company=item.company or "",
            role=item.role or "",
            subject=item.subject,
            body=item.body,
            status=status_str,
            error_message="" if success else msg
        )
        results.append({
            "to_email": item.to_email,
            "success": success,
            "message": msg,
            "log_id": log_id
        })
        # 1.5s delay between sends to respect Gmail rate limit
        time.sleep(1.5)

    sent_count = sum(1 for r in results if r["success"])
    return {
        "success": True,
        "sent_count": sent_count,
        "total_count": len(results),
        "results": results
    }

@app.post("/api/batch-schedule")
def api_batch_schedule(req: BatchScheduleRequest):
    queued_ids = []
    for item in req.items:
        log_id = log_email(
            recruiter_name=item.recruiter_name or "",
            recruiter_email=item.to_email,
            company=item.company or "",
            role=item.role or "",
            subject=item.subject,
            body=item.body,
            status="SCHEDULED",
            scheduled_for=req.scheduled_for
        )
        queued_ids.append(log_id)

    return {
        "success": True,
        "scheduled_count": len(queued_ids),
        "scheduled_for": req.scheduled_for,
        "message": f"{len(queued_ids)} applications queued for {req.scheduled_for}!"
    }

@app.post("/api/cancel-scheduled/{log_id}")
def api_cancel_scheduled(log_id: int):
    ok = cancel_scheduled_email(log_id)
    return {"success": ok}

@app.get("/api/history")
def api_get_history(limit: int = 150):
    rows = get_history(limit=limit)
    return {"history": rows}

@app.delete("/api/history/{log_id}")
def api_delete_history(log_id: int):
    ok = delete_log(log_id)
    return {"success": ok}

@app.post("/api/history/clear")
def api_clear_history():
    clear_history()
    return {"success": True}

@app.get("/api/settings")
def api_get_settings():
    s = load_settings()
    pwd = s.get("gmail_app_password", "")
    masked_pwd = (pwd[:2] + "*" * (len(pwd) - 4) + pwd[-2:]) if len(pwd) >= 4 else ("*" * len(pwd) if pwd else "")
    return {
        "sender_name": s.get("sender_name"),
        "sender_email": s.get("sender_email"),
        "sender_phone": s.get("sender_phone"),
        "linkedin_url": s.get("linkedin_url"),
        "has_app_password": bool(pwd),
        "masked_password": masked_pwd,
        "default_job_role": s.get("default_job_role", "Software Engineer"),
        "current_company": s.get("current_company"),
        "current_experience": s.get("current_experience"),
        "resume_filename": s.get("resume_filename")
    }

@app.post("/api/settings")
def api_update_settings(req: SettingsUpdateRequest):
    updates = {}
    if req.sender_name is not None: updates["sender_name"] = req.sender_name
    if req.sender_email is not None: updates["sender_email"] = req.sender_email
    if req.sender_phone is not None: updates["sender_phone"] = req.sender_phone
    if req.linkedin_url is not None: updates["linkedin_url"] = req.linkedin_url
    if req.gmail_app_password is not None and req.gmail_app_password.strip():
        updates["gmail_app_password"] = req.gmail_app_password.strip()
    if req.default_job_role is not None: updates["default_job_role"] = req.default_job_role
    if req.current_company is not None: updates["current_company"] = req.current_company
    if req.current_experience is not None: updates["current_experience"] = req.current_experience
    
    saved = save_settings(updates)
    return {"status": "success", "message": "Settings updated successfully."}

@app.post("/api/test-smtp")
def api_test_smtp(req: TestSmtpRequest):
    success, msg = test_smtp_connection(req.sender_email, req.gmail_app_password)
    return {"success": success, "message": msg}

@app.get("/api/resume-info")
def api_resume_info():
    path = get_resume_path()
    return {
        "filename": path.name if path else None,
        "exists": path.exists() if path else False,
        "size_kb": round(path.stat().st_size / 1024, 1) if (path and path.exists()) else 0,
        "path": str(path) if path else ""
    }

@app.post("/api/upload-resume")
async def api_upload_resume(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resume files are supported.")
    
    target_dir = Path("/tmp/resumes") if os.getenv("VERCEL") else RESUMES_DIR
    target_dir.mkdir(parents=True, exist_ok=True)
    dest_path = target_dir / file.filename
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    save_settings({"resume_filename": file.filename})
    return {
        "status": "success",
        "filename": file.filename,
        "message": f"Resume '{file.filename}' uploaded and set as active."
    }

if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    @app.get("/")
    @app.get("/index.html")
    def serve_index():
        return FileResponse(FRONTEND_DIR / "index.html")
