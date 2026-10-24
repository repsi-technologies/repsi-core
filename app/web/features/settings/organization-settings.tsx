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
import { useTranslation, tr, richText } from "@/lib/i18n";

export function useOrganization() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<OrganizationProfile | null>(null);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    try {
      setProfile(await orgApi.profile());
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("settings.couldn_t_load_your_business_settings"));
    }
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return { profile, setProfile, error, reload };
}

function Loading() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 py-10 text-sm text-[var(--text-muted)]">
      {richText(t("settings.loader2loading"), { loader2: <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> })}</div>
  );
}

function ReadOnlyNote({ show }: { show: boolean }) {
  const { t } = useTranslation();
  if (!show) return null;
  return <FormAlert kind="info">{t("settings.only_owners_and_admins_can_change")}</FormAlert>;
}

export function BusinessProfileSection() {
  const { t } = useTranslation();
  const { profile, setProfile, error } = useOrganization();
  return (
    <SectionCard title={t("settings.business_profile")} description={t("settings.name_logo_contact_details_and_address")}>
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
  const { t } = useTranslation();
  const { profile, setProfile, error } = useOrganization();
  return (
    <SectionCard title={t("settings.hours_regional_preferences")} description={t("settings.opening_hours_holidays_time_zone_currency")}>
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
  const { t } = useTranslation();
  const { profile, error } = useOrganization();
  return (
    <SectionCard title={t("settings.branches_locations")} description={t("settings.every_physical_location_of_your_business")}>
      {error ? <FormAlert>{error}</FormAlert> : !profile ? <Loading /> : (
        <BranchesManager canEdit={profile.can_edit} defaultCountry={profile.country_code} businessHours={profile.opening_hours} />
      )}
    </SectionCard>
  );
}

export function TeamSection({ role }: { role: string }) {
  const { t } = useTranslation();
  const { profile } = useOrganization();
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const canSee = ["OWNER", "ADMIN", "MANAGER", "SUPER_ADMIN"].includes(role);
  useEffect(() => {
    if (canSee) orgApi.branches().then(setBranches).catch(() => setBranches([]));
  }, [canSee]);
  return (
    <SectionCard title={t("settings.team_access")} description={t("settings.invite_trainers_and_staff_set_their")}>
      {!canSee ? (
        <FormAlert kind="info">{t("settings.only_owners_admins_and_managers_can")}</FormAlert>
      ) : branches === null ? <Loading /> : (
        <TeamManager myRole={role} branches={branches} defaultCountry={profile?.country_code} />
      )}
    </SectionCard>
  );
}

// ─── My profile & sign-in methods ──────────────────────────────────────

export function ProfileSection() {
  const { t } = useTranslation();
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
      setError(err instanceof ApiError ? err.message : t("settings.couldn_t_load_your_profile"));
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (error && !me) return <SectionCard title={t("settings.my_profile")}><FormAlert>{error}</FormAlert></SectionCard>;
  if (!me || !ids) return <SectionCard title={t("settings.my_profile")}><Loading /></SectionCard>;

  return (
    <div className="space-y-6">
      {notice && <FormAlert kind="success">{notice}</FormAlert>}
      {error && <FormAlert>{error}</FormAlert>}
      <NameCard me={me} onSaved={(u) => { setMe(u); setNotice(t("settings.profile_updated")); }} />
      <SignInMethods ids={ids} setIds={setIds} setNotice={setNotice} setError={setError} />
      <PasswordCard hasPassword={ids.has_password} onSaved={() => { setNotice(t("settings.password_saved")); load(); }} />
    </div>
  );
}

function NameCard({ me, onSaved }: { me: SessionUser; onSaved: (u: SessionUser) => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState(me.full_name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  return (
    <SectionCard title={t("settings.my_profile")} description={t("settings.how_you_appear_to_your_team")}>
      <form className="space-y-4" noValidate onSubmit={async (e) => {
        e.preventDefault();
        if (name.trim().length < 2) return setError(t("settings.enter_your_full_name"));
        setSaving(true);
        setError("");
        try { onSaved(await authApi.updateProfile(name.trim())); }
        catch (err) { setError(err instanceof ApiError ? err.message : t("settings.couldn_t_save")); }
        finally { setSaving(false); }
      }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="me-name" label={t("invite.full_name")} required error={error}>
            <TextInput id="me-name" value={name} invalid={Boolean(error)} autoComplete="name" onChange={(e) => setName(e.target.value)} />
          </FormField>
          <FormField id="me-email" label={t("invite.email")} required hint={t("settings.your_email_identifies_your_account_across")}>
            <TextInput id="me-email" value={me.email} readOnly className="bg-[var(--background)] text-[var(--text-muted)]" />
          </FormField>
        </div>
        <div className="flex justify-end"><PrimaryButton type="submit" loading={saving} disabled={name.trim() === me.full_name}>{t("members.save")}</PrimaryButton></div>
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
        setNotice(tr("settings.google_account_connected_you_can_now"));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : tr("settings.couldn_t_connect_google"));
      } finally {
        setBusy(false);
      }
    },
    onError: () => setError(tr("settings.google_sign_in_was_cancelled")),
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
      setOtpError(err instanceof ApiError ? err.message : tr("settings.couldn_t_send_the_code"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionCard title={tr("settings.sign_in_methods")} description={tr("settings.all_of_these_open_the_same")}>
      <ul className="divide-y divide-[var(--border)]">
        <li className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-5 w-5 text-[var(--text-muted)]" aria-hidden />
            <div>
              <p className="text-sm font-medium">{tr("settings.email_password")}</p>
              <p className="text-xs text-[var(--text-muted)]">
                {ids.email} · {ids.email_verified ? "verified" : tr("settings.not_verified_yet")} · {ids.has_password ? tr("settings.password_set") : tr("settings.no_password")}
              </p>
            </div>
          </div>
          {ids.email_verified ? (
            <span className="inline-flex w-fit items-center gap-1 text-xs font-medium text-emerald-700">{richText(tr("settings.checkcircle2verified"), { checkcircle2: <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> })}</span>
          ) : (
            <span className="text-xs text-[var(--text-muted)]">{tr("settings.verify_by_connecting_google_or_using")}</span>
          )}
        </li>

        <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-[var(--text-muted)]" aria-hidden />
            <div>
              <p className="text-sm font-medium">{tr("settings.google")}</p>
              <p className="text-xs text-[var(--text-muted)]">{ids.google_linked ? tr("settings.connected_google_email", undefined, { google_email: ids.google_email }) : tr("settings.connect_the_google_account_for_email", undefined, { email: ids.email })}</p>
            </div>
          </div>
          {ids.google_linked ? (
            <SecondaryButton type="button" disabled={busy} className="h-8 px-3 text-xs" onClick={async () => {
              setBusy(true);
              setError("");
              try { setIds(await authApi.unlinkGoogle()); setNotice(tr("settings.google_disconnected")); }
              catch (err) { setError(err instanceof ApiError ? err.message : tr("settings.couldn_t_disconnect_google")); }
              finally { setBusy(false); }
            }}>{tr("settings.disconnect")}</SecondaryButton>
          ) : (
            <SecondaryButton type="button" disabled={busy} className="h-8 px-3 text-xs" onClick={() => linkGoogle()}>{tr("settings.connect_google")}</SecondaryButton>
          )}
        </li>

        <li className="space-y-3 py-4 last:pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <MessageCircle className="mt-0.5 h-5 w-5 text-[var(--text-muted)]" aria-hidden />
              <div>
                <p className="text-sm font-medium">{tr("login.whatsapp_otp")}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {ids.phone && ids.phone_verified ? `${formatPhone(ids.phone)} · verified` : tr("settings.add_a_mobile_number_to_sign")}
                </p>
              </div>
            </div>
            {!editingPhone && (
              <SecondaryButton type="button" className="h-8 px-3 text-xs" onClick={() => { setEditingPhone(true); setOtpPhone(null); setOtpError(""); }}>
                {ids.phone_verified ? tr("auth.change_number") : tr("settings.add_number")}
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
                      setNotice(tr("settings.phone_number_verified"));
                      setEditingPhone(false);
                      setPhone("");
                    } catch (err) {
                      setOtpError(err instanceof ApiError ? err.message : tr("verify_email.verification_failed"));
                    } finally {
                      setVerifying(false);
                    }
                  }} />
              ) : (
                <>
                  <FormField id="link-phone" label={tr("login.mobile_number")} required error={otpError}>
                    <PhoneInput id="link-phone" value={phone} error={Boolean(otpError)} onChange={setPhone} onCountryChange={(c) => setCountry(c.code)} />
                  </FormField>
                  <div className="flex justify-end gap-2">
                    <SecondaryButton type="button" onClick={() => setEditingPhone(false)}>{tr("common.cancel")}</SecondaryButton>
                    <PrimaryButton type="button" loading={busy} onClick={sendCode}>{tr("login.send_code")}</PrimaryButton>
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
  const { t } = useTranslation();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <SectionCard title={hasPassword ? t("settings.change_password") : t("settings.set_a_password")}
      description={hasPassword ? undefined : t("settings.you_currently_sign_in_with_google")}>
      <form className="max-w-md space-y-4" noValidate onSubmit={async (e) => {
        e.preventDefault();
        if (next.length < 8) return setError(t("reset_password.use_at_least_8_characters"));
        if (next !== confirm) return setError(t("invite.passwords_don_t_match"));
        setSaving(true);
        setError("");
        try {
          await authApi.changePassword(hasPassword ? current : null, next);
          setCurrent(""); setNext(""); setConfirm("");
          onSaved();
        } catch (err) {
          setError(err instanceof ApiError ? err.message : t("settings.couldn_t_save_the_password"));
        } finally {
          setSaving(false);
        }
      }}>
        {error && <FormAlert>{error}</FormAlert>}
        {hasPassword && (
          <FormField id="pw-current" label={t("settings.current_password")} required>
            <TextInput id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </FormField>
        )}
        <FormField id="pw-new" label={t("reset_password.new_password")} required hint={t("invite.at_least_8_characters")}>
          <TextInput id="pw-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        </FormField>
        <FormField id="pw-confirm" label={t("settings.confirm_new_password")} required>
          <TextInput id="pw-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </FormField>
        <PrimaryButton type="submit" loading={saving}>{t("settings.save_password")}</PrimaryButton>
      </form>
    </SectionCard>
  );
}
