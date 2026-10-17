// Global state
let currentHistory = [];
let currentPreviewMode = "visual"; // "visual" or "edit"
let currentBatchItems = [];
let customScheduleTarget = "single"; // "single" or "batch"
let next10amDefault = "";

let lenisInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    initLenis();
    checkSmtpStatus();
    checkResumeStatus();
    loadSettings();
    loadHistory();
    fetchNext10AM();
    initAntigravityPhysics();
    initParticleCanvas();
    initDropZone();
    initKeyboardShortcuts();
    updateEmailStats();

    // Auto-parse on paste or input after 600ms debounce
    let debounceTimer;
    const inputEl = document.getElementById("raw-post-input");
    if (inputEl) {
        inputEl.addEventListener("input", () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (inputEl.value.trim().length > 5) {
                    processInput(false);
                }
            }, 600);
        });
    }
});

// Lenis Buttery Momentum Smooth Scrolling & Layered Parallax
function initLenis() {
    if (typeof Lenis !== "undefined") {
        try {
            lenisInstance = new Lenis({
                lerp: 0.08,
                smoothWheel: true,
                wheelMultiplier: 1.05,
            });

            function raf(time) {
                lenisInstance.raf(time);
                requestAnimationFrame(raf);
            }
            requestAnimationFrame(raf);

            lenisInstance.on("scroll", (e) => {
                // Update top progress bar
                const progressEl = document.getElementById("scroll-progress-bar");
                if (progressEl) {
                    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                    const pct = maxScroll > 0 ? (e.animatedScroll / maxScroll) * 100 : 0;
                    progressEl.style.width = `${Math.min(100, Math.max(0, pct))}%`;
                }

                // Apple parallax depth layers
                const parallaxEls = document.querySelectorAll("[data-parallax]");
                parallaxEls.forEach(el => {
                    const speed = parseFloat(el.getAttribute("data-parallax") || "0.05");
                    const offset = e.animatedScroll * speed;
                    el.style.transform = `translate3d(0, ${offset}px, 0)`;
                });
            });
        } catch (err) {
            console.warn("Lenis initialization:", err);
        }
    }
}

function scrollToStudio() {
    if (lenisInstance) {
        lenisInstance.scrollTo("#studio-workspace", { offset: -70, duration: 1.1 });
    } else {
        document.getElementById("studio-workspace")?.scrollIntoView({ behavior: "smooth" });
    }
}

// Antigravity 3D Tilt & Weightless Physics on cards
function initAntigravityPhysics() {
    const cards = document.querySelectorAll('.antigravity-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -3.5;
            const rotateY = ((x - centerX) / centerX) * 3.5;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        });
    });
}

