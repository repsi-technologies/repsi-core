"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Keyboard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tr, richText } from "@/lib/i18n";

type ScannerState = "idle" | "starting" | "scanning" | "denied" | "unsupported" | "error";

interface QrCameraScannerProps {
  /** Called once per distinct code; the scanner pauses until `resume` changes. */
  onResult: (value: string) => void;
  /** Disable while the parent is processing a result. */
  busy?: boolean;
  label?: string;
  manualPlaceholder?: string;
}

// BarcodeDetector is a browser API (Chrome, Edge, Android); not in TypeScript's DOM lib yet.
type Detector = { detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]> };

function getDetector(): Detector | null {
  const Ctor = typeof window !== "undefined" ? (window as any).BarcodeDetector : undefined;
  if (!Ctor) return null;
  try {
    return new Ctor({ formats: ["qr_code"] });
  } catch {
    return null;
  }
}

/**
 * Camera QR scanner using the browser's built-in BarcodeDetector, with a manual-entry fallback
 * for browsers without it (Safari, Firefox desktop) or when camera permission is denied.
 * Repeated detections of the same code within a few seconds are ignored (camera retries).
 */
export function QrCameraScanner({ onResult, busy = false, label = "Scan QR code", manualPlaceholder = "Paste or type the code" }: QrCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastRef = useRef<{ value: string; at: number } | null>(null);
  const busyRef = useRef(busy);
  const [state, setState] = useState<ScannerState>("idle");
  const [manual, setManual] = useState("");
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  const stop = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setState((s) => (s === "scanning" || s === "starting" ? "idle" : s));
  }, []);

  useEffect(() => stop, [stop]);

  const emit = useCallback(
    (value: string) => {
      const now = Date.now();
      const last = lastRef.current;
      if (last && last.value === value && now - last.at < 5000) return;
      lastRef.current = { value, at: now };
      onResult(value);
    },
    [onResult]
  );

  const start = async () => {
    const detector = getDetector();
    if (!detector) {
      setState("unsupported");
      setShowManual(true);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      setShowManual(true);
      return;
    }
    setState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setState("scanning");
      const tick = async () => {
        if (!streamRef.current) return;
        if (!busyRef.current && video.readyState >= 2) {
          try {
            const codes = await detector.detect(video);
            if (codes[0]?.rawValue) emit(codes[0].rawValue);
          } catch {
            /* transient decode errors are expected between frames */
          }
        }
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    } catch (err: any) {
      stop();
      if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
        setState("denied");
      } else {
        setState("error");
      }
      setShowManual(true);
    }
  };

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const v = manual.trim();
    if (!v) return;
    lastRef.current = null;
    onResult(v);
    setManual("");
  };

  const active = state === "scanning" || state === "starting";

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-black aspect-[4/3] max-h-[360px] w-full">
        <video ref={videoRef} className={`h-full w-full object-cover ${active ? "" : "hidden"}`} muted playsInline aria-label={tr("attendance.camera_preview")} />
        {active && <div className="pointer-events-none absolute inset-10 rounded-xl border-2 border-white/70" aria-hidden />}
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-xs text-white/80">
            <CameraOff className="h-8 w-8" aria-hidden />
            {state === "idle" && <p>{tr("attendance.camera_is_off")}</p>}
            {state === "denied" && <p>{tr("attendance.camera_permission_was_denied_allow_camera")}</p>}
            {state === "unsupported" && <p>{tr("attendance.this_browser_can_t_scan_qr")}</p>}
            {state === "error" && <p>{tr("attendance.the_camera_couldn_t_start_it")}</p>}
          </div>
        )}
        {busy && active && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" aria-label={tr("attendance.processing_2")} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {active ? (
          <Button variant="secondary" size="sm" onClick={stop}>
            {richText(tr("attendance.cameraoffstop_camera"), { cameraoff: <CameraOff className="h-3.5 w-3.5" /> })}</Button>
        ) : (
          <Button size="sm" onClick={start}>
            <Camera className="h-3.5 w-3.5" /> {label}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => setShowManual((v) => !v)} aria-expanded={showManual}>
          {richText(tr("attendance.keyboardenter_code"), { keyboard: <Keyboard className="h-3.5 w-3.5" /> })}</Button>
      </div>

      {showManual && (
        <form onSubmit={submitManual} className="flex gap-2">
          <label htmlFor="qr-manual" className="sr-only">{tr("attendance.qr_code_value")}</label>
          <input
            id="qr-manual"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder={manualPlaceholder}
            autoComplete="off"
            className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          />
          <Button type="submit" size="sm" disabled={busy || !manual.trim()}>{tr("common.submit")}</Button>
        </form>
      )}
    </div>
  );
}
