"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormAlert } from "@/components/organization/form-fields";
import { repsiApi, type ChatReportReason } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";

export const REPORT_REASONS: { id: ChatReportReason; label: string }[] = [
  { id: "harassment", label: "Harassment or bullying" },
  { id: "inappropriate", label: "Inappropriate or sexual content" },
  { id: "off_topic", label: "Unwanted personal / off-topic messages" },
  { id: "spam", label: "Spam or selling" },
  { id: "safety", label: "Unsafe training or health advice" },
  { id: "other", label: "Something else" },
];

/** Lets a member or trainer flag a conversation (or one message) for the gym owner to review. */
export function ReportChatDialog({
  open,
  onOpenChange,
  conversationId,
  otherName,
  message,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  otherName: string;
  message?: { id: string; body: string | null } | null;
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<ChatReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setReason(null);
      setDetails("");
      setError(null);
      setDone(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    setBusy(true);
    setError(null);
    try {
      await repsiApi.reportConversation(conversationId, { reason, details: details.trim() || undefined, message_id: message?.id });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{message ? t("chat.report_message", "Report message") : t("chat.report_conversation", "Report conversation")}</DialogTitle>
          <DialogDescription>
            {t("chat.report_desc", "Your gym's owner will review this. {name} is not told who reported.", { name: otherName })}
          </DialogDescription>
        </DialogHeader>
        {done ? (
          <>
            <FormAlert kind="success">{t("chat.report_sent", "Thanks — the report was sent to the gym owner.")}</FormAlert>
            <DialogFooter>
              <Button onClick={() => close(false)}>{t("common.close", "Close")}</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {message?.body && (
              <blockquote className="rounded-[10px] border-l-2 border-[var(--primary)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-secondary)] line-clamp-3">
                {message.body}
              </blockquote>
            )}
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium text-[var(--text)]">{t("chat.report_reason", "What's wrong?")}</legend>
              {REPORT_REASONS.map((r) => (
                <label key={r.id} className="flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] has-[:checked]:border-[var(--primary)] has-[:checked]:bg-[var(--primary-soft)]">
                  <input type="radio" name="reason" value={r.id} checked={reason === r.id} onChange={() => setReason(r.id)} className="accent-[var(--primary)]" />
                  {t(`chat.reason_${r.id}`, r.label)}
                </label>
              ))}
            </fieldset>
            <div className="space-y-1">
              <label htmlFor="report-details" className="text-sm font-medium text-[var(--text)]">{t("chat.report_details", "Details (optional)")}</label>
              <textarea
                id="report-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={2000}
                rows={3}
                className="w-full resize-none rounded-[10px] border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text)]"
              />
            </div>
            {error && <FormAlert kind="error">{error}</FormAlert>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => close(false)}>{t("common.cancel", "Cancel")}</Button>
              <Button type="submit" disabled={!reason || busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("chat.send_report", "Send report")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