// Antigravity Canvas: Interactive 60fps Floating Particles & Constellations
function initParticleCanvas() {
    const canvas = document.getElementById("antigravity-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let mouse = { x: -1000, y: -1000, radius: 130 };

    window.addEventListener("resize", () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    window.addEventListener("mousemove", (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener("mouseout", () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    // Generate weightless floating particles
    const particleCount = Math.min(65, Math.max(25, Math.floor((width * height) / 20000)));
    const particles = [];
    const colors = ["#38bdf8", "#818cf8", "#c084fc", "#ffffff"];

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.45,
            vy: (Math.random() - 0.5) * 0.45,
            radius: Math.random() * 1.8 + 0.6,
            color: colors[Math.floor(Math.random() * colors.length)],
            baseAlpha: Math.random() * 0.35 + 0.15,
            alpha: 0.2
        });
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            p.x += p.vx;
            p.y += p.vy;

            // Seamless wrap
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            // Subtle mouse repulsion for antigravity feel
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < mouse.radius) {
                const force = (mouse.radius - dist) / mouse.radius;
                const angle = Math.atan2(dy, dx);
                p.x += Math.cos(angle) * force * 1.6;
                p.y += Math.sin(angle) * force * 1.6;
                p.alpha = Math.min(0.9, p.baseAlpha + force * 0.6);
            } else {
                p.alpha = p.baseAlpha;
            }

            // Draw particle
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Connect nearby particles with subtle glowing lines
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const lineDx = p.x - p2.x;
                const lineDy = p.y - p2.y;
                const lineDist = Math.sqrt(lineDx * lineDx + lineDy * lineDy);

                if (lineDist < 110) {
                    const lineAlpha = (1 - lineDist / 110) * 0.16;
                    ctx.save();
                    ctx.strokeStyle = "#38bdf8";
                    ctx.globalAlpha = lineAlpha;
                    ctx.lineWidth = 0.6;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
}

// Quick Sample Presets for One-Click Testing
function loadSamplePrompt(type) {
    const input = document.getElementById("raw-post-input");
    if (!input) return;

    if (type === "fullstack") {
        input.value = `We are hiring a Full Stack Developer (React / Python) at Innovate Labs!
Looking for someone with 1-2 years of experience building modern web apps, REST APIs, and responsive frontends.
Send your resume to Neha Sharma at tech.talent@innovatecorp.com with your portfolio or GitHub!`;
    } else if (type === "python") {
        input.value = `Urgent Opening: Python & AI Engineer at NeuralScale AI
Skills: Python, FastAPI, LLM integration, PostgreSQL, Docker.
Experience: 1-3 years.
Location: Remote (India).
Interested candidates please share your resume directly with Vikram Mehta at careers@neuralscale.ai`;
    } else if (type === "cloud") {
        input.value = `Apex Cloud Systems is looking for a Backend / Cloud Software Engineer (AWS, Microservices, Python/Node).
1+ years experience preferred.
Drop your resume and recent projects to David Chen at hiring@apexcloud.io.`;
    } else if (type === "direct") {
        input.value = `talent.acquisition@stripe.com\nrecruiting@databricks.com\nhr@uber.com`;
    }

    scrollToStudio();
    processInput(true);
}

    try {
        const res = await fetch("/api/default-schedule-time");
        const data = await res.json();
        next10amDefault = data.next_10am;
    } catch (e) {
        console.error("Failed to fetch default schedule time:", e);
    }
}

// Tab switching (Apple-style dark segmented control)
function switchTab(tabName) {
    const tabs = ["outreach", "history", "settings"];
    tabs.forEach(t => {
        const section = document.getElementById(`tab-${t}`);
        const btn = document.getElementById(`tab-btn-${t}`);
        if (t === tabName) {
            section.classList.remove("hidden");
            btn.className = "px-3.5 py-1.5 rounded-lg font-semibold text-white bg-white/[0.12] shadow-sm border border-white/[0.15] flex items-center gap-1.5 transition-all";
        } else {
            section.classList.add("hidden");
            btn.className = "px-3.5 py-1.5 rounded-lg font-medium text-zinc-400 hover:text-white flex items-center gap-1.5 transition-all";
        }
    });

    if (tabName === "history") {
        loadHistory();
    }
    lucide.createIcons();
    scrollToStudio();
}

// Preview mode toggle: Visual (Gmail view) vs Edit Text
function setPreviewMode(mode) {
    currentPreviewMode = mode;
    const visualContainer = document.getElementById("visual-preview-container");
    const editContainer = document.getElementById("raw-edit-container");
    const btnVisual = document.getElementById("btn-mode-visual");
    const btnEdit = document.getElementById("btn-mode-edit");

    if (mode === "visual") {
        visualContainer.classList.remove("hidden");
        editContainer.classList.add("hidden");
        btnVisual.className = "px-3 py-1.5 rounded-lg bg-white/[0.12] text-white border border-white/[0.15] shadow-xs flex items-center gap-1.5 transition-all";
        btnEdit.className = "px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white border border-transparent flex items-center gap-1.5 transition-all";
        updateVisualPreviewFromEditor();
    } else {
        visualContainer.classList.add("hidden");
        editContainer.classList.remove("hidden");
        btnEdit.className = "px-3 py-1.5 rounded-lg bg-white/[0.12] text-white border border-white/[0.15] shadow-xs flex items-center gap-1.5 transition-all";
        btnVisual.className = "px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white border border-transparent flex items-center gap-1.5 transition-all";
    }
    lucide.createIcons();
}

function updateVisualPreviewFromEditor() {
    const raw = document.getElementById("email-body").value;
    const box = document.getElementById("visual-preview-content");
    if (!raw.trim()) {
        box.innerHTML = `<span class="text-zinc-500 italic">Your personalized email will appear here...</span>`;
        updateEmailStats();
        return;
    }

    // Convert markdown **bold** or <b>bold</b> to styled HTML preview
    let formatted = raw.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    
    // Convert links
    formatted = formatted.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank">$1</a>');
    formatted = formatted.replace(/(\+91\s*\d{10})/g, '<a href="tel:$1">$1</a>');
    
    box.innerHTML = formatted;
    updateEmailStats();
}

// Live Word Count, Character Count, and Recruiter Optimal Length Meter
function updateEmailStats() {
    const raw = document.getElementById("email-body")?.value || "";
    const clean = raw.replace(/<[^>]*>/g, "").replace(/\*\*/g, "").trim();
    
    const words = clean ? clean.split(/\s+/).length : 0;
    const chars = clean.length;
    const readSecs = Math.max(1, Math.ceil((words / 210) * 60));

    const wordCountEl = document.getElementById("email-word-count");
    const charCountEl = document.getElementById("email-char-count");
    const readTimeEl = document.getElementById("email-reading-time");
    const badgeEl = document.getElementById("optimal-length-badge");

    if (wordCountEl) wordCountEl.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
    if (charCountEl) charCountEl.textContent = `${chars} chars`;
    if (readTimeEl) readTimeEl.textContent = words > 0 ? `~${readSecs}s read` : `~0s read`;

    if (!badgeEl) return;

    if (words === 0) {
        badgeEl.textContent = "Draft Empty";
        badgeEl.className = "px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-zinc-400 border border-white/10";
    } else if (words >= 70 && words <= 170) {
        badgeEl.textContent = "⚡ Optimal Length (75-160w: Highest Response Rate)";
        badgeEl.className = "px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
    } else if (words < 70) {
        badgeEl.textContent = "Brief Pitch (< 70w)";
        badgeEl.className = "px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30";
    } else {
        badgeEl.textContent = "Long Pitch (> 170w - Consider Trimming)";
        badgeEl.className = "px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30";
    }
}


// Wrap selected text in textarea with <b>...</b>
function wrapSelectionWithBold() {
    const textarea = document.getElementById("email-body");
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) {
        showToast("Please highlight words first to make them bold.", "info");
        return;
    }
    const selected = textarea.value.substring(start, end);
    const replacement = `<b>${selected}</b>`;
    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    textarea.selectionStart = start;
    textarea.selectionEnd = start + replacement.length;
    updateVisualPreviewFromEditor();
}

// Toast notification helper with Apple frosted pill design
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    
    let border = "border-white/10";
    let icon = "info";
    let iconColor = "text-cyan-400";
    if (type === "success") {
        border = "border-emerald-500/30";
        icon = "check-circle-2";
        iconColor = "text-emerald-400";
    } else if (type === "error") {
        border = "border-rose-500/30";
        icon = "alert-circle";
        iconColor = "text-rose-400";
    }

    toast.className = `bg-zinc-900/90 backdrop-blur-2xl text-zinc-100 border ${border} shadow-[0_15px_40px_rgba(0,0,0,0.8)] px-4 py-3 rounded-2xl text-xs font-medium flex items-center gap-2.5 transform transition-all duration-300 translate-y-2 pointer-events-auto`;
    toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 ${iconColor} flex-shrink-0"></i><span>${message}</span>`;
    
    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.classList.remove("translate-y-2");
        toast.classList.add("translate-y-0");
    }, 10);

    setTimeout(() => {
        toast.classList.add("opacity-0", "translate-y-[-10px]");
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Clear input
function clearInput() {
    document.getElementById("raw-post-input").value = "";
    document.getElementById("field-email").value = "";
    document.getElementById("field-name").value = "";
    document.getElementById("field-company").value = "";
    document.getElementById("field-role").value = "";
    document.getElementById("field-exp").value = "";
    document.getElementById("email-subject").value = "";
    document.getElementById("email-body").value = "";
    document.getElementById("visual-preview-content").innerHTML = `<span class="text-zinc-500 italic">Your personalized email will appear here...</span>`;
    document.getElementById("detected-mode-badge").textContent = "Ready";
    document.getElementById("detected-mode-badge").className = "text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-400 border border-white/10";
    
    document.getElementById("single-studio-box").classList.remove("hidden");
    document.getElementById("batch-studio-box").classList.add("hidden");
    currentBatchItems = [];
    updateEmailStats();
}

// Parse input from raw textarea
async function processInput(showToastNotice = true) {
    const text = document.getElementById("raw-post-input").value.trim();
    if (!text) {
        if (showToastNotice) showToast("Please paste a LinkedIn post or email address.", "error");
        return;
    }

    const btn = document.getElementById("btn-generate");
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Analyzing...</span>`;
    lucide.createIcons();

    try {
        const res = await fetch("/api/parse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        });
        const data = await res.json();

        if (res.ok) {
            const parsed = data.parsed;
            if (data.next_10am) next10amDefault = data.next_10am;

            if (parsed.mode === "batch") {
                renderBatchMode(parsed);
                if (showToastNotice) showToast(`Batch Mode: Detected ${parsed.batch_count} recruiter emails!`, "success");
            } else {
                renderSingleMode(parsed, data.draft);
                if (showToastNotice) showToast("Email draft generated with genuine bold highlights!", "success");
            }

            // Resume info
            if (data.resume && data.resume.exists) {
                document.getElementById("card-resume-name").textContent = data.resume.filename;
                document.getElementById("card-resume-size").textContent = `${data.resume.size_kb} KB - Attached automatically`;
            }
        } else {
            showToast(data.detail || "Failed to parse post.", "error");
        }
    } catch (err) {
        showToast("Error connecting to server.", "error");
    } finally {
        btn.innerHTML = originalText;
        lucide.createIcons();
    }
}

function renderSingleMode(parsed, draft) {
    document.getElementById("single-studio-box").classList.remove("hidden");
    document.getElementById("batch-studio-box").classList.add("hidden");

    document.getElementById("field-email").value = parsed.recruiter_email || "";
    document.getElementById("field-name").value = parsed.recruiter_name || "";
    document.getElementById("field-company").value = parsed.company || "";
    document.getElementById("field-role").value = parsed.role || "Software Engineer";
    document.getElementById("field-exp").value = parsed.years_required || "";

    const badge = document.getElementById("detected-mode-badge");
    if (parsed.mode === "plain_email") {
        badge.textContent = "Default: Software Engineer";
        badge.className = "text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30";
    } else {
        badge.textContent = `Role: ${parsed.role}`;
        badge.className = "text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30";
    }

    if (draft) {
        document.getElementById("email-subject").value = draft.subject;
        document.getElementById("email-body").value = draft.body;
        updateVisualPreviewFromEditor();
    }
}

function renderBatchMode(parsed) {
    document.getElementById("single-studio-box").classList.add("hidden");
    document.getElementById("batch-studio-box").classList.remove("hidden");

    currentBatchItems = parsed.batch_items || [];
    document.getElementById("batch-count-badge").textContent = `${parsed.batch_count} Recipients`;

    const badge = document.getElementById("detected-mode-badge");
    badge.textContent = `Bulk Mode (${parsed.batch_count} Emails)`;
    badge.className = "text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30";

    const tbody = document.getElementById("batch-table-body");
    tbody.innerHTML = currentBatchItems.map((item, idx) => `
        <tr class="hover:bg-white/[0.03] transition border-b border-white/[0.05]">
          <td class="p-3 font-mono text-zinc-500">${idx + 1}</td>
          <td class="p-3 font-semibold text-white">${item.recruiter_email}</td>
          <td class="p-3 text-zinc-400">${item.recruiter_name || "-"}</td>
          <td class="p-3 text-zinc-300 font-medium">${item.company || "-"}</td>
          <td class="p-3 text-right">
            <button onclick="viewBatchItemDraft(${idx})" class="px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 rounded-lg text-[11px] font-medium border border-white/[0.08] transition">
              Preview
            </button>
          </td>
        </tr>
    `).join("");

    lucide.createIcons();
}

function viewBatchItemDraft(index) {
    const item = currentBatchItems[index];
    if (!item) return;

    document.getElementById("modal-to").textContent = `${item.recruiter_name ? item.recruiter_name + " <" : ""}${item.recruiter_email}${item.recruiter_name ? ">" : ""}`;
    document.getElementById("modal-subject").textContent = item.subject;
    document.getElementById("modal-date").textContent = "Draft Preview (Batch Item)";
    
    let formatted = item.body.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    formatted = formatted.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank">$1</a>');
    formatted = formatted.replace(/(\+91\s*\d{10})/g, '<a href="tel:$1">$1</a>');
    document.getElementById("modal-body").innerHTML = formatted;

    document.getElementById("view-modal").classList.remove("hidden");
    lucide.createIcons();
}

// Regenerate draft using the manual fields
async function regenerateFromFields() {
    const recruiter_email = document.getElementById("field-email").value.trim();
    const recruiter_name = document.getElementById("field-name").value.trim();
    const company = document.getElementById("field-company").value.trim();
    const role = document.getElementById("field-role").value.trim();
    const expStr = document.getElementById("field-exp").value.trim();
    const years_required = expStr ? parseInt(expStr) : null;

    try {
        const res = await fetch("/api/generate-custom", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                recruiter_email,
                recruiter_name,
                company,
                role,
                years_required
            })
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById("email-subject").value = data.draft.subject;
            document.getElementById("email-body").value = data.draft.body;
            updateVisualPreviewFromEditor();
            showToast("Draft updated from fields!", "success");
        }
    } catch (err) {
        showToast("Failed to update draft.", "error");
    }
}

// Send email
async function sendApplicationNow() {
    const to_email = document.getElementById("field-email").value.trim();
    const recruiter_name = document.getElementById("field-name").value.trim();
    const company = document.getElementById("field-company").value.trim();
    const role = document.getElementById("field-role").value.trim();
    const subject = document.getElementById("email-subject").value.trim();
    const body = document.getElementById("email-body").value.trim();

    if (!to_email || !to_email.includes("@")) {
        showToast("Please enter a valid Recruiter Email address in the box on the left.", "error");
        document.getElementById("field-email").focus();
        document.getElementById("field-email").classList.add("ring-2", "ring-red-500");
        setTimeout(() => document.getElementById("field-email").classList.remove("ring-2", "ring-red-500"), 3000);
        return;
    }
    if (!subject || !body) {
        showToast("Subject and body cannot be empty.", "error");
        return;
    }

    const btn = document.getElementById("btn-send-email");
    const sendBtnText = document.getElementById("send-btn-text");
    btn.disabled = true;
    sendBtnText.textContent = "Sending Email...";
    btn.classList.add("opacity-75");

    try {
        const res = await fetch("/api/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                to_email,
                recruiter_name,
                company,
                role,
                subject,
                body
            })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            showToast(`Success! Email sent to ${to_email} with resume attached.`, "success");
            loadHistory();
        } else {
            showToast(data.message || "Sending failed. Check settings.", "error");
            if (data.message && data.message.includes("Password")) {
                document.getElementById("smtp-warning-banner").classList.remove("hidden");
            }
        }
    } catch (err) {
        showToast("Connection error while sending email.", "error");
    } finally {
        btn.disabled = false;
        sendBtnText.textContent = "Send Now";
        btn.classList.remove("opacity-75");
        lucide.createIcons();
    }
}

function getClientNext10AM() {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
    if (now >= target) {
        target.setDate(target.getDate() + 1);
    }
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, "0");
    const d = String(target.getDate()).padStart(2, "0");
    return `${y}-${m}-${d} 10:00:00`;
}

// Single Email Schedule for 10:00 AM preset
async function scheduleSingle10AM() {
    const to_email = document.getElementById("field-email").value.trim();
    const recruiter_name = document.getElementById("field-name").value.trim();
    const company = document.getElementById("field-company").value.trim();
    const role = document.getElementById("field-role").value.trim();
    const subject = document.getElementById("email-subject").value.trim();
    const body = document.getElementById("email-body").value.trim();

    if (!to_email || !to_email.includes("@")) {
        showToast("Please enter a valid Recruiter Email address in the box on the left.", "error");
        document.getElementById("field-email").focus();
        document.getElementById("field-email").classList.add("ring-2", "ring-red-500");
        setTimeout(() => document.getElementById("field-email").classList.remove("ring-2", "ring-red-500"), 3000);
        return;
    }

    const scheduledTime = next10amDefault || getClientNext10AM();

    try {
        const res = await fetch("/api/schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                to_email,
                recruiter_name,
                company,
                role,
                subject,
                body,
                scheduled_for: scheduledTime
            })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            showToast(`Application scheduled for morning 10:00 AM (${scheduledTime})!`, "success");
            loadHistory();
            switchTab("history");
        } else {
            showToast(data.detail || data.message || "Failed to schedule.", "error");
        }
    } catch (e) {
        showToast("Error scheduling application.", "error");
    }
}

// Batch Sending
async function sendBatchNow() {
    if (!currentBatchItems.length) {
        showToast("No batch items to send.", "error");
        return;
    }

    if (!confirm(`Are you sure you want to send all ${currentBatchItems.length} applications right now?`)) {
        return;
    }

    const btn = document.getElementById("btn-batch-send");
    const btnText = document.getElementById("batch-send-text");
    const progressContainer = document.getElementById("batch-progress-container");
    const progressBar = document.getElementById("batch-progress-bar");
    const progressStatus = document.getElementById("batch-progress-status");
    const progressPercent = document.getElementById("batch-progress-percent");

    btn.disabled = true;
    btn.classList.add("opacity-75");
    progressContainer.classList.remove("hidden");

    let sentSuccess = 0;
    const total = currentBatchItems.length;

    for (let i = 0; i < total; i++) {
        const item = currentBatchItems[i];
        const pct = Math.round(((i) / total) * 100);
        progressBar.style.width = `${pct}%`;
        progressPercent.textContent = `${pct}%`;
        progressStatus.textContent = `Sending (${i + 1}/${total}): ${item.recruiter_email}...`;

        try {
            const res = await fetch("/api/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to_email: item.recruiter_email,
                    recruiter_name: item.recruiter_name,
                    company: item.company,
                    role: item.role,
                    subject: item.subject,
                    body: item.body
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                sentSuccess++;
            }
        } catch (e) {
            console.error(e);
        }

        if (i < total - 1) {
            await new Promise(r => setTimeout(r, 1500));
        }
    }

    progressBar.style.width = "100%";
    progressPercent.textContent = "100%";
    progressStatus.textContent = `Batch complete! Sent ${sentSuccess} of ${total} applications.`;

    btn.disabled = false;
    btn.classList.remove("opacity-75");
    btnText.textContent = "Send All Now";

    showToast(`Batch complete: ${sentSuccess}/${total} emails sent successfully!`, "success");
    loadHistory();
}

// Batch Schedule for 10:00 AM preset
async function scheduleBatch10AM() {
    if (!currentBatchItems.length) {
        showToast("No batch items to schedule.", "error");
        return;
    }

    const scheduledTime = next10amDefault || getClientNext10AM();

    const formattedItems = currentBatchItems.map(item => ({
        to_email: item.recruiter_email,
        recruiter_name: item.recruiter_name,
        company: item.company,
        role: item.role,
        subject: item.subject,
        body: item.body
    }));

    try {
        const res = await fetch("/api/batch-schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                items: formattedItems,
                scheduled_for: scheduledTime
            })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            showToast(`${data.scheduled_count} applications scheduled for morning 10:00 AM (${scheduledTime})!`, "success");
            loadHistory();
            switchTab("history");
        } else {
            showToast(data.detail || data.message || "Failed to schedule batch.", "error");
        }
    } catch (e) {
        showToast("Error scheduling batch.", "error");
    }
}

// Custom Schedule Modal Handlers
function openCustomScheduleModal(target) {
    customScheduleTarget = target;
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const mins = String(now.getMinutes()).padStart(2, "0");
    document.getElementById("custom-schedule-datetime").value = `${year}-${month}-${day}T${hours}:${mins}`;

    document.getElementById("schedule-modal").classList.remove("hidden");
    lucide.createIcons();
}

function closeScheduleModal() {
    document.getElementById("schedule-modal").classList.add("hidden");
}

async function confirmCustomSchedule() {
    const val = document.getElementById("custom-schedule-datetime").value;
    if (!val) {
        showToast("Please pick a date and time.", "error");
        return;
    }

    const scheduled_for = val.replace("T", " ") + ":00";
    closeScheduleModal();

    if (customScheduleTarget === "single") {
        const to_email = document.getElementById("field-email").value.trim();
        const recruiter_name = document.getElementById("field-name").value.trim();
        const company = document.getElementById("field-company").value.trim();
        const role = document.getElementById("field-role").value.trim();
        const subject = document.getElementById("email-subject").value.trim();
        const body = document.getElementById("email-body").value.trim();

        if (!to_email) {
            showToast("Please provide recruiter email address.", "error");
            return;
        }

        try {
            const res = await fetch("/api/schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ to_email, recruiter_name, company, role, subject, body, scheduled_for })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast(`Application scheduled for ${scheduled_for}!`, "success");
                loadHistory();
                switchTab("history");
            }
        } catch (e) {
            showToast("Error scheduling application.", "error");
        }
    } else {
        const formattedItems = currentBatchItems.map(item => ({
            to_email: item.recruiter_email,
            recruiter_name: item.recruiter_name,
            company: item.company,
            role: item.role,
            subject: item.subject,
            body: item.body
        }));

        try {
            const res = await fetch("/api/batch-schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items: formattedItems, scheduled_for })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast(`${data.scheduled_count} applications scheduled for ${scheduled_for}!`, "success");
                loadHistory();
                switchTab("history");
            }
        } catch (e) {
            showToast("Error scheduling batch.", "error");
        }
    }
}

// Copy to clipboard with instant checkmark feedback
function copyEmailToClipboard() {
    const subject = document.getElementById("email-subject")?.value || "";
    const body = document.getElementById("email-body")?.value || "";
    if (!subject && !body) {
        showToast("Nothing to copy yet. Generate a draft first!", "info");
        return;
    }

    const cleanBody = body.replace(/<\/?b>/gi, "").replace(/\*\*/g, "");
    const fullText = `Subject: ${subject}\n\n${cleanBody}`;

    navigator.clipboard.writeText(fullText).then(() => {
        showToast("Clean email text copied to clipboard!", "success");
        const btn = document.getElementById("btn-copy-email");
        if (btn) {
            const originalHtml = btn.innerHTML;
            btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i> <span class="text-emerald-300 font-semibold">Copied!</span>`;
            lucide.createIcons();
            setTimeout(() => {
                btn.innerHTML = originalHtml;
                lucide.createIcons();
            }, 2000);
        }
    }).catch(() => {
        showToast("Failed to copy text.", "error");
    });
}

