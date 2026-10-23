"""Discount coupons and promotional offers, with an append-only redemption history."""
from sqlalchemy import JSON, Boolean, Column, Date, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint

from app.core.database import Base
from app.models.base import TenantMixin, TimestampMixin, generate_uuid

DISCOUNT_TYPES = ("percent", "flat")


class Coupon(Base, TimestampMixin, TenantMixin):
    __tablename__ = "coupons"
    __table_args__ = (UniqueConstraint("workspace_id", "code", name="uq_coupon_workspace_code"),)

    id = Column(String(64), primary_key=True, default=generate_uuid)
    code = Column(String(40), nullable=False)  # stored upper-case
    description = Column(Text, nullable=True)
    discount_type = Column(String(10), nullable=False, default="percent")
    discount_value = Column(Float, nullable=False)
    max_discount = Column(Float, nullable=True)  # cap for percent coupons
    min_amount = Column(Float, nullable=True)
    valid_from = Column(Date, nullable=True)
    valid_until = Column(Date, nullable=True)
    max_redemptions = Column(Integer, nullable=True)  # NULL = unlimited
    max_per_member = Column(Integer, nullable=False, default=1)
    plan_ids = Column(JSON, nullable=True)  # NULL/empty = every plan
    new_members_only = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_by = Column(String(64), nullable=True)


class CouponRedemption(Base, TimestampMixin, TenantMixin):
    __tablename__ = "coupon_redemptions"
    __table_args__ = (Index("ix_coupon_redemptions_ws_coupon", "workspace_id", "coupon_id"),)

    id = Column(String(64), primary_key=True, default=generate_uuid)
    coupon_id = Column(String(64), ForeignKey("coupons.id", ondelete="CASCADE"), nullable=False)
    member_id = Column(String(64), ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    membership_id = Column(String(64), ForeignKey("memberships.id", ondelete="SET NULL"), nullable=True)
    plan_id = Column(String(64), nullable=True)
    list_price = Column(Float, nullable=False)
    discount_amount = Column(Float, nullable=False)
    final_price = Column(Float, nullable=False)
    redeemed_by_user_id = Column(String(64), nullable=True)
