# 🚀 JobwalaAI - Intelligent Job Application & Outreach Automator

Automated Job Application & Outreach Web Application designed for **Harsh Kumar Singh**.

Paste LinkedIn recruitment post text (or just a recruiter email) to automatically extract requirements, generate personalized, high-converting outreach emails matching your skills and experience, and send them directly via Gmail SMTP (`harsh19singh98@gmail.com`) with your resume (`HarshKumarSingh_Resume.pdf`) attached!

---

## 🌟 Key Features

1. **LinkedIn Post Parsing**:
   - Automatically extracts **Recruiter Name**, **Recruiter Email**, **Company Name**, **Job Role**, and **Required Experience**.
2. **Default Software Engineer Fallback**:
   - If you only paste an email address (e.g. `hr@company.com`) without post text, the system automatically defaults to a targeted **Software Engineer** outreach email with your resume attached.
3. **Smart Personalization Engine**:
   - Dynamically tailors technical skills depending on the role (Full Stack, Python, Generative AI / LLM / RAG, Backend, Cloud).
   - If an opening requires higher experience, it politely adds an acknowledgment expressing interest in junior/mid-level opportunities.
4. **Direct Gmail SMTP Sending**:
   - Sends emails securely using a Google App Password.
   - Automatically attaches your active resume (`HarshKumarSingh_Resume.pdf`).
5. **Live Preview & Direct Editing**:
   - Apple-inspired antigravity UI with live simulated Gmail preview, character counters, and full markdown-to-HTML conversion.
6. **Sent History Tracking**:
   - SQLite database logs every email sent: recruiter email, company, role, timestamp, and status to prevent duplicate outreach.
7. **Resume Manager**:
   - View active resume info or upload a new PDF anytime directly from the Web UI.

---

## ⚡ Quick Start

### 1. Launch the Application
Double-click `run.bat` in this folder, OR run in your terminal:
```bash
python backend/main.py
```
This automatically opens the dashboard in your default browser at `http://127.0.0.1:8000`.

### 2. Configure Gmail App Password (First-Time Only)
1. Go to your [Google Account App Passwords](https://myaccount.google.com/apppasswords).
2. Enter an App Name (e.g., `JobwalaAI`) and click **Create**.
3. Copy the generated 16-character password (e.g. `abcd efgh ijkl mnop`).
4. In the app, switch to the **Settings** tab and paste it into the **Gmail App Password** field.
5. Click **Test Connection** to verify!

---

## 📂 Project Structure

```
job-email-automation/
├── backend/
│   ├── app.py              # FastAPI endpoints and static file serving
│   ├── config.py           # Configuration management (profile & credentials)
│   ├── generator.py        # LinkedIn post extraction & email drafting
│   ├── mailer.py           # Gmail SMTP email sender with PDF attachment
│   ├── database.py         # SQLite logging for sent applications
│   └── main.py             # Server launcher with auto-browser opening
├── frontend/
│   ├── index.html          # Apple-inspired Antigravity UI (Tailwind CSS + Lucide)
│   └── app.js              # Client-side controller, parsing & live preview
├── resumes/
│   └── HarshKumarSingh_Resume.pdf # Active resume file (attached to emails)
├── applications.db         # Local database of sent applications
├── settings.json           # Saved user preferences & credentials
├── run.bat                 # 1-click launcher for Windows
└── README.md               # Documentation
```
