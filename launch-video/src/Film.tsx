import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CROP, PHOTO, PRODUCT, SITE, screen, type Img, type View } from "./assets";
import { C, T, ease, sec, tween } from "./theme";
import { Card, Crop, LOGO, Line, Photo, RMark, SLASH, Wordmark, camAt, camRect, fitBox, type Box, type Cam } from "./ui";

const S = T.scenes;
type Fmt = { W: number; H: number; v: boolean };
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const lerpBox = (a: Box, b: Box, p: number): Box => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p) });
const inScene = (frame: number, [a, b]: number[]) => frame >= sec(a) && frame < sec(b);
const poly = (pts: number[][]) => `polygon(${pts.map(([x, y]) => `${x}px ${y}px`).join(", ")})`;

/**
 * A wipe whose edge runs at the angle of the logo's slash. p=0 shows nothing, p=1 the whole frame.
 * Used for every brand-led transition, so the film's one shape language comes from the logo itself.
 */
function slashWipe(W: number, H: number, p: number) {
  const lean = H * 0.71;
  const e = lerp(-lean, W, p);
  return poly([[0, 0], [e, 0], [e + lean, H], [0, H]]);
}

/** Two lines of type: a headline block anchored at (x, y). */
const Copy: React.FC<{ at: number; lines: string[]; x: number; y: number; size: number; color?: string; shadow?: boolean; align?: "left" | "center"; w?: number }> = ({
  at, lines, x, y, size, color = C.text, shadow, align = "left", w,
}) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, display: "flex", flexDirection: "column" }}>
    {lines.map((line, i) => (
      <Line key={i} at={at + i * 3} size={size} color={color} shadow={shadow} align={align}>{line}</Line>
    ))}
  </div>
);

// ---------- Scene 1: hook ----------
// The R assembles in the dark; its slash becomes a window onto an athlete, and the window opens to full frame.
const Hook: React.FC<{ f: Fmt }> = ({ f }) => {
  const frame = useCurrentFrame();
  const scale = (f.v ? 420 : 360) / LOGO.markW;
  const x = (f.W - LOGO.markW * scale) / 2;
  const y = (f.H - LOGO.markH * scale) / 2 - (f.v ? 80 : 0);
  const hit = sec(T.slashHit);
  const windowIn = tween(frame, [sec(1.85), sec(2.15)], [0, 1]);
  const open = tween(frame, [sec(2.2), sec(3.7)], [0, 1], ease.in);
  const pts = SLASH.map(([px, py]) => [x + px * scale, y + py * scale]);
  const c0 = [pts.reduce((s, p) => s + p[0], 0) / 4, pts.reduce((s, p) => s + p[1], 0) / 4];
  const k = Math.pow(26, open);
  const c = [lerp(c0[0], f.W / 2, open), lerp(c0[1], f.H / 2, open)];
  const windowPts = pts.map(([px, py]) => [c[0] + (px - c0[0]) * k, c[1] + (py - c0[1]) * k]);
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      {frame >= sec(1.85) && (
        <AbsoluteFill style={{ clipPath: poly(windowPts), opacity: windowIn }}>
          <Photo img={PHOTO.core} w={f.W} h={f.H} focus={f.v ? [0.7, 0.45] : [0.6, 0.48]} zoom={lerp(1.35, 1.08, open) + 0.04 * tween(frame, [sec(3.7), sec(4)], [0, 1])} />
        </AbsoluteFill>
      )}
      <RMark scale={scale} x={x} y={y} slash={tween(frame, [hit - 4, hit + 6], [0, 1])} slashOpacity={1 - windowIn}
        body={tween(frame, [hit + 4, hit + 22], [0, 1]) * tween(frame, [sec(2.2), sec(2.6)], [1, 0])} />
    </AbsoluteFill>
  );
};

