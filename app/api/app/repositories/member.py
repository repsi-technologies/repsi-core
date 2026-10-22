from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from datetime import date
from sqlalchemy import or_, false
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

    def count_expiring(self) -> int:
        return (
            self.db.query(Member)
            .filter(Member.workspace_id == self.workspace_id, Member.status == MemberStatus.EXPIRING)
            .count()
        )
