"""
REPSI help knowledge base for the AI assistant and support assistant.

Most questions are answered straight from here with zero model calls: a keyword match above
`DIRECT_ANSWER_SCORE` returns the entry as-is. Only unclear questions go to Gemini, and then only
the top few entries are sent as context. Paths are relative to the workspace (`/{slug}` + path)
and are the only links the assistant may return.

Audience: "staff" (owner/admin/manager/staff), "trainer", "member", or "all".
"""
import re
from dataclasses import dataclass


@dataclass(frozen=True)
class KbEntry:
    id: str
    title: str
    audience: tuple
    keywords: tuple
    answer: str
    path: str = ""


STAFF = ("staff",)
MEMBER = ("member",)
TRAINER = ("trainer",)
ALL = ("staff", "trainer", "member")

ENTRIES: tuple[KbEntry, ...] = (
    # ── Owner / staff navigation ─────────────────────────────────────
    KbEntry("add-member", "Add a member", STAFF, ("add", "new", "member", "register", "create", "join", "signup"),
            "Open Members and choose Add member. Enter name and phone (email optional), pick a plan to start a membership, then save. REPSI blocks duplicate phones/emails and checks your plan's member limit.",
            "/members/new"),
    KbEntry("import-members", "Import members from a spreadsheet", STAFF, ("import", "csv", "excel", "bulk", "upload", "spreadsheet", "members"),
            "Open Members and use Import. Upload a CSV with first name, phone and optional email/plan columns. Each row is validated; duplicates and rows over your plan limit are reported with their row number.",
            "/members"),
    KbEntry("find-member", "Find or edit a member", STAFF, ("find", "search", "edit", "member", "profile", "details", "update"),
            "Use Members (or the search bar at the top). Open a member to see their profile, memberships, payments, attendance, notes and training.",
            "/members"),
    KbEntry("member-status", "Suspend, archive or reactivate a member", STAFF, ("suspend", "archive", "deactivate", "reactivate", "inactive", "status", "block"),
            "Open the member, then change their status. Suspend and archive need a reason and an owner/admin/manager. Reactivating counts against your plan's member limit.",
            "/members"),
    KbEntry("plans", "Create membership plans", STAFF, ("plan", "plans", "membership", "price", "pricing", "package", "duration", "create"),
            "Open Memberships to create plans with a duration and price. Existing members keep the price they signed up with when you edit a plan.",
            "/memberships"),
    KbEntry("assign-membership", "Assign or renew a membership", STAFF, ("assign", "renew", "renewal", "extend", "membership", "start"),
            "Open the member and use Renew or Assign membership. Choose whether it starts after the current one ends or today. Extensions need a reason and are recorded in the history.",
            "/members"),
    KbEntry("freeze", "Freeze or unfreeze a membership", STAFF, ("freeze", "pause", "hold", "unfreeze", "resume", "vacation", "travel"),
            "Open the member's membership and choose Freeze with dates and a reason. When it resumes, the end date moves by the frozen days. Frozen members can't check in.",
            "/members"),
    KbEntry("record-payment", "Record a payment", STAFF, ("payment", "pay", "paid", "record", "cash", "upi", "fee", "collect", "receipt"),
            "Open Payments (or the member) and record the amount and method. Partial payments leave a balance you can see on the member. Members' uploaded payment proofs appear in the verification queue.",
            "/payments"),
    KbEntry("dues", "See unpaid dues and balances", STAFF, ("due", "dues", "unpaid", "balance", "pending", "outstanding", "owe", "defaulter"),
            "Open AI Insights > Smart reminders for members with unpaid balances, expiring and expired memberships, and freezes ending soon. You can message a group in one click.",
            "/insights"),
    KbEntry("check-in", "Check members in", STAFF, ("check", "checkin", "attendance", "entry", "scan", "qr", "door", "front", "desk"),
            "Use Attendance > Check-in to search a member or scan their QR pass. REPSI checks membership, freezes and dues before letting them in. Use Attendance > Display for a self check-in QR screen.",
            "/attendance/check-in"),
    KbEntry("attendance-reports", "Attendance reports and peak hours", STAFF, ("attendance", "report", "peak", "busy", "visits", "hours", "crowd"),
            "Open Attendance > Reports for visits by day and hour. AI Insights also summarizes peak times in plain language.",
            "/attendance/reports"),
    KbEntry("trainers", "Add trainers and assign clients", STAFF, ("trainer", "trainers", "coach", "assign", "client", "pt", "personal"),
            "Open Trainers to add a trainer (counts against your plan's trainer limit) and assign members to them. Trainers only see their assigned clients.",
            "/trainers"),
    KbEntry("workouts", "Workout programs and exercise library", ALL, ("workout", "program", "exercise", "routine", "training", "plan", "library"),
            "Open Workouts to browse the exercise library, build programs and assign them to members. Members see their schedule under My Workout.",
            "/workouts"),
    KbEntry("staff-roles", "Invite staff and set permissions", STAFF, ("staff", "team", "invite", "role", "permission", "manager", "admin", "employee", "access"),
            "Open Settings > Team & Roles to invite admins, managers and front-desk staff, and grant or revoke individual permissions. Staff accounts count against your plan's staff limit.",
            "/settings/team"),
    KbEntry("broadcast", "Send an announcement to members", STAFF, ("broadcast", "announce", "announcement", "message", "notify", "send", "whatsapp", "email", "sms", "everyone"),
            "Open Broadcasts, choose an audience (all, expiring, expired, new or hand-picked members), pick in-app, email or WhatsApp, preview the recipient count and send. Every delivery's status is logged.",
            "/broadcasts"),
    KbEntry("templates", "Reusable message templates", STAFF, ("template", "templates", "reuse", "saved", "message"),
            "Open Broadcasts > Templates to save messages you send often. WhatsApp needs a template already approved with your provider.",
            "/broadcasts"),
    KbEntry("insights", "Business insights", STAFF, ("insight", "insights", "business", "performance", "summary", "how", "doing", "growth", "kpi", "revenue", "analytics"),
            "Open AI Insights for a plain-language summary of members, revenue and attendance over the last 30 days, with suggested actions.",
            "/insights"),
    KbEntry("reports", "Reports", STAFF, ("report", "reports", "export", "download", "pdf", "excel", "csv"),
            "Open Reports for business reports. AI Insights can turn the revenue, attendance and membership reports into plain-language summaries. Member CSV export is on plans that include data export.",
            "/reports"),
    KbEntry("billing", "Your REPSI plan, limits and billing", STAFF, ("subscription", "billing", "upgrade", "plan", "limit", "trial", "invoice", "repsi", "price"),
            "Open Settings > Subscription & Billing to see your plan, trial days left, and usage against member, trainer, staff and branch limits.",
            "/settings/billing"),
    KbEntry("settings", "Gym settings, hours and branches", STAFF, ("settings", "hours", "timing", "branch", "location", "logo", "timezone", "gst", "address"),
            "Open Settings to update your gym profile, opening hours, timezone, branches and payment details.",
            "/settings"),
    KbEntry("website", "Gym website", STAFF, ("website", "site", "page", "online", "landing", "domain"),
            "Open Website Builder to publish a simple website for your gym with plans and contact details.",
            "/website"),
    KbEntry("crm", "Leads and enquiries", STAFF, ("lead", "leads", "enquiry", "inquiry", "crm", "prospect", "follow", "followup", "walkin"),
            "Open CRM & Leads to track enquiries, schedule follow-ups and convert a lead into a member.",
            "/crm"),
    KbEntry("expenses", "Track expenses", STAFF, ("expense", "expenses", "rent", "salary", "bill", "cost", "spend"),
            "Open Expenses to record rent, salaries and other costs so profit is visible next to revenue.",
            "/expenses"),
    KbEntry("equipment", "Equipment and machines", STAFF, ("equipment", "machine", "machines", "maintenance", "repair"),
            "Open Equipment to list machines and track maintenance.",
            "/machines"),
    # ── Trainer ──────────────────────────────────────────────────────
    KbEntry("trainer-clients", "My clients", TRAINER, ("client", "clients", "members", "assigned", "my"),
            "Open Clients to see the members assigned to you, their programs and progress.",
            "/trainer/clients"),
    KbEntry("trainer-schedule", "My schedule and sessions", TRAINER, ("schedule", "session", "sessions", "calendar", "today", "class"),
            "Open Schedule for today's sessions and classes.",
            "/trainer/schedule"),
    # ── Member self-service ──────────────────────────────────────────
    KbEntry("member-qr", "My check-in pass", MEMBER, ("qr", "pass", "check", "checkin", "entry", "code", "scan"),
            "Open My QR to show your check-in pass at the desk. It refreshes every minute, so screenshots won't work.",
            "/member/qr"),
    KbEntry("member-membership", "My membership", MEMBER, ("membership", "expire", "expiry", "renew", "plan", "valid", "days", "left"),
            "Open My Membership to see your plan, start and end dates, freezes and days left. Ask the front desk to renew or freeze.",
            "/member/membership"),
    KbEntry("member-payments", "My payments and receipts", MEMBER, ("payment", "payments", "pay", "receipt", "due", "balance", "invoice", "upi", "proof"),
            "Open Payments to see what you've paid, any balance due, and to upload a payment proof for the gym to verify.",
            "/member/payments"),
    KbEntry("member-workout", "My workouts", MEMBER, ("workout", "today", "exercise", "plan", "routine", "program", "train"),
            "Open My Workout for today's session from your assigned program. You can log sets and see progress under Progress.",
            "/member/workout"),
    KbEntry("member-ai-coach", "Get workout suggestions", MEMBER, ("suggest", "suggestion", "ai", "coach", "goal", "lose", "weight", "gain", "muscle", "beginner", "routine"),
            "Open AI Coach, answer a few questions about your goal, experience, days and equipment, and get a suggested weekly routine from your gym's exercise library.",
            "/member/ai-coach"),
    KbEntry("member-steps", "Steps and Google Fit", MEMBER, ("steps", "google", "fit", "connect", "integration", "watch", "tracker"),
            "Open Integrations to connect activity tracking.",
            "/member/integrations"),
    KbEntry("member-trainer", "My trainer", MEMBER, ("trainer", "coach", "pt", "contact"),
            "Open My Trainer to see who's coaching you.",
            "/member/trainer"),
    KbEntry("notification-prefs", "Notification settings", ALL, ("notification", "notifications", "alerts", "unsubscribe", "stop", "opt", "whatsapp", "email", "preferences"),
            "Open Notifications to switch in-app, email, WhatsApp and announcement messages on or off. WhatsApp is only sent after you opt in.",
            "/notifications"),
    # ── Support / product FAQ ────────────────────────────────────────
    KbEntry("faq-data-safety", "Is my data safe?", ALL, ("safe", "secure", "security", "privacy", "data", "private", "gdpr"),
            "Each gym's data is isolated from other gyms, every request is permission-checked, and sensitive actions are audit-logged. REPSI's AI only receives totals and anonymous figures, never member names or contact details.",
            ""),
    KbEntry("faq-ai", "How does REPSI's AI work?", ALL, ("ai", "gemini", "artificial", "intelligence", "assistant", "chatbot", "accurate"),
            "REPSI's AI rewrites numbers REPSI has already calculated into plain language and suggests next steps. It never sees member names or contact details, and it has a daily usage limit per gym.",
            ""),
    KbEntry("faq-support", "Contact REPSI support", ALL, ("support", "help", "contact", "bug", "problem", "issue", "error", "human", "agent"),
            "If something isn't working, note what you were doing and any request ID shown with the error, and contact REPSI support from the help page. Gym members should contact their gym's front desk first.",
            ""),
    KbEntry("faq-password", "Forgot password or can't log in", ALL, ("password", "forgot", "reset", "login", "signin", "otp", "locked"),
            "Use Forgot password on the sign-in page, or sign in with WhatsApp OTP if your phone is verified.",
            ""),
)

