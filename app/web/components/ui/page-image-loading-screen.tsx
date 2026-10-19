"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { RepsiBrandLoader } from "@/components/ui/repsi-brand-loader";

/**
 * Marketing Landing Page Initial Loading Screen
 *
 * Requirements:
 * 1. Zero text clutter — only the iconic R lettermark and sleek progress track
 * 2. Continuously loads ("load and load") until the page actually opens
 * 3. Once the page has loaded, completes to 100% and smoothly fades out
 * 4. Guarded by sessionStorage so it doesn't interrupt internal route navigation
 */
export function PageImageLoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(12);
  const isPageReadyRef = useRef(false);

  const completeAndReveal = useCallback(() => {
    // Fill to 100%
    setProgress(100);

    try {
      sessionStorage.setItem("repsi_initial_loaded", "true");
    } catch {}

    // Brief hold at 100% for smooth visual satisfaction
    const holdTimer = setTimeout(() => {
      setIsExiting(true);

      const unmountTimer = setTimeout(() => {
        setVisible(false);
      }, 300);

      return () => clearTimeout(unmountTimer);
    }, 180);

    return () => clearTimeout(holdTimer);
  }, []);

  useEffect(() => {
    // 01. Never show if already loaded in this tab session
    try {
      if (sessionStorage.getItem("repsi_initial_loaded")) {
        setVisible(false);
        return;
      }
    } catch {}

    const startTime = Date.now();
    let isCancelled = false;

    // 02. Continuous progress loop: simulates realistic progressive network loading
    // Moves actively from 12% -> 35% -> 60% -> 80% -> 92% until page ready
    const progressInterval = setInterval(() => {
      if (isCancelled || isPageReadyRef.current) return;

      setProgress((prev) => {
        if (prev < 40) return prev + Math.floor(Math.random() * 8 + 6); // fast initial jump
        if (prev < 70) return prev + Math.floor(Math.random() * 5 + 4); // steady middle
        if (prev < 88) return prev + Math.floor(Math.random() * 3 + 2); // approaching completion
        if (prev < 94) return prev + 1; // slow creep while waiting for network/DOM
        return prev;
      });
    }, 120);

    // 03. Detect genuine page & asset completion
    const checkPageReady = () => {
      if (isCancelled || isPageReadyRef.current) return;

      const elapsed = Date.now() - startTime;
      // Allow a brief minimum aesthetic duration (700ms) so user sees the loading sequence
      const remainingTime = Math.max(0, 700 - elapsed);

      setTimeout(() => {
        if (isCancelled) return;
        isPageReadyRef.current = true;
        clearInterval(progressInterval);
        completeAndReveal();
      }, remainingTime);
    };

    if (typeof document !== "undefined") {
      if (document.readyState === "complete") {
        checkPageReady();
      } else {
        window.addEventListener("load", checkPageReady, { once: true });
        // Also check when DOM interactive in case window.load is delayed by non-essential scripts
        document.addEventListener("readystatechange", () => {
          if (document.readyState === "complete") {
            checkPageReady();
          }
        });
      }
    }

    // 04. Hard safety fallback: guarantees page opens within 3 seconds regardless of network
    const safetyTimer = setTimeout(() => {
      if (!isPageReadyRef.current) {
        checkPageReady();
      }
    }, 2800);

    return () => {
      isCancelled = true;
      clearInterval(progressInterval);
      clearTimeout(safetyTimer);
      window.removeEventListener("load", checkPageReady);
    };
  }, [completeAndReveal]);

  if (!visible) return null;

  return (
    <div
      onClick={completeAndReveal}
      className="cursor-pointer"
      title="Click to skip"
    >
      <RepsiBrandLoader
        progress={progress}
        showText={false}
        fullScreen={true}
        isExiting={isExiting}
      />
    </div>
  );
}

export default PageImageLoadingScreen;