// ---------- Scene 2: problem ----------
// The live website's own problem section, shot like a scroll: the camera lands on each pain point on the beat,
// then punches into the orange REPSI on the beat before the drop, and a slash wipe floods the frame orange.
const Problem: React.FC<{ f: Fmt }> = ({ f }) => {
  const frame = useCurrentFrame();
  const [h1, h2, h3, h4] = T.problemHits.map(sec);
  const snap = sec(T.snap);
  const end = sec(S.problem[1]);
  const img = f.v ? SITE.phoneProblems : SITE.problems;
  const K: Cam[] = f.v
    ? [[195, 160, 380], [195, 175, 345], [195, 430, 345], [195, 830, 300], [195, 912, 300], [195, 990, 300], [195, 1093, 330], [195, 1080, 34]]
    : [[718, 232, 1180], [718, 240, 1080], [719, 560, 1150], [719, 843, 1000], [719, 955, 1000], [719, 1067, 1000], [719, 1185, 900], [479, 1186, 46]];
  const cam = camAt(frame, [
    [sec(S.problem[0]), K[0]], [h1 - 7, K[1]], [h1, K[2]], [h2 - 7, K[2]], [h2, K[3]], [h3 - 7, K[3]], [h3, K[4]], [h4 - 7, K[4]], [h4, K[5]],
    [snap - 8, K[5]], [snap, K[6]], [snap + 16, K[6]], [end - 4, K[7]],
  ]);
  const flood = tween(frame, [end - 9, end], [0, 1], ease.in);
  return (
    <AbsoluteFill style={{ background: C.cream }}>
      <Crop img={img} rect={camRect(cam, f.W / f.H)} w={f.W} h={f.H} />
      {flood > 0 && <AbsoluteFill style={{ background: C.flame, clipPath: slashWipe(f.W, f.H, flood) }} />}
    </AbsoluteFill>
  );
};

