"""
Create (or refresh) the sales demo gym and its login.

    python -m scripts.seed_demo            # local SQLite / disposable database
    python -m scripts.seed_demo --yes      # required for PostgreSQL or ENVIRONMENT=production

Reads DEMO_ACCOUNT_EMAIL (default demo@repsi.app), DEMO_ACCOUNT_PASSWORD and DEMO_WORKSPACE_SLUG from the
environment / app/api/.env. The password is never printed.

What it creates, all inside one workspace flagged `is_demo` (see app/core/demo.py for what that blocks):
- the owner login, on the Enterprise plan as complimentary access with unlimited members, staff,
  trainers and branches (recorded in the subscription audit log, like any super-admin grant);
- two branches, four membership plans, five trainers and six weekly classes;
- ~140 members with membership history (renewals, expiries, a freeze), receipts, part-paid invoices,
  60 days of check-ins (a few still in the gym today), trainer assignments and notes;
- expenses, sales leads with follow-ups, and a few owner notifications.

Safety: it only ever writes to the demo workspace and the demo user. It refuses to run if the demo email
belongs to a real account or the slug belongs to a gym that is not a demo. Re-running updates the
password and plan; sample data is only generated the first time.
"""
import argparse
import json
import random
import sys
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings  # noqa: E402
from app.core.database import SessionLocal  # noqa: E402
from app.core.migrations import run_database_migrations  # noqa: E402
from app.core.security import get_password_hash  # noqa: E402
import app.models  # noqa: E402,F401
from app.models.attendance import Attendance, AttendanceMethod, AttendanceStatus, CheckoutType, GymLocation  # noqa: E402
from app.models.billing import SubscriptionPlan, SubscriptionStatus  # noqa: E402
from app.models.system import Notification  # noqa: E402
from app.models.crm import FollowUpStatus, FollowUpType, Lead, LeadFollowUp, LeadPriority, LeadStatus  # noqa: E402
from app.models.finance import Expense, Invoice, Payment, PaymentMethod, PaymentStatus  # noqa: E402
from app.models.member import Member, MemberStatus, Membership, MembershipPlan  # noqa: E402
from app.models.member_records import MemberNote  # noqa: E402
from app.models.trainer import GymClass, Trainer, TrainerClient, TrainerClientStatus, TrainerStatus  # noqa: E402
from app.models.user import User, UserRole, Workspace, WorkspaceMember  # noqa: E402
from app.services.billing import BillingService, invalidate_entitlements  # noqa: E402
from app.services.finance_ops import assign_receipt_number  # noqa: E402
from app.services.member_lifecycle import record_member_event  # noqa: E402
from app.services.membership_lifecycle import record_event  # noqa: E402

FIRST = ["Aarav", "Vivaan", "Aditya", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan", "Rohan", "Karthik", "Rahul",
         "Vikram", "Nikhil", "Pranav", "Siddharth", "Ananya", "Diya", "Priya", "Aditi", "Kavya", "Meera", "Sneha",
         "Pooja", "Divya", "Lakshmi", "Nandini", "Riya", "Shreya", "Tanvi", "Neha", "Farhan", "Imran", "Zoya",
         "Sana", "Joseph", "Maria", "Deepak", "Harish", "Gautam", "Swathi"]
LAST = ["Sharma", "Iyer", "Reddy", "Nair", "Rao", "Menon", "Patel", "Gupta", "Singh", "Kumar", "Pillai", "Shetty",
        "Hegde", "Joshi", "Verma", "Khan", "Fernandes", "Das", "Bhat", "Krishnan"]
PLANS = [  # name, months, price, description
    ("Monthly", 1, 2000.0, "Full gym access, all branches"),
    ("Quarterly", 3, 5400.0, "Save 10% on three months"),
    ("Half-yearly", 6, 9900.0, "Six months plus one free PT session"),
    ("Annual", 12, 17999.0, "Best value: twelve months, two guest passes"),
]
TRAINERS = [  # name, specialization, years
    ("Arun Prakash", "Strength & conditioning", "8 years"),
    ("Meghana Rao", "Yoga & mobility", "6 years"),
    ("Vikram Shetty", "CrossFit & HIIT", "5 years"),
    ("Fatima Sheikh", "Weight loss & nutrition", "7 years"),
    ("Daniel Joseph", "Powerlifting", "10 years"),
]
CLASSES = [  # name, category, schedule, minutes, capacity, trainer index
    ("Morning HIIT", "HIIT", "Mon/Wed/Fri 06:30 AM", 45, 20, 2),
    ("Power Yoga", "Yoga", "Tue/Thu/Sat 07:00 AM", 60, 18, 1),
    ("Strength Foundations", "Strength", "Mon/Thu 07:00 PM", 60, 12, 0),
    ("Zumba", "Dance", "Wed/Fri 06:30 PM", 50, 25, 3),
    ("Powerlifting Club", "Strength", "Sat 05:00 PM", 90, 10, 4),
    ("Core & Mobility", "Mobility", "Sun 09:00 AM", 40, 20, 1),
]


