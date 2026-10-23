"""
Receipts, refunds, outstanding dues and day-end reconciliation for gym-member payments.

History is append-only: a refund is its own row linked to the payment (the payment keeps its
original amount and gains `refunded_amount`); a reconciliation is closed once per business day,
and reopening it records a new row instead of editing the closed one.
"""
from __future__ import annotations

import io
from datetime import date, datetime, time, timedelta, timezone
from typing import Optional
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.audit import record_audit
from app.models.finance import CashReconciliation, Invoice, Payment, PaymentStatus, Refund, WorkspaceCounter
from app.models.member import Member
from app.models.user import Workspace
from app.services.notify import safe_notify

REFUND_METHODS = ("cash", "upi", "bank_transfer", "card", "original_method")


def next_number(db: Session, workspace_id: str, name: str) -> int:
    """Per-gym sequence. The row lock (PostgreSQL) keeps concurrent receipts from sharing a number."""
    q = select(WorkspaceCounter).where(WorkspaceCounter.workspace_id == workspace_id, WorkspaceCounter.name == name)
    if db.bind is not None and db.bind.dialect.name == "postgresql":
        q = q.with_for_update()
    counter = db.scalar(q)
    if counter is None:
        counter = WorkspaceCounter(workspace_id=workspace_id, name=name, value=0)
        db.add(counter)
        db.flush()
    counter.value += 1
    db.flush()
    return counter.value


def assign_receipt_number(db: Session, payment: Payment) -> str:
    if payment.receipt_number:
        return payment.receipt_number
    year = (payment.paid_at or datetime.now(timezone.utc)).year
    payment.receipt_number = f"RCPT-{year}-{next_number(db, payment.workspace_id, 'receipt'):06d}"
    return payment.receipt_number


def money(amount: float, currency: str = "INR") -> str:
    symbol = {"INR": "₹", "USD": "$", "EUR": "€", "GBP": "£"}.get((currency or "INR").upper(), f"{currency} ")
    return f"{symbol}{amount:,.2f}"


def on_payment_recorded(db: Session, payment: Payment) -> None:
    """Receipt number plus the member's payment confirmation. Call before the request commits."""
    if payment.status != PaymentStatus.SUCCESS:
        return
    number = assign_receipt_number(db, payment)
    member = db.get(Member, payment.member_id)
    paid = payment.paid_at or datetime.now(timezone.utc)
    safe_notify(db, member, "payment_receipt", payment.id, variables={
        "amount": money(payment.amount, payment.currency), "receipt_number": number,
        "date": paid.strftime("%d %b %Y"),
    })


# ─── Receipt PDF ───────────────────────────────────────────────────────


def receipt_pdf(db: Session, payment: Payment) -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A5
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    ws = db.get(Workspace, payment.workspace_id)
    member = db.get(Member, payment.member_id)
    refunds = db.scalars(select(Refund).where(Refund.payment_id == payment.id).order_by(Refund.processed_at)).all()
    styles = getSampleStyleSheet()
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A5, leftMargin=12 * mm, rightMargin=12 * mm, topMargin=12 * mm,
                            bottomMargin=12 * mm, title=f"Receipt {payment.receipt_number or payment.id}")
    address = ", ".join(x for x in (ws.address, ws.city, ws.state, ws.postal_code) if x) if ws else ""
    # reportlab's base fonts have no rupee glyph, so amounts print as "INR 1,500.00".
    amount = lambda v: f"{payment.currency or 'INR'} {v:,.2f}"  # noqa: E731
    rows = [
        ["Receipt no.", payment.receipt_number or "—"],
        ["Date", (payment.paid_at or payment.created_at).strftime("%d %b %Y %H:%M")],
        ["Received from", f"{member.first_name} {member.last_name or ''}".strip() if member else "—"],
        ["Amount", amount(payment.amount)],
        ["Method", (payment.method.value if hasattr(payment.method, "value") else str(payment.method)).upper()],
        ["Reference", payment.transaction_ref or "—"],
        ["Status", payment.status.value if hasattr(payment.status, "value") else str(payment.status)],
    ]
    for r in refunds:
        rows.append([f"Refund {r.processed_at:%d %b %Y}", f"- {amount(r.amount)} ({r.reason[:40]})"])
    if refunds:
        rows.append(["Net received", amount(payment.amount - (payment.refunded_amount or 0))])
    table = Table(rows, colWidths=[38 * mm, 82 * mm])
    table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#E4E2DC")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story = [
        Paragraph(f"<b>{_esc(ws.name if ws else 'Gym')}</b>", styles["Title"]),
        Paragraph(_esc(address), styles["Normal"]),
        Paragraph(_esc(" · ".join(x for x in ((ws.phone if ws else None), (ws.email if ws else None)) if x)), styles["Normal"]),
        Spacer(1, 6 * mm),
        Paragraph("<b>Payment receipt</b>", styles["Heading2"]),
        table,
        Spacer(1, 8 * mm),
        Paragraph("This is a computer-generated receipt.", styles["Italic"]),
    ]
    doc.build(story)
    return buf.getvalue()


