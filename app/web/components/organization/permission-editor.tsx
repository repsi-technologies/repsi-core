"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { FormAlert, PrimaryButton, SecondaryButton } from "@/components/organization/form-fields";
import { repsiApi, type ApiStaffPermissions } from "@/lib/api";

/**
 * Per-staff permission overrides on top of the role's defaults. The backend enforces every rule
 * (no self-edits, no owner restrictions, can't grant what you don't hold); this UI only reflects it.
 */
export function PermissionEditor({ memberId, onClose }: { memberId: string; onClose: () => void }) {
  const [catalog, setCatalog] = useState<{ key: string; label: string }[] | null>(null);
  const [presets, setPresets] = useState<{ key: string; label: string; permissions: string[] }[]>([]);
  const [current, setCurrent] = useState<ApiStaffPermissions | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([repsiApi.getPermissionCatalog(), repsiApi.getTeamMemberPermissions(memberId)])
      .then(([cat, perms]) => {
        setCatalog(cat.permissions);
        setPresets(cat.trainer_presets || []);
        setCurrent(perms);
        setSelected(new Set(perms.effective));
      })
      .catch((err) => setError(err.message));
  }, [memberId]);

  const defaults = useMemo(() => new Set(current?.role_defaults || []), [current]);
  const dirty = current ? [...selected].sort().join() !== [...current.effective].sort().join() : false;

  const toggle = (key: string) => {
    setSaved(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const save = async () => {
    if (!current) return;
    setSaving(true);
    setError(null);
    try {
      const grant = [...selected].filter((p) => !defaults.has(p));
      const revoke = [...defaults].filter((p) => !selected.has(p));
      // Send the preset key when the selection is exactly a preset, so the audit log names it.
      const preset = presets.find((p) => p.permissions.length === selected.size && p.permissions.every((k) => selected.has(k)));
      const updated = await repsiApi.setTeamMemberPermissions(memberId, preset && current.role === "TRAINER" ? { grant: [], revoke: [], preset: preset.key } : { grant, revoke });
      setCurrent(updated);
      setSelected(new Set(updated.effective));
      setSaved(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (error && !current) return <FormAlert kind="error">{error}</FormAlert>;
  if (!catalog || !current) {
    return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" aria-label="Loading permissions" /></div>;
  }

  return (
    <div className="mt-3 space-y-3 rounded-[10px] border border-[var(--border)] bg-[var(--background)] p-3">
      <p className="text-xs text-[var(--text-muted)]">
        Checked items are what this person can do. Bold items are the defaults for the {current.role.toLowerCase()} role.
      </p>
      {current.role === "TRAINER" && presets.length > 0 && !current.locked && (
        <label className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
          Apply a trainer preset
          <select
            className="h-8 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-2 text-xs text-[var(--text)]"
            value=""
            onChange={(e) => {
              const preset = presets.find((p) => p.key === e.target.value);
              if (preset) { setSaved(false); setSelected(new Set(preset.permissions)); }
            }}
          >
            <option value="">Choose…</option>
            {presets.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </label>
      )}
      <fieldset className="grid gap-2 sm:grid-cols-2">
        <legend className="sr-only">Permissions</legend>
        {catalog.map((p) => (
          <label key={p.key} className="flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              checked={selected.has(p.key)}
              disabled={current.locked}
              onChange={() => toggle(p.key)}
              className="mt-0.5"
            />
            <span className={defaults.has(p.key) ? "font-semibold text-[var(--text)]" : "text-[var(--text-secondary)]"}>{p.label}</span>
          </label>
        ))}
      </fieldset>
      {error && <FormAlert kind="error">{error}</FormAlert>}
      {saved && !dirty && <FormAlert kind="success">Permissions saved.</FormAlert>}
      <div className="flex justify-end gap-2">
        <SecondaryButton type="button" className="h-8 px-3 text-xs" onClick={onClose}>Close</SecondaryButton>
        <SecondaryButton type="button" className="h-8 px-3 text-xs" disabled={saving}
          onClick={() => { setSaved(false); setSelected(new Set(current.role_defaults)); }}>
          Reset to role defaults
        </SecondaryButton>
        <PrimaryButton type="button" className="h-8 px-3 text-xs" disabled={!dirty || current.locked} loading={saving} onClick={save}>
          Save permissions
        </PrimaryButton>
      </div>
    </div>
  );
}
