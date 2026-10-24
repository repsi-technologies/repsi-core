"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Archive, FileText, PenLine, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyBlock, Field, LoadingRow, Modal, Notice, inputClass } from "@/features/fitness/shared";
import { documentsApi, formatDateTime, type DocumentCategory, type MemberDocument } from "@/lib/operations-api";
import { useTranslation, richText } from "@/lib/i18n";

const CATEGORY_LABEL: Record<DocumentCategory, string> = {
  agreement: "Agreement", waiver: "Waiver", id_proof: "ID proof", medical: "Medical", other: "Other",
};

function UploadDialog({ memberId, onDone, onClose }: { memberId: string; onDone: () => void; onClose: () => void }) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [meta, setMeta] = useState({ title: "", category: "waiver" as DocumentCategory, visible_to_member: true, requires_acknowledgement: false, expires_on: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return setError(t("members.choose_a_pdf_or_image_file"));
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
    <Modal title={t("members.upload_document")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {error && <Notice kind="error">{error}</Notice>}
        <Field label={t("members.file")} htmlFor="doc-file" hint={t("members.pdf_png_jpeg_or_webp_up")}>
          <input id="doc-file" ref={fileRef} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" required className={inputClass} />
        </Field>
        <Field label={t("members.title")} htmlFor="doc-title">
          <input id="doc-title" required minLength={2} className={inputClass} value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("members.type")} htmlFor="doc-category">
            <select id="doc-category" className={inputClass} value={meta.category} onChange={(e) => setMeta({ ...meta, category: e.target.value as DocumentCategory })}>
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label={t("members.expires_on_optional")} htmlFor="doc-expiry">
            <input id="doc-expiry" type="date" className={inputClass} value={meta.expires_on} onChange={(e) => setMeta({ ...meta, expires_on: e.target.value })} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          {richText(t("members.inputmember_can_see_this_document"), { input: <input type="checkbox" checked={meta.visible_to_member} onChange={(e) => setMeta({ ...meta, visible_to_member: e.target.checked })} /> })}</label>
        <label className="flex items-center gap-2 text-sm">
          {richText(t("members.inputmember_must_sign_it_in_the"), { input: <input type="checkbox" checked={meta.requires_acknowledgement} disabled={!meta.visible_to_member}
            onChange={(e) => setMeta({ ...meta, requires_acknowledgement: e.target.checked })} /> })}</label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>{t("common.cancel")}</Button>
          <Button type="submit" size="sm" loading={saving}>{richText(t("members.uploadupload"), { upload: <Upload aria-hidden /> })}</Button>
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
  const { t } = useTranslation();
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
        <h2 className="text-base font-semibold text-[var(--text)]">{t("members.documents")}</h2>
        {canManage && !self && <Button size="sm" variant="outline" onClick={() => setUploading(true)}>{richText(t("members.uploadupload"), { upload: <Upload aria-hidden /> })}</Button>}
      </div>
      {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
      {docs === null ? <LoadingRow /> : docs.length === 0 ? (
        <EmptyBlock title={t("members.no_documents")}>{canManage ? t("members.upload_waivers_agreements_or_id_proofs") : null}</EmptyBlock>
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
                  ? <Badge variant="active">{t("members.signed_by_acknowledged_name", undefined, { acknowledged_name: d.acknowledged_name })}</Badge>
                  : <Badge variant="expiring">{t("members.awaiting_signature")}</Badge>)}
                {self && d.requires_acknowledgement && !d.acknowledged_at && (
                  <Button size="sm" onClick={() => setSigning(d)}>{richText(t("members.penlinesign"), { penline: <PenLine aria-hidden /> })}</Button>
                )}
                {canManage && !self && (
                  <Button size="sm" variant="ghost" aria-label={t("members.archive_title", undefined, { title: d.title })}
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
        <Modal title={t("members.sign_title", undefined, { title: signing.title })} onClose={() => setSigning(null)}>
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
            <p className="text-sm text-[var(--text-secondary)]">{t("members.open_and_read_the_document_first")}</p>
            <Field label={t("invite.full_name")} htmlFor="sign-name">
              <input id="sign-name" required minLength={2} autoComplete="name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setSigning(null)}>{t("common.cancel")}</Button>
              <Button type="submit" size="sm">{t("members.i_agree_and_sign")}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
