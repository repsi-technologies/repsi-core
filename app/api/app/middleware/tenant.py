from typing import Optional
from fastapi import Header, HTTPException, Request, status, Depends
from jose import JWTError, jwt
from app.core.config import settings
from app.core.security import decode_access_token


from app.core.database import get_db
from sqlalchemy.orm import Session


# While a workspace is suspended its users can still sign in, read their own session/billing state
# and see why access is restricted; everything else is refused until a super admin reactivates it.
SUSPENDED_WORKSPACE_ALLOWED_PATHS = (
    "/auth/", "/billing/trial-status", "/billing/entitlements", "/billing/plans", "/notifications",
)


def _refuse_if_suspended(ws, request: Optional[Request]) -> None:
    if ws is None or ws.is_active is not False:
        return
    path = request.url.path if request is not None else ""
    if request is not None and request.method == "GET" and any(seg in path for seg in SUSPENDED_WORKSPACE_ALLOWED_PATHS):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={
            "error_code": "WORKSPACE_SUSPENDED",
            "workspace_id": ws.id,
            "message": "This gym workspace is suspended. Contact REPSI support to reactivate it.",
        },
    )


class TenantContext:
    def __init__(self, workspace_id: str, user_id: str, role: Optional[str] = None):
        self.workspace_id = workspace_id
        self.user_id = user_id
        self.role = role


def get_current_tenant(
    request: Request = None,
    authorization: Optional[str] = Header(None),
    x_workspace_id: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> TenantContext:
    """
    Extracts authenticated tenant context securely from JWT claims.
    Header override (X-Workspace-ID) is strictly restricted to SUPER_ADMIN.
    """
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]

    payload = decode_access_token(token) if token else None

    if payload and payload.get("sub"):
        user_id = payload.get("sub")
        jwt_workspace_id = payload.get("workspace_id")
        role = payload.get("role")

        workspace_id = x_workspace_id or jwt_workspace_id

        if role == "SUPER_ADMIN":
            return TenantContext(workspace_id=workspace_id or "platform", user_id=user_id, role="SUPER_ADMIN")

        from app.models.user import Workspace, WorkspaceMember

        if workspace_id:
            # Strictly verify tenant isolation and active membership in the workspace
            ws = db.query(Workspace).filter(
                (Workspace.id == workspace_id) | (Workspace.slug == workspace_id)
            ).first()
            actual_ws_id = ws.id if ws else workspace_id

            member = db.query(WorkspaceMember).filter(
                WorkspaceMember.workspace_id == actual_ws_id,
                WorkspaceMember.user_id == user_id,
            ).first()
            if not member or not member.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied. You do not have an active account in this gym workspace.",
                )
            _refuse_if_suspended(ws, request)
            role = member.role.value if hasattr(member.role, "value") else str(member.role)
            return TenantContext(workspace_id=actual_ws_id, user_id=user_id, role=role)

        # Fallback to user's first active workspace membership if no workspace_id was passed
        first_member = db.query(WorkspaceMember).filter(
            WorkspaceMember.user_id == user_id,
            WorkspaceMember.is_active == True,
        ).first()
        if first_member:
            _refuse_if_suspended(db.get(Workspace, first_member.workspace_id), request)
            resolved_role = first_member.role.value if hasattr(first_member.role, "value") else str(first_member.role)
            return TenantContext(workspace_id=first_member.workspace_id, user_id=user_id, role=resolved_role)

        # User has no active workspaces (e.g. freshly created user before workspace assignment)
        return TenantContext(workspace_id="", user_id=user_id, role=role or "USER")

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication token required" if not authorization else "Invalid or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )


ORG_ADMIN_ROLES = ("OWNER", "ADMIN", "SUPER_ADMIN")
BRANCH_MANAGER_ROLES = ("OWNER", "ADMIN", "MANAGER", "SUPER_ADMIN")


def get_current_user(
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Resolves the signed-in User row (works before the user belongs to any workspace)."""
    from app.models.user import User

    user = db.query(User).filter(User.id == tenant.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Your session is no longer valid.")
    return user


def require_roles(*roles: str):
    """Dependency factory: the caller must hold one of `roles` in the active workspace."""

    def checker(tenant: TenantContext = Depends(get_current_tenant)) -> TenantContext:
        if not tenant.workspace_id or tenant.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to perform this action.",
            )
        return tenant

    return checker
