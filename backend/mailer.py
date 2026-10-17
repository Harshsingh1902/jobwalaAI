import smtplib
import os
import re
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from pathlib import Path
from typing import Tuple, Optional
import html
from backend.config import load_settings, get_resume_path

def clean_password(pwd: str) -> str:
    return (pwd or "").replace(" ", "").strip()

def test_smtp_connection(sender_email: Optional[str] = None, app_password: Optional[str] = None) -> Tuple[bool, str]:
    settings = load_settings()
    email_to_use = sender_email or settings.get("sender_email")
    pwd_to_use = clean_password(app_password or settings.get("gmail_app_password", ""))

    if not email_to_use:
        return False, "Sender email is not configured."
    if not pwd_to_use:
        return False, "Gmail App Password is not set. Please provide your 16-character App Password."

    server = settings.get("smtp_server", "smtp.gmail.com")
    port = int(settings.get("smtp_port", 587))

    try:
        with smtplib.SMTP(server, port, timeout=15) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
            smtp.login(email_to_use, pwd_to_use)
            return True, f"Success! Successfully connected and authenticated with Gmail as {email_to_use}."
    except smtplib.SMTPAuthenticationError:
        return False, (
            "Gmail Authentication Failed. Make sure you are using a 16-character 'Google App Password' "
            "(not your standard account password). Generate one at: https://myaccount.google.com/apppasswords"
        )
    except Exception as e:
        return False, f"SMTP Connection error: {str(e)}"

def format_body_to_html(raw_body: str) -> str:
    """
    Format body to match natural, genuine Gmail composition:
    - Full width, left aligned (NO artificial centered container)
    - Standard Gmail Arial 14px font
    - Preserves/converts bold tags (<b> and **markdown**)
    - Clickable phone and LinkedIn links
    """
    text = raw_body.strip()

    # Convert markdown **bold** to <b>bold</b> if present
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)

    # Protect existing <b>, </b>, <strong>, </strong>, <a>, </a> tags while escaping the rest
    # Placeholder tokens
    placeholders = []
    def save_tag(match):
        placeholders.append(match.group(0))
        return f"__TAG_TOKEN_{len(placeholders)-1}__"

    tag_pattern = r'</?(?:b|strong|i|em|a(?:\s+[^>]*)?)>'
    text_with_tokens = re.sub(tag_pattern, save_tag, text, flags=re.IGNORECASE)

    # Escape HTML entities
    escaped = html.escape(text_with_tokens)

    # Restore tags
    for i, orig_tag in enumerate(placeholders):
        escaped = escaped.replace(f"__TAG_TOKEN_{i}__", orig_tag)

    # Make plain URLs clickable
    url_pattern = r'(https?://[^\s<]+)'
    escaped = re.sub(url_pattern, r'<a href="\1" target="_blank" style="color: #1155cc; text-decoration: underline;">\1</a>', escaped)

    # Make phone number clickable
    phone_pattern = r'(\+91\s*\d{10})'
    escaped = re.sub(phone_pattern, r'<a href="tel:\1" style="color: #1155cc; text-decoration: underline;">\1</a>', escaped)

    # Split paragraphs by double newline and lines by single newline
    paragraphs = escaped.split("\n\n")
    html_paragraphs = []
    for p in paragraphs:
        lines = p.split("\n")
        joined_lines = "<br>".join(lines)
        html_paragraphs.append(f"<div>{joined_lines}</div>")

    # Native Gmail composition HTML structure
    return f"""<div dir="ltr" style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #222222; line-height: 1.5; margin: 0; padding: 0;">
{"<div><br></div>".join(html_paragraphs)}
</div>"""

def strip_tags_for_plain(text: str) -> str:
    # Remove HTML tags for the text/plain fallback
    clean = re.sub(r'</?[a-zA-Z0-9]+[^>]*>', '', text)
    # Remove markdown bold markers
    clean = re.sub(r'\*\*(.*?)\*\*', r'\1', clean)
    return clean

def send_application_email(
    to_email: str,
    subject: str,
    body_text: str,
    custom_resume_path: Optional[Path] = None
) -> Tuple[bool, str]:
    settings = load_settings()
    sender_email = settings.get("sender_email")
    app_password = clean_password(settings.get("gmail_app_password", ""))
    sender_name = settings.get("sender_name", "Harsh Kumar Singh")

    if not sender_email:
        return False, "Sender email is missing."
    if not app_password:
        return False, "Gmail App Password is missing. Please configure it in Settings."
    if not to_email:
        return False, "Recipient email is missing."

    resume_path = custom_resume_path or get_resume_path()
    if not resume_path.exists():
        return False, f"Resume file not found at: {resume_path}. Please check resumes folder."

    server = settings.get("smtp_server", "smtp.gmail.com")
    port = int(settings.get("smtp_port", 587))

    try:
        msg = MIMEMultipart("mixed")
        msg["From"] = f"{sender_name} <{sender_email}>"
        msg["To"] = to_email
        msg["Subject"] = subject
        msg["Reply-To"] = sender_email

        alt_part = MIMEMultipart("alternative")
        
        # Clean plain text part
        clean_plain = strip_tags_for_plain(body_text)
        part_text = MIMEText(clean_plain, "plain", "utf-8")
        alt_part.attach(part_text)

        # Natural Gmail HTML part
        html_content = format_body_to_html(body_text)
        part_html = MIMEText(html_content, "html", "utf-8")
        alt_part.attach(part_html)

        msg.attach(alt_part)

        # Attach Resume PDF
        resume_name = resume_path.name
        with open(resume_path, "rb") as f:
            pdf_attachment = MIMEApplication(f.read(), _subtype="pdf")
            pdf_attachment.add_header(
                "Content-Disposition",
                "attachment",
                filename=resume_name
            )
            msg.attach(pdf_attachment)

        # Send via Gmail SMTP
        with smtplib.SMTP(server, port, timeout=25) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
            smtp.login(sender_email, app_password)
            smtp.send_message(msg)

        return True, f"Application successfully sent to {to_email} with {resume_name} attached!"

    except smtplib.SMTPAuthenticationError:
        return False, (
            "Gmail Authentication Error: Invalid App Password. "
            "Please check your 16-character App Password in Settings."
        )
    except Exception as e:
        return False, f"Failed to send email: {str(e)}"
