"""
Member documents: agreements, waivers, ID proofs and medical forms.

Files go to private storage (app/core/storage.py) after a magic-byte check (PDF, PNG, JPEG, WebP)
and a size cap. Staff with `documents.manage` upload and archive; staff with `members.view` read;
members see the documents shared with them and acknowledge (sign) the ones that need it.
Documents are archived, never deleted, so signed agreements stay on record.
"""
import hashlib
import uuid
from datetime import date, datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import Response
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from urllib.parse import quote

from app.core.audit import record_audit
from app.core.config import settings
from app.core.database import get_db
from app.core.permissions import has_permission
from app.core.rate_limit import client_ip
from app.core.storage import StorageNotConfigured, detect_mime_type, get_storage
from app.middleware.tenant import TenantContext, get_current_tenant
from app.models.member import Member
from app.models.member_records import MemberDocument
from app.models.user import User

router = APIRouter(prefix="/members", tags=["Member documents"])

CATEGORIES = ("agreement", "waiver", "id_proof", "medical", "other")


class DocumentResponse(BaseModel):
    id: str
    member_id: str
    category: str
    title: str
    original_filename: Optional[str] = None
    content_type: str
    size_bytes: int
    visible_to_member: bool
    requires_acknowledgement: bool
    acknowledged_at: Optional[datetime] = None
    acknowledged_name: Optional[str] = None
    expires_on: Optional[date] = None
    archived_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AcknowledgeRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=200)
    agree: bool


def _member(db: Session, tenant: TenantContext, member_id: str) -> Member:
    if member_id == "me":
        m = db.scalar(select(Member).where(Member.workspace_id == tenant.workspace_id, Member.user_id == tenant.user_id))
    else:
        m = db.scalar(select(Member).where(Member.workspace_id == tenant.workspace_id, Member.id == member_id))
    if m is None:
        raise HTTPException(status_code=404, detail="Member not found.")
    if tenant.role == "USER":
        if m.user_id != tenant.user_id:
            raise HTTPException(status_code=404, detail="Member not found.")
    elif not has_permission(db, tenant, "members.view"):
        raise HTTPException(status_code=403, detail="You don't have permission to view member documents.")
    return m


def _document(db: Session, tenant: TenantContext, member: Member, doc_id: str) -> MemberDocument:
    doc = db.scalar(select(MemberDocument).where(
        MemberDocument.workspace_id == tenant.workspace_id, MemberDocument.member_id == member.id,
        MemberDocument.id == doc_id))
    if doc is None or (tenant.role == "USER" and (not doc.visible_to_member or doc.archived_at)):
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc


@router.get("/{member_id}/documents", response_model=list[DocumentResponse])
def list_documents(member_id: str, include_archived: bool = False,
                   tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)):
    member = _member(db, tenant, member_id)
    q = select(MemberDocument).where(MemberDocument.workspace_id == tenant.workspace_id,
                                     MemberDocument.member_id == member.id)
    if tenant.role == "USER":
        q = q.where(MemberDocument.visible_to_member.is_(True), MemberDocument.archived_at.is_(None))
    elif not include_archived:
        q = q.where(MemberDocument.archived_at.is_(None))
    return db.scalars(q.order_by(MemberDocument.created_at.desc())).all()


