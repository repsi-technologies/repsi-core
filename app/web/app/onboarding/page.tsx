"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Check, Clock, LogOut, MapPin, Rocket, Users } from "lucide-react";

import { BusinessProfileForm } from "@/components/organization/business-profile-form";
import { PreferencesForm } from "@/components/organization/preferences-form";
import { BranchesManager } from "@/components/organization/branches-manager";
import { TeamManager } from "@/components/organization/team-manager";
import { FormAlert, PrimaryButton, SecondaryButton } from "@/components/organization/form-fields";
import { RepsiBrandLoader } from "@/components/ui/repsi-brand-loader";
import { ApiError, applySession, getToken, orgApi, type Branch, type OnboardingState } from "@/lib/auth-client";
import { logoutSession } from "@/lib/auth";
import { formatPhone } from "@/lib/countries";
import { cn } from "@/lib/utils";

type StepId = "business" | "preferences" | "branches" | "team" | "launch";

const STEPS: { id: StepId; label: string; title: string; description: string; icon: typeof Building2 }[] = [
  { id: "business", label: "Business", title: "Tell us about your business", description: "This appears on invoices, member apps and your public page.", icon: Building2 },
  { id: "preferences", label: "Hours & region", title: "Opening hours and regional settings", description: "Used for attendance, reminders, billing and reports.", icon: Clock },
  { id: "branches", label: "Branches", title: "Your locations", description: "We created your main branch from your business address. Add more if you have them.", icon: MapPin },
  { id: "team", label: "Team", title: "Invite your team", description: "Trainers and staff get their own sign-in and only see the branches you choose. You can skip this for now.", icon: Users },
  { id: "launch", label: "Launch", title: "You're ready to launch", description: "Review your setup and open your workspace.", icon: Rocket },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState | null>(null);
  const [step, setStep] = useState<StepId>("business");
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const refresh = useCallback(async () => {
    const s = await orgApi.onboardingState();
    setState(s);
    setBranches(s.branches);
    return s;
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login?redirect=/onboarding");
      return;
    }
    refresh()
      .then((s) => {
        if (!s.has_workspace && !s.user.next_path.startsWith("/onboarding")) {
          // Already set up (e.g. a returning owner): go to the right workspace.
          router.replace(s.user.next_path);
          return;
        }
        setStep(s.current_step);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) router.replace("/login?redirect=/onboarding");
        else setLoadError(err instanceof ApiError ? err.message : "We couldn't load your setup.");
      });
  }, [refresh, router]);

  useEffect(() => {
    headingRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  if (loadError) {
    return (
      <Shell>
        <div className="mx-auto max-w-md space-y-4 py-16 text-center">
          <FormAlert>{loadError}</FormAlert>
          <SecondaryButton onClick={() => window.location.reload()}>Try again</SecondaryButton>
        </div>
      </Shell>
    );
  }
  if (!state) return <RepsiBrandLoader showText={false} fullScreen />;

  const index = STEPS.findIndex((s) => s.id === step);
  const current = STEPS[index];
  const reachable = (id: StepId) => {
    const i = STEPS.findIndex((s) => s.id === id);
    return i <= STEPS.findIndex((s) => s.id === state.current_step) || state.steps[id];
  };
  const go = (id: StepId) => {
    setError("");
    setStep(id);
  };

  async function advance(target: "branches" | "team", next: StepId) {
    setBusy(true);
    setError("");
    try {
      setState(await orgApi.advance(target));
      go(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't continue. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function launch() {
    setBusy(true);
    setError("");
    try {
      const res = await orgApi.complete();
      router.replace(applySession(res.session));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't launch your workspace.");
      setBusy(false);
    }
  }

  return (
    <Shell email={state.user.email}>
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 lg:py-10">
        {/* Progress */}
        <nav aria-label="Setup progress" className="lg:sticky lg:top-6 lg:self-start">
          <p className="mb-2 text-xs font-medium text-[var(--text-muted)] lg:mb-4">
            Step {index + 1} of {STEPS.length}
          </p>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[var(--border)] lg:hidden" aria-hidden>
            <div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${((index + 1) / STEPS.length) * 100}%` }} />
          </div>
          <ol className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible">
            {STEPS.map((s, i) => {
              const done = state.steps[s.id];
              const active = s.id === step;
              const enabled = reachable(s.id);
              return (
                <li key={s.id} className="shrink-0">
                  <button type="button" disabled={!enabled} onClick={() => go(s.id)} aria-current={active ? "step" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed",
                      active ? "bg-[var(--surface)] font-semibold text-[var(--text)] shadow-xs ring-1 ring-[var(--border)]" : enabled ? "text-[var(--text-secondary)] hover:bg-[var(--surface)]" : "text-[var(--text-disabled,#A6A8AC)]"
                    )}>
                    <span className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      done ? "bg-[var(--primary)] text-white" : active ? "border-2 border-[var(--primary)] text-[var(--primary-dark)]" : "border border-[var(--border-strong,#C9C7C1)]"
                    )}>
                      {done ? <Check className="h-3.5 w-3.5" aria-label="Completed" /> : i + 1}
                    </span>
                    <span className="whitespace-nowrap">{s.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Step content */}
        <main className="min-w-0 space-y-5">
          <div>
            <h1 ref={headingRef} tabIndex={-1} className="text-xl font-bold tracking-tight text-[var(--text)] outline-none sm:text-2xl">
              {current.title}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{current.description}</p>
          </div>

          {error && <FormAlert>{error}</FormAlert>}

          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            {step === "business" && (
              <BusinessProfileForm
                profile={state.profile}
                defaultEmail={state.user.email}
                defaultPhone={state.user.phone}
                showSlug
                submitLabel="Save & continue"
                pendingLogo={pendingLogo}
                onPendingLogo={setPendingLogo}
                onLogoUpload={async (file) => {
                  const p = await orgApi.uploadLogo(file);
                  setState((s) => (s ? { ...s, profile: p } : s));
                }}
                onLogoRemove={async () => {
                  const p = await orgApi.removeLogo();
                  setState((s) => (s ? { ...s, profile: p } : s));
                }}
                onSubmit={async (data) => {
                  const res = await orgApi.saveBusiness(data);
                  applySession(res.session); // token now scoped to the new organization
                  if (pendingLogo) {
                    try {
                      await orgApi.uploadLogo(pendingLogo);
                      setPendingLogo(null);
                    } catch (err) {
                      setError(err instanceof ApiError ? `Business saved, but the logo failed: ${err.message}` : "Logo upload failed.");
                    }
                  }
                  await refresh();
                  go("preferences");
                }}
              />
            )}

            {step === "preferences" && (
              <PreferencesForm
                profile={state.profile}
                submitLabel="Save & continue"
                onSubmit={async (data) => {
                  setState(await orgApi.savePreferencesOnboarding(data));
                  go("branches");
                }}
              />
            )}

            {step === "branches" && (
              <div className="space-y-6">
                <BranchesManager canEdit defaultCountry={state.profile?.country_code} businessHours={state.profile?.opening_hours} onChange={setBranches} />
                <StepNav onBack={() => go("preferences")}>
                  <PrimaryButton type="button" loading={busy} disabled={branches.length === 0} onClick={() => advance("branches", "team")}>
                    Continue <ArrowRight className="h-4 w-4" aria-hidden />
                  </PrimaryButton>
                </StepNav>
              </div>
            )}

            {step === "team" && (
              <div className="space-y-6">
                <TeamManager myRole="OWNER" branches={branches} showMembers={false} defaultCountry={state.profile?.country_code} />
                <StepNav onBack={() => go("branches")}>
                  <PrimaryButton type="button" loading={busy} onClick={() => advance("team", "launch")}>
                    Continue <ArrowRight className="h-4 w-4" aria-hidden />
                  </PrimaryButton>
                </StepNav>
              </div>
            )}

            {step === "launch" && state.profile && (
              <div className="space-y-6">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Summary label="Business" value={state.profile.name} sub={`repsi.app/${state.profile.slug}`} onEdit={() => go("business")} />
                  <Summary label="Contact" value={formatPhone(state.profile.phone) || "—"} sub={state.profile.business_email || undefined} onEdit={() => go("business")} />
                  <Summary label="Address" value={[state.profile.address_line1, state.profile.city].filter(Boolean).join(", ")}
                    sub={[state.profile.state, state.profile.postal_code, state.profile.country].filter(Boolean).join(", ")} onEdit={() => go("business")} />
                  <Summary label="Region" value={`${state.profile.timezone || "—"} · ${state.profile.currency || "—"}`}
                    sub={`${Object.values(state.profile.opening_hours || {}).filter((d) => !d.closed).length} open days a week`} onEdit={() => go("preferences")} />
                  <Summary label="Branches" value={`${branches.length} active`} sub={branches.map((b) => b.name).join(", ")} onEdit={() => go("branches")} />
                </dl>
                <p className="rounded-[10px] bg-[var(--primary-soft)] px-4 py-3 text-sm text-[var(--primary-dark)]">
                  Your 14-day free trial starts today. You can change plans anytime from Settings → Billing.
                </p>
                <StepNav onBack={() => go("team")}>
                  <PrimaryButton type="button" loading={busy} onClick={launch}>
                    <Rocket className="h-4 w-4" aria-hidden /> Launch workspace
                  </PrimaryButton>
                </StepNav>
              </div>
            )}
          </div>

          {(step === "business" || step === "preferences") && index > 0 && (
            <SecondaryButton type="button" onClick={() => go(STEPS[index - 1].id)}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> Back
            </SecondaryButton>
          )}
        </main>
      </div>
    </Shell>
  );
}

function StepNav({ onBack, children }: { onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
      <SecondaryButton type="button" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back
      </SecondaryButton>
      {children}
    </div>
  );
}

function Summary({ label, value, sub, onEdit }: { label: string; value: string; sub?: string; onEdit: () => void }) {
  return (
    <div className="rounded-[12px] border border-[var(--border)] p-4">
      <div className="flex items-center justify-between gap-2">
        <dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{label}</dt>
        <button type="button" onClick={onEdit} className="text-xs font-medium text-[var(--primary-dark)] hover:underline">Edit</button>
      </div>
      <dd className="mt-1 break-words text-sm font-medium text-[var(--text)]">{value}</dd>
      {sub && <dd className="mt-0.5 break-words text-xs text-[var(--text-muted)]">{sub}</dd>}
    </div>
  );
}

function Shell({ children, email }: { children: React.ReactNode; email?: string }) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      <header className="flex h-16 items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-4 sm:px-6">
        <Image src="/logos/logo-dark.png" alt="REPSI" width={120} height={40} className="h-7 w-auto object-contain" priority />
        <div className="flex min-w-0 items-center gap-3">
          {email && <span className="hidden truncate text-sm text-[var(--text-muted)] sm:inline">{email}</span>}
          <button type="button" onClick={() => logoutSession()}
            className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[var(--border)] px-3 text-sm font-medium hover:bg-[var(--surface-hover)]"
            title="Your progress is saved. Sign in again to continue.">
            <LogOut className="h-4 w-4" aria-hidden /> <span>Save & exit</span>
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