STOPWORDS = frozenset(
    "a an the to i my me we our you your how do does can is are of in on for with and or what where when why "
    "it this that be please there get set up use using want need show see".split()
)
DIRECT_ANSWER_SCORE = 2.5
_WORD = re.compile(r"[a-z0-9]+")


def tokens(text: str) -> list[str]:
    return [w for w in _WORD.findall((text or "").lower()) if w not in STOPWORDS and len(w) > 1]


def audience_for(role: str) -> str:
    if role == "USER":
        return "member"
    if role == "TRAINER":
        return "trainer"
    return "staff"


def search(question: str, role: str, limit: int = 4) -> list[tuple[float, KbEntry]]:
    """Keyword overlap scoring (title words weigh more). Deterministic and free."""
    audience = audience_for(role)
    words = tokens(question)
    if not words:
        return []
    scored = []
    for e in ENTRIES:
        if audience not in e.audience:
            continue
        kw, title = set(e.keywords), set(tokens(e.title))
        score = 0.0
        for w in words:
            stem = w.rstrip("s")
            if w in kw or stem in kw:
                score += 1.0
            if w in title or stem in title:
                score += 0.5
        if score:
            scored.append((score, e))
    scored.sort(key=lambda x: -x[0])
    return scored[:limit]


def allowed_paths(role: str) -> set[str]:
    audience = audience_for(role)
    return {e.path for e in ENTRIES if audience in e.audience and e.path}
