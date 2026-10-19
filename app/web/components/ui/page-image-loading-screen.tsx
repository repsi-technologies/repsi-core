"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RepsiBrandLoader } from "@/components/ui/repsi-brand-loader";

/**
 * Marketing Landing Page Genuine Initializer Screen
 *
 * Implements:
 * 1. Shows strictly on initial cold visit (sessionStorage guarded)
 * 2. Connects to real document/asset readiness (window.load / document.readyState)
 * 3. Never flashes during internal client-side navigation
 * 4. Refined 5-stage animation:
 *    - Stage 1: R body reveal
 *    - Stage 2: Flame Orange diagonal slash
 *    - Stage 3: REPSI brand reveal
 *    - Stage 4: Loading indicator
 *    - Stage 5: Smooth completion and 250ms fade-out
 * 5. Robust error and timeout safety nets
 */
export function PageImageLoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const completeAndExit = useCallback(() => {
    setIsExiting(true);
    try {
      sessionStorage.setItem("repsi_initial_loaded", "true");
    } catch {}

    const timer = setTimeout(() => {
      setVisible(false);
    }, 280);

    return () => clearTimeout(timer);
  }, []);

  const handleRetry = useCallback(() => {
    setInitError(null);
    window.location.reload();
  }, []);

  useEffect(() => {
    // 01. Never show if user already initialized REPSI in this tab session
    try {
      if (sessionStorage.getItem("repsi_initial_loaded")) {
        setVisible(false);
        return;
      }
    } catch {}

    let exitTimeout: NodeJS.Timeout;
    const startTime = Date.now();
    // Minimum time to allow the refined 500-600ms logo reveal to complete its aesthetic arc
    const minRevealDuration = 600;

    const onReady = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minRevealDuration - elapsed);

      exitTimeout = setTimeout(() => {
        completeAndExit();
      }, remaining);
    };

    if (typeof document !== "undefined") {
      if (document.readyState === "complete") {
        onReady();
      } else {
        window.addEventListener("load", onReady, { once: true });
      }
    }

    // 02. Hard timeout failsafe: under no network condition can loader persist past 2s
    const hardTimeout = setTimeout(() => {
      completeAndExit();
    }, 2000);

    // 03. Global unhandled error listener for initialization failures
    const errorHandler = (event: ErrorEvent) => {
      // Filter out benign resize observer / cross-origin extension noise
      if (event.message && !event.message.includes("ResizeObserver")) {
        setInitError("Unable to initialize workspace smoothly.");
      }
    };
    window.addEventListener("error", errorHandler);

    return () => {
      clearTimeout(exitTimeout);
      clearTimeout(hardTimeout);
      window.removeEventListener("load", onReady);
      window.removeEventListener("error", errorHandler);
    };
  }, [completeAndExit]);

  if (!visible) return null;

  return (
    <div
      onClick={completeAndExit}
      className="cursor-pointer"
      title="Click to skip"
    >
      <RepsiBrandLoader
        message="Preparing your workspace..."
        error={initError}
        onRetry={handleRetry}
        fullScreen={true}
        isExiting={isExiting}
      />
    </div>
  );
}

export default PageImageLoadingScreen;
