import sqlite3
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_FILE = Path(__file__).resolve().parent.parent / "applications.db"

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sent_emails (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recruiter_name TEXT,
                recruiter_email TEXT NOT NULL,
                company TEXT,
                role TEXT,
                subject TEXT,
                body TEXT,
                status TEXT NOT NULL,
                error_message TEXT,
                sent_at TEXT NOT NULL,
                scheduled_for TEXT
            )
        """)
        # Migration check: ensure scheduled_for column exists if table was created previously
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(sent_emails)")
        cols = [row["name"] for row in cursor.fetchall()]
        if "scheduled_for" not in cols:
            conn.execute("ALTER TABLE sent_emails ADD COLUMN scheduled_for TEXT")
        conn.commit()

def log_email(
    recruiter_name: str,
    recruiter_email: str,
    company: str,
    role: str,
    subject: str,
    body: str,
    status: str,
    error_message: Optional[str] = None,
    scheduled_for: Optional[str] = None
) -> int:
    init_db()
    sent_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO sent_emails 
            (recruiter_name, recruiter_email, company, role, subject, body, status, error_message, sent_at, scheduled_for)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            recruiter_name,
            recruiter_email,
            company,
            role,
            subject,
            body,
            status,
            error_message or "",
            sent_at,
            scheduled_for
        ))
        conn.commit()
        return cursor.lastrowid

def get_pending_scheduled_emails() -> List[Dict[str, Any]]:
    init_db()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, recruiter_name, recruiter_email, company, role, subject, body, status, scheduled_for, sent_at
            FROM sent_emails
            WHERE status = 'SCHEDULED' AND scheduled_for <= ?
            ORDER BY scheduled_for ASC
        """, (now_str,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def mark_scheduled_complete(log_id: int, status: str, error_message: str = "") -> bool:
    init_db()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE sent_emails
            SET status = ?, error_message = ?, sent_at = ?
            WHERE id = ?
        """, (status, error_message, now_str, log_id))
        conn.commit()
        return cursor.rowcount > 0

def cancel_scheduled_email(log_id: int) -> bool:
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE sent_emails
            SET status = 'CANCELLED', error_message = 'Cancelled by user before dispatch'
            WHERE id = ? AND status = 'SCHEDULED'
        """, (log_id,))
        conn.commit()
        return cursor.rowcount > 0

def get_history(limit: int = 150) -> List[Dict[str, Any]]:
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, recruiter_name, recruiter_email, company, role, subject, body, status, error_message, sent_at, scheduled_for
            FROM sent_emails
            ORDER BY id DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def delete_log(log_id: int) -> bool:
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sent_emails WHERE id = ?", (log_id,))
        conn.commit()
        return cursor.rowcount > 0

def clear_history() -> bool:
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sent_emails")
        conn.commit()
        return True
