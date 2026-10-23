"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Archive, FileText, PenLine, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyBlock, Field, LoadingRow, Modal, Notice, inputClass } from "@/features/fitness/shared";
import { documentsApi, formatDateTime, type DocumentCategory, type MemberDocument } from "@/lib/operations-api";

const CATEGORY_LABEL: Record<DocumentCategory, string> = {
  agreement: "Agreement", waiver: "Waiver", id_proof: "ID proof", medical: "Medical", other: "Other",
};

function UploadDialog({ memberId, onDone, onClose }: { memberId: string; onDone: () => void; onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [meta, setMeta] = useState({ title: "", category: "waiver" as DocumentCategory, visible_to_member: true, requires_acknowledgement: false, expires_on: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Choose a PDF or image file.");
    setSaving(true);
    setError(null);
    try {
      await documentsApi.upload(memberId, file, { ...meta, expires_on: meta.expires_on || undefined });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal title="Upload document" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {error && <Notice kind="error">{error}</Notice>}
        <Field label="File" htmlFor="doc-file" hint="PDF, PNG, JPEG or WebP, up to 10 MB. Stored privately.">
          <input id="doc-file" ref={fileRef} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" required className={inputClass} />
        </Field>
        <Field label="Title" htmlFor="doc-title">
          <input id="doc-title" required minLength={2} className={inputClass} value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type" htmlFor="doc-category">
            <select id="doc-category" className={inputClass} value={meta.category} onChange={(e) => setMeta({ ...meta, category: e.target.value as DocumentCategory })}>
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Expires on (optional)" htmlFor="doc-expiry">
            <input id="doc-expiry" type="date" className={inputClass} value={meta.expires_on} onChange={(e) => setMeta({ ...meta, expires_on: e.target.value })} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={meta.visible_to_member} onChange={(e) => setMeta({ ...meta, visible_to_member: e.target.checked })} />
          Member can see this document
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={meta.requires_acknowledgement} disabled={!meta.visible_to_member}
            onChange={(e) => setMeta({ ...meta, requires_acknowledgement: e.target.checked })} />
          Member must sign it in the app
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" loading={saving}><Upload aria-hidden /> Upload</Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Documents for one member. `memberId="me"` is the member's own view (sign agreements);
 * staff pass the member's id and can upload and archive.
 */
export function MemberDocuments({ memberId, canManage = false }: { memberId: string; canManage?: boolean }) {
  const self = memberId === "me";
  const [docs, setDocs] = useState<MemberDocument[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [signing, setSigning] = useState<MemberDocument | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    documentsApi.list(memberId).then(setDocs).catch((e) => { setError(e.message); setDocs([]); });
  }, [memberId]);
  useEffect(load, [load]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--text)]">Documents</h2>
        {canManage && !self && <Button size="sm" variant="outline" onClick={() => setUploading(true)}><Upload aria-hidden /> Upload</Button>}
      </div>
      {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
      {docs === null ? <LoadingRow /> : docs.length === 0 ? (
        <EmptyBlock title="No documents">{canManage ? "Upload waivers, agreements or ID proofs." : null}</EmptyBlock>
      ) : (
        <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          {docs.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <button type="button" className="flex items-center gap-2 text-left hover:underline" onClick={() => documentsApi.download(memberId, d).catch((e) => setError(e.message))}>
                <FileText className="h-4 w-4 text-[var(--text-muted)]" aria-hidden />
                <span>
                  <span className="font-medium">{d.title}</span>
                  <span className="block text-xs text-[var(--text-muted)]">{CATEGORY_LABEL[d.category]} · {formatDateTime(d.created_at)}</span>
                </span>
              </button>
              <span className="flex items-center gap-2">
                {d.requires_acknowledgement && (d.acknowledged_at
                  ? <Badge variant="active">Signed by {d.acknowledged_name}</Badge>
                  : <Badge variant="expiring">Awaiting signature</Badge>)}
                {self && d.requires_acknowledgement && !d.acknowledged_at && (
                  <Button size="sm" onClick={() => setSigning(d)}><PenLine aria-hidden /> Sign</Button>
                )}
                {canManage && !self && (
                  <Button size="sm" variant="ghost" aria-label={`Archive ${d.title}`}
                    onClick={async () => { await documentsApi.archive(memberId, d.id).catch((e) => setError(e.message)); load(); }}>
                    <Archive aria-hidden />
                  </Button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {uploading && <UploadDialog memberId={memberId} onClose={() => setUploading(false)} onDone={() => { setUploading(false); load(); }} />}
      {signing && (
        <Modal title={`Sign: ${signing.title}`} onClose={() => setSigning(null)}>
          <form className="space-y-3" onSubmit={async (e) => {
            e.preventDefault();
            try {
              await documentsApi.acknowledge(memberId, signing.id, name);
              setSigning(null);
              load();
            } catch (err) {
              setError((err as Error).message);
            }
          }}>
            <p className="text-sm text-[var(--text-secondary)]">Open and read the document first. Typing your full name below counts as your signature.</p>
            <Field label="Full name" htmlFor="sign-name">
              <input id="sign-name" required minLength={2} autoComplete="name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setSigning(null)}>Cancel</Button>
              <Button type="submit" size="sm">I agree and sign</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
