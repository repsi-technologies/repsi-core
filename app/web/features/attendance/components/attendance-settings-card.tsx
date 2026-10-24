"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Clock,
  ShieldCheck,
  Zap,
  Save,
  CheckCircle2,
  AlertCircle,
  Moon,
  Users,
  Fingerprint,
  Radio,
  Trash2,
  Plus,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Server,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApiAttendanceSettings, repsiApi } from "@/lib/api";
import { useTranslation, richText } from "@/lib/i18n";

interface AttendanceSettingsCardProps {
  settings: ApiAttendanceSettings | null;
  onRefresh: () => Promise<void>;
}

export function AttendanceSettingsCard({ settings, onRefresh }: AttendanceSettingsCardProps) {
  const { t } = useTranslation();
  const [maxMinutes, setMaxMinutes] = useState<number>(settings?.max_session_duration_minutes ?? 240);
  const [closingTime, setClosingTime] = useState<string>(settings?.gym_closing_time ?? "22:00");
  const [autoCheckout, setAutoCheckout] = useState<boolean>(settings?.auto_checkout_enabled ?? true);
  const [memberCheckout, setMemberCheckout] = useState<boolean>(settings?.allow_member_manual_checkout ?? true);
  const [staffCheckout, setStaffCheckout] = useState<boolean>(settings?.allow_staff_manual_checkout ?? true);
  const [qrRotation, setQrRotation] = useState<number>(settings?.qr_rotation_interval_minutes ?? 0);

  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Biometric Devices state
  const [biometricDevices, setBiometricDevices] = useState<any[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [testingDeviceId, setTestingDeviceId] = useState<string | null>(null);
  const [deviceTestResult, setDeviceTestResult] = useState<Record<string, any>>({});
  const [showRegisterDeviceModal, setShowRegisterDeviceModal] = useState(false);
  const [newDevice, setNewDevice] = useState({
    device_name: "Front Reception Turnstile",
    device_model: "ZKTeco K40 Fingerprint Terminal",
    device_serial: "",
    ip_address: "192.168.1.201",
    port: 4370,
    location_name: "Main Reception",
  });
  const [registeringDevice, setRegisteringDevice] = useState(false);
  const [deviceError, setDeviceError] = useState("");

  const loadBiometricDevices = async () => {
    setLoadingDevices(true);
    try {
      const devs = await repsiApi.getBiometricDevices();
      setBiometricDevices(devs);
    } catch (e) {
      console.warn("Could not load biometric devices", e);
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    loadBiometricDevices();
  }, []);

  const handleTestDevice = async (deviceId: string) => {
    setTestingDeviceId(deviceId);
    try {
      const res = await repsiApi.testBiometricDevice(deviceId);
      setDeviceTestResult((prev) => ({ ...prev, [deviceId]: res }));
      await loadBiometricDevices();
    } catch (err: any) {
      setDeviceTestResult((prev) => ({
        ...prev,
        [deviceId]: {
          success: false,
          status: "DISCONNECTED",
          message: err.message || t("attendance.device_could_not_be_reached_on"),
        },
      }));
    } finally {
      setTestingDeviceId(null);
    }
  };

  const handleRegisterDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevice.device_serial.trim()) {
      setDeviceError("Device Serial Number is required.");
      return;
    }
    setRegisteringDevice(true);
    setDeviceError("");
    try {
      await repsiApi.registerBiometricDevice({
        ...newDevice,
        port: Number(newDevice.port),
      });
      setShowRegisterDeviceModal(false);
      setNewDevice({
        device_name: "Front Reception Turnstile",
        device_model: "ZKTeco K40 Fingerprint Terminal",
        device_serial: "",
        ip_address: "192.168.1.201",
        port: 4370,
        location_name: "Main Reception",
      });
      await loadBiometricDevices();
    } catch (err: any) {
      setDeviceError(err.message || t("attendance.failed_to_register_biometric_device"));
    } finally {
      setRegisteringDevice(false);
    }
  };

  const handleDeleteDevice = async (deviceId: string, deviceName: string) => {
    if (!confirm(t("attendance.are_you_sure_you_want_to", undefined, { deviceName }))) return;
    try {
      await repsiApi.deleteBiometricDevice(deviceId);
      await loadBiometricDevices();
    } catch (err: any) {
      alert(err.message || t("attendance.failed_to_delete_device"));
    }
  };

  useEffect(() => {
    if (settings) {
      setMaxMinutes(settings.max_session_duration_minutes ?? 240);
      setClosingTime(settings.gym_closing_time ?? "22:00");
      setAutoCheckout(settings.auto_checkout_enabled ?? true);
      setMemberCheckout(settings.allow_member_manual_checkout ?? true);
      setStaffCheckout(settings.allow_staff_manual_checkout ?? true);
      setQrRotation(settings.qr_rotation_interval_minutes ?? 0);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await repsiApi.updateAttendanceSettings({
        max_session_duration_minutes: Number(maxMinutes),
        gym_closing_time: closingTime,
        auto_checkout_enabled: autoCheckout,
        allow_member_manual_checkout: memberCheckout,
        allow_staff_manual_checkout: staffCheckout,
        qr_rotation_interval_minutes: Number(qrRotation),
      });
      await onRefresh();
      setFeedback(t("attendance.attendance_policies_updated_successfully"));
      setTimeout(() => setFeedback(null), 3000);
    } catch (e: any) {
      alert(e.message || t("attendance.failed_to_update_settings"));
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerAutoCheckout = async () => {
    setTriggering(true);
    try {
      const res = await repsiApi.triggerAutoCheckout();
      alert(res.message);
      await onRefresh();
    } catch (e: any) {
      alert(e.message || t("attendance.failed_to_execute_auto_checkout"));
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[var(--text)] tracking-tight">
            {t("attendance.attendance_policy_auto_checkout_configuration")}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {t("attendance.configure_automated_checkout_windows_gym_closing")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleTriggerAutoCheckout}
            disabled={triggering}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 h-9 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
          >
            <Zap className={`w-3.5 h-3.5 ${triggering ? "animate-spin" : ""}`} />
            <span>{t("attendance.run_auto_checkout_now")}</span>
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="text-xs gap-1.5 h-9 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-semibold shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? t("trainers.saving") : t("attendance.save_settings")}</span>
          </Button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Maximum Session Duration Card */}
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--background)] space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                {t("attendance.maximum_workout_session_duration")}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                {t("attendance.members_exceeding_this_duration_are_automatically")}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: t("attendance.2_hours"), val: 120 },
                { label: t("attendance.3_hours"), val: 180 },
                { label: t("attendance.4_hours"), val: 240 },
                { label: t("attendance.5_hours"), val: 300 },
                { label: t("attendance.6_hours"), val: 360 },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => setMaxMinutes(preset.val)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    maxMinutes === preset.val
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-emerald-600 shadow-sm"
                      : "bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:border-emerald-500/40"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">{t("attendance.custom_duration")}</span>
              <input
                type="number"
                min={30}
                max={720}
                value={maxMinutes}
                onChange={(e) => setMaxMinutes(Number(e.target.value))}
                className="w-24 h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text)] font-mono font-semibold"
              />
              <span className="text-xs text-[var(--text-muted)]">{t("attendance.minutes_mathh_valuem", undefined, { Math: Math.floor(maxMinutes / 60), value: maxMinutes % 60 })}</span>
            </div>
          </div>
        </div>

        {/* Smart Gym Closing Time Rule */}
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--background)] space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                {t("attendance.gym_closing_time_smart_rule")}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                {t("attendance.auto_checkout_sessions_at_closing_time")}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm font-mono font-bold text-[var(--text)]"
              />
              <span className="text-xs text-[var(--text-muted)]">
                {t("attendance.default_10_00_pm_22_00")}
              </span>
            </div>

            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              <strong>{t("attendance.smart_auto_checkout_rule")}</strong> {t("attendance.uses_whichever_limit_comes_earlier_gym")}
            </p>
          </div>
        </div>

        {/* Toggles: Auto Checkout & Permissions */}
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--background)] space-y-4">
          <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
            {t("attendance.automated_checkout_engine")}
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[var(--text)]">{t("attendance.enable_smart_auto_checkout")}</span>
                <p className="text-[11px] text-[var(--text-muted)]">{t("attendance.automatically_closes_sessions_exceeding_limits")}</p>
              </div>
              <input
                type="checkbox"
                checked={autoCheckout}
                onChange={(e) => setAutoCheckout(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[var(--text)]">{t("attendance.allow_member_manual_check_out")}</span>
                <p className="text-[11px] text-[var(--text-muted)]">{t("attendance.members_can_tap_check_out_in")}</p>
              </div>
              <input
                type="checkbox"
                checked={memberCheckout}
                onChange={(e) => setMemberCheckout(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* QR Security & Rotation Policy */}
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--background)] space-y-4">
          <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
            {t("attendance.qr_security_settings")}
          </h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-[var(--text)]">{t("attendance.staff_assisted_checkout")}</span>
                <p className="text-[11px] text-[var(--text-muted)]">{t("attendance.allow_front_desk_staff_to_manually")}</p>
              </div>
              <input
                type="checkbox"
                checked={staffCheckout}
                onChange={(e) => setStaffCheckout(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </label>

            <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text)]">{t("attendance.automatic_qr_token_rotation")}</span>
                <select
                  value={qrRotation}
                  onChange={(e) => setQrRotation(Number(e.target.value))}
                  className="h-7 px-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text)] font-semibold"
                >
                  <option value={0}>{t("attendance.manual_only_standard")}</option>
                  <option value={15}>{t("attendance.every_15_minutes")}</option>
                  <option value={30}>{t("attendance.every_30_minutes")}</option>
                  <option value={60}>{t("attendance.every_1_hour")}</option>
                </select>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                {t("attendance.recommended_manual_rotation_for_printed_posters")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Biometric & Fingerprint Terminals */}
      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--background)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                  {t("attendance.biometric_fingerprint_terminals")}
                </h3>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                {t("attendance.manage_hardware_fingerprint_terminals_zkteco_mantra")}
              </p>
            </div>
            <Button
              onClick={() => setShowRegisterDeviceModal(true)}
              size="sm"
              className="gap-1.5 text-xs bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-semibold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("attendance.register_biometric_device")}</span>
            </Button>
          </div>

          {loadingDevices ? (
            <div className="p-6 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>{t("attendance.loading_registered_biometric_terminals")}</span>
            </div>
          ) : biometricDevices.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] text-center space-y-2">
              <Radio className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
              <p className="text-xs font-bold text-[var(--text)]">{t("attendance.no_physical_biometric_devices_registered_yet")}</p>
              <p className="text-[11px] text-[var(--text-muted)] max-w-md mx-auto">
                {t("attendance.connect_your_gym_entrance_turnstiles_or")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {biometricDevices.map((dev) => {
                const isOnline = dev.status === "ONLINE";
                const isTesting = testingDeviceId === dev.id;
                const testRes = deviceTestResult[dev.id];

                return (
                  <div
                    key={dev.id}
                    className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-3 shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[var(--text)]">{dev.device_name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-secondary)]">
                            {dev.device_model}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {t("attendance.location")}{" "}<strong className="text-[var(--text)]">{dev.location_name}</strong> • S/N:{" "}
                          <span className="font-mono">{dev.device_serial}</span>
                          {dev.ip_address && t("attendance.lan_ip_address_port", undefined, { ip_address: dev.ip_address, port: dev.port })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isOnline ? (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/25 text-[10px] gap-1 font-bold">
                            {richText(t("attendance.spanconnected_online"), { span: <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> })}</Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/25 text-[10px] gap-1 font-bold">
                            {richText(t("attendance.alerttrianglehardware_disconnected"), { alerttriangle: <AlertTriangle className="w-3 h-3" /> })}</Badge>
                        )}

                        <Button
                          onClick={() => handleTestDevice(dev.id)}
                          disabled={isTesting}
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] gap-1 px-2.5"
                        >
                          {isTesting ? (
                            <>
                              {richText(t("attendance.loader2testing"), { loader2: <Loader2 className="w-3 h-3 animate-spin" /> })}</>
                          ) : (
                            <>
                              {richText(t("attendance.refreshcwtest_connectivity"), { refreshcw: <RefreshCw className="w-3 h-3" /> })}</>
                          )}
                        </Button>

                        <button
                          onClick={() => handleDeleteDevice(dev.id, dev.device_name)}
                          className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors"
                          title={t("attendance.revoke_device")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Test result message if available */}
                    {testRes && (
                      <div
                        className={`p-2.5 rounded-lg text-[11px] flex items-start gap-2 ${
                          testRes.success
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <p className="font-semibold">{testRes.message}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">
                            {t("attendance.status_verified_at_tolocaletimestring", undefined, { toLocaleTimeString: new Date().toLocaleTimeString() })}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[11px] text-[var(--text-muted)] flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p>
              <strong>{t("attendance.biometric_privacy_zero_knowledge_architecture")}</strong> {t("attendance.repsi_does_not_store_raw_fingerprint")}
            </p>
          </div>
        </div>

      {/* Register Biometric Device Modal */}
      {showRegisterDeviceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-[var(--text)]">{t("attendance.register_biometric_terminal")}</h3>
              </div>
              <button
                onClick={() => setShowRegisterDeviceModal(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--surface-hover)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterDeviceSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text)]">{t("attendance.device_friendly_name")}</label>
                <input
                  type="text"
                  required
                  value={newDevice.device_name}
                  onChange={(e) => setNewDevice({ ...newDevice, device_name: e.target.value })}
                  placeholder={t("attendance.e_g_front_turnstile_scanner")}
                  className="w-full h-9 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text)]">{t("attendance.device_model_manufacturer")}</label>
                <select
                  value={newDevice.device_model}
                  onChange={(e) => setNewDevice({ ...newDevice, device_model: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text)] font-medium"
                >
                  <option value="ZKTeco K40 Fingerprint Terminal">{t("attendance.zkteco_k40_mb20_standalone_terminal")}</option>
                  <option value="ZKTeco IN01 / UFace Network Device">{t("attendance.zkteco_in01_uface_network_device")}</option>
                  <option value="Mantra MBF30 Biometric Terminal">{t("attendance.mantra_mbf30_biometric_terminal")}</option>
                  <option value="Mantra MFS100 Optical Scanner">{t("attendance.mantra_mfs100_optical_scanner")}</option>
                  <option value="Generic Network Biometric Terminal">{t("attendance.generic_network_biometric_gateway")}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text)]">{t("attendance.device_serial_number_s_n")}</label>
                <input
                  type="text"
                  required
                  value={newDevice.device_serial}
                  onChange={(e) => setNewDevice({ ...newDevice, device_serial: e.target.value })}
                  placeholder={t("attendance.e_g_zk9812498124")}
                  className="w-full h-9 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-mono text-[var(--text)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text)]">{t("attendance.local_ip_address")}</label>
                  <input
                    type="text"
                    value={newDevice.ip_address}
                    onChange={(e) => setNewDevice({ ...newDevice, ip_address: e.target.value })}
                    placeholder="192.168.1.201"
                    className="w-full h-9 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-mono text-[var(--text)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text)]">{t("attendance.port")}</label>
                  <input
                    type="number"
                    value={newDevice.port}
                    onChange={(e) => setNewDevice({ ...newDevice, port: Number(e.target.value) })}
                    placeholder="4370"
                    className="w-full h-9 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs font-mono text-[var(--text)]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text)]">{t("attendance.installation_location")}</label>
                <input
                  type="text"
                  value={newDevice.location_name}
                  onChange={(e) => setNewDevice({ ...newDevice, location_name: e.target.value })}
                  placeholder={t("attendance.main_entrance_turnstile_1")}
                  className="w-full h-9 px-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] text-xs text-[var(--text)]"
                />
              </div>

              {deviceError && (
                <p className="text-xs text-rose-500 font-medium">{deviceError}</p>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--border)]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRegisterDeviceModal(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={registeringDevice}
                  className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-semibold"
                >
                  {registeringDevice ? (
                    <>
                      {richText(t("attendance.loader2registering"), { loader2: <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> })}</>
                  ) : (
                    "Register Device"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
