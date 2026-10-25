"""
REPSI AI features, built to be useful with zero model calls and cheap when Gemini is used.

| Feature              | Free path (always available)                 | Gemini adds                          | Cache            |
|----------------------|----------------------------------------------|--------------------------------------|------------------|
| Assistant / support  | knowledge-base keyword match                 | answer for unclear questions         | global, 7 days   |
| Business insights    | SQL metrics + rule-based highlights          | plain-language summary + actions     | gym, per day     |
| Report summaries     | SQL report data + template summary           | plain-language summary               | gym+type, per day|
| Smart reminders      | rule-based groups (no AI at all)             | -                                    | -                |
| Workout suggestions  | rule-based weekly plan from the gym library  | personalised plan (opt-in per request)| gym+answers, 30d |

Data sent to Gemini: aggregates, library exercise names and the user's scrubbed free text only.
"""
from __future__ import annotations

import json
import re
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import and_, exists, extract, func, select
from sqlalchemy.orm import Session

from app.core import ai_knowledge as kb
from app.models.attendance import Attendance
from app.models.finance import Payment, PaymentStatus
from app.models.fitness import Exercise
from app.models.member import Member, MemberStatus, Membership
from app.models.member_records import MembershipFreeze
from app.models.user import Workspace
from app.services import ai_core
from app.services.ai_core import AiContext, AiResult, clean_list, clean_text, scrub_pii
from app.services.communication import workspace_today

WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


def _pct(now: float, before: float) -> Optional[float]:
    return round((now - before) / before * 100, 1) if before else None


def _naive(d: date) -> datetime:
    return datetime(d.year, d.month, d.day)


# ─── Assistant / support ───────────────────────────────────────────────


def assistant(db: Session, ctx: AiContext, question: str) -> dict:
    q = clean_text(scrub_pii(question), 500)
    if len(q) < 2:
        raise HTTPException(status_code=422, detail="Ask a question about REPSI.")
    hits = kb.search(q, ctx.role)
    paths = kb.allowed_paths(ctx.role)

    def entry_answer(e: kb.KbEntry) -> dict:
        return {"answer": e.answer, "links": [{"title": e.title, "path": e.path}] if e.path else [],
                "related": [h.title for _, h in hits[1:4]]}

    top_score = hits[0][0] if hits else 0
    clear_winner = hits and (len(hits) == 1 or top_score - hits[1][0] >= 1.0)
    if top_score >= kb.DIRECT_ANSWER_SCORE and clear_winner:
        ai_core.log_usage(db, ctx, "assistant", "kb")
        return {**entry_answer(hits[0][1]), "source": "kb", "notice": None}

    def fallback() -> dict:
        if hits:
            return entry_answer(hits[0][1])
        return {"answer": "I couldn't find that in REPSI's help. Try different words, or contact support from the help page.",
                "links": [], "related": [e.title for e in kb.ENTRIES if kb.audience_for(ctx.role) in e.audience][:4]}

    if not hits:
        ai_core.log_usage(db, ctx, "assistant", "kb")
        return {**fallback(), "source": "kb", "notice": None}

    context = [{"title": e.title, "path": e.path, "help": e.answer} for _, e in hits]
    by_path = {e.path: e.title for _, e in hits if e.path}

    def validate(raw: dict) -> dict:
        answer = clean_text(raw.get("answer"), 700)
        if len(answer) < 5:
            raise ValueError("empty answer")
        links = [p for p in (raw.get("paths") or []) if isinstance(p, str) and p in paths and p in by_path][:3]
        return {"answer": answer, "links": [{"title": by_path[p], "path": p} for p in links],
                "related": [e.title for _, e in hits if e.path not in links][:3]}

    result = ai_core.run(
        db, ctx, "assistant",
        system=("Answer the user's question about using REPSI using only the help entries provided. "
                "If they don't cover it, say you're not sure and suggest contacting support. "
                'Shape: {"answer": string (max 80 words), "paths": [up to 2 "path" values from the entries]}'),
        prompt=json.dumps({"help_entries": context}) + f"\n<user_input>{q}</user_input>",
        validate=validate, fallback=fallback, max_tokens=250, temperature=0.2,
        key=ai_core.cache_key("assistant", kb.audience_for(ctx.role), sorted(set(kb.tokens(q)))),
        ttl=timedelta(days=7),
    )
    return {**result.data, "source": result.source, "notice": result.notice}


# ─── Business metrics (deterministic, tenant-scoped) ───────────────────


def _balance_rows(db: Session, workspace_id: str):
    paid = (
        select(Payment.membership_id.label("mid"), func.coalesce(func.sum(Payment.amount), 0.0).label("paid"))
        .where(Payment.workspace_id == workspace_id, Payment.status == PaymentStatus.SUCCESS, Payment.membership_id.isnot(None))
        .group_by(Payment.membership_id).subquery()
    )
    due = Membership.price_paid - func.coalesce(paid.c.paid, 0.0)
    return (
        select(Membership.id, Membership.member_id, Membership.status, Membership.end_date, due.label("due"))
        .outerjoin(paid, paid.c.mid == Membership.id)
        .where(Membership.workspace_id == workspace_id,
               Membership.status.in_([MemberStatus.ACTIVE, MemberStatus.FROZEN]), due > 0.5)
    )


