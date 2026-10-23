"""Coupon validation and redemption. Redemptions are append-only; a coupon is archived, never deleted once used."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.member import Member, Membership, MembershipPlan
from app.models.offers import Coupon, CouponRedemption


@dataclass
class Quote:
    coupon: Coupon
    list_price: float
    discount: float
    final_price: float

    def as_dict(self) -> dict:
        return {"coupon_id": self.coupon.id, "code": self.coupon.code, "list_price": self.list_price,
                "discount": self.discount, "final_price": self.final_price,
                "discount_type": self.coupon.discount_type, "discount_value": self.coupon.discount_value}


def normalize_code(code: str) -> str:
    return "".join(code.split()).upper()


def find_coupon(db: Session, workspace_id: str, code: str) -> Coupon:
    coupon = db.scalar(select(Coupon).where(Coupon.workspace_id == workspace_id, Coupon.code == normalize_code(code)))
    if coupon is None:
        raise HTTPException(status_code=404, detail="Coupon code not found.")
    return coupon


def quote(db: Session, coupon: Coupon, plan: MembershipPlan, member: Optional[Member], today: date,
          list_price: Optional[float] = None) -> Quote:
    def bad(msg: str) -> HTTPException:
        return HTTPException(status_code=422, detail=msg)

    if not coupon.is_active:
        raise bad("This coupon is no longer active.")
    if coupon.valid_from and today < coupon.valid_from:
        raise bad(f"This coupon starts on {coupon.valid_from:%d %b %Y}.")
    if coupon.valid_until and today > coupon.valid_until:
        raise bad("This coupon has expired.")
    if coupon.plan_ids and plan.id not in coupon.plan_ids:
        raise bad("This coupon doesn't apply to the selected plan.")
    price = plan.price if list_price is None else list_price
    if coupon.min_amount and price < coupon.min_amount:
        raise bad(f"This coupon needs a minimum amount of {coupon.min_amount:.2f}.")
    used = db.scalar(select(func.count(CouponRedemption.id)).where(CouponRedemption.coupon_id == coupon.id)) or 0
    if coupon.max_redemptions is not None and used >= coupon.max_redemptions:
        raise bad("This coupon has reached its redemption limit.")
    if member is not None:
        mine = db.scalar(select(func.count(CouponRedemption.id)).where(
            CouponRedemption.coupon_id == coupon.id, CouponRedemption.member_id == member.id)) or 0
        if mine >= (coupon.max_per_member or 1):
            raise bad("This member has already used this coupon.")
        if coupon.new_members_only and db.scalar(select(Membership.id).where(
                Membership.workspace_id == member.workspace_id, Membership.member_id == member.id)):
            raise bad("This coupon is for new members only.")
    if coupon.discount_type == "percent":
        discount = price * coupon.discount_value / 100.0
        if coupon.max_discount is not None:
            discount = min(discount, coupon.max_discount)
    else:
        discount = coupon.discount_value
    discount = round(min(max(discount, 0.0), price), 2)
    return Quote(coupon=coupon, list_price=round(price, 2), discount=discount, final_price=round(price - discount, 2))


def redeem(db: Session, q: Quote, member: Member, membership: Membership, actor_user_id: Optional[str]) -> CouponRedemption:
    r = CouponRedemption(workspace_id=member.workspace_id, coupon_id=q.coupon.id, member_id=member.id,
                         membership_id=membership.id, plan_id=membership.plan_id, list_price=q.list_price,
                         discount_amount=q.discount, final_price=q.final_price, redeemed_by_user_id=actor_user_id)
    db.add(r)
    db.flush()
    return r
