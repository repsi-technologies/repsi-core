"use client";

import React from "react";
import Image from "next/image";

export interface RepsiRLogoProps {
  /** Size in pixels (applies to width, height is maintained at 495:382 aspect ratio) */
  size?: number;
  /** Color variant: 'light' uses near-black (#191919) body, 'dark' uses crisp white body */
  variant?: "light" | "dark";
  /** Whether to play the 2-stage staged animation sequence */
  animated?: boolean;
  /** Optional container class name */
  className?: string;
  /** Optional image priority */
  priority?: boolean;
}

/**
 * Authentic REPSI "R" Geometric Lettermark
 *
 * Implements:
 * 1. Exact geometry from the official brand wordmark
 * 2. Distinctive Flame Orange (#E25822) diagonal slash integrated into the R
 * 3. Near-black (#191919) body for light mode, white for dark mode
 * 4. Staged animation:
 *    - Stage 1: R body fades in scaling 94% -> 100% (600ms)
 *    - Stage 2: Orange diagonal stroke directional reveal (500ms at 180ms delay)
 */
export function RepsiRLogo({
  size = 112,
  variant = "light",
  animated = true,
  className = "",
  priority = true,
}: RepsiRLogoProps) {
  const bodySrc =
    variant === "dark"
      ? "/logos/repsi-r-body-white.png"
      : "/logos/repsi-r-body.png";

  const slashSrc = "/logos/repsi-r-slash.png";

  const width = size;
  const height = Math.round((size * 382) / 495);

  return (
    <div
      className={`relative select-none inline-flex items-center justify-center ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
      aria-hidden="true"
    >
      {/* Stage 1: Main R Body (Near-black #191919 on light, White on dark) */}
      <div
        className={`absolute inset-0 w-full h-full pointer-events-none ${
          animated ? "animate-repsi-body-reveal" : ""
        }`}
      >
        <Image
          src={bodySrc}
          alt=""
          width={495}
          height={382}
          priority={priority}
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>

      {/* Stage 2: Flame Orange Diagonal Slash Accent */}
      <div
        className={`absolute inset-0 w-full h-full pointer-events-none ${
          animated ? "animate-repsi-slash-reveal" : ""
        }`}
      >
        <Image
          src={slashSrc}
          alt=""
          width={495}
          height={382}
          priority={priority}
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>
    </div>
  );
}

export default RepsiRLogo;