def business_metrics(db: Session, workspace_id: str) -> dict:
    ws = db.get(Workspace, workspace_id)
    today = workspace_today(ws)
    d30, d60 = today - timedelta(days=30), today - timedelta(days=60)
    W = Member.workspace_id == workspace_id
    MS = Membership.workspace_id == workspace_id

    def count(*where) -> int:
        return db.scalar(select(func.count()).select_from(Member).where(W, *where)) or 0

    live = and_(MS, Membership.member_id == Member.id, Membership.status == MemberStatus.ACTIVE,
                Membership.start_date <= today, Membership.end_date >= today)
    latest_end = (select(Membership.member_id, func.max(Membership.end_date).label("last_end"))
                  .where(MS, Membership.status.in_([MemberStatus.ACTIVE, MemberStatus.EXPIRED]))
                  .group_by(Membership.member_id).subquery())
    lapsed = db.scalar(select(func.count()).select_from(latest_end).where(
        latest_end.c.last_end < today, latest_end.c.last_end >= d30)) or 0

    def collected(start: date, end: date) -> float:
        return float(db.scalar(select(func.coalesce(func.sum(Payment.amount), 0.0)).where(
            Payment.workspace_id == workspace_id, Payment.status == PaymentStatus.SUCCESS,
            Payment.paid_at >= _naive(start), Payment.paid_at < _naive(end))) or 0.0)

    balances = db.execute(_balance_rows(db, workspace_id)).all()

    A = Attendance.workspace_id == workspace_id

    def visits(start: date, end: date) -> int:
        return db.scalar(select(func.count(Attendance.id)).where(
            A, Attendance.check_in_time >= _naive(start), Attendance.check_in_time < _naive(end))) or 0

    recent = and_(A, Attendance.check_in_time >= _naive(d30))
    by_dow = {
        int(row[0]): int(row[1])
        for row in db.execute(
            select(extract("dow", Attendance.check_in_time), func.count())
            .where(recent)
            .group_by(extract("dow", Attendance.check_in_time))
        ).all()
        if row[0] is not None
    }
    by_hour = {
        int(row[0]): int(row[1])
        for row in db.execute(
            select(extract("hour", Attendance.check_in_time), func.count())
            .where(recent)
            .group_by(extract("hour", Attendance.check_in_time))
        ).all()
        if row[0] is not None
    }
    visits_30 = visits(d30, today + timedelta(days=1))
    busiest_dow = max(by_dow, key=lambda k: by_dow[k]) if by_dow else None
    busiest_hour = max(by_hour, key=lambda k: by_hour[k]) if by_hour else None

    return {
        "period": f"last 30 days to {today.isoformat()}",
        "currency": (ws.currency if ws and getattr(ws, "currency", None) else "INR"),
        "members": {
            "active_accounts": count(Member.status == MemberStatus.ACTIVE),
            "with_active_membership": count(Member.status == MemberStatus.ACTIVE, exists().where(live)),
            "new_last_30d": count(Member.joined_date >= d30),
            "new_previous_30d": count(Member.joined_date >= d60, Member.joined_date < d30),
            "expiring_next_7d": db.scalar(select(func.count(func.distinct(Membership.member_id))).where(
                MS, Membership.status == MemberStatus.ACTIVE, Membership.end_date >= today,
                Membership.end_date <= today + timedelta(days=7))) or 0,
            "lapsed_last_30d": lapsed,
            "frozen": db.scalar(select(func.count(Membership.id)).where(MS, Membership.status == MemberStatus.FROZEN)) or 0,
        },
        "revenue": {
            "collected_last_30d": round(collected(d30, today + timedelta(days=1)), 2),
            "collected_previous_30d": round(collected(d60, d30), 2),
            "outstanding_dues": round(sum(float(r.due) for r in balances), 2),
            "members_with_dues": len({r.member_id for r in balances}),
        },
        "attendance": {
            "visits_last_30d": visits_30,
            "visits_previous_30d": visits(d60, d30),
            "average_daily_visits": round(visits_30 / 30, 1),
            "busiest_weekday": WEEKDAYS[int(busiest_dow)] if busiest_dow is not None else None,
            "busiest_hour_utc": int(busiest_hour) if busiest_hour is not None else None,
        },
    }


def rule_highlights(m: dict) -> list[str]:
    out = []
    mem, rev, att = m["members"], m["revenue"], m["attendance"]
    cur = m["currency"]
    change = _pct(rev["collected_last_30d"], rev["collected_previous_30d"])
    if change is not None:
        out.append(f"Collections {'up' if change >= 0 else 'down'} {abs(change)}% vs the previous 30 days "
                   f"({cur} {rev['collected_last_30d']:,.0f}).")
    elif rev["collected_last_30d"]:
        out.append(f"{cur} {rev['collected_last_30d']:,.0f} collected in the last 30 days.")
    if rev["members_with_dues"]:
        out.append(f"{rev['members_with_dues']} member(s) owe {cur} {rev['outstanding_dues']:,.0f} in total.")
    out.append(f"{mem['new_last_30d']} new member(s) joined (previous 30 days: {mem['new_previous_30d']}).")
    if mem["expiring_next_7d"]:
        out.append(f"{mem['expiring_next_7d']} membership(s) end in the next 7 days.")
    if mem["lapsed_last_30d"]:
        out.append(f"{mem['lapsed_last_30d']} member(s) lapsed in the last 30 days without renewing.")
    vchange = _pct(att["visits_last_30d"], att["visits_previous_30d"])
    if att["visits_last_30d"]:
        busiest = f" Busiest day: {att['busiest_weekday']}." if att["busiest_weekday"] else ""
        trend = f" ({'+' if vchange >= 0 else ''}{vchange}% vs before)" if vchange is not None else ""
        out.append(f"{att['visits_last_30d']} visits, about {att['average_daily_visits']} a day{trend}.{busiest}")
    return out


def rule_actions(m: dict) -> list[str]:
    acts = []
    if m["revenue"]["members_with_dues"]:
        acts.append("Send a dues reminder to members with unpaid balances (Smart reminders).")
    if m["members"]["expiring_next_7d"]:
        acts.append("Message members whose membership ends this week about renewing.")
    if m["members"]["lapsed_last_30d"]:
        acts.append("Run a win-back offer for recently lapsed members.")
    if m["members"]["new_last_30d"] < m["members"]["new_previous_30d"]:
        acts.append("New sign-ups slowed: follow up on open leads in CRM.")
    return acts[:3] or ["Keep tracking: no urgent actions this week."]


def _summary_validator(max_points: int):
    def validate(raw: dict) -> dict:
        summary = clean_text(raw.get("summary"), 600)
        if len(summary) < 10:
            raise ValueError("summary too short")
        return {"summary": summary, "highlights": clean_list(raw.get("highlights"), max_points, 200),
                "actions": clean_list(raw.get("actions"), 3, 200)}
    return validate


