# 🚀 LinkedIn Job Application Mail Automator

Automated Job Application & Outreach Web Application designed specifically for **Vibhu Dixit**.

Paste LinkedIn job recruitment post text (or just a plain recruiter email) to automatically generate personalized, high-converting outreach emails matching your 1-year experience at Meridian Solutions, B.Tech from GLA University, and Microsoft certifications (AZ-900, AZ-104, AZ-500, SC-200, SC-300, SC-401), and send them directly from `vibhudixit88@gmail.com` with your resume (`VibhuDixit_Resume.pdf`) attached!

---

## 🌟 Key Features

1. **LinkedIn Post Parsing**:
   - Automatically extracts **Recruiter Name**, **Recruiter Email**, **Company Name**, **Job Role**, and **Required Experience**.
2. **Default Software Engineer Fallback**:
   - If you only paste/type an email address (e.g. `hr@company.com`) without any post text, the system automatically defaults to a targeted **Software Engineer** outreach email with your resume attached.
3. **Smart Personalization Engine**:
   - Dynamically tailors your technical skills depending on the role (Full Stack, Python, Generative AI / LLM / RAG, Data Science).
   - If an opening requires higher experience (e.g., 5+ years), it politely adds an acknowledgment expressing interest in junior/mid-level opportunities (matching your previous ChatGPT examples).
4. **Direct Gmail SMTP Sending**:
   - Sends emails directly from `vibhudixit88@gmail.com` using a secure 16-character Google App Password.
   - Automatically attaches your `VibhuDixit_Resume.pdf`.
5. **Live Preview & Direct Editing**:
   - Review and tweak the subject and email body before hitting "Send Application Now", or copy the generated text to your clipboard.
6. **Sent History Tracking**:
   - SQLite database logs every email sent: recruiter email, company, role, timestamp, and status to prevent duplicate applications.
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

### 2. Configure Gmail App Password (First-Time Only, 30 seconds)
1. Go to your [Google Account App Passwords](https://myaccount.google.com/apppasswords).
2. Enter an App Name (e.g., `Job Automator`) and click **Create**.
3. Copy the generated 16-character password (e.g. `abcd efgh ijkl mnop`).
4. In the app, switch to the **Settings** tab and paste it into the **Gmail App Password** field.
5. Click **Test Connection** to verify!

---

## 📂 Project Structure

```
ApplicationMail/
├── backend/
│   ├── app.py              # FastAPI endpoints and static file serving
│   ├── config.py           # Configuration management (profile & credentials)
│   ├── generator.py        # LinkedIn post extraction & email drafting
│   ├── mailer.py           # Gmail SMTP email sender with PDF attachment
│   ├── database.py         # SQLite logging for sent applications
│   └── main.py             # Server launcher with auto-browser opening
├── frontend/
│   ├── index.html          # Modern dashboard UI (Tailwind CSS + Lucide icons)
│   └── app.js              # Client-side controller, parsing & live preview
├── resumes/
│   └── VibhuDixit_Resume.pdf # Active resume file (attached to emails)
├── applications.db         # Local database of sent applications
├── settings.json           # Saved user preferences & credentials
├── run.bat                 # 1-click launcher for Windows
└── README.md               # Documentation
```
