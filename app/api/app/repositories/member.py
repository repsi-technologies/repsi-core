from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from datetime import date, timedelta
from sqlalchemy import and_, or_, false
from app.models.member import Member, Membership, MembershipPlan, MemberStatus
from app.repositories.base import BaseTenantRepository


class MemberRepository(BaseTenantRepository[Member]):
    def __init__(self, db: Session, workspace_id: str):
        super().__init__(Member, db, workspace_id)

    def _filtered(self, query: str = "", status: Optional[str] = None, plan_id: Optional[str] = None,
                  joined_from: Optional[date] = None, joined_to: Optional[date] = None,
                  include_archived: bool = False):
        q = self.db.query(Member).filter(Member.workspace_id == self.workspace_id)
        if query:
            term = f"%{query.strip()}%"
            q = q.filter(or_(
                Member.first_name.ilike(term),
                Member.last_name.ilike(term),
                Member.email.ilike(term),
                Member.phone.ilike(term),
                Member.id == query.strip(),
            ))
        if status and status.lower() != "all":
            membership_filter = self._membership_state_filter(status.lower())
            if membership_filter is not None:
                q = q.filter(membership_filter)
            else:
                try:
                    q = q.filter(Member.status == MemberStatus(status.lower()))
                except ValueError:
                    return q.filter(false())
        elif not include_archived:
            q = q.filter(Member.status != MemberStatus.ARCHIVED)
        if plan_id:
            q = q.filter(Member.memberships.any(Membership.plan_id == plan_id))
        if joined_from:
            q = q.filter(Member.joined_date >= joined_from)
        if joined_to:
            q = q.filter(Member.joined_date <= joined_to)
        return q

    def search(self, query: str = "", status: Optional[str] = None, skip: int = 0, limit: int = 50,
               sort: str = "-created_at", **filters) -> List[Member]:
        column = getattr(Member, sort.lstrip("-"))
        order = column.desc() if sort.startswith("-") else column.asc()
        return (
            self._filtered(query, status, **filters)
            .options(joinedload(Member.memberships).joinedload(Membership.plan))
            .order_by(order, Member.id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_search(self, query: str = "", status: Optional[str] = None, **filters) -> int:
        return self._filtered(query, status, **filters).count()

    def get(self, id: str) -> Optional[Member]:
        return (
            self.db.query(Member)
            .options(joinedload(Member.memberships).joinedload(Membership.plan))
            .filter(Member.workspace_id == self.workspace_id, Member.id == id)
            .first()
        )

    def count_active(self) -> int:
        return (
            self.db.query(Member)
            .filter(Member.workspace_id == self.workspace_id, Member.status == MemberStatus.ACTIVE)
            .count()
        )

    @staticmethod
    def _membership_state_filter(status: str):
        """`expiring`, `expired` and `frozen` describe the membership, not the account (Member.status
        only holds active/inactive/suspended/archived), so they are matched on memberships. Rows that
        still carry the legacy account value keep matching too."""
        today = date.today()
        current = and_(Membership.status.in_([MemberStatus.ACTIVE, MemberStatus.FROZEN]), Membership.end_date >= today)
        if status == "expiring":
            return or_(Member.status == MemberStatus.EXPIRING, Member.memberships.any(and_(
                Membership.status == MemberStatus.ACTIVE,
                Membership.end_date >= today,
                Membership.end_date <= today + timedelta(days=7),
            )))
        if status == "expired":
            return or_(Member.status == MemberStatus.EXPIRED, and_(
                Member.status == MemberStatus.ACTIVE,
                Member.memberships.any(),
                ~Member.memberships.any(current),
            ))
        if status == "frozen":
            return or_(Member.status == MemberStatus.FROZEN, Member.memberships.any(and_(
                Membership.status == MemberStatus.FROZEN, Membership.end_date >= today)))
        return None

    def count_expiring(self, days: int = 7) -> int:
        """Members whose active membership ends within `days` (same window as /memberships/run-expiry).
        Member.status is the account status, so the legacy EXPIRING value is never set on members."""
        today = date.today()
        return (
            self.db.query(Membership.member_id)
            .filter(
                Membership.workspace_id == self.workspace_id,
                Membership.status == MemberStatus.ACTIVE,
                Membership.end_date >= today,
                Membership.end_date <= today + timedelta(days=days),
            )
            .distinct()
            .count()
        )