def insights(db: Session, ctx: AiContext) -> dict:
    if not ctx.workspace_id:
        raise HTTPException(status_code=400, detail="Workspace context required.")
    m = business_metrics(db, ctx.workspace_id)
    hl, acts = rule_highlights(m), rule_actions(m)

    def fallback() -> dict:
        return {"summary": " ".join(hl[:2]) or "Not enough activity yet to summarize.", "highlights": hl, "actions": acts}

    result = ai_core.run(
        db, ctx, "insights",
        system=("Summarize this gym's last 30 days for the owner from the metrics JSON. Mention the most important "
                "change first, compare with the previous period, and suggest concrete next steps that REPSI supports "
                "(reminders, broadcasts, renewals, CRM follow-ups). "
                'Shape: {"summary": string (max 70 words), "highlights": [max 4 short strings], "actions": [max 3 short strings]}'),
        prompt=json.dumps({"metrics": m}),
        validate=_summary_validator(4), fallback=fallback, max_tokens=350,
        key=ai_core.cache_key("insights", ctx.workspace_id, [m["period"], m]), ttl=timedelta(hours=24),
    )
    return {**result.data, "metrics": m, "source": result.source, "notice": result.notice}


# ─── Report summaries ──────────────────────────────────────────────────

REPORT_TYPES = ("overview", "revenue", "attendance", "memberships")


def report_data(db: Session, workspace_id: str, report_type: str) -> dict:
    m = business_metrics(db, workspace_id)
    if report_type == "overview":
        return m
    if report_type == "memberships":
        return {"period": m["period"], "members": m["members"]}
    if report_type == "attendance":
        today = workspace_today(db.get(Workspace, workspace_id))
        since = _naive(today - timedelta(days=30))
        rows = db.execute(select(extract("dow", Attendance.check_in_time), func.count())
                          .where(Attendance.workspace_id == workspace_id, Attendance.check_in_time >= since)
                          .group_by(extract("dow", Attendance.check_in_time))).all()
        return {"period": m["period"], "attendance": m["attendance"],
                "visits_by_weekday": {WEEKDAYS[int(d)]: c for d, c in rows}}
    if report_type == "revenue":
        today = workspace_today(db.get(Workspace, workspace_id))
        months = []
        y, mo = today.year, today.month
        for _ in range(6):
            start = date(y, mo, 1)
            end = date(y + (mo == 12), mo % 12 + 1, 1)
            total = db.scalar(select(func.coalesce(func.sum(Payment.amount), 0.0)).where(
                Payment.workspace_id == workspace_id, Payment.status == PaymentStatus.SUCCESS,
                Payment.paid_at >= _naive(start), Payment.paid_at < _naive(end))) or 0.0
            months.append({"month": start.strftime("%b %Y"), "collected": round(float(total), 2)})
            y, mo = (y - 1, 12) if mo == 1 else (y, mo - 1)
        return {"period": "last 6 months", "currency": m["currency"], "revenue": m["revenue"],
                "collected_by_month": list(reversed(months))}
    raise HTTPException(status_code=422, detail=f"Unknown report type. Use one of: {', '.join(REPORT_TYPES)}.")


def report_summary(db: Session, ctx: AiContext, report_type: str) -> dict:
    ws_id = ctx.workspace_id
    if not ws_id:
        raise HTTPException(status_code=400, detail="Workspace context required.")
    data = report_data(db, ws_id, report_type)

    def fallback() -> dict:
        if report_type == "revenue":
            months = data["collected_by_month"]
            best = max(months, key=lambda x: x["collected"])
            pts = [f"{x['month']}: {data['currency']} {x['collected']:,.0f}" for x in months]
            lead = (f"Best month in the last 6 was {best['month']} ({data['currency']} {best['collected']:,.0f})."
                    if best["collected"] > 0 else "No payments were recorded in the last 6 months.")
            return {"summary": f"{lead} {data['revenue']['members_with_dues']} member(s) currently have dues.",
                    "highlights": pts[-4:], "actions": []}
        full = business_metrics(db, ws_id) if report_type != "overview" else data
        hl = rule_highlights(full)
        keep = {"memberships": ("member", "joined", "lapsed", "end"), "attendance": ("visit",)}.get(report_type)
        if keep:
            hl = [h for h in hl if any(k in h for k in keep)] or hl
        return {"summary": " ".join(hl[:2]) or "Not enough data yet.", "highlights": hl[:4], "actions": rule_actions(full)}

    result = ai_core.run(
        db, ctx, "report",
        system=(f"Explain this gym {report_type} report in plain language for a busy owner with no analytics background. "
                "Point out trends and anything unusual, using only the numbers given. "
                'Shape: {"summary": string (max 60 words), "highlights": [max 4 short strings], "actions": [max 2 short strings]}'),
        prompt=json.dumps({"report": report_type, "data": data}),
        validate=_summary_validator(4), fallback=fallback, max_tokens=300,
        key=ai_core.cache_key("report", ctx.workspace_id, [report_type, data]), ttl=timedelta(hours=24),
    )
    return {**result.data, "report_type": report_type, "data": data, "source": result.source, "notice": result.notice}


# ─── Smart reminders (rules only, zero AI cost) ────────────────────────