// Check SMTP & Resume Status
async function checkSmtpStatus() {
    try {
        const res = await fetch("/api/settings");
        const s = await res.json();
        const badge = document.getElementById("smtp-badge");
        const banner = document.getElementById("smtp-warning-banner");

        if (s.has_app_password) {
            badge.className = "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]";
            badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span><span>Gmail Configured</span>`;
            banner.classList.add("hidden");
        } else {
            badge.className = "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)] cursor-pointer hover:bg-amber-500/20 transition";
            badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span><span>Setup Gmail Password</span>`;
            banner.classList.remove("hidden");
        }
    } catch (e) {
        console.error(e);
    }
}

async function checkResumeStatus() {
    try {
        const res = await fetch("/api/resume-info");
        const info = await res.json();
        const text = document.getElementById("resume-status-text");
        const settingName = document.getElementById("setting-resume-filename");
        const settingSize = document.getElementById("setting-resume-size");
        const cardName = document.getElementById("card-resume-name");
        const cardSize = document.getElementById("card-resume-size");

        if (info.exists) {
            text.textContent = `Resume: ${info.filename}`;
            settingName.textContent = info.filename;
            settingSize.textContent = `${info.size_kb} KB - PDF format ready`;
            cardName.textContent = info.filename;
            cardSize.textContent = `${info.size_kb} KB - Attached automatically`;
        } else {
            text.textContent = "No Resume Found";
            settingName.textContent = "None";
            settingSize.textContent = "Please upload a resume PDF";
        }
    } catch (e) {
        console.error(e);
    }
}

