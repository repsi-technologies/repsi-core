import React from "react";
import { Img as RImg, staticFile, useCurrentFrame } from "remotion";
import type { Img, Rect, View } from "./assets";
import { C, ease, fontFamily, tween } from "./theme";

export type Box = { x: number; y: number; w: number; h: number };

/**
 * Shows `rect` of an image inside a w x h viewport. "cover" fills the viewport (cropping the rect's long
 * side), "contain" fits the whole rect. This is the film's virtual camera: animate the rect, the shot moves.
 */
export const Crop: React.FC<{ img: Img; rect: Rect; w: number; h: number; fit?: "cover" | "contain"; filter?: string }> = ({
  img, rect, w, h, fit = "cover", filter,
}) => {
  const [x0, y0, x1, y1] = rect;
  const rw = x1 - x0;
  const rh = y1 - y0;
  const s = fit === "cover" ? Math.max(w / rw, h / rh) : Math.min(w / rw, h / rh);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  return (
    <div style={{ position: "relative", width: w, height: h, overflow: "hidden" }}>
      <RImg src={img.src} style={{ position: "absolute", left: w / 2 - cx * s, top: h / 2 - cy * s, width: img.w * s, height: img.h * s,
        maxWidth: "none", filter }} />
    </div>
  );
};

/** A camera target: centre (cx, cy) and visible width, in image px; height follows the viewport's aspect. */
export type Cam = [number, number, number];
export function camRect([cx, cy, cw]: Cam, aspect: number): Rect {
  const ch = cw / aspect;
  return [cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2];
}
/** Moves the camera through keyframes [frame, cam], easing between each pair. */
export function camAt(frame: number, keys: [number, Cam][], easing = ease.inOut): Cam {
  if (frame <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, c1] = keys[i];
    const [f0, c0] = keys[i - 1];
    if (frame <= f1) {
      const p = tween(frame, [f0, f1], [0, 1], easing);
      // Zoom moves geometrically so a push-in keeps a constant perceived speed.
      return [c0[0] + (c1[0] - c0[0]) * p, c0[1] + (c1[1] - c0[1]) * p, c0[2] * Math.pow(c1[2] / c0[2], p)];
    }
  }
  return keys[keys.length - 1][1];
}

/** A photograph filling its box, with a slow push (Ken Burns) about a focus point. */
export const Photo: React.FC<{ img: Img; w: number; h: number; focus?: [number, number]; zoom?: number; filter?: string }> = ({
  img, w, h, focus = [0.5, 0.5], zoom = 1, filter = "saturate(1.08) contrast(1.04)",
}) => {
  const aspect = w / h;
  let rw = img.w / zoom;
  let rh = rw / aspect;
  if (rh > img.h / zoom) { rh = img.h / zoom; rw = rh * aspect; }
  const cx = Math.min(img.w - rw / 2, Math.max(rw / 2, focus[0] * img.w));
  const cy = Math.min(img.h - rh / 2, Math.max(rh / 2, focus[1] * img.h));
  return <Crop img={img} rect={[cx - rw / 2, cy - rh / 2, cx + rw / 2, cy + rh / 2]} w={w} h={h} filter={filter} />;
};

/** A product view presented as a floating card (or bare, when the capture already includes its own device). */
export const Card: React.FC<{ view: View; box: Box; radius?: number }> = ({ view, box, radius = 22 }) => (
  <div style={{
    position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: view.bare ? 0 : view.phone ? radius * 2.4 : radius,
    overflow: "hidden", background: view.bare ? "transparent" : "#FFFFFF", boxSizing: "border-box",
    // A phone-width product capture gets a plain dark bezel, so it reads as the app on a phone.
    border: view.phone ? `${Math.max(8, box.w * 0.03)}px solid #111214` : undefined,
    boxShadow: view.bare ? "none" : "0 2px 0 rgba(0,0,0,0.04), 0 30px 80px rgba(23,25,28,0.28)",
    filter: view.bare ? "drop-shadow(0 30px 50px rgba(23,25,28,0.35))" : undefined,
  }}>
    <Crop img={view.img} rect={view.rect} fit="cover"
      w={view.phone ? box.w - 2 * Math.max(8, box.w * 0.03) : box.w} h={view.phone ? box.h - 2 * Math.max(8, box.w * 0.03) : box.h} />
  </div>
);

