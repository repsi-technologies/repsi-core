"""Discount coupons and promotional offers (managed with `plans.manage`)."""
from datetime import date
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.audit import record_audit
from app.core.database import get_db
from app.core.permissions import require_permission
from app.middleware.tenant import TenantContext, get_current_tenant
from app.models.member import Member, MembershipPlan
from app.models.offers import Coupon, CouponRedemption
from app.services import offers as svc

router = APIRouter(prefix="/offers", tags=["Offers"])


class CouponBase(BaseModel):
    description: Optional[str] = Field(default=None, max_length=500)
    discount_type: Literal["percent", "flat"] = "percent"
    discount_value: float = Field(gt=0)
    max_discount: Optional[float] = Field(default=None, gt=0)
    min_amount: Optional[float] = Field(default=None, ge=0)
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None
    max_redemptions: Optional[int] = Field(default=None, ge=1)
    max_per_member: int = Field(default=1, ge=1, le=100)
    plan_ids: Optional[List[str]] = None
    new_members_only: bool = False


class CouponCreate(CouponBase):
    code: str = Field(min_length=3, max_length=40)

    @field_validator("code")
    @classmethod
    def _code(cls, v: str) -> str:
        v = svc.normalize_code(v)
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError("Use letters, numbers, - or _ in coupon codes")
        return v


class CouponUpdate(BaseModel):
    description: Optional[str] = Field(default=None, max_length=500)
    max_discount: Optional[float] = Field(default=None, gt=0)
    min_amount: Optional[float] = Field(default=None, ge=0)
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None
    max_redemptions: Optional[int] = Field(default=None, ge=1)
    max_per_member: Optional[int] = Field(default=None, ge=1, le=100)
    plan_ids: Optional[List[str]] = None
    new_members_only: Optional[bool] = None
    is_active: Optional[bool] = None


class CouponResponse(CouponBase):
    id: str
    code: str
    is_active: bool
    redemptions: int = 0

    model_config = ConfigDict(from_attributes=True)


class QuoteRequest(BaseModel):
    code: str = Field(min_length=1, max_length=40)
    plan_id: str
    member_id: Optional[str] = None


def _check(data: CouponBase | CouponUpdate, db: Session, workspace_id: str) -> None:
    if getattr(data, "discount_type", None) == "percent" and data.discount_value > 100:
        raise HTTPException(status_code=422, detail="A percentage discount can't exceed 100%.")
    if data.valid_from and data.valid_until and data.valid_until < data.valid_from:
        raise HTTPException(status_code=422, detail="The end date must be on or after the start date.")
    if data.plan_ids:
        found = set(db.scalars(select(MembershipPlan.id).where(
            MembershipPlan.workspace_id == workspace_id, MembershipPlan.id.in_(data.plan_ids))).all())
        if found != set(data.plan_ids):
            raise HTTPException(status_code=404, detail="One or more plans were not found.")


def _response(db: Session, c: Coupon) -> CouponResponse:
    n = db.scalar(select(func.count(CouponRedemption.id)).where(CouponRedemption.coupon_id == c.id)) or 0
    return CouponResponse.model_validate(c).model_copy(update={"redemptions": n})


@router.get("/coupons", response_model=List[CouponResponse])
def list_coupons(include_inactive: bool = False, tenant: TenantContext = Depends(require_permission("plans.manage")),
                 db: Session = Depends(get_db)):
    q = select(Coupon).where(Coupon.workspace_id == tenant.workspace_id)
    if not include_inactive:
        q = q.where(Coupon.is_active.is_(True))
    return [_response(db, c) for c in db.scalars(q.order_by(Coupon.created_at.desc())).all()]


@router.post("/coupons", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
def create_coupon(data: CouponCreate, tenant: TenantContext = Depends(require_permission("plans.manage")),
                  db: Session = Depends(get_db)):
    _check(data, db, tenant.workspace_id)
    c = Coupon(workspace_id=tenant.workspace_id, created_by=tenant.user_id, **data.model_dump())
    db.add(c)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A coupon with this code already exists.")
    record_audit(db, tenant.workspace_id, tenant.user_id, "coupon_created", resource_type="coupon", resource_id=c.id,
                 details={"code": c.code, "type": c.discount_type, "value": c.discount_value})
    db.commit()
    return _response(db, c)


@router.patch("/coupons/{coupon_id}", response_model=CouponResponse)
def update_coupon(coupon_id: str, data: CouponUpdate, tenant: TenantContext = Depends(require_permission("plans.manage")),
                  db: Session = Depends(get_db)):
    c = db.scalar(select(Coupon).where(Coupon.workspace_id == tenant.workspace_id, Coupon.id == coupon_id))
    if c is None:
        raise HTTPException(status_code=404, detail="Coupon not found.")
    changes = data.model_dump(exclude_unset=True)
    merged = CouponUpdate(**{**{k: getattr(c, k) for k in CouponUpdate.model_fields if hasattr(c, k)}, **changes})
    _check(merged, db, tenant.workspace_id)
    for k, v in changes.items():
        setattr(c, k, v)
    record_audit(db, tenant.workspace_id, tenant.user_id, "coupon_updated", resource_type="coupon", resource_id=c.id,
                 details={"fields": sorted(changes)})
    db.commit()
    return _response(db, c)


@router.get("/coupons/{coupon_id}/redemptions")
def coupon_redemptions(coupon_id: str, tenant: TenantContext = Depends(require_permission("plans.manage")),
                       db: Session = Depends(get_db)):
    rows = db.execute(select(CouponRedemption, Member).join(Member, Member.id == CouponRedemption.member_id).where(
        CouponRedemption.workspace_id == tenant.workspace_id, CouponRedemption.coupon_id == coupon_id,
    ).order_by(CouponRedemption.created_at.desc()).limit(500)).all()
    return [{"id": r.id, "member_id": m.id, "member_name": f"{m.first_name} {m.last_name or ''}".strip(),
             "membership_id": r.membership_id, "list_price": r.list_price, "discount": r.discount_amount,
             "final_price": r.final_price, "redeemed_at": r.created_at} for r, m in rows]


@router.post("/coupons/quote")
def quote_coupon(data: QuoteRequest, tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)):
    """Preview a discount. Members can check codes for themselves; staff for any member."""
    plan = db.scalar(select(MembershipPlan).where(MembershipPlan.workspace_id == tenant.workspace_id,
                                                  MembershipPlan.id == data.plan_id))
    if plan is None:
        raise HTTPException(status_code=404, detail="Membership plan not found.")
    member = None
    if tenant.role == "USER":
        member = db.scalar(select(Member).where(Member.workspace_id == tenant.workspace_id, Member.user_id == tenant.user_id))
    elif data.member_id:
        member = db.scalar(select(Member).where(Member.workspace_id == tenant.workspace_id, Member.id == data.member_id))
        if member is None:
            raise HTTPException(status_code=404, detail="Member not found.")
    coupon = svc.find_coupon(db, tenant.workspace_id, data.code)
    return svc.quote(db, coupon, plan, member, date.today()).as_dict()
