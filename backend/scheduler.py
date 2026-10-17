import time
import threading
from datetime import datetime, timedelta
from typing import Optional
from backend.database import get_pending_scheduled_emails, mark_scheduled_complete
from backend.mailer import send_application_email

_scheduler_running = False
_scheduler_thread: Optional[threading.Thread] = None

def get_next_10am_datetime() -> datetime:
    now = datetime.now()
    target = now.replace(hour=10, minute=0, second=0, microsecond=0)
    if now >= target:
        # If it is already 10:00 AM or later today, schedule for tomorrow at 10:00 AM
        target = target + timedelta(days=1)
    return target

def get_next_10am_str() -> str:
    return get_next_10am_datetime().strftime("%Y-%m-%d %H:%M:%S")

def _scheduler_loop():
    global _scheduler_running
    print("[Scheduler] Background Email Scheduler started (checking every 15s)...")
    while _scheduler_running:
        try:
            pending = get_pending_scheduled_emails()
            for item in pending:
                log_id = item["id"]
                to_email = item["recruiter_email"]
                subject = item["subject"]
                body = item["body"]
                
                print(f"[Scheduler] Dispatching scheduled email #{log_id} to {to_email}...")
                success, msg = send_application_email(
                    to_email=to_email,
                    subject=subject,
                    body_text=body
                )
                
                status_str = "SENT" if success else "FAILED"
                err_msg = "" if success else msg
                mark_scheduled_complete(log_id, status_str, err_msg)
                
                if success:
                    print(f"[Scheduler] Successfully delivered scheduled email to {to_email}!")
                else:
                    print(f"[Scheduler] Failed to deliver scheduled email to {to_email}: {msg}")
                    
        except Exception as e:
            print(f"[Scheduler Error] {e}")
            
        for _ in range(15):
            if not _scheduler_running:
                break
            time.sleep(1)

def start_scheduler():
    global _scheduler_running, _scheduler_thread
    if not _scheduler_running:
        _scheduler_running = True
        _scheduler_thread = threading.Thread(target=_scheduler_loop, daemon=True)
        _scheduler_thread.start()

def stop_scheduler():
    global _scheduler_running
    _scheduler_running = False
