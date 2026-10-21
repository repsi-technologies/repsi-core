"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Loader2, MessageCircle, ShieldCheck } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import type { CountryCode } from "libphonenumber-js/min";

import { BusinessProfileForm } from "@/components/organization/business-profile-form";
import { PreferencesForm } from "@/components/organization/preferences-form";
import { BranchesManager } from "@/components/organization/branches-manager";
import { TeamManager } from "@/components/organization/team-manager";
import { FormAlert, FormField, PrimaryButton, SecondaryButton, SectionCard, TextInput } from "@/components/organization/form-fields";
import { PhoneInput } from "@/components/ui/phone-input";
import { OtpVerification } from "@/components/auth/otp-verification";
import {
  ApiError,
  authApi,
  orgApi,
  type Branch,
  type IdentitySummary,
  type OrganizationProfile,
  type SessionUser,
} from "@/lib/auth-client";
import { formatPhone, isValidPhone, splitPhone } from "@/lib/countries";

export function useOrganization() {
  const [profile, setProfile] = useState<OrganizationProfile | null>(null);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    try {
      setProfile(await orgApi.profile());
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load your business settings.");
    }
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return { profile, setProfile, error, reload };
}

function Loading() {
  return (
    <div className="flex items-center gap-2 py-10 text-sm text-[var(--text-muted)]">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading…
    </div>
  );
}

function ReadOnlyNote({ show }: { show: boolean }) {
  if (!show) return null;
  return <FormAlert kind="info">Only owners and admins can change these settings.</FormAlert>;
}

export function BusinessProfileSection() {
  const { profile, setProfile, error } = useOrganization();
  return (
    <SectionCard title="Business profile" description="Name, logo, contact details and address shown across REPSI.">
      {error ? <FormAlert>{error}</FormAlert> : !profile ? <Loading /> : (
        <div className="space-y-4">
          <ReadOnlyNote show={!profile.can_edit} />
          {profile.can_edit && !profile.can_rename && profile.rename_message && (
            <FormAlert kind="info">{profile.rename_message}</FormAlert>
          )}
          <BusinessProfileForm
            profile={profile}
            submitLabel="Save changes"
            disabled={!profile.can_edit}
            onSubmit={async (data) => setProfile(await orgApi.updateProfile(data))}
            onLogoUpload={async (file) => setProfile(await orgApi.uploadLogo(file))}
            onLogoRemove={async () => setProfile(await orgApi.removeLogo())}
          />
        </div>
      )}
    </SectionCard>
  );
}

export function HoursSection() {
  const { profile, setProfile, error } = useOrganization();
  return (
    <SectionCard title="Hours & regional preferences" description="Opening hours, holidays, time zone, currency and language.">
      {error ? <FormAlert>{error}</FormAlert> : !profile ? <Loading /> : (
        <div className="space-y-4">
          <ReadOnlyNote show={!profile.can_edit} />
          <PreferencesForm profile={profile} submitLabel="Save changes" disabled={!profile.can_edit}
            onSubmit={async (data) => setProfile(await orgApi.updatePreferences(data))} />
        </div>
      )}
    </SectionCard>
  );
}

export function BranchesSection() {
  const { profile, error } = useOrganization();
  return (
    <SectionCard title="Branches & locations" description="Every physical location of your business.">
      {error ? <FormAlert>{error}</FormAlert> : !profile ? <Loading /> : (
        <BranchesManager canEdit={profile.can_edit} defaultCountry={profile.country_code} businessHours={profile.opening_hours} />
      )}
    </SectionCard>
  );
}

export function TeamSection({ role }: { role: string }) {
  const { profile } = useOrganization();
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const canSee = ["OWNER", "ADMIN", "MANAGER", "SUPER_ADMIN"].includes(role);
  useEffect(() => {
    if (canSee) orgApi.branches().then(setBranches).catch(() => setBranches([]));
  }, [canSee]);
  return (
    <SectionCard title="Team & access" description="Invite trainers and staff, set their roles, and choose which branches they can access.">
      {!canSee ? (
        <FormAlert kind="info">Only owners, admins and managers can manage the team.</FormAlert>
      ) : branches === null ? <Loading /> : (
        <TeamManager myRole={role} branches={branches} defaultCountry={profile?.country_code} />
      )}
    </SectionCard>
  );
}

// ─── My profile & sign-in methods ──────────────────────────────────────