// Load Settings into settings page
async function loadSettings() {
    try {
        const res = await fetch("/api/settings");
        const s = await res.json();
        document.getElementById("setting-sender-email").value = s.sender_email || "harsh19singh98@gmail.com";
        document.getElementById("setting-name").value = s.sender_name || "Harsh Kumar Singh";
        document.getElementById("setting-phone").value = s.sender_phone || "";
        document.getElementById("setting-linkedin").value = s.linkedin_url || "";
        document.getElementById("setting-company").value = s.current_company || "";
        if (s.has_app_password) {
            document.getElementById("setting-app-password").placeholder = `Current: ${s.masked_password}`;
        }
    } catch (e) {
        console.error(e);
    }
}

// Save Settings from UI
async function saveSettingsFromUi() {
    const sender_email = document.getElementById("setting-sender-email").value.trim();
    const app_pwd = document.getElementById("setting-app-password").value.trim();
    const sender_name = document.getElementById("setting-name").value.trim();
    const sender_phone = document.getElementById("setting-phone").value.trim();
    const linkedin_url = document.getElementById("setting-linkedin").value.trim();
    const current_company = document.getElementById("setting-company").value.trim();

    const payload = {
        sender_email,
        sender_name,
        sender_phone,
        linkedin_url,
        current_company
    };
    if (app_pwd) {
        payload.gmail_app_password = app_pwd;
    }

    try {
        const res = await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            showToast("Settings saved successfully!", "success");
            checkSmtpStatus();
            document.getElementById("setting-app-password").value = "";
            loadSettings();
        } else {
            showToast("Failed to save settings.", "error");
        }
    } catch (err) {
        showToast("Error updating settings.", "error");
    }
}