def _esc(text: str) -> str:
    return (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# ─── Refunds ───────────────────────────────────────────────────────────


def refund_payment(db: Session, payment: Payment, amount: float, reason: str, method: str,
                   actor_user_id: str, reference: Optional[str] = None) -> Refund:
    if payment.status not in (PaymentStatus.SUCCESS, PaymentStatus.REFUNDED):
        raise HTTPException(status_code=409, detail="Only successful payments can be refunded.")
    refundable = round(payment.amount - (payment.refunded_amount or 0), 2)
    if amount <= 0:
        raise HTTPException(status_code=422, detail="Refund amount must be greater than zero.")
    if amount > refundable + 1e-6:
        raise HTTPException(status_code=422, detail=f"Only {refundable:.2f} of this payment can still be refunded.")
    if method not in REFUND_METHODS:
        raise HTTPException(status_code=422, detail=f"Refund method must be one of: {', '.join(REFUND_METHODS)}.")
    refund = Refund(
        workspace_id=payment.workspace_id, payment_id=payment.id, member_id=payment.member_id,
        amount=round(amount, 2), method=method, reason=reason.strip(), reference=reference,
        processed_by_user_id=actor_user_id, processed_at=datetime.now(timezone.utc),
    )
    db.add(refund)
    payment.refunded_amount = round((payment.refunded_amount or 0) + amount, 2)
    if payment.refunded_amount >= payment.amount - 1e-6:
        payment.status = PaymentStatus.REFUNDED
    if payment.invoice_id:
        invoice = db.get(Invoice, payment.invoice_id)
        if invoice is not None and invoice.workspace_id == payment.workspace_id:
            invoice.amount_paid = max(0.0, round((invoice.amount_paid or 0) - amount, 2))
            if invoice.amount_paid < invoice.total_amount and invoice.status == "paid":
                invoice.status = "partially_refunded" if invoice.amount_paid > 0 else "refunded"
    db.flush()
    record_audit(db, payment.workspace_id, actor_user_id, "payment_refunded", resource_type="payment",
                 resource_id=payment.id, details={"amount": round(amount, 2), "method": method,
                                                  "reason": reason.strip()[:200], "refund_id": refund.id})
    safe_notify(db, db.get(Member, payment.member_id), "refund_processed", refund.id,
                variables={"amount": money(amount, payment.currency), "reason": reason.strip()[:120]})
    return refund


# ─── Outstanding dues ──────────────────────────────────────────────────


def outstanding_dues(db: Session, workspace_id: str, today: date) -> list[dict]:
    rows = db.execute(
        select(Invoice, Member)
        .join(Member, Member.id == Invoice.member_id)
        .where(Invoice.workspace_id == workspace_id, Invoice.status.in_(("pending", "partial", "overdue")))
        .order_by(Invoice.due_date)
    ).all()
    out = []
    for inv, m in rows:
        balance = round((inv.total_amount or 0) - (inv.amount_paid or 0), 2)
        if balance <= 0:
            continue
        days = (today - inv.due_date).days if inv.due_date else 0
        bucket = "current" if days <= 0 else "1-30" if days <= 30 else "31-60" if days <= 60 else "60+"
        out.append({
            "invoice_id": inv.id, "invoice_number": inv.invoice_number, "member_id": m.id,
            "member_name": f"{m.first_name} {m.last_name or ''}".strip(), "phone": m.phone,
            "total": inv.total_amount, "paid": inv.amount_paid or 0, "balance": balance,
            "due_date": inv.due_date.isoformat() if inv.due_date else None, "days_overdue": max(0, days),
            "age_bucket": bucket,
        })
    return out


# ─── Day-end reconciliation ────────────────────────────────────────────


def _day_bounds(ws: Optional[Workspace], day: date) -> tuple[datetime, datetime]:
    tz = ZoneInfo(ws.timezone) if ws and ws.timezone else timezone.utc
    start = datetime.combine(day, time.min, tzinfo=tz).astimezone(timezone.utc).replace(tzinfo=None)
    return start, start + timedelta(days=1)


def expected_collections(db: Session, workspace_id: str, day: date) -> dict:
    """What the system recorded for the business day, by payment method, net of refunds that day."""
    ws = db.get(Workspace, workspace_id)
    start, end = _day_bounds(ws, day)
    expected: dict[str, float] = {}
    for method, total in db.execute(
        select(Payment.method, func.coalesce(func.sum(Payment.amount), 0.0))
        .where(Payment.workspace_id == workspace_id, Payment.paid_at >= start, Payment.paid_at < end,
               Payment.status.in_((PaymentStatus.SUCCESS, PaymentStatus.REFUNDED)))
        .group_by(Payment.method)
    ).all():
        key = method.value if hasattr(method, "value") else str(method)
        expected[key] = round(float(total), 2)
    for method, total in db.execute(
        select(Refund.method, func.coalesce(func.sum(Refund.amount), 0.0))
        .where(Refund.workspace_id == workspace_id, Refund.processed_at >= start.replace(tzinfo=timezone.utc),
               Refund.processed_at < end.replace(tzinfo=timezone.utc))
        .group_by(Refund.method)
    ).all():
        key = "cash" if method == "cash" else "upi" if method == "upi" else method
        expected[key] = round(expected.get(key, 0.0) - float(total), 2)
    return expected


def close_day(db: Session, workspace_id: str, day: date, counted: dict, actor_user_id: str,
              notes: Optional[str] = None) -> CashReconciliation:
    existing = db.scalar(select(CashReconciliation).where(
        CashReconciliation.workspace_id == workspace_id, CashReconciliation.business_date == day,
        CashReconciliation.branch_key == "all"))
    if existing is not None and existing.status == "closed":
        raise HTTPException(status_code=409, detail="This day is already closed. Reopen it to record a new count.")
    expected = expected_collections(db, workspace_id, day)
    counted = {k: round(float(v), 2) for k, v in counted.items()}
    methods = sorted(set(expected) | set(counted))
    variance = {m: round(counted.get(m, 0.0) - expected.get(m, 0.0), 2) for m in methods}
    if existing is not None:  # reopened earlier: archive under a dated key, then write the new close
        existing.branch_key = f"reopened-{existing.id[:8]}"
        db.flush()
    rec = CashReconciliation(
        workspace_id=workspace_id, business_date=day, expected=expected, counted=counted, variance=variance,
        total_expected=round(sum(expected.values()), 2), total_counted=round(sum(counted.values()), 2),
        total_variance=round(sum(variance.values()), 2), notes=notes, closed_by_user_id=actor_user_id,
        closed_at=datetime.now(timezone.utc),
    )
    db.add(rec)
    db.flush()
    record_audit(db, workspace_id, actor_user_id, "day_closed", resource_type="reconciliation", resource_id=rec.id,
                 details={"date": day.isoformat(), "expected": rec.total_expected, "counted": rec.total_counted,
                          "variance": rec.total_variance})
    return rec


def reopen_day(db: Session, workspace_id: str, day: date, actor_user_id: str, reason: str) -> CashReconciliation:
    rec = db.scalar(select(CashReconciliation).where(
        CashReconciliation.workspace_id == workspace_id, CashReconciliation.business_date == day,
        CashReconciliation.branch_key == "all"))
    if rec is None or rec.status != "closed":
        raise HTTPException(status_code=404, detail="No closed reconciliation for this day.")
    rec.status = "reopened"
    rec.notes = f"{rec.notes or ''}\nReopened: {reason}".strip()
    record_audit(db, workspace_id, actor_user_id, "day_reopened", resource_type="reconciliation", resource_id=rec.id,
                 details={"date": day.isoformat(), "reason": reason[:200]})
    db.flush()
    return rec