export function ProfileSection() {
  const [me, setMe] = useState<SessionUser | null>(null);
  const [ids, setIds] = useState<IdentitySummary | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const [user, identities] = await Promise.all([authApi.me(), authApi.identities()]);
      setMe(user);
      setIds(identities);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load your profile.");
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (error && !me) return <SectionCard title="My profile"><FormAlert>{error}</FormAlert></SectionCard>;
  if (!me || !ids) return <SectionCard title="My profile"><Loading /></SectionCard>;

  return (
    <div className="space-y-6">
      {notice && <FormAlert kind="success">{notice}</FormAlert>}
      {error && <FormAlert>{error}</FormAlert>}
      <NameCard me={me} onSaved={(u) => { setMe(u); setNotice("Profile updated."); }} />
      <SignInMethods ids={ids} setIds={setIds} setNotice={setNotice} setError={setError} />
      <PasswordCard hasPassword={ids.has_password} onSaved={() => { setNotice("Password saved."); load(); }} />
    </div>
  );
}

function NameCard({ me, onSaved }: { me: SessionUser; onSaved: (u: SessionUser) => void }) {
  const [name, setName] = useState(me.full_name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  return (
    <SectionCard title="My profile" description="How you appear to your team.">
      <form className="space-y-4" noValidate onSubmit={async (e) => {
        e.preventDefault();
        if (name.trim().length < 2) return setError("Enter your full name.");
        setSaving(true);
        setError("");
        try { onSaved(await authApi.updateProfile(name.trim())); }
        catch (err) { setError(err instanceof ApiError ? err.message : "Couldn't save."); }
        finally { setSaving(false); }
      }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="me-name" label="Full name" required error={error}>
            <TextInput id="me-name" value={name} invalid={Boolean(error)} autoComplete="name" onChange={(e) => setName(e.target.value)} />
          </FormField>
          <FormField id="me-email" label="Email" required hint="Your email identifies your account across all sign-in methods.">
            <TextInput id="me-email" value={me.email} readOnly className="bg-[var(--background)] text-[var(--text-muted)]" />
          </FormField>
        </div>
        <div className="flex justify-end"><PrimaryButton type="submit" loading={saving} disabled={name.trim() === me.full_name}>Save</PrimaryButton></div>
      </form>
    </SectionCard>
  );
}

function SignInMethods({
  ids,
  setIds,
  setNotice,
  setError,
}: {
  ids: IdentitySummary;
  setIds: (i: IdentitySummary) => void;
  setNotice: (s: string) => void;
  setError: (s: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("IN");
  const [otpPhone, setOtpPhone] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(30);
  const [testMode, setTestMode] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);

  const linkGoogle = useGoogleLogin({
    onSuccess: async (t) => {
      setBusy(true);
      setError("");
      try {
        setIds(await authApi.linkGoogle(t.access_token));
        setNotice("Google account connected. You can now sign in with Google.");
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Couldn't connect Google.");
      } finally {
        setBusy(false);
      }
    },
    onError: () => setError("Google sign-in was cancelled."),
  });

  async function sendCode() {
    if (!isValidPhone(phone, country as CountryCode)) return setOtpError("Enter a valid mobile number.");
    setBusy(true);
    setOtpError("");
    try {
      const res = await authApi.requestLinkPhoneOtp(splitPhone(phone, country as CountryCode).national, country);
      setOtpPhone(res.phone);
      setResendIn(res.resend_in);
      setTestMode(res.test_mode);
    } catch (err) {
      setOtpError(err instanceof ApiError ? err.message : "Couldn't send the code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionCard title="Sign-in methods" description="All of these open the same account, organizations and permissions.">
      <ul className="divide-y divide-[var(--border)]">
        <li className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-5 w-5 text-[var(--text-muted)]" aria-hidden />
            <div>
              <p className="text-sm font-medium">Email & password</p>
              <p className="text-xs text-[var(--text-muted)]">
                {ids.email} · {ids.email_verified ? "verified" : "not verified yet"} · {ids.has_password ? "password set" : "no password"}
              </p>
            </div>
          </div>
          {ids.email_verified ? (
            <span className="inline-flex w-fit items-center gap-1 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Verified</span>
          ) : (
            <span className="text-xs text-[var(--text-muted)]">Verify by connecting Google or using “Forgot password”.</span>
          )}
        </li>

        <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-[var(--text-muted)]" aria-hidden />
            <div>
              <p className="text-sm font-medium">Google</p>
              <p className="text-xs text-[var(--text-muted)]">{ids.google_linked ? `Connected (${ids.google_email})` : `Connect the Google account for ${ids.email}`}</p>
            </div>
          </div>
          {ids.google_linked ? (
            <SecondaryButton type="button" disabled={busy} className="h-8 px-3 text-xs" onClick={async () => {
              setBusy(true);
              setError("");
              try { setIds(await authApi.unlinkGoogle()); setNotice("Google disconnected."); }
              catch (err) { setError(err instanceof ApiError ? err.message : "Couldn't disconnect Google."); }
              finally { setBusy(false); }
            }}>Disconnect</SecondaryButton>
          ) : (
            <SecondaryButton type="button" disabled={busy} className="h-8 px-3 text-xs" onClick={() => linkGoogle()}>Connect Google</SecondaryButton>
          )}
        </li>

        <li className="space-y-3 py-4 last:pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <MessageCircle className="mt-0.5 h-5 w-5 text-[var(--text-muted)]" aria-hidden />
              <div>
                <p className="text-sm font-medium">WhatsApp OTP</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {ids.phone && ids.phone_verified ? `${formatPhone(ids.phone)} · verified` : "Add a mobile number to sign in with a WhatsApp code."}
                </p>
              </div>
            </div>
            {!editingPhone && (
              <SecondaryButton type="button" className="h-8 px-3 text-xs" onClick={() => { setEditingPhone(true); setOtpPhone(null); setOtpError(""); }}>
                {ids.phone_verified ? "Change number" : "Add number"}
              </SecondaryButton>
            )}
          </div>
          {editingPhone && (
            <div className="max-w-md space-y-3 rounded-[12px] border border-[var(--border)] p-4">
              {otpPhone ? (
                <OtpVerification phone={otpPhone} resendIn={resendIn} testMode={testMode} verifying={verifying} resending={busy}
                  error={otpError} submitLabel="Verify number"
                  onChangeNumber={() => setOtpPhone(null)}
                  onResend={sendCode}
                  onVerify={async (code) => {
                    setVerifying(true);
                    setOtpError("");
                    try {
                      setIds(await authApi.verifyLinkPhone(otpPhone, country, code));
                      setNotice("Phone number verified.");
                      setEditingPhone(false);
                      setPhone("");
                    } catch (err) {
                      setOtpError(err instanceof ApiError ? err.message : "Verification failed.");
                    } finally {
                      setVerifying(false);
                    }
                  }} />
              ) : (
                <>
                  <FormField id="link-phone" label="Mobile number" required error={otpError}>
                    <PhoneInput id="link-phone" value={phone} error={Boolean(otpError)} onChange={setPhone} onCountryChange={(c) => setCountry(c.code)} />
                  </FormField>
                  <div className="flex justify-end gap-2">
                    <SecondaryButton type="button" onClick={() => setEditingPhone(false)}>Cancel</SecondaryButton>
                    <PrimaryButton type="button" loading={busy} onClick={sendCode}>Send code</PrimaryButton>
                  </div>
                </>
              )}
            </div>
          )}
        </li>
      </ul>
    </SectionCard>
  );
}

function PasswordCard({ hasPassword, onSaved }: { hasPassword: boolean; onSaved: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <SectionCard title={hasPassword ? "Change password" : "Set a password"}
      description={hasPassword ? undefined : "You currently sign in with Google or WhatsApp. Add a password to also sign in with your email."}>
      <form className="max-w-md space-y-4" noValidate onSubmit={async (e) => {
        e.preventDefault();
        if (next.length < 8) return setError("Use at least 8 characters.");
        if (next !== confirm) return setError("Passwords don't match.");
        setSaving(true);
        setError("");
        try {
          await authApi.changePassword(hasPassword ? current : null, next);
          setCurrent(""); setNext(""); setConfirm("");
          onSaved();
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "Couldn't save the password.");
        } finally {
          setSaving(false);
        }
      }}>
        {error && <FormAlert>{error}</FormAlert>}
        {hasPassword && (
          <FormField id="pw-current" label="Current password" required>
            <TextInput id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </FormField>
        )}
        <FormField id="pw-new" label="New password" required hint="At least 8 characters.">
          <TextInput id="pw-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        </FormField>
        <FormField id="pw-confirm" label="Confirm new password" required>
          <TextInput id="pw-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </FormField>
        <PrimaryButton type="submit" loading={saving}>Save password</PrimaryButton>
      </form>
    </SectionCard>
  );
}