// Test SMTP connection
async function testSmtpConnection() {
    const sender_email = document.getElementById("setting-sender-email").value.trim();
    const gmail_app_password = document.getElementById("setting-app-password").value.trim();

    const resultBox = document.getElementById("smtp-test-result");
    resultBox.classList.remove("hidden");
    resultBox.className = "p-3.5 rounded-xl text-xs bg-zinc-900 border border-white/10 text-zinc-300 flex items-center gap-2";
    resultBox.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin text-cyan-400"></i> Testing connection to smtp.gmail.com...`;
    lucide.createIcons();

    try {
        const res = await fetch("/api/test-smtp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sender_email, gmail_app_password })
        });
        const data = await res.json();

        if (data.success) {
            resultBox.className = "p-3.5 rounded-xl text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20";
            resultBox.innerHTML = `<strong>✓ Success:</strong> ${data.message}`;
            checkSmtpStatus();
        } else {
            resultBox.className = "p-3.5 rounded-xl text-xs bg-rose-500/10 text-rose-300 border border-rose-500/20";
            resultBox.innerHTML = `<strong>✗ Connection Failed:</strong> ${data.message}`;
        }
    } catch (err) {
        resultBox.className = "p-3.5 rounded-xl text-xs bg-rose-500/10 text-rose-300 border border-rose-500/20";
        resultBox.innerHTML = `Error contacting server.`;
    }
}