// ---------- Scene 3: solution ----------
const Solution: React.FC<{ f: Fmt }> = ({ f }) => {
  const frame = useCurrentFrame();
  const a = sec(S.solution[0]);
  const reveal = tween(frame, [a + 30, a + 44], [0, 1], ease.inOut);
  const img = f.v ? SITE.phoneHero : SITE.top;
  const keys: [number, Cam][] = f.v
    ? [[a + 30, [195, 300, 390]], [a + 118, [195, 300, 360]], [a + 160, [195, 630, 390]], [a + 186, [131, 655, 216]], [a + 210, [131, 655, 196]]]
    : [[a + 30, [720, 450, 1440]], [a + 118, [720, 430, 1260]], [a + 160, [463, 740, 780]], [a + 186, [356, 734, 520]], [a + 210, [356, 734, 470]]];
  const cam = camAt(frame, keys);
  return (
    <AbsoluteFill style={{ background: C.cream }}>
      <Crop img={img} rect={camRect(cam, f.W / f.H)} w={f.W} h={f.H} />
      {reveal < 1 && (
        <AbsoluteFill style={{ background: C.flame, alignItems: "center", justifyContent: "center",
          clipPath: reveal > 0 ? `polygon(${[[f.W, 0], [lerp(-f.H * 0.71, f.W, reveal), 0], [lerp(-f.H * 0.71, f.W, reveal) + f.H * 0.71, f.H], [f.W, f.H]].map(([x, y]) => `${x}px ${y}px`).join(", ")})` : undefined }}>
          <Line at={a + 2} size={f.v ? 150 : 180} color={C.paper} align="center" weight={700}>Meet REPSI.</Line>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ---------- Scene 4: features ----------
type Enter = "match" | "cut" | "wipe" | "push" | "rise" | "slide";
type Beat = { photo: Img; focus: [number, number]; bg: string; lines: string[]; view: View; enter: Enter };
const FEATURES: Beat[] = [
  { photo: PHOTO.barbell, focus: [0.48, 0.38], bg: C.cream, lines: ["Your whole gym,", "at a glance."], enter: "match",
    view: { img: SITE.top, rect: CROP.dashScreen } },
  { photo: PHOTO.dumbbells, focus: [0.45, 0.5], bg: C.charcoal, lines: ["Every member,", "tracked and retained."], enter: "cut",
    view: screen("analytics", PRODUCT.analytics, { img: SITE.top, rect: CROP.dashMembers }) },
  { photo: PHOTO.ropes, focus: [0.74, 0.58], bg: C.flame, lines: ["Trainers and clients,", "in sync."], enter: "wipe",
    view: { img: SITE.pricing, rect: CROP.proList } },
  { photo: PHOTO.deadlift, focus: [0.5, 0.42], bg: C.cream, lines: ["Workout and diet", "plans, built in."], enter: "push",
    view: { img: SITE.pricing, rect: CROP.growthList } },
  { photo: PHOTO.group, focus: [0.42, 0.5], bg: C.charcoal, lines: ["Check-ins, tracked", "as they happen."], enter: "cut",
    view: screen("phone-attendance", PRODUCT.attendanceHub, { img: SITE.top, rect: CROP.dashAttendance }, true) },
  { photo: PHOTO.core, focus: [0.62, 0.45], bg: C.flame, lines: ["Payments and renewals,", "under control."], enter: "rise",
    view: screen("phone-payments", PRODUCT.paymentsPhone, { img: SITE.pricing, rect: CROP.starterCard }, true) },
  { photo: PHOTO.stretch, focus: [0.6, 0.5], bg: C.cream, lines: ["An app for members.", "A portal for trainers."], enter: "slide",
    view: { img: SITE.top, rect: CROP.phoneMock, bare: true } },
  { photo: PHOTO.dumbbells, focus: [0.7, 0.62], bg: C.charcoal, lines: ["Reminders and broadcasts,", "built in."], enter: "cut",
    view: screen("notifications", PRODUCT.notifications, { img: SITE.pricing, rect: CROP.proWhatsApp }) },
];

function featureLayout(f: Fmt) {
  return f.v
    ? { photo: { x: 0, y: 0, w: f.W, h: 900 }, ui: { x: 60, y: 830, w: 960, h: 650 }, copy: { x: 64, y: 560, size: 72 }, alignTop: false }
    : { photo: { x: 0, y: 0, w: 680, h: f.H }, ui: { x: 750, y: 90, w: 1110, h: 900 }, copy: { x: 64, y: 820, size: 54 }, alignTop: false };
}

/** One feature beat. `t` is frames since the beat began; `match` animates in from the previous scene's full-frame shot. */
const BeatView: React.FC<{ f: Fmt; beat: Beat; t: number; dur: number; at: number }> = ({ f, beat, t, dur, at }) => {
  const L = featureLayout(f);
  let card = fitBox(beat.view, L.ui);
  if (L.alignTop) card = { ...card, y: L.ui.y };
  const p = t / dur;
  let photoBox: Box = L.photo;
  let punch = 1;
  if (beat.enter === "match") {
    const m = tween(t, [0, 14], [0, 1], ease.out);
    card = lerpBox({ x: 0, y: 0, w: f.W, h: f.H }, card, m);
    photoBox = f.v ? { ...L.photo, y: lerp(-L.photo.h, 0, m) } : { ...L.photo, x: lerp(-L.photo.w, 0, m) };
  } else if (beat.enter === "cut") {
    punch = 1 + 0.06 * tween(t, [0, 7], [1, 0]);
  }
  const float = -10 * p;
  return (
    <AbsoluteFill style={{ background: beat.bg }}>
      <div style={{ position: "absolute", left: photoBox.x, top: photoBox.y, width: photoBox.w, height: photoBox.h, overflow: "hidden" }}>
        <Photo img={beat.photo} w={photoBox.w} h={photoBox.h} focus={beat.focus} zoom={1.02 + 0.07 * p} />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.62) 100%)" }} />
      </div>
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${float}px) scale(${punch})`, transformOrigin: `${card.x + card.w / 2}px ${card.y + card.h / 2}px` }}>
        <Card view={beat.view} box={card} />
      </div>
      <Copy at={at + 3} lines={beat.lines} x={L.copy.x} y={L.copy.y} size={L.copy.size} color={C.paper} shadow />
    </AbsoluteFill>
  );
};

const Features: React.FC<{ f: Fmt }> = ({ f }) => {
  const frame = useCurrentFrame();
  const cuts = T.featureCuts.map(sec);
  const end = sec(S.features[1]);
  const i = Math.max(0, cuts.findLastIndex((c) => frame >= c));
  const a = cuts[i];
  const dur = (cuts[i + 1] ?? end) - a;
  const beat = FEATURES[i];
  const cur = <BeatView f={f} beat={beat} t={frame - a} dur={dur} at={a} />;
  if (i === 0 || ["match", "cut"].includes(beat.enter)) return cur;
  const prevA = cuts[i - 1];
  const prev = <BeatView f={f} beat={FEATURES[i - 1]} t={a - prevA} dur={a - prevA} at={prevA} />;
  const D = 9;
  const p = tween(frame - a, [0, D], [0, 1], ease.inOut);
  if (p >= 1) return cur;
  const layer = (node: React.ReactNode, style: React.CSSProperties) => <AbsoluteFill style={style}>{node}</AbsoluteFill>;
  switch (beat.enter) {
    case "wipe":
      return <>{prev}{layer(cur, { clipPath: slashWipe(f.W, f.H, p) })}</>;
    case "push":
      return <>{layer(prev, { transform: `translateX(${-f.W * p}px)` })}{layer(cur, { transform: `translateX(${f.W * (1 - p)}px)` })}</>;
    case "rise":
      return <>{prev}{layer(cur, { clipPath: `inset(${(1 - p) * 100}% 0 0 0)` })}</>;
    case "slide":
      return <>{layer(prev, { transform: `translateY(${-f.H * 0.25 * p}px)` })}{layer(cur, { transform: `translateY(${f.H * (1 - p)}px)` })}</>;
    default:
      return cur;
  }
};

// ---------- Scene 5: experience ----------
// The phone stays put while the gym changes around it: the app is the constant on the gym floor.
const MOMENTS: { photo: Img; focus: [number, number]; lines: string[]; view: View }[] = [
  { photo: PHOTO.group, focus: [0.45, 0.5], lines: ["Built for", "the gym floor."],
    view: { img: SITE.top, rect: CROP.phoneMock, bare: true } },
  { photo: PHOTO.deadlift, focus: [0.5, 0.45], lines: ["Every member,", "every check-in."],
    view: screen("phone-payments", [0, 0, 390, 760], { img: SITE.top, rect: CROP.phoneMock, bare: true }, true) },
  { photo: PHOTO.ropes, focus: [0.72, 0.55], lines: ["Every trainer,", "every client."],
    view: { img: SITE.phoneHero, rect: [0, 0, 390, 760] } },
];

const Experience: React.FC<{ f: Fmt }> = ({ f }) => {
  const frame = useCurrentFrame();
  const cuts = T.experienceCuts.map(sec);
  const i = Math.max(0, cuts.findLastIndex((c) => frame >= c));
  const a = cuts[i];
  const b = cuts[i + 1] ?? sec(S.experience[1]);
  if (frame >= sec(33.75)) return <AbsoluteFill style={{ background: C.ink }} />;
  const band: Box = f.v ? { x: 0, y: 0, w: f.W, h: 720 } : { x: 0, y: 0, w: 1180, h: f.H };
  const phoneArea: Box = f.v ? { x: 0, y: 600, w: f.W, h: 880 } : { x: 1220, y: 110, w: 620, h: 860 };
  const m = MOMENTS[i];
  const phone = fitBox(m.view, phoneArea);
  // The second moment arrives with a whip: the photo band slides in over the first, fast in the middle.
  const whip = i === 1 ? tween(frame - a, [0, 8], [1, 0], ease.inOut) : 0;
  const lift = tween(frame, [cuts[0], sec(33.75)], [0, 1], ease.inOut);
  const renderBand = (k: number, offset: number) => {
    const mm = MOMENTS[k];
    const p = (frame - (cuts[k] ?? a)) / (b - a);
    return (
      <div style={{ position: "absolute", left: band.x + offset, top: band.y, width: band.w, height: band.h, overflow: "hidden" }}>
        <Photo img={mm.photo} w={band.w} h={band.h} focus={mm.focus} zoom={1.04 + 0.08 * p} />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)" }} />
      </div>
    );
  };
  const copy = f.v ? { x: 64, y: 330, size: 76 } : { x: 80, y: 790, size: 70 };
  return (
    <AbsoluteFill style={{ background: C.flame }}>
      {whip > 0 && renderBand(0, -band.w * (1 - whip) - 0)}
      {renderBand(i, whip > 0 ? band.w * whip : 0)}
      <div style={{ position: "absolute", inset: 0, transform: `translateY(${-14 * lift}px)` }}>
        <Card view={m.view} box={phone} />
      </div>
      <Copy key={i} at={a + 3} lines={m.lines} x={copy.x} y={copy.y} size={copy.size} color={C.paper} shadow />
    </AbsoluteFill>
  );
};

// ---------- Scene 6: reveal ----------
const Reveal: React.FC<{ f: Fmt }> = ({ f }) => {
  const frame = useCurrentFrame();
  const a = sec(S.reveal[0]);
  const s = (f.v ? 860 : 1100) / (LOGO.contentX1 - LOGO.contentX0);
  const logoY = f.v ? 820 : 440;
  const settle = 1.04 - 0.04 * tween(frame, [a, sec(37)], [0, 1], ease.out);
  const wx = f.W / 2 - ((LOGO.contentX0 + LOGO.contentX1) / 2) * s;
  const wy = logoY - ((LOGO.contentY0 + LOGO.contentY1) / 2) * s;
  // The R lands centred, as it did in the opening, then slides home while the rest of the wordmark wipes in.
  const rCentre = wx + ((LOGO.rX + 583) / 2) * s;
  const slide = tween(frame, [a + 14, a + 32], [f.W / 2 - rCentre, 0], ease.inOut);
  const letters = tween(frame, [a + 18, a + 38], [0, 1], ease.inOut);
  const fade = tween(frame, [sec(39.4), sec(40) - 1], [1, 0], ease.inOut);
  const tag = sec(T.taglineAt);
  const url = sec(T.urlAt);
  const bgIn = tween(frame, [a, a + 24], [0, 1]);
  return (
    <AbsoluteFill style={{ background: C.ink, opacity: fade }}>
      {/* The athlete from the opening returns behind the logo, pulled down so the white wordmark reads. */}
      <AbsoluteFill style={{ opacity: bgIn * 0.55 }}>
        <Photo img={PHOTO.core} w={f.W} h={f.H} focus={f.v ? [0.62, 0.5] : [0.55, 0.5]} zoom={1.12 - 0.06 * tween(frame, [a, sec(40)], [0, 1])}
          filter="saturate(0.9) brightness(0.55)" />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(11,12,14,0.55) 0%, rgba(11,12,14,0.25) 45%, rgba(11,12,14,0.8) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${settle})`, transformOrigin: `${f.W / 2}px ${logoY}px` }}>
        <Wordmark scale={s} x={wx} y={wy} letters={letters} />
        <RMark scale={s} x={wx + (LOGO.rX - LOGO.markX) * s + slide} y={wy + (LOGO.rY - LOGO.markY) * s}
          slash={tween(frame, [a, a + 7], [0, 1])} body={tween(frame, [a + 3, a + 16], [0, 1])} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: f.v ? 1000 : 600, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <Line at={tag} size={f.v ? 60 : 52} align="center" color={C.paper}>One Platform.</Line>
        <Line at={tag + 4} size={f.v ? 60 : 52} align="center" weight={400} color={C.muted}>Complete Fitness Management.</Line>
        <div style={{ height: f.v ? 64 : 44 }} />
        <Line at={url} size={f.v ? 44 : 36} align="center" weight={600} color={C.flameLight} tracking="0">repsi.app</Line>
      </div>
    </AbsoluteFill>
  );
};

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const f: Fmt = { W: width, H: height, v: height > width };
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      {inScene(frame, S.hook) && <Hook f={f} />}
      {inScene(frame, S.problem) && <Problem f={f} />}
      {inScene(frame, S.solution) && <Solution f={f} />}
      {inScene(frame, S.features) && <Features f={f} />}
      {inScene(frame, S.experience) && <Experience f={f} />}
      {inScene(frame, S.reveal) && <Reveal f={f} />}
      <Audio src={staticFile("audio/score.wav")} />
    </AbsoluteFill>
  );
};
