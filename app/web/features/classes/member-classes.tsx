"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyBlock, LoadingRow, Notice, addDays, isoDate } from "@/features/fitness/shared";
import { bookingApi, formatDateTime, type ClassBooking, type ClassSession } from "@/lib/operations-api";
import { useTranslation } from "@/lib/i18n";

/** Member self-service: browse upcoming sessions, book or join the waitlist, cancel. */
export function MemberClasses() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<ClassSession[] | null>(null);
  const [mine, setMine] = useState<ClassBooking[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, m] = await Promise.all([
        bookingApi.listSessions({ start: isoDate(), end: addDays(isoDate(), 7) }),
        bookingApi.myBookings(),
      ]);
      setSessions(s);
      setMine(m.filter((b) => b.status !== "cancelled"));
    } catch (e) {
      setError((e as Error).message);
      setSessions([]);
      setMine([]);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const run = async (key: string, fn: () => Promise<ClassBooking>, ok: (b: ClassBooking) => string) => {
    setBusy(key);
    setError(null);
    try {
      const b = await fn();
      setNotice(ok(b));
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)] tracking-tight">{t("nav.classes")}</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">{t("classes.book_a_place_or_join_the")}</p>
      </div>
      {error && <Notice kind="error" onDismiss={() => setError(null)}>{error}</Notice>}
      {notice && <Notice kind="success" onDismiss={() => setNotice(null)}>{notice}</Notice>}

      <section aria-labelledby="my-bookings" className="space-y-2">
        <h2 id="my-bookings" className="text-base font-semibold text-[var(--text)]">{t("classes.my_bookings")}</h2>
        {mine === null ? <LoadingRow /> : mine.length === 0 ? (
          <EmptyBlock title={t("classes.no_upcoming_bookings")} />
        ) : (
          <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            {mine.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <span>
                  <span className="font-medium">{b.class_name}</span>
                  <span className="text-sm text-[var(--text-muted)]"> · {formatDateTime(b.starts_at)}</span>
                </span>
                <span className="flex items-center gap-2">
                  <Badge variant={b.status === "waitlisted" ? "expiring" : "active"}>
                    {b.status === "waitlisted" ? t("classes.waitlist_waitlist_position", undefined, { waitlist_position: b.waitlist_position }) : b.status}
                  </Badge>
                  {(b.status === "booked" || b.status === "waitlisted") && (
                    <Button size="sm" variant="ghost" loading={busy === b.id}
                      onClick={() => run(b.id, () => bookingApi.cancelBooking(b.id), (x) => x.late_cancel
                        ? "Cancelled. This was a late cancellation and still counts as a class."
                        : "Booking cancelled.")}>
                      {t("common.cancel")}
                    </Button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="upcoming" className="space-y-2">
        <h2 id="upcoming" className="text-base font-semibold text-[var(--text)]">{t("classes.this_week")}</h2>
        {sessions === null ? <LoadingRow /> : sessions.length === 0 ? (
          <EmptyBlock title={t("classes.no_classes_scheduled_this_week")} />
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sessions.map((s) => {
              const full = s.spots_left === 0;
              return (
                <li key={s.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-[var(--text)]">{s.class_name}</h3>
                    <p className="text-sm text-[var(--text-muted)] flex items-center gap-1.5">
                      <CalendarCheck className="h-4 w-4" aria-hidden /> {formatDateTime(s.starts_at)}{s.room ? ` · ${s.room}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-secondary)] flex items-center gap-1.5 tabular-nums">
                      <Users className="h-4 w-4" aria-hidden /> {full ? t("classes.full") : `${s.spots_left} left`}
                    </span>
                    {s.my_booking ? (
                      <Badge variant="active">{s.my_booking.status === "waitlisted" ? t("classes.on_waitlist") : t("classes.booked")}</Badge>
                    ) : (
                      <Button size="sm" variant={full ? "outline" : "default"} loading={busy === s.id}
                        onClick={() => run(s.id, () => bookingApi.book(s.id), (b) => b.status === "waitlisted"
                          ? `Added to the waitlist (#${b.waitlist_position}). We'll notify you if a place opens.`
                          : "You're booked.")}>
                        {full ? t("classes.join_waitlist") : t("classes.book")}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