// Toggle password view
function togglePasswordVisibility() {
    const pwdInput = document.getElementById("setting-app-password");
    if (pwdInput.type === "password") {
        pwdInput.type = "text";
    } else {
        pwdInput.type = "password";
    }
}

// Drop Zone & Drag-and-Drop Resume Handlers
function initDropZone() {
    const dropZone = document.getElementById("drop-zone");
    const fileInput = document.getElementById("resume-file-input");
    if (!dropZone || !fileInput) return;

    ["dragenter", "dragover"].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add("border-cyan-400", "bg-cyan-500/10");
            dropZone.classList.remove("border-white/15", "bg-zinc-950/40");
        }, false);
    });

    ["dragleave", "dragend"].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove("border-cyan-400", "bg-cyan-500/10");
            dropZone.classList.add("border-white/15", "bg-zinc-950/40");
        }, false);
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove("border-cyan-400", "bg-cyan-500/10");
        dropZone.classList.add("border-white/15", "bg-zinc-950/40");

        const dt = e.dataTransfer;
        if (dt && dt.files && dt.files.length > 0) {
            fileInput.files = dt.files;
            handleFileSelected({ target: fileInput });
        }
    }, false);
}

function handleFileSelected(event) {
    const input = event.target || document.getElementById("resume-file-input");
    const displayBox = document.getElementById("selected-file-display");
    const nameLabel = document.getElementById("selected-file-name");
    const btnText = document.getElementById("upload-btn-text");

    if (!input || !input.files || !input.files.length) {
        if (displayBox) displayBox.classList.add("hidden");
        if (btnText) btnText.textContent = "Upload & Set Active Resume";
        return;
    }

    const file = input.files[0];
    if (!file.name.toLowerCase().endsWith(".pdf")) {
        showToast("Please choose a valid PDF file (.pdf)", "error");
        input.value = "";
        if (displayBox) displayBox.classList.add("hidden");
        if (btnText) btnText.textContent = "Upload & Set Active Resume";
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showToast("File is larger than the 10MB size limit.", "error");
        input.value = "";
        if (displayBox) displayBox.classList.add("hidden");
        if (btnText) btnText.textContent = "Upload & Set Active Resume";
        return;
    }

    const sizeKb = Math.round(file.size / 1024);
    if (displayBox && nameLabel) {
        nameLabel.textContent = `Ready: ${file.name} (${sizeKb} KB)`;
        displayBox.classList.remove("hidden");
    }
    if (btnText) {
        btnText.textContent = `Upload & Save "${file.name}"`;
    }
    lucide.createIcons();
}