@router.post("/{member_id}/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    member_id: str,
    file: UploadFile = File(...),
    title: str = Form(..., min_length=2, max_length=200),
    category: Literal["agreement", "waiver", "id_proof", "medical", "other"] = Form("other"),
    visible_to_member: bool = Form(True),
    requires_acknowledgement: bool = Form(False),
    expires_on: Optional[date] = Form(None),
    tenant: TenantContext = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    if tenant.role == "USER" or not has_permission(db, tenant, "documents.manage"):
        raise HTTPException(status_code=403, detail="You don't have permission to upload member documents.")
    member = _member(db, tenant, member_id)
    data = await file.read(settings.MEMBER_DOCUMENT_MAX_BYTES + 1)
    if not data:
        raise HTTPException(status_code=400, detail="Choose a file to upload.")
    if len(data) > settings.MEMBER_DOCUMENT_MAX_BYTES:
        raise HTTPException(status_code=413, detail=f"Documents must be {settings.MEMBER_DOCUMENT_MAX_BYTES // (1024 * 1024)} MB or smaller.")
    mime = detect_mime_type(data)
    if mime is None:
        raise HTTPException(status_code=415, detail="Upload a PDF, PNG, JPEG or WebP file.")
    ext = {"application/pdf": "pdf", "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}[mime]
    key = f"member_documents/{tenant.workspace_id}/{member.id}/{uuid.uuid4().hex}.{ext}"
    try:
        get_storage().put(key, data, mime)
    except StorageNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    doc = MemberDocument(
        workspace_id=tenant.workspace_id, member_id=member.id, category=category, title=title.strip(),
        storage_key=key, original_filename=(file.filename or "")[:255] or None, content_type=mime, size_bytes=len(data),
        sha256=hashlib.sha256(data).hexdigest(), uploaded_by_user_id=tenant.user_id,
        visible_to_member=visible_to_member, requires_acknowledgement=requires_acknowledgement, expires_on=expires_on,
    )
    db.add(doc)
    db.flush()
    record_audit(db, tenant.workspace_id, tenant.user_id, "member_document_uploaded", resource_type="member_document",
                 resource_id=doc.id, details={"member_id": member.id, "category": category, "size": len(data)})
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/{member_id}/documents/{doc_id}/file")
def download_document(member_id: str, doc_id: str, tenant: TenantContext = Depends(get_current_tenant),
                      db: Session = Depends(get_db)):
    member = _member(db, tenant, member_id)
    doc = _document(db, tenant, member, doc_id)
    try:
        data = get_storage().get(doc.storage_key)
    except StorageNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    if data is None:
        raise HTTPException(status_code=404, detail="The document file is missing from storage.")
    name = doc.original_filename or f"{doc.title}.{doc.storage_key.rsplit('.', 1)[-1]}"
    return Response(content=data, media_type=doc.content_type, headers={
        "Content-Disposition": f"inline; filename*=UTF-8''{quote(name)}",
        "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"})


@router.post("/{member_id}/documents/{doc_id}/acknowledge", response_model=DocumentResponse)
def acknowledge_document(member_id: str, doc_id: str, data: AcknowledgeRequest, request: Request,
                         tenant: TenantContext = Depends(get_current_tenant), db: Session = Depends(get_db)):
    """The member signs an agreement or waiver by typing their name. Recorded once, with time and IP."""
    member = _member(db, tenant, member_id)
    if member.user_id != tenant.user_id:
        raise HTTPException(status_code=403, detail="Only the member can sign their own documents.")
    doc = _document(db, tenant, member, doc_id)
    if not doc.requires_acknowledgement:
        raise HTTPException(status_code=409, detail="This document doesn't need a signature.")
    if doc.acknowledged_at:
        raise HTTPException(status_code=409, detail="You've already signed this document.")
    if not data.agree:
        raise HTTPException(status_code=422, detail="Tick the box to confirm you agree.")
    doc.acknowledged_at = datetime.now(timezone.utc)
    doc.acknowledged_by_user_id = tenant.user_id
    doc.acknowledged_name = " ".join(data.full_name.split())
    doc.acknowledged_ip = client_ip(request)
    record_audit(db, tenant.workspace_id, tenant.user_id, "member_document_signed", resource_type="member_document",
                 resource_id=doc.id, details={"member_id": member.id})
    db.commit()
    db.refresh(doc)
    return doc


@router.post("/{member_id}/documents/{doc_id}/archive", response_model=DocumentResponse)
def archive_document(member_id: str, doc_id: str, tenant: TenantContext = Depends(get_current_tenant),
                     db: Session = Depends(get_db)):
    if tenant.role == "USER" or not has_permission(db, tenant, "documents.manage"):
        raise HTTPException(status_code=403, detail="You don't have permission to archive member documents.")
    member = _member(db, tenant, member_id)
    doc = _document(db, tenant, member, doc_id)
    if doc.archived_at is None:
        doc.archived_at = datetime.now(timezone.utc)
        record_audit(db, tenant.workspace_id, tenant.user_id, "member_document_archived",
                     resource_type="member_document", resource_id=doc.id, details={"member_id": member.id})
        db.commit()
        db.refresh(doc)
    return doc