/** The largest box of the view's aspect that fits in `area`, centred. */
export function fitBox(view: View, area: Box): Box {
  const [x0, y0, x1, y1] = view.rect;
  const a = (x1 - x0) / (y1 - y0);
  let w = area.w;
  let h = w / a;
  if (h > area.h) { h = area.h; w = h * a; }
  return { x: area.x + (area.w - w) / 2, y: area.y + (area.h - h) / 2, w, h };
}

/** A line of type revealed from under a mask; `out` slides it away the same way. */
export const Line: React.FC<{
  at: number; out?: number; size: number; weight?: number; color?: string; children: React.ReactNode; dur?: number;
  align?: "left" | "center"; tracking?: string; lineHeight?: number; shadow?: boolean;
}> = ({ at, out, size, weight = 700, color = C.text, children, dur = 12, align = "left", tracking = "-0.03em", lineHeight = 1.04, shadow }) => {
  const frame = useCurrentFrame();
  const enter = tween(frame, [at, at + dur], [105, 0]);
  const exit = out === undefined ? 0 : tween(frame, [out, out + 8], [0, -105], ease.in);
  const visible = frame >= at && (out === undefined || frame < out + 8);
  return (
    <div style={{ overflow: "hidden", textAlign: align, paddingBottom: size * 0.14, marginBottom: -size * 0.14 }}>
      <div style={{ transform: `translateY(${enter + exit}%)`, opacity: visible ? 1 : 0, fontFamily, fontSize: size, fontWeight: weight,
        color, letterSpacing: tracking, lineHeight, whiteSpace: "nowrap", textShadow: shadow ? "0 2px 24px rgba(0,0,0,0.35)" : undefined }}>
        {children}
      </div>
    </div>
  );
};

// ---------- the official logo ----------
// The R lettermark ships as two layers (body + slash, 495x382) whose R matches the wordmark's R pixel for pixel:
// lettermark content starts at (17,15) and the wordmark's R at (119,180) in the 2172x724 wordmark, same scale.
export const LOGO = { w: 2172, h: 724, rX: 119, rY: 180, markW: 495, markH: 382, markX: 17, markY: 15, rEnd: 590, contentX0: 119, contentX1: 2043, contentY0: 180, contentY1: 532 };
// The slash parallelogram in lettermark px (top-left, top-right, bottom-right, bottom-left).
export const SLASH: [number, number][] = [[19, 157], [166, 157], [326, 364], [179, 364]];

/** The R lettermark, assembled from its official layers. `slash` and `body` run 0..1. */
export const RMark: React.FC<{ scale: number; x: number; y: number; slash: number; body: number; slashOpacity?: number }> = ({ scale, x, y, slash, body, slashOpacity = 1 }) => {
  const w = LOGO.markW * scale;
  const h = LOGO.markH * scale;
  // The slash is revealed along its own diagonal (top-left to bottom-right), the way it reads.
  const p = slash * 140 - 20;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
      <RImg src={staticFile("brand/repsi-r-body-white.png")} style={{ position: "absolute", inset: 0, width: w, height: h,
        opacity: body, transform: `scale(${0.94 + 0.06 * Math.min(1, body)})`, transformOrigin: "60% 50%" }} />
      <RImg src={staticFile("brand/repsi-r-slash.png")} style={{ position: "absolute", inset: 0, width: w, height: h, opacity: slashOpacity,
        clipPath: `polygon(0% 0%, ${p}% 0%, ${p - 40}% 100%, 0% 100%)` }} />
    </div>
  );
};

/** The full wordmark. `letters` (0..1) wipes in everything after the R; the R itself is drawn by RMark on top. */
export const Wordmark: React.FC<{ scale: number; x: number; y: number; letters: number }> = ({ scale, x, y, letters }) => {
  const from = (LOGO.rEnd / LOGO.w) * 100;
  const right = from + (100 - from) * letters;
  return (
    <RImg src={staticFile("brand/repsi-logo-white.png")} style={{ position: "absolute", left: x, top: y, width: LOGO.w * scale,
      height: LOGO.h * scale, clipPath: `inset(0 ${100 - right}% 0 ${from}%)` }} />
  );
};