// Upload resume with visual progress feedback
async function uploadNewResume() {
    const fileInput = document.getElementById("resume-file-input");
    if (!fileInput || !fileInput.files.length) {
        showToast("Please select or drop a PDF file first.", "error");
        return;
    }

    const btn = document.getElementById("btn-upload-resume");
    const btnText = document.getElementById("upload-btn-text");
    const originalText = btnText ? btnText.textContent : "Upload";
    
    if (btn) btn.disabled = true;
    if (btnText) btnText.textContent = "Uploading PDF...";

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    try {
        const res = await fetch("/api/upload-resume", {
            method: "POST",
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            showToast(data.message || "Resume updated successfully!", "success");
            checkResumeStatus();
            fileInput.value = "";
            const displayBox = document.getElementById("selected-file-display");
            if (displayBox) displayBox.classList.add("hidden");
            if (btnText) btnText.textContent = "Upload & Set Active Resume";
        } else {
            showToast(data.detail || "Upload failed.", "error");
            if (btnText) btnText.textContent = originalText;
        }
    } catch (err) {
        showToast("Error uploading file.", "error");
        if (btnText) btnText.textContent = originalText;
    } finally {
        if (btn) btn.disabled = false;
        lucide.createIcons();
    }
}

// Keyboard shortcuts for production workflow
function initKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
        // Ctrl+Enter or Cmd+Enter to analyze input
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            const activeEl = document.activeElement;
            if (activeEl && activeEl.id === "raw-post-input") {
                e.preventDefault();
                processInput(true);
            }
        }

        // Escape key dismisses modals
        if (e.key === "Escape") {
            closeModal();
            closeScheduleModal();
        }
    });
}

