"""
Business reports (revenue, memberships, attendance, dues, trainers, classes), saved report views
and CSV / Excel / PDF export. Requires `reports.view`; exports also need `records.export`.
"""
import json
from datetime import date, timedelta
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.audit import record_audit
from app.core.database import get_db
from app.core.permissions import has_permission, require_permission
from app.middleware.tenant import TenantContext
from app.models.system import SavedReport
from app.models.user import Workspace
from app.services import reports as svc

router = APIRouter(prefix="/reports", tags=["Reports"])

ReportType = Literal["revenue", "memberships", "attendance", "dues", "trainers", "classes"]


class SavedReportCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    report_type: ReportType
    filters: dict = Field(default_factory=dict)
    is_shared: bool = True


class SavedReportResponse(BaseModel):
    id: str
    name: str
    report_type: str
    filters: dict
    is_shared: bool
    created_by: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


def _filters(start: Optional[date], end: Optional[date], group_by: str, plan_id: Optional[str],
             branch_id: Optional[str], trainer_id: Optional[str]) -> svc.ReportFilters:
    end = end or date.today()
    start = start or end - timedelta(days=89)
    return svc.ReportFilters(start, end, group_by, plan_id, branch_id, trainer_id)


@router.get("/catalog")
def report_catalog(tenant: TenantContext = Depends(require_permission("reports.view"))):
    return svc.CATALOG


@router.get("/summary")
def get_reports_summary(tenant: TenantContext = Depends(require_permission("reports.view")),
                        db: Session = Depends(get_db)):
    """Headline numbers for the last 30 days (replaces the old placeholder list)."""
    f = svc.ReportFilters(date.today() - timedelta(days=29), date.today(), "month")
    rev = svc.revenue(db, tenant.workspace_id, f)["summary"]
    mem = svc.memberships(db, tenant.workspace_id, f)["summary"]
    att = svc.attendance(db, tenant.workspace_id, f)["summary"]
    due = svc.dues(db, tenant.workspace_id, f)["summary"]
    return {"workspace_id": tenant.workspace_id, "period": f.as_dict(), "revenue": rev,
            "memberships": {k: v for k, v in mem.items()}, "attendance": {k: v for k, v in att.items() if k != "heatmap"},
            "dues": due, "reports": svc.CATALOG}


@router.get("/saved", response_model=list[SavedReportResponse])
def list_saved_reports(tenant: TenantContext = Depends(require_permission("reports.view")), db: Session = Depends(get_db)):
    rows = db.scalars(select(SavedReport).where(SavedReport.workspace_id == tenant.workspace_id).order_by(SavedReport.name)).all()
    return [_saved_view(r) for r in rows if r.is_shared or r.created_by == tenant.user_id]


@router.post("/saved", response_model=SavedReportResponse, status_code=status.HTTP_201_CREATED)
def save_report(data: SavedReportCreate, tenant: TenantContext = Depends(require_permission("reports.view")),
                db: Session = Depends(get_db)):
    allowed = {"start", "end", "group_by", "plan_id", "branch_id", "trainer_id", "relative_days"}
    bad = set(data.filters) - allowed
    if bad:
        raise HTTPException(status_code=422, detail=f"Unknown filters: {', '.join(sorted(bad))}.")
    r = SavedReport(workspace_id=tenant.workspace_id, name=data.name.strip(), report_type=data.report_type,
                    filters=json.dumps(data.filters), created_by=tenant.user_id, is_shared=data.is_shared)
    db.add(r)
    db.commit()
    db.refresh(r)
    return _saved_view(r)


@router.delete("/saved/{saved_id}")
def delete_saved_report(saved_id: str, tenant: TenantContext = Depends(require_permission("reports.view")),
                        db: Session = Depends(get_db)):
    r = db.scalar(select(SavedReport).where(SavedReport.workspace_id == tenant.workspace_id, SavedReport.id == saved_id))
    if r is None:
        raise HTTPException(status_code=404, detail="Saved report not found.")
    if r.created_by != tenant.user_id and tenant.role not in ("OWNER", "ADMIN", "SUPER_ADMIN"):
        raise HTTPException(status_code=403, detail="Only the person who saved this view can delete it.")
    db.delete(r)  # a saved view is a preference, not a business record
    db.commit()
    return {"status": "success"}


@router.get("/saved/{saved_id}/run")
def run_saved_report(saved_id: str, tenant: TenantContext = Depends(require_permission("reports.view")),
                     db: Session = Depends(get_db)):
    r = db.scalar(select(SavedReport).where(SavedReport.workspace_id == tenant.workspace_id, SavedReport.id == saved_id))
    if r is None or not (r.is_shared or r.created_by == tenant.user_id):
        raise HTTPException(status_code=404, detail="Saved report not found.")
    f = json.loads(r.filters or "{}")
    end = date.fromisoformat(f["end"]) if f.get("end") else date.today()
    start = date.fromisoformat(f["start"]) if f.get("start") else end - timedelta(days=int(f.get("relative_days", 90)) - 1)
    return svc.run(db, tenant.workspace_id, r.report_type, svc.ReportFilters(
        start, end, f.get("group_by", "month"), f.get("plan_id"), f.get("branch_id"), f.get("trainer_id")))


@router.get("/{report_type}")
def run_report(
    report_type: ReportType,
    start: Optional[date] = None,
    end: Optional[date] = None,
    group_by: Literal["day", "week", "month"] = "month",
    plan_id: Optional[str] = None,
    branch_id: Optional[str] = None,
    trainer_id: Optional[str] = None,
    tenant: TenantContext = Depends(require_permission("reports.view")),
    db: Session = Depends(get_db),
):
    return svc.run(db, tenant.workspace_id, report_type, _filters(start, end, group_by, plan_id, branch_id, trainer_id))


@router.get("/{report_type}/export")
def export_report(
    report_type: ReportType,
    format: Literal["csv", "xlsx", "pdf"] = "csv",
    start: Optional[date] = None,
    end: Optional[date] = None,
    group_by: Literal["day", "week", "month"] = "month",
    plan_id: Optional[str] = None,
    branch_id: Optional[str] = None,
    trainer_id: Optional[str] = None,
    tenant: TenantContext = Depends(require_permission("reports.view")),
    db: Session = Depends(get_db),
):
    if not has_permission(db, tenant, "records.export"):
        raise HTTPException(status_code=403, detail="You don't have permission to export records.")
    report = svc.run(db, tenant.workspace_id, report_type, _filters(start, end, group_by, plan_id, branch_id, trainer_id))
    ws = db.get(Workspace, tenant.workspace_id)
    name = f"{report_type}-{report['filters']['start']}-to-{report['filters']['end']}"
    if format == "xlsx":
        body, media = svc.to_xlsx(report), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    elif format == "pdf":
        body, media = svc.to_pdf(report, ws.name if ws else "Gym"), "application/pdf"
    else:
        body, media = svc.to_csv(report), "text/csv; charset=utf-8"
    record_audit(db, tenant.workspace_id, tenant.user_id, "report_exported", resource_type="report",
                 details={"report": report_type, "format": format, "rows": len(report["rows"])})
    db.commit()
    return Response(content=body, media_type=media, headers={
        "Content-Disposition": f'attachment; filename="{name}.{format}"', "Cache-Control": "private, no-store"})


def _saved_view(r: SavedReport) -> SavedReportResponse:
    return SavedReportResponse(id=r.id, name=r.name, report_type=r.report_type, filters=json.loads(r.filters or "{}"),
                               is_shared=r.is_shared, created_by=r.created_by)