REMINDER_TEMPLATES = {
    "unpaid_dues": ("Payment reminder from {{gym_name}}",
                    "Hi {{first_name}}, a balance is pending on your membership at {{gym_name}}. Please clear it at the front desk or upload your payment proof in the app. Thank you!"),
    "expiring_soon": ("Your membership ends soon",
                      "Hi {{first_name}}, your {{gym_name}} membership ends this week. Renew now to keep your streak going!"),
    "lapsed": ("We miss you at {{gym_name}}",
               "Hi {{first_name}}, it's been a while! Come back to {{gym_name}} — ask the front desk about renewing your membership."),
    "freeze_ending": ("Your membership freeze ends soon",
                      "Hi {{first_name}}, your membership freeze at {{gym_name}} ends soon. We're looking forward to seeing you back!"),
    "frozen_unpaid": ("Clear your dues before your freeze ends",
                      "Hi {{first_name}}, your membership at {{gym_name}} is on freeze and has a pending balance. Please clear it so you can resume without interruption."),
    "inactive": ("We haven't seen you in a while",
                 "Hi {{first_name}}, your membership at {{gym_name}} is active but we haven't seen you for two weeks. Need a new plan? Talk to your trainer!"),
}
REMINDER_LABELS = {
    "unpaid_dues": "Unpaid balances",
    "expiring_soon": "Memberships ending in 7 days",
    "lapsed": "Lapsed in the last 30 days (not renewed)",
    "freeze_ending": "Freezes ending in 7 days",
    "frozen_unpaid": "Frozen with unpaid balance",
    "inactive": "Active but no visit in 14 days",
}


def smart_reminders(db: Session, workspace_id: str, limit: int = 50) -> dict:
    ws = db.get(Workspace, workspace_id)
    today = workspace_today(ws)
    MS = Membership.workspace_id == workspace_id
    groups: dict[str, dict[str, dict]] = {k: {} for k in REMINDER_TEMPLATES}

    members = {str(m.id): m for m in db.scalars(select(Member).where(
        Member.workspace_id == workspace_id, Member.status == MemberStatus.ACTIVE)).all()}

    def add(group: str, member_id: str, detail: str) -> None:
        mid = str(member_id)
        m = members.get(mid)
        if m and mid not in groups[group]:
            groups[group][mid] = {"member_id": str(m.id), "name": f"{m.first_name} {m.last_name or ''}".strip(),
                                  "detail": detail}

    for r in db.execute(_balance_rows(db, workspace_id)).all():
        group = "frozen_unpaid" if r.status == MemberStatus.FROZEN else "unpaid_dues"
        add(group, str(r.member_id), f"Due {r.due:,.0f}")

    for ms in db.scalars(select(Membership).where(
            MS, Membership.status == MemberStatus.ACTIVE, Membership.end_date >= today,
            Membership.end_date <= today + timedelta(days=7))).all():
        renewed = db.scalar(select(func.count(Membership.id)).where(
            MS, Membership.member_id == ms.member_id, Membership.start_date > ms.end_date,
            Membership.status == MemberStatus.ACTIVE)) or 0
        if not renewed:
            add("expiring_soon", str(ms.member_id), f"Ends {ms.end_date.isoformat()}")

    latest = {
        str(row[0]): row[1]
        for row in db.execute(select(Membership.member_id, func.max(Membership.end_date)).where(
            MS, Membership.status.in_([MemberStatus.ACTIVE, MemberStatus.EXPIRED])).group_by(Membership.member_id)).all()
        if row[0] is not None and row[1] is not None
    }
    for member_id, last_end in latest.items():
        if today - timedelta(days=30) <= last_end < today:
            add("lapsed", str(member_id), f"Ended {last_end.isoformat()}")

    for fz, ms in db.execute(select(MembershipFreeze, Membership).join(Membership, Membership.id == MembershipFreeze.membership_id).where(
            MembershipFreeze.workspace_id == workspace_id, MembershipFreeze.resumed_at.is_(None),
            MembershipFreeze.end_date >= today, MembershipFreeze.end_date <= today + timedelta(days=7))).all():
        add("freeze_ending", ms.member_id, f"Freeze ends {fz.end_date.isoformat()}")

    since = _naive(today - timedelta(days=14))
    live = db.scalars(select(Membership.member_id).where(
        MS, Membership.status == MemberStatus.ACTIVE, Membership.start_date <= today - timedelta(days=14),
        Membership.end_date >= today)).all()
    seen = set(db.scalars(select(Attendance.member_id).where(
        Attendance.workspace_id == workspace_id, Attendance.check_in_time >= since, Attendance.member_id.isnot(None))).all())
    for member_id in set(live) - seen:
        add("inactive", member_id, "No check-in for 14+ days")

    out = []
    for key, rows in groups.items():
        items = list(rows.values())
        title, message = REMINDER_TEMPLATES[key]
        out.append({"key": key, "label": REMINDER_LABELS[key], "count": len(items), "members": items[:limit],
                    "suggested_title": title, "suggested_message": message})
    return {"groups": [g for g in out if g["count"]], "generated_for": today.isoformat(), "source": "rules"}


# ─── Workout suggestions ───────────────────────────────────────────────

QUESTIONS = [
    {"key": "goal", "label": "What's your main goal?", "type": "choice",
     "options": [["fat_loss", "Lose fat"], ["muscle_gain", "Build muscle"], ["strength", "Get stronger"],
                 ["endurance", "Improve stamina"], ["general_fitness", "General fitness"], ["mobility", "Move better / flexibility"]]},
    {"key": "experience", "label": "How much have you trained before?", "type": "choice",
     "options": [["beginner", "New or returning (under 6 months)"], ["intermediate", "6 months to 2 years"], ["advanced", "Over 2 years"]]},
    {"key": "days_per_week", "label": "How many days a week can you train?", "type": "choice",
     "options": [[2, "2"], [3, "3"], [4, "4"], [5, "5"], [6, "6"]]},
    {"key": "session_minutes", "label": "How long is each session?", "type": "choice",
     "options": [[20, "20 min"], [30, "30 min"], [45, "45 min"], [60, "60 min"], [90, "90 min"]]},
    {"key": "equipment", "label": "Where will you train?", "type": "choice",
     "options": [["full_gym", "In the gym (all equipment)"], ["home_dumbbells", "At home with dumbbells"], ["bodyweight", "No equipment"]]},
    {"key": "limitations", "label": "Any area to go easy on?", "type": "multi",
     "options": [["knees", "Knees"], ["lower_back", "Lower back"], ["shoulders", "Shoulders"], ["wrists", "Wrists"]]},
    {"key": "health_flags", "label": "Do any of these apply to you right now?", "type": "multi",
     "options": [["heart_condition", "Heart condition or high blood pressure"], ["pregnancy", "Pregnant or recently gave birth"],
                 ["recent_surgery", "Surgery or serious injury in the last 6 months"], ["chest_pain_dizziness", "Chest pain or dizziness when active"]]},
    {"key": "notes", "label": "Anything else? (optional, no personal details)", "type": "text"},
]
EQUIPMENT_ALLOWED = {
    "bodyweight": {"bodyweight"},
    "home_dumbbells": {"bodyweight", "dumbbell", "kettlebell", "bench"},
    "full_gym": None,  # everything
}
LIMITATION_EXCLUDES = {
    "knees": {"squat", "lunge", "plyometric"},
    "lower_back": {"hinge"},
    "shoulders": {"vertical_push"},
    "wrists": set(),
}
DIFFICULTY_ALLOWED = {"beginner": {"beginner"}, "intermediate": {"beginner", "intermediate"},
                      "advanced": {"beginner", "intermediate", "advanced"}}