// History functions
async function loadHistory() {
    try {
        const res = await fetch("/api/history");
        const data = await res.json();
        currentHistory = data.history || [];
        renderHistoryTable(currentHistory);
    } catch (e) {
        console.error(e);
    }
}

function renderHistoryTable(items) {
    const tbody = document.getElementById("history-table-body");
    if (!items.length) {
        tbody.innerHTML = `
            <tr>
              <td colspan="6" class="p-8 text-center text-zinc-500">
                <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50 text-zinc-600"></i>
                No job applications sent yet. Sent applications will be logged here automatically!
              </td>
            </tr>
        `;
        lucide.createIcons();
        return;
    }

    tbody.innerHTML = items.map(item => {
        let statusBadge = "";
        let actionButtons = `
            <button onclick="viewHistoryDetail(${item.id})" class="px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 rounded-lg text-[11px] font-medium border border-white/[0.08] transition">
              View
            </button>
            <button onclick="deleteHistoryItem(${item.id})" class="px-2.5 py-1 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[11px] font-medium border border-rose-500/20 transition">
              Delete
            </button>
        `;

        if (item.status === "SCHEDULED") {
            statusBadge = `
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  SCHEDULED &bull; ${item.scheduled_for}
                </span>
            `;
            actionButtons = `
                <button onclick="viewHistoryDetail(${item.id})" class="px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 rounded-lg text-[11px] font-medium border border-white/[0.08] transition">
                  View
                </button>
                <button onclick="cancelScheduledItem(${item.id})" class="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[11px] font-bold border border-amber-500/30 transition">
                  Cancel
                </button>
            `;
        } else if (item.status === "SENT") {
            statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">SENT</span>`;
        } else if (item.status === "CANCELLED") {
            statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-white/10">CANCELLED</span>`;
        } else {
            statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20" title="${item.error_message || ''}">FAILED</span>`;
        }

        return `
            <tr class="hover:bg-white/[0.03] transition border-b border-white/[0.05]">
              <td class="p-3.5 font-mono text-zinc-400">${item.sent_at}</td>
              <td class="p-3.5 font-semibold text-white">${item.recruiter_email}</td>
              <td class="p-3.5 font-medium text-zinc-300">${item.company || "-"}</td>
              <td class="p-3.5 text-zinc-400">${item.role || "-"}</td>
              <td class="p-3.5">${statusBadge}</td>
              <td class="p-3.5 text-right space-x-1.5">${actionButtons}</td>
            </tr>
        `;
    }).join("");
    lucide.createIcons();
}

async function cancelScheduledItem(id) {
    if (!confirm("Are you sure you want to cancel this scheduled email?")) return;
    try {
        const res = await fetch(`/api/cancel-scheduled/${id}`, { method: "POST" });
        const data = await res.json();
        if (data.success) {
            showToast("Scheduled email cancelled.", "info");
            loadHistory();
        }
    } catch (e) {
        showToast("Error cancelling item.", "error");
    }
}

function filterHistoryTable() {
    const query = document.getElementById("history-search").value.toLowerCase();
    const filtered = currentHistory.filter(i => 
        (i.recruiter_email && i.recruiter_email.toLowerCase().includes(query)) ||
        (i.company && i.company.toLowerCase().includes(query)) ||
        (i.role && i.role.toLowerCase().includes(query))
    );
    renderHistoryTable(filtered);
}

function viewHistoryDetail(id) {
    const item = currentHistory.find(i => i.id === id);
    if (!item) return;

    document.getElementById("modal-to").textContent = `${item.recruiter_name ? item.recruiter_name + " <" : ""}${item.recruiter_email}${item.recruiter_name ? ">" : ""}`;
    document.getElementById("modal-subject").textContent = item.subject;
    document.getElementById("modal-date").textContent = item.sent_at;
    
    // Render body with bold keywords
    let formatted = item.body.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    formatted = formatted.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank">$1</a>');
    formatted = formatted.replace(/(\+91\s*\d{10})/g, '<a href="tel:$1">$1</a>');
    document.getElementById("modal-body").innerHTML = formatted;

    document.getElementById("view-modal").classList.remove("hidden");
    lucide.createIcons();
}

function closeModal() {
    document.getElementById("view-modal").classList.add("hidden");
}

async function deleteHistoryItem(id) {
    if (!confirm("Are you sure you want to delete this log?")) return;
    try {
        await fetch(`/api/history/${id}`, { method: "DELETE" });
        loadHistory();
        showToast("Log entry deleted.", "info");
    } catch (e) {
        showToast("Error deleting item.", "error");
    }
}

async function clearAllHistoryConfirm() {
    if (!confirm("Are you sure you want to clear all sent history logs?")) return;
    try {
        await fetch("/api/history/clear", { method: "POST" });
        loadHistory();
        showToast("All history cleared.", "info");
    } catch (e) {
        showToast("Error clearing history.", "error");
    }
}