GYM_TZ = ZoneInfo("Asia/Kolkata")


def _local_time(d: date, hh: int, mm: int) -> datetime:
    """A gym-local wall-clock time as UTC, which is how the API stores timestamps."""
    return datetime.combine(d, time(hh, mm), tzinfo=GYM_TZ).astimezone(timezone.utc)


def _guard_target(args) -> None:
    url = settings.DATABASE_URL
    risky = not url.startswith("sqlite") or settings.ENVIRONMENT.lower() in ("production", "prod", "staging")
    host = url.split("@")[-1].split("/")[0] if "@" in url else url.split("///")[-1]
    print(f"[demo] Database: {host}  (ENVIRONMENT={settings.ENVIRONMENT})")
    if risky and not args.yes:
        raise SystemExit("[demo] This is a shared or production database. Re-run with --yes to create the demo gym there.")
    if len(settings.DEMO_ACCOUNT_PASSWORD or "") < 12:
        raise SystemExit("[demo] Set DEMO_ACCOUNT_PASSWORD (12+ characters) in app/api/.env first.")


def _ensure_account(db) -> tuple[User, Workspace]:
    email = settings.DEMO_ACCOUNT_EMAIL.strip().lower()
    slug = settings.DEMO_WORKSPACE_SLUG.strip().lower()
    ws = db.query(Workspace).filter(Workspace.slug == slug).first()
    if ws is not None and not ws.is_demo:
        raise SystemExit(f"[demo] The slug '{slug}' belongs to a real gym. Choose another DEMO_WORKSPACE_SLUG.")
    user = db.query(User).filter(User.email == email).first()
    if user is not None:
        others = (
            db.query(WorkspaceMember)
            .join(Workspace, Workspace.id == WorkspaceMember.workspace_id)
            .filter(WorkspaceMember.user_id == user.id, Workspace.is_demo.is_(False))
            .count()
        )
        if others or user.is_superadmin:
            raise SystemExit(f"[demo] {email} is a real account (member of a real gym or a platform admin). Refusing.")

    if ws is None:
        ws = Workspace(
            name="REPSI Demo Fitness", slug=slug, is_demo=True, is_active=True, onboarding_completed=True,
            onboarding_step=5, phone="+91 80 4000 0000", email="hello@demo.repsi.app",
            address="12, 100 Feet Road, Indiranagar", city="Bengaluru", state="Karnataka", postal_code="560038",
            country="India", country_code="IN", timezone="Asia/Kolkata", currency="INR", locale="en-IN",
            gym_type="Commercial Fitness", business_types="Gym, Yoga Studio, PT Studio", business_size="100-500",
            brand_color="#E25822",
            opening_hours=json.dumps({d: {"closed": False, "open": "05:30", "close": "22:30"}
                                      for d in ("mon", "tue", "wed", "thu", "fri", "sat")} | {"sun": {"closed": False, "open": "07:00", "close": "13:00"}}),
        )
        db.add(ws)
        db.flush()
        print(f"[demo] Created workspace {slug}")

    if user is None:
        user = User(email=email, full_name="Demo Owner", is_active=True, email_verified=True,
                    hashed_password=get_password_hash(settings.DEMO_ACCOUNT_PASSWORD))
        db.add(user)
        db.flush()
        print(f"[demo] Created user {email}")
    user.hashed_password = get_password_hash(settings.DEMO_ACCOUNT_PASSWORD)
    user.is_active = True

    link = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == ws.id, WorkspaceMember.user_id == user.id).first()
    if link is None:
        db.add(WorkspaceMember(workspace_id=ws.id, user_id=user.id, role=UserRole.OWNER, is_active=True))
    else:
        link.role, link.is_active = UserRole.OWNER, True
    db.flush()
    return user, ws


