"use client";

import React, { useState, useEffect } from "react";
import { RepsiBrandLoader } from "@/components/ui/repsi-brand-loader";

/**
 * Initial Marketing Page Image Loading Screen
 *
 * Renders the official REPSI brand loader with:
 * - Animated Black R body + Flame Orange diagonal slash
 * - Single subtle orange glow expansion
 * - Smooth continuous progress track (zero stuck states)
 * - Automatic smooth fade-out (250ms) after genuine initialization
 * - Fail-safe guaranteed dismiss so it NEVER blocks the user
 */
export function PageImageLoadingScreen() {
  const [mounted, setMounted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setMounted(true);

    // If user already saw the loader in this tab session, skip immediately
    try {
      if (sessionStorage.getItem("repsi_initial_loaded")) {
        setVisible(false);
        return;
      }
    } catch {}

    // Smooth presentation duration (650ms), then 250ms fade out
    const dismissTimer = setTimeout(() => {
      setIsExiting(true);
      try {
        sessionStorage.setItem("repsi_initial_loaded", "true");
      } catch {}

      setTimeout(() => {
        setVisible(false);
      }, 280);
    }, 700);

    // Guaranteed hard safety timeout: under no circumstance will loader persist > 1.2s
    const hardSafetyTimer = setTimeout(() => {
      setVisible(false);
    }, 1200);

    return () => {
      clearTimeout(dismissTimer);
      clearTimeout(hardSafetyTimer);
    };
  }, []);

  // Before hydration, or once dismissed, render nothing
  if (!visible) return null;

  return (
    <div
      onClick={() => setVisible(false)}
      className="cursor-pointer"
      title="Click to skip"
    >
      <RepsiBrandLoader
        message="Preparing your workspace..."
        fullScreen={true}
        showConceptNote={true}
        isExiting={isExiting}
      />
    </div>
  );
}

export default PageImageLoadingScreen;