PRESCRIPTION = {
    "strength": (4, "4-6", 150), "muscle_gain": (3, "8-12", 90), "fat_loss": (3, "12-15", 45),
    "endurance": (3, "15-20", 30), "general_fitness": (3, "8-12", 60), "mobility": (2, "30-45s", 30),
}
EXERCISES_PER_SESSION = {20: 3, 30: 4, 45: 5, 60: 6, 90: 7}
SPLITS = {
    "full": [("Full body", ["squat", "horizontal_push", "horizontal_pull", "hinge", "anti_extension", "locomotion", "lunge"])],
    "upper_lower": [("Upper body", ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull", "isolation", "anti_extension"]),
                    ("Lower body", ["squat", "hinge", "lunge", "isolation", "anti_extension", "locomotion"])],
    "ppl": [("Push", ["horizontal_push", "vertical_push", "isolation", "anti_extension"]),
            ("Pull", ["horizontal_pull", "vertical_pull", "isolation", "rotation"]),
            ("Legs", ["squat", "hinge", "lunge", "isolation", "flexion"])],
    "mobility": [("Mobility & core", ["mobility", "anti_extension", "rotation", "locomotion", "flexion"])],
}
DISCLAIMER = "Suggestions only, not medical advice. Warm up, start light, and stop if anything hurts. Check with a trainer before trying new lifts."
HEALTH_STOP = ("Because of what you told us, please get clearance from a doctor before starting a new program, "
               "and ask a trainer at your gym to build one with you. We haven't generated a workout for safety reasons.")


def _validate_answers(a: dict) -> dict:
    def choice(key, default):
        opts = next(q["options"] for q in QUESTIONS if q["key"] == key)
        v = a.get(key, default)
        if v not in [o[0] for o in opts]:
            raise HTTPException(status_code=422, detail=f"Invalid answer for {key}.")
        return v

    def multi(key):
        opts = {o[0] for o in next(q["options"] for q in QUESTIONS if q["key"] == key)}
        vals = a.get(key) or []
        if not isinstance(vals, list) or any(v not in opts for v in vals):
            raise HTTPException(status_code=422, detail=f"Invalid answer for {key}.")
        return sorted(set(vals))

    return {
        "goal": choice("goal", "general_fitness"), "experience": choice("experience", "beginner"),
        "days_per_week": choice("days_per_week", 3), "session_minutes": choice("session_minutes", 45),
        "equipment": choice("equipment", "full_gym"), "limitations": multi("limitations"),
        "health_flags": multi("health_flags"), "notes": clean_text(scrub_pii(a.get("notes") or ""), 200),
    }


def _candidates(db: Session, workspace_id: str, ans: dict) -> list[Exercise]:
    rows = db.scalars(select(Exercise).where(
        Exercise.status == "active",
        (Exercise.workspace_id.is_(None)) | (Exercise.workspace_id == workspace_id),
    ).order_by(Exercise.name)).all()
    allowed_eq = EQUIPMENT_ALLOWED[ans["equipment"]]
    excluded = set().union(*(LIMITATION_EXCLUDES[x] for x in ans["limitations"])) if ans["limitations"] else set()
    out = []
    for e in rows:
        if e.difficulty not in DIFFICULTY_ALLOWED[ans["experience"]] or e.movement_pattern in excluded:
            continue
        raw_eq = getattr(e, "equipment", None)
        eq_raw = str(raw_eq) if raw_eq is not None and str(raw_eq).strip() != "" else "[]"
        eq = set(json.loads(eq_raw) or ["bodyweight"])
        if allowed_eq is not None and not eq <= allowed_eq:
            continue
        out.append(e)
    return out


def _rule_plan(ans: dict, cands: list[Exercise]) -> dict:
    goal, days = ans["goal"], ans["days_per_week"]
    split = "mobility" if goal == "mobility" else "full" if days <= 3 else "upper_lower" if days == 4 else "ppl"
    sets, reps, rest = PRESCRIPTION[goal]
    if ans["experience"] == "beginner" and goal != "mobility":
        sets = max(2, sets - 1)
    per = EXERCISES_PER_SESSION[ans["session_minutes"]]
    by_pattern: dict[str, list[Exercise]] = {}
    for e in cands:
        raw_mp = getattr(e, "movement_pattern", None)
        pattern = str(raw_mp) if raw_mp is not None and str(raw_mp).strip() != "" else "other"
        by_pattern.setdefault(pattern, []).append(e)

    plan_days = []
    for i in range(days):
        name, slots = SPLITS[split][i % len(SPLITS[split])]
        rotation = i // len(SPLITS[split])
        chosen: list[Exercise] = []
        for slot in slots + list(by_pattern):
            pool = [e for e in by_pattern.get(slot, []) if e not in chosen]
            if pool:
                chosen.append(pool[rotation % len(pool)])
            if len(chosen) >= per:
                break
        items = []
        for e in chosen:
            cardio = (str(e.exercise_type or "") == "cardio") or (str(e.movement_pattern or "") == "locomotion")
            items.append({"exercise_id": str(e.id), "name": str(e.name),
                          "sets": 1 if cardio else sets, "reps": "8-12 min" if cardio else reps,
                          "rest_seconds": 0 if cardio else rest, "note": ""})
        plan_days.append({"name": f"Day {i + 1}: {name}" + (f" ({'AB'[rotation % 2]})" if split == "full" and days > 1 else ""),
                          "focus": name, "exercises": items})
    titles = {"fat_loss": "Fat-loss", "muscle_gain": "Muscle-building", "strength": "Strength",
              "endurance": "Stamina", "general_fitness": "General fitness", "mobility": "Mobility"}
    return {
        "title": f"{titles[goal]} plan · {days} days/week",
        "overview": f"{days} sessions of about {ans['session_minutes']} minutes using exercises from your gym's library. "
                    f"Add weight or reps when the last set feels easy.",
        "days": plan_days,
        "tips": ["Warm up for 5 minutes before each session.", "Leave at least one rest day between hard sessions for the same muscles.",
                 "Track your sets in My Workout to see progress."],
    }


def workout_suggestion(db: Session, ctx: AiContext, answers: dict, use_ai: bool) -> dict:
    if not ctx.workspace_id:
        raise HTTPException(status_code=400, detail="Workspace context required.")
    ans = _validate_answers(answers)
    if ans["health_flags"]:
        ai_core.log_usage(db, ctx, "workout", "rules")
        return {"plan": None, "safety_message": HEALTH_STOP, "disclaimer": DISCLAIMER, "source": "rules", "notice": None}
    cands = _candidates(db, ctx.workspace_id, ans)
    if len(cands) < 3:
        raise HTTPException(status_code=422, detail="Your gym's exercise library doesn't have enough exercises for these answers yet.")
    plan = _rule_plan(ans, cands)
    if not use_ai:
        ai_core.log_usage(db, ctx, "workout", "rules")
        return {"plan": plan, "safety_message": None, "disclaimer": DISCLAIMER, "source": "rules", "notice": None}

    alias = {f"e{i + 1}": e for i, e in enumerate(cands[:45])}
    library = [{"id": k, "name": e.name, "pattern": e.movement_pattern, "type": e.exercise_type, "level": e.difficulty}
               for k, e in alias.items()]
    per = EXERCISES_PER_SESSION[ans["session_minutes"]]

    def validate(raw: dict) -> dict:
        days = raw.get("days")
        if not isinstance(days, list) or len(days) != ans["days_per_week"]:
            raise ValueError("wrong number of days")
        out_days = []
        for i, d in enumerate(days):
            exs = []
            for x in (d.get("exercises") or [])[: per + 1]:
                e = alias.get(str(x.get("id")))
                if e is None:
                    raise ValueError("unknown exercise id")
                sets = int(x.get("sets", 3))
                rest = int(x.get("rest_seconds", 60))
                reps = clean_text(x.get("reps", "8-12"), 12)
                if not (1 <= sets <= 6 and 0 <= rest <= 300 and re.fullmatch(r"[0-9]{1,3}(-[0-9]{1,3})?\s?(s|sec|min)?", reps)):
                    raise ValueError("prescription out of range")
                exs.append({"exercise_id": e.id, "name": e.name, "sets": sets, "reps": reps, "rest_seconds": rest,
                            "note": clean_text(x.get("note"), 120)})
            if len(exs) < 2:
                raise ValueError("day too short")
            focus = clean_text(d.get("focus"), 40) or "Training"
            out_days.append({"name": f"Day {i + 1}: {focus}", "focus": focus, "exercises": exs})
        return {"title": clean_text(raw.get("title"), 80) or plan["title"],
                "overview": clean_text(raw.get("overview"), 300) or plan["overview"],
                "days": out_days, "tips": clean_list(raw.get("tips"), 3, 160) or plan["tips"]}

    result = ai_core.run(
        db, ctx, "workout",
        system=("You are a careful strength coach. Build a weekly plan using ONLY exercise ids from the library. "
                f"Exactly {ans['days_per_week']} days, {max(2, per - 1)}-{per} exercises per day, balanced muscle groups, "
                "sensible progression for the experience level, avoid the listed limitations. reps is like \"8-12\" or \"30s\". "
                'Shape: {"title": str, "overview": str (max 40 words), "days": [{"focus": str, "exercises": '
                '[{"id": "e1", "sets": int, "reps": str, "rest_seconds": int, "note": str (max 12 words)}]}], "tips": [max 3 short str]}'),
        prompt=json.dumps({"answers": {k: v for k, v in ans.items() if k not in ("notes", "health_flags")}, "library": library})
        + (f"\n<user_input>{ans['notes']}</user_input>" if ans["notes"] else ""),
        validate=validate, fallback=lambda: plan, max_tokens=1100, temperature=0.4,
        key=ai_core.cache_key("workout", ctx.workspace_id, [ans, sorted(e.id for e in alias.values())]),
        ttl=timedelta(days=30),
    )
    return {"plan": result.data, "safety_message": None, "disclaimer": DISCLAIMER, "source": result.source, "notice": result.notice}


# ─── Diet suggestion ────────────────────────────────────────────────────
# A rule-based daily meal plan the trainer can review, edit, then save and assign. Macros come
# from goal + bodyweight; meals are scaled from diet-type templates. use_ai=true asks Gemini to
# rewrite the meals (same macro targets) and counts toward the quota.

DIET_QUESTIONS = [
    {"key": "goal", "label": "What's the goal?", "type": "choice",
     "options": [["fat_loss", "Lose fat"], ["muscle_gain", "Build muscle"], ["strength", "Get stronger"],
                 ["endurance", "Improve stamina"], ["general_fitness", "General fitness"], ["mobility", "Stay healthy"]]},
    {"key": "diet_type", "label": "Food preference", "type": "choice",
     "options": [["vegetarian", "Vegetarian"], ["vegan", "Vegan"], ["eggetarian", "Eggetarian"], ["non_vegetarian", "Non-vegetarian"]]},
    {"key": "weight_kg", "label": "Body weight (kg)", "type": "number"},
    {"key": "meals_per_day", "label": "Meals per day", "type": "choice", "options": [[3, "3"], [4, "4"], [5, "5"]]},
    {"key": "health_flags", "label": "Any of these apply?", "type": "multi",
     "options": [["diabetes", "Diabetes"], ["hypertension", "High blood pressure"], ["pregnancy", "Pregnant or nursing"],
                 ["kidney", "Kidney condition"]]},
    {"key": "notes", "label": "Allergies or foods to avoid? (optional)", "type": "text"},
]

DIET_TARGETS = {
    "fat_loss": (27, 2.0), "muscle_gain": (38, 2.0), "strength": (34, 1.8),
    "endurance": (35, 1.6), "general_fitness": (31, 1.6), "mobility": (29, 1.4),
}
DIET_HEALTH_STOP = ("Because of what you told us, a diet plan should be set with a doctor or a qualified dietitian. "
                    "We haven't generated one here for safety. Your trainer can still guide general habits.")

_DIET_TEMPLATES = {
    "vegetarian": [
        ("breakfast", "08:00", "Breakfast", [("Vegetable poha", "1.5 cups", 300, 7, 52, 7),
                                              ("Curd (dahi)", "1 bowl", 110, 8, 9, 4), ("Almonds", "8 pcs", 70, 3, 2, 6)]),
        ("lunch", "13:00", "Lunch", [("Roti (whole wheat)", "3", 240, 9, 45, 3), ("Dal", "1.5 cups", 230, 15, 30, 5),
                                      ("Mixed veg sabzi", "1 cup", 150, 5, 18, 7), ("Salad", "1 plate", 50, 2, 10, 0)]),
        ("snack", "17:00", "Evening snack", [("Roasted chana", "40 g", 160, 9, 22, 3), ("Banana", "1", 100, 1, 26, 0)]),
        ("dinner", "20:30", "Dinner", [("Paneer bhurji", "1 cup", 280, 18, 8, 20), ("Roti", "2", 160, 6, 30, 2),
                                        ("Sauteed greens", "1 cup", 90, 4, 10, 4)]),
    ],
    "vegan": [
        ("breakfast", "08:00", "Breakfast", [("Oats with soy milk", "1.5 cups", 320, 14, 50, 7),
                                              ("Peanut butter", "1 tbsp", 95, 4, 3, 8), ("Apple", "1", 80, 0, 21, 0)]),
        ("lunch", "13:00", "Lunch", [("Brown rice", "1 cup", 220, 5, 46, 2), ("Rajma / chana", "1.5 cups", 300, 16, 45, 6),
                                      ("Mixed veg", "1 cup", 140, 5, 16, 7)]),
        ("snack", "17:00", "Evening snack", [("Roasted peanuts", "40 g", 230, 10, 8, 18), ("Orange", "1", 60, 1, 15, 0)]),
        ("dinner", "20:30", "Dinner", [("Tofu stir-fry", "1.5 cups", 300, 20, 14, 18), ("Quinoa", "1 cup", 220, 8, 39, 4)]),
    ],
    "eggetarian": [
        ("breakfast", "08:00", "Breakfast", [("Veg omelette (3 eggs)", "1", 300, 20, 4, 22),
                                              ("Multigrain toast", "2", 160, 6, 28, 3), ("Orange", "1", 60, 1, 15, 0)]),
        ("lunch", "13:00", "Lunch", [("Rice", "1 cup", 200, 4, 44, 1), ("Dal", "1.5 cups", 230, 15, 30, 5),
                                      ("Veg sabzi", "1 cup", 150, 5, 18, 7), ("Curd", "1 bowl", 110, 8, 9, 4)]),
        ("snack", "17:00", "Evening snack", [("Boiled eggs", "2", 160, 13, 1, 11), ("Sprouts", "1 cup", 120, 8, 20, 1)]),
        ("dinner", "20:30", "Dinner", [("Egg curry (2 eggs)", "1 bowl", 290, 16, 10, 20), ("Roti", "2", 160, 6, 30, 2),
                                        ("Salad", "1 plate", 50, 2, 10, 0)]),
    ],
    "non_vegetarian": [
        ("breakfast", "08:00", "Breakfast", [("Egg whites (4) + 1 whole", "1", 180, 22, 2, 8),
                                              ("Oats", "1 cup", 220, 8, 38, 5), ("Banana", "1", 100, 1, 26, 0)]),
        ("lunch", "13:00", "Lunch", [("Grilled chicken breast", "150 g", 250, 46, 0, 6), ("Rice", "1 cup", 200, 4, 44, 1),
                                      ("Mixed veg", "1 cup", 140, 5, 16, 7)]),
        ("snack", "17:00", "Evening snack", [("Greek yogurt", "1 cup", 150, 17, 9, 4), ("Walnuts", "6 halves", 130, 3, 3, 13)]),
        ("dinner", "20:30", "Dinner", [("Fish curry", "150 g", 260, 30, 6, 12), ("Roti", "2", 160, 6, 30, 2),
                                        ("Sauteed greens", "1 cup", 90, 4, 10, 4)]),
    ],
}


def _diet_answers(a: dict) -> dict:
    def choice(key, default=None):
        opts = [o[0] for o in next(q["options"] for q in DIET_QUESTIONS if q["key"] == key)]
        v = a.get(key, default)
        if isinstance(v, str) and v.isdigit():
            v = int(v)
        if v not in opts:
            raise HTTPException(status_code=422, detail=f"Invalid answer for {key}.")
        return v

    def multi(key):
        opts = {o[0] for o in next(q["options"] for q in DIET_QUESTIONS if q["key"] == key)}
        vals = a.get(key) or []
        if not isinstance(vals, list) or any(v not in opts for v in vals):
            raise HTTPException(status_code=422, detail=f"Invalid answer for {key}.")
        return sorted(set(vals))

    try:
        weight = float(a.get("weight_kg"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="Enter the member's body weight in kg.")
    if not 25 <= weight <= 250:
        raise HTTPException(status_code=422, detail="Body weight must be between 25 and 250 kg.")
    return {"goal": choice("goal", "general_fitness"), "diet_type": choice("diet_type", "vegetarian"),
            "weight_kg": round(weight, 1), "meals_per_day": choice("meals_per_day", 3),
            "health_flags": multi("health_flags"), "notes": clean_text(scrub_pii(a.get("notes") or ""), 200)}


def _diet_targets(ans: dict) -> dict:
    kcal_kg, protein_kg = DIET_TARGETS[ans["goal"]]
    weight = ans["weight_kg"]
    calories = round(weight * kcal_kg)
    protein = round(weight * protein_kg)
    fat = round(calories * 0.25 / 9)
    carbs = max(0, round((calories - protein * 4 - fat * 9) / 4))
    return {"calories_target": float(calories), "protein_target": float(protein),
            "carbs_target": float(carbs), "fat_target": float(fat), "water_ml_target": round(weight * 35)}


def _scale_meals(ans: dict, targets: dict) -> list:
    template = _DIET_TEMPLATES[ans["diet_type"]]
    keep = template[:3] if ans["meals_per_day"] == 3 else template[:4] if ans["meals_per_day"] == 4 else template
    if ans["meals_per_day"] == 5:
        keep = template + [("snack", "11:00", "Mid-morning snack",
                            [("Fruit bowl", "1 cup", 90, 1, 22, 0), ("Mixed nuts", "20 g", 120, 4, 5, 10)])]
    base_kcal = sum(cal for _, _, _, items in keep for _, _, cal, _, _, _ in items)
    factor = targets["calories_target"] / base_kcal if base_kcal else 1.0
    meals = []
    for slot, time, title, items in keep:
        scaled = [{"food": food, "portion": portion, "calories": round(cal * factor),
                   "protein": round(p * factor), "carbs": round(c * factor), "fat": round(f * factor)}
                  for food, portion, cal, p, c, f in items]
        meals.append({"slot": slot, "time": time, "title": title, "items": scaled})
    return meals


def _rule_diet(ans: dict) -> dict:
    targets = _diet_targets(ans)
    titles = {"fat_loss": "Fat-loss", "muscle_gain": "Muscle-gain", "strength": "Strength",
              "endurance": "Endurance", "general_fitness": "Balanced", "mobility": "Maintenance"}
    diet_label = {"vegetarian": "veg", "vegan": "vegan", "eggetarian": "eggetarian", "non_vegetarian": "non-veg"}
    return {
        "name": f"{titles[ans['goal']]} {diet_label[ans['diet_type']]} plan · {int(targets['calories_target'])} kcal",
        "goal": ans["goal"], "diet_type": ans["diet_type"],
        **targets, "meals": _scale_meals(ans, targets),
        "notes": "Portions are a starting point — adjust to appetite and progress. Drink water through the day.",
    }


def diet_suggestion(db: Session, ctx: AiContext, answers: dict, use_ai: bool) -> dict:
    if not ctx.workspace_id:
        raise HTTPException(status_code=400, detail="Workspace context required.")
    ans = _diet_answers(answers)
    if ans["health_flags"]:
        ai_core.log_usage(db, ctx, "diet", "rules")
        return {"plan": None, "safety_message": DIET_HEALTH_STOP, "disclaimer": DISCLAIMER, "source": "rules", "notice": None}
    plan = _rule_diet(ans)
    if not use_ai:
        ai_core.log_usage(db, ctx, "diet", "rules")
        return {"plan": plan, "safety_message": None, "disclaimer": DISCLAIMER, "source": "rules", "notice": None}

    targets = _diet_targets(ans)

    def validate(raw: dict) -> dict:
        meals = raw.get("meals")
        if not isinstance(meals, list) or not (2 <= len(meals) <= 6):
            raise ValueError("bad meals")
        out = []
        for m in meals:
            items = []
            for it in (m.get("items") or [])[:8]:
                food = clean_text(it.get("food"), 80)
                if not food:
                    continue
                items.append({"food": food, "portion": clean_text(it.get("portion"), 40) or "1 serving",
                              "calories": max(0, min(2000, int(it.get("calories", 0) or 0))),
                              "protein": max(0, min(200, int(it.get("protein", 0) or 0))),
                              "carbs": max(0, min(400, int(it.get("carbs", 0) or 0))),
                              "fat": max(0, min(200, int(it.get("fat", 0) or 0)))})
            if not items:
                raise ValueError("empty meal")
            out.append({"slot": clean_text(m.get("slot"), 30) or "meal", "time": clean_text(m.get("time"), 10),
                        "title": clean_text(m.get("title"), 60) or "Meal", "items": items})
        return {**plan, "name": clean_text(raw.get("name"), 120) or plan["name"], "meals": out,
                "notes": clean_text(raw.get("notes"), 300) or plan["notes"]}

    result = ai_core.run(
        db, ctx, "diet",
        system=("You are a sports dietitian for an Indian gym. Build a one-day meal plan that hits about "
                f"{int(targets['calories_target'])} kcal and {int(targets['protein_target'])} g protein, "
                f"{ans['diet_type'].replace('_', ' ')} only, {ans['meals_per_day']} meals, common affordable foods. "
                'Shape: {"name": str, "meals": [{"slot": str, "time": "HH:MM", "title": str, "items": '
                '[{"food": str, "portion": str, "calories": int, "protein": int, "carbs": int, "fat": int}]}], "notes": str}'),
        prompt=json.dumps({"targets": targets, "diet_type": ans["diet_type"], "goal": ans["goal"],
                           "meals_per_day": ans["meals_per_day"]})
        + (f"\n<avoid>{ans['notes']}</avoid>" if ans["notes"] else ""),
        validate=validate, fallback=lambda: plan, max_tokens=1200, temperature=0.5,
        key=ai_core.cache_key("diet", ctx.workspace_id, [ans]), ttl=timedelta(days=14),
    )
    return {"plan": result.data, "safety_message": None, "disclaimer": DISCLAIMER, "source": result.source, "notice": result.notice}