def _ensure_unlimited_plan(db, ws: Workspace, user: User) -> None:
    BillingService.ensure_default_plans(db)
    top = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == "enterprise").first()
    sub = BillingService.get_or_create_workspace_subscription(db, ws.id)
    old = f"plan={sub.plan_id}, status={sub.status}"
    sub.plan_id = top.id
    sub.status = SubscriptionStatus.ACTIVE
    sub.billing_cycle = "annual"
    sub.custom_member_limit = sub.custom_trainer_limit = sub.custom_staff_limit = sub.custom_branch_limit = -1
    db.commit()
    BillingService.log_subscription_audit(db, ws.id, user.id, "plan_change", old, "plan=enterprise, status=active",
                                          "Sales demo gym: Enterprise with unlimited usage")
    BillingService.grant_complimentary_access(db, ws.id, is_indefinite=True, actor_user_id=user.id,
                                              reason="Sales demo gym")
    invalidate_entitlements(ws.id)


def _seed_sample_data(db, ws: Workspace, owner: User, rng: random.Random) -> None:
    today = datetime.now(GYM_TZ).date()
    W = ws.id

    branches = [
        GymLocation(workspace_id=W, name="Indiranagar", code="IND", is_primary=True, city="Bengaluru",
                    address="12, 100 Feet Road", closing_time="22:30", timezone="Asia/Kolkata", country_code="IN"),
        GymLocation(workspace_id=W, name="Koramangala", code="KOR", is_primary=False, city="Bengaluru",
                    address="80 Feet Road, 4th Block", closing_time="22:00", timezone="Asia/Kolkata", country_code="IN"),
    ]
    db.add_all(branches)

    plans = [MembershipPlan(workspace_id=W, name=n, duration_months=m, price=p, description=d, is_active=True,
                            guest_passes=2 if m == 12 else 0) for n, m, p, d in PLANS]
    db.add_all(plans)

    trainers = [Trainer(workspace_id=W, name=n, email=f"{n.split()[0].lower()}@demo.repsi.app",
                        phone=f"+9190000100{i:02d}", specialization=s, experience=y, status=TrainerStatus.ACTIVE,
                        is_active=True, hourly_rate=800 + 100 * i, commission_percentage=15,
                        joining_date=today - timedelta(days=400 + 60 * i), max_active_clients=15)
                for i, (n, s, y) in enumerate(TRAINERS)]
    db.add_all(trainers)
    db.flush()

    for n, cat, sched, mins, cap, ti in CLASSES:
        db.add(GymClass(workspace_id=W, name=n, category=cat, schedule=sched, duration_minutes=mins, capacity=cap,
                        trainer_id=trainers[ti].id, branch_id=branches[0].id, room="Studio A", is_active=True,
                        waitlist_enabled=True))

    # ─── Members with membership history ──────────────────────────────────
    methods = [PaymentMethod.UPI] * 5 + [PaymentMethod.CASH] * 3 + [PaymentMethod.CARD] * 2
    members: list[tuple[Member, Membership]] = []
    for i in range(140):
        # Vary the surname per pass through the first names, so full names don't repeat.
        first, last = FIRST[i % len(FIRST)], LAST[(i * 7 + i // len(FIRST) * 3) % len(LAST)]
        plan = rng.choices(plans, weights=[40, 25, 15, 20])[0]
        # Where the current period ends relative to today decides the story: active, expiring, expired.
        story = rng.choices(["active", "expiring", "expired", "frozen"], weights=[72, 12, 13, 3])[0]
        if story == "expiring":
            end = today + timedelta(days=rng.randint(0, 6))
        elif story == "expired":
            end = today - timedelta(days=rng.randint(3, 40))
        else:
            end = today + timedelta(days=rng.randint(10, plan.duration_months * 30))
        start = end - timedelta(days=plan.duration_months * 30)
        renewals = rng.choices([0, 1, 2, 3], weights=[35, 35, 20, 10])[0]
        joined = start - timedelta(days=renewals * plan.duration_months * 30)

        m = Member(workspace_id=W, first_name=first, last_name=last,
                   email=f"{first.lower()}.{last.lower()}{i}@example.com", phone=f"+919000{20000 + i:05d}",
                   gender="female" if FIRST.index(first) in range(15, 30) or first in ("Zoya", "Sana", "Maria", "Swathi") else "male",
                   date_of_birth=date(1985 + i % 20, 1 + i % 12, 1 + i % 27), joined_date=joined,
                   status=MemberStatus.INACTIVE if story == "expired" and i % 3 == 0 else MemberStatus.ACTIVE)
        db.add(m)
        db.flush()
        record_member_event(db, m, "created", owner.id, to_status=m.status.value,
                            reason="Joined at the front desk").created_at = _local_time(joined, 10, 0)

        # Earlier, completed periods (history is appended, never overwritten).
        period_start = joined
        for r in range(renewals + 1):
            p_end = period_start + timedelta(days=plan.duration_months * 30)
            current = r == renewals
            status = MemberStatus.ACTIVE
            if current and story == "expired":
                status = MemberStatus.EXPIRED
            elif current and story == "frozen":
                status = MemberStatus.FROZEN
            elif not current:
                status = MemberStatus.EXPIRED
            ms = Membership(workspace_id=W, member_id=m.id, plan_id=plan.id, start_date=period_start,
                            end_date=p_end if not current else end, status=status, price_paid=plan.price)
            db.add(ms)
            db.flush()
            # History rows carry the date they happened, not the date the demo was seeded.
            record_event(db, ms, "assigned" if r == 0 else "renewed", owner.id, to_status=MemberStatus.ACTIVE,
                         new_end_date=ms.end_date).created_at = _local_time(period_start, 10, 5)
            if status == MemberStatus.EXPIRED:
                record_event(db, ms, "expired", None, from_status=MemberStatus.ACTIVE,
                             to_status=MemberStatus.EXPIRED).created_at = _local_time(ms.end_date + timedelta(days=1), 0, 5)
            if status == MemberStatus.FROZEN:
                record_event(db, ms, "frozen", owner.id, from_status=MemberStatus.ACTIVE, to_status=MemberStatus.FROZEN,
                             reason="Travelling for work").created_at = _local_time(today - timedelta(days=5), 11, 0)

            # Invoice + payment. A few current periods are only part-paid, leaving dues to collect.
            part_paid = current and story in ("active", "expiring") and i % 11 == 0
            paid = round(plan.price * 0.5, 2) if part_paid else plan.price
            inv = Invoice(workspace_id=W, invoice_number=f"INV-DEMO-{i:03d}-{r}", member_id=m.id, membership_id=ms.id,
                          subtotal=plan.price, tax_amount=0, total_amount=plan.price, amount_paid=paid,
                          status="pending" if part_paid else "paid", due_date=period_start + timedelta(days=7))
            db.add(inv)
            db.flush()
            pay = Payment(workspace_id=W, member_id=m.id, membership_id=ms.id, invoice_id=inv.id, amount=paid,
                          currency="INR", method=rng.choice(methods), status=PaymentStatus.SUCCESS,
                          paid_at=_local_time(period_start, rng.randint(7, 20), rng.choice([0, 15, 30, 45])),
                          recorded_by_user_id=owner.id, notes="Part payment, balance due" if part_paid else None)
            db.add(pay)
            db.flush()
            assign_receipt_number(db, pay)
            period_start = p_end
        members.append((m, ms))

    # ─── Trainer assignments and notes ────────────────────────────────────
    for idx, (m, _) in enumerate(members[:40]):
        t = trainers[idx % len(trainers)]
        m.trainer_id = t.id
        db.add(TrainerClient(workspace_id=W, trainer_id=t.id, client_id=m.id, status=TrainerClientStatus.ACTIVE,
                             assigned_by=owner.id, started_at=datetime.now(timezone.utc) - timedelta(days=20 + idx)))
    for m, _ in members[:8]:
        db.add(MemberNote(workspace_id=W, member_id=m.id, author_user_id=owner.id, author_name=owner.full_name,
                          body=rng.choice(["Prefers evening slots.", "Recovering from a knee injury; avoid deep squats.",
                                           "Interested in the annual plan at renewal.", "Asked about PT packages."])))

    # ─── 60 days of attendance; a few members are in the gym right now ──────
    regulars = [(m, ms) for m, ms in members if ms.status in (MemberStatus.ACTIVE,)]
    now_utc = datetime.now(timezone.utc)
    for back in range(60, -1, -1):
        day = today - timedelta(days=back)
        weekend = day.weekday() >= 5
        for m, ms in regulars:
            if day < ms.start_date and day < m.joined_date:
                continue
            if rng.random() > (0.28 if weekend else 0.42):
                continue
            morning = rng.random() < 0.55
            hh = rng.randint(5, 9) if morning else rng.randint(17, 21)
            check_in = _local_time(day, hh, rng.randint(0, 59))
            if check_in > now_utc:
                continue
            minutes = rng.randint(40, 105)
            db.add(Attendance(
                workspace_id=W, member_id=m.id, gym_location_id=(branches[0] if rng.random() < 0.7 else branches[1]).id,
                check_in_time=check_in, check_out_time=min(check_in + timedelta(minutes=minutes), now_utc),
                duration_minutes=minutes, method=AttendanceMethod.QR if rng.random() < 0.8 else AttendanceMethod.MANUAL,
                status=AttendanceStatus.CHECKED_OUT, checkout_type=CheckoutType.MANUAL,
            ))

    # A few members are in the gym right now (during opening hours), so the live views have people.
    local_now = datetime.now(GYM_TZ)
    if 6 <= local_now.hour < 22:
        visited_today = set()
        for m, _ in rng.sample(regulars, k=min(7, len(regulars))):
            if m.id in visited_today:
                continue
            visited_today.add(m.id)
            db.add(Attendance(
                workspace_id=W, member_id=m.id, gym_location_id=branches[0].id,
                check_in_time=now_utc - timedelta(minutes=rng.randint(5, 80)),
                method=AttendanceMethod.QR, status=AttendanceStatus.CHECKED_IN,
            ))

    # ─── Expenses (three months) ──────────────────────────────────────────
    for mo in range(3):
        first_of = (today.replace(day=1) - timedelta(days=30 * mo)).replace(day=1)
        # Sized for a ~140-member, two-branch gym so the demo runs a realistic, modest profit.
        for cat, title, amount in (("rent", "Indiranagar rent", 42000), ("rent", "Koramangala rent", 30000),
                                   ("salaries", "Trainer salaries", 55000), ("utilities", "Electricity", 8500 + 400 * mo),
                                   ("maintenance", "Equipment servicing", 4000), ("marketing", "Instagram ads", 6000)):
            db.add(Expense(workspace_id=W, category=cat, title=title, amount=amount, expense_date=first_of + timedelta(days=4),
                           vendor=None, payment_method="bank_transfer"))

    # ─── Sales leads ──────────────────────────────────────────────────────
    lead_specs = [(LeadStatus.NEW, "Instagram"), (LeadStatus.CONTACTED, "Walk-in"), (LeadStatus.VISIT_SCHEDULED, "Website"),
                  (LeadStatus.TRIAL, "Referral"), (LeadStatus.NEGOTIATION, "Walk-in"), (LeadStatus.LOST, "Google")]
    for i in range(15):
        st, src = lead_specs[i % len(lead_specs)]
        lead = Lead(workspace_id=W, first_name=FIRST[(i * 3 + 5) % len(FIRST)], last_name=LAST[(i * 5 + 2) % len(LAST)],
                    phone=f"+919000{30000 + i:05d}", email=f"lead{i}@example.com", source=src, status=st,
                    priority=[LeadPriority.MEDIUM, LeadPriority.HIGH, LeadPriority.LOW][i % 3],
                    interested_plan=plans[i % 4].name, expected_value=plans[i % 4].price, assigned_staff_id=owner.id,
                    lost_reason="Chose a gym closer to home" if st == LeadStatus.LOST else None,
                    next_follow_up_at=None if st == LeadStatus.LOST else datetime.now(timezone.utc) + timedelta(days=i % 5))
        db.add(lead)
        db.flush()
        if st != LeadStatus.LOST:
            db.add(LeadFollowUp(workspace_id=W, lead_id=lead.id, follow_up_type=FollowUpType.CALL if i % 2 else FollowUpType.WHATSAPP,
                                scheduled_at=datetime.now(timezone.utc) + timedelta(days=i % 5, hours=2),
                                status=FollowUpStatus.PENDING, assigned_to_id=owner.id, notes="Share plan pricing"))

    for title, msg in (("Renewals due this week", "8 memberships end in the next 7 days."),
                       ("Payment recorded", "Quarterly plan payment received at the front desk."),
                       ("New lead", "A new enquiry arrived from Instagram.")):
        db.add(Notification(workspace_id=W, user_id=owner.id, title=title, message=msg, is_read=False))
    db.commit()
    print(f"[demo] Seeded {len(members)} members, {len(trainers)} trainers, {len(CLASSES)} classes and 60 days of activity")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--yes", action="store_true", help="confirm a shared/production database")
    args = parser.parse_args()
    _guard_target(args)
    run_database_migrations()
    db = SessionLocal()
    try:
        owner, ws = _ensure_account(db)
        db.commit()
        _ensure_unlimited_plan(db, ws, owner)
        if db.query(Member).filter(Member.workspace_id == ws.id).count() == 0:
            _seed_sample_data(db, ws, owner, random.Random(42))
        else:
            print("[demo] Sample data already present; left unchanged")
        print(f"[demo] Ready: sign in as {settings.DEMO_ACCOUNT_EMAIL} (password from DEMO_ACCOUNT_PASSWORD)")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
