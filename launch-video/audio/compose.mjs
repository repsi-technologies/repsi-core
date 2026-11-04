// Scores the launch film: a 120 BPM sound-design track synthesised in code, so every hit lands on the
// same timeline the picture is cut to (src/timeline.json). Writes public/audio/score.wav (48 kHz, stereo).
//
//   node audio/compose.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const T = JSON.parse(readFileSync(path.join(root, "src/timeline.json"), "utf-8"));

const SR = 48000;
const N = Math.round(SR * T.duration);
const BEAT = 60 / T.bpm;
const TAU = Math.PI * 2;

// Three buses: drums, music (ducked under the kick), and a reverb send.
const bus = { drums: [new Float32Array(N), new Float32Array(N)], music: [new Float32Array(N), new Float32Array(N)] };
const send = new Float32Array(N);
const duck = new Float32Array(N);

let seed = 0x5eed;
function noise() {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
}
const lpCoef = (fc) => 1 - Math.exp((-TAU * Math.min(fc, SR * 0.45)) / SR);
const midi = (m) => 440 * 2 ** ((m - 69) / 12);

/** Renders gen(t) from `start` for `dur` seconds onto a bus, with equal-power pan and a reverb send. */
function voice(start, dur, gen, { gain = 1, pan = 0, rev = 0, to = "music" } = {}) {
  const s0 = Math.round(start * SR);
  const len = Math.round(dur * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  const [L, R] = bus[to];
  for (let i = 0; i < len; i++) {
    const n = s0 + i;
    if (n < 0 || n >= N) continue;
    const x = gen(i / SR, dur);
    L[n] += x * gl;
    R[n] += x * gr;
    send[n] += x * gain * rev;
  }
}

// ---------- instruments ----------
function kick(at, gain = 1) {
  let ph = 0;
  voice(at, 0.5, (t) => {
    ph += (TAU * (44 + 80 * Math.exp(-t * 30))) / SR;
    return Math.sin(ph) * Math.exp(-t * 7) + noise() * Math.exp(-t * 400) * 0.25;
  }, { gain: 0.9 * gain, to: "drums" });
  const s0 = Math.round(at * SR);
  for (let i = 0; i < SR * 0.3; i++) if (s0 + i < N) duck[s0 + i] = Math.max(duck[s0 + i], gain * Math.exp(-i / SR / 0.09));
}
function clap(at, gain = 1, pan = 0) {
  let lp = 0;
  const a = lpCoef(1400);
  voice(at, 0.3, (t) => {
    const x = noise();
    lp += a * (x - lp);
    const env = [0, 0.011, 0.022].reduce((e, o) => e + (t >= o ? Math.exp(-(t - o) * 90) : 0), 0) * 0.6 + Math.exp(-t * 16) * 0.5;
    return (x - lp) * env;
  }, { gain: 0.45 * gain, pan, rev: 0.25, to: "drums" });
}
function hat(at, gain = 1, pan = 0) {
  let lp = 0;
  const a = lpCoef(7500);
  voice(at, 0.09, (t) => {
    const x = noise();
    lp += a * (x - lp);
    return (x - lp) * Math.exp(-t * 60);
  }, { gain: 0.22 * gain, pan, to: "drums" });
}
function tick(at, freq = 1800, gain = 1, pan = 0) {
  voice(at, 0.08, (t) => (Math.sin(TAU * freq * t) * 0.8 + noise() * 0.2) * Math.exp(-t * 110), { gain: 0.2 * gain, pan, rev: 0.3, to: "drums" });
}
function bass(at, note, dur = BEAT / 2 - 0.02, gain = 1) {
  const f = midi(note);
  let ph = 0, lp = 0;
  voice(at, dur, (t, d) => {
    ph = (ph + f / SR) % 1;
    const env = Math.min(1, t / 0.004) * (t > d - 0.03 ? Math.max(0, (d - t) / 0.03) : 1) * (0.75 + 0.25 * Math.exp(-t * 12));
    lp += lpCoef(180 + 700 * Math.exp(-t * 14)) * (2 * ph - 1 - lp);
    return lp * env + Math.sin(TAU * f * t) * 0.6 * env;
  }, { gain: 0.42 * gain });
}
function pad(at, notes, dur, gain = 1, cutoff = 1100) {
  for (const [k, note] of notes.entries()) {
    const fs = [-0.0028, 0, 0.0031].map((d) => midi(note) * (1 + d));
    const ph = [0.1, 0.4, 0.7];
    let lp = 0;
    voice(at, dur + 1.2, (t) => {
      let x = 0;
      for (let j = 0; j < 3; j++) { ph[j] = (ph[j] + fs[j] / SR) % 1; x += 2 * ph[j] - 1; }
      lp += lpCoef(cutoff) * (x / 3 - lp);
      const env = Math.min(1, t / 0.7) * (t > dur ? Math.exp(-(t - dur) * 4) : 1);
      return lp * env;
    }, { gain: 0.16 * gain, pan: (k - 1) * 0.35, rev: 0.5 });
  }
}
function pluck(at, note, gain = 1, pan = 0) {
  const f = midi(note);
  let ph = 0, lp = 0;
  voice(at, 0.6, (t) => {
    ph = (ph + f / SR) % 1;
    lp += lpCoef(300 + 3200 * Math.exp(-t * 14)) * (2 * ph - 1 - lp);
    return lp * Math.exp(-t * 6);
  }, { gain: 0.14 * gain, pan, rev: 0.45 });
}
function riser(start, end, gain = 1) {
  let lp = 0, ph = 0;
  voice(start, end - start, (t, d) => {
    const p = t / d;
    lp += lpCoef(250 * 32 ** p) * (noise() - lp);
    ph += (TAU * (180 * 4 ** p)) / SR;
    return (lp * 0.9 + Math.sin(ph) * 0.15) * p * p;
  }, { gain: 0.5 * gain, rev: 0.3 });
}
function whoosh(center, gain = 1, dir = 1) {
  const d = 0.42;
  let lp = 0, lo = 0;
  const s0 = Math.round((center - d * 0.6) * SR);
  const len = Math.round(d * SR);
  for (let i = 0; i < len; i++) {
    const n = s0 + i;
    if (n < 0 || n >= N) continue;
    const p = i / len;
    const bell = Math.sin(Math.PI * p) ** 2;
    const x = noise();
    lp += lpCoef(400 + 3800 * bell) * (x - lp);
    lo += lpCoef(220) * (x - lo);
    const y = (lp - lo) * bell * 0.35 * gain;
    const pan = dir * (p * 1.4 - 0.7);
    bus.music[0][n] += y * Math.cos(((pan + 1) * Math.PI) / 4);
    bus.music[1][n] += y * Math.sin(((pan + 1) * Math.PI) / 4);
    send[n] += y * 0.2;
  }
}
function impact(at, gain = 1) {
  let ph = 0, lp = 0;
  voice(at, 3, (t) => {
    ph += (TAU * (30 + 55 * Math.exp(-t * 7))) / SR;
    lp += lpCoef(900 * Math.exp(-t * 5) + 80) * (noise() - lp);
    return Math.sin(ph) * Math.exp(-t * 1.5) + lp * Math.exp(-t * 5) * 0.8;
  }, { gain: 0.85 * gain, rev: 0.55, to: "drums" });
  const s0 = Math.round(at * SR);
  for (let i = 0; i < SR * 0.6; i++) if (s0 + i < N) duck[s0 + i] = Math.max(duck[s0 + i], gain * Math.exp(-i / SR / 0.25));
}
function drone(start, end, peakAt, fadeFrom) {
  let lp = 0;
  voice(start, end - start, (t) => {
    const at = start + t;
    const env = at < peakAt ? ((at - start) / (peakAt - start)) ** 2 : at < fadeFrom ? 1 : Math.max(0, 1 - (at - fadeFrom) / (end - fadeFrom));
    lp += lpCoef(160) * (noise() - lp);
    const lfo = 0.85 + 0.15 * Math.sin(TAU * 0.25 * t);
    return (Math.sin(TAU * 41.2 * t) * 0.7 + Math.sin(TAU * 61.7 * t) * 0.25 + lp * 1.2) * env * lfo;
  }, { gain: 0.5, rev: 0.2 });
}
function bell(at, note, gain = 1) {
  const f = midi(note);
  voice(at, 2.5, (t) => (Math.sin(TAU * f * t) + Math.sin(TAU * f * 2.01 * t) * 0.3 * Math.exp(-t * 3)) * Math.exp(-t * 2.2) * Math.min(1, t / 0.003),
    { gain: 0.09 * gain, rev: 0.6 });
}

// ---------- harmony ----------
const CHORDS = { Am: { root: 33, pad: [57, 60, 64] }, F: { root: 29, pad: [53, 57, 60] }, C: { root: 36, pad: [55, 60, 64] }, G: { root: 31, pad: [55, 59, 62] } };
const PROG = ["Am", "F", "C", "G"];
const BAR = BEAT * 4;
function groove(from, to, { kicks = true, claps = true, hats = 0, bassLine = true, chordOffset = 0 } = {}) {
  for (let b = 0; from + b * BAR < to - 1e-6; b++) {
    const barStart = from + b * BAR;
    const ch = CHORDS[PROG[(b + chordOffset) % 4]];
    pad(barStart, ch.pad, Math.min(BAR, to - barStart));
    for (let i = 0; i < 16; i++) {
      const at = barStart + (i * BEAT) / 4;
      if (at >= to - 1e-6) break;
      if (kicks && i % 4 === 0) kick(at);
      if (claps && (i === 4 || i === 12)) clap(at, 1, 0.1);
      if (hats === 1 && i % 4 === 2) hat(at, 1, 0.3);
      if (hats === 2) hat(at, i % 2 ? 0.55 : 1, i % 4 === 2 ? 0.3 : -0.2);
      if (bassLine && i % 2 === 0) bass(at, ch.root + (i % 8 === 6 ? 12 : 0));
    }
  }
}

const S = T.scenes;

// Scene 1, hook: the drone rises out of silence, a tick lands on the slash, impact on the cut.
drone(0.2, 5.6, 3.6, 4.0); // L-cut: the drone carries under the opening of the problem scene.
tick(T.slashHit, 1400, 1.2);
kick(T.slashHit, 0.35);
riser(2.2, S.hook[1]);
impact(S.problem[0], 1);

// Scene 2, problem: a clock and a detuned pulse; a glitch tick for each scattered tool, a snap when they align.
for (let t = S.problem[0] + BEAT; t < T.snap; t += BEAT) tick(t, 900, 0.45, (t * 2) % 2 ? 0.4 : -0.4);
T.problemHits.forEach((t, i) => { tick(t, 2600, 0.9, i % 2 ? 0.5 : -0.5); hat(t, 0.8, i % 2 ? -0.3 : 0.3); });
voice(S.problem[0] + 0.5, T.snap - S.problem[0] - 0.5, (t) => (Math.sin(TAU * 55 * t) + Math.sin(TAU * 58.3 * t)) * 0.5 * Math.min(1, t / 1.5),
  { gain: 0.16 });
clap(T.snap, 0.9);
tick(T.snap, 3200, 1.2);
riser(T.snap, S.solution[0], 0.8);
for (let t = 8.5; t < S.solution[0]; t += BEAT / 2) bass(t, 33, BEAT / 2 - 0.02, 0.6); // J-cut into the solution.

// Scene 3, solution: impact and the chords resolve; the groove builds, then breaks for the drop.
impact(S.solution[0], 0.7);
groove(S.solution[0], 15, { claps: false, hats: 0 });
for (let t = 12; t < 15; t += BEAT) hat(t + BEAT / 2, 0.9, 0.3);
pad(15, CHORDS.G.pad, 1);
riser(14.5, S.features[0], 1);
for (let i = 0; i < 8; i++) clap(15 + (i * BEAT) / 4, 0.25 + i * 0.1, i % 2 ? 0.2 : -0.2);

// Scene 4, features: full groove; a whoosh on every product cut, double-time hats into the speed ramp.
impact(S.features[0], 0.6);
groove(S.features[0], S.features[1], { hats: 2 });
T.featureCuts.slice(1).forEach((t, i) => whoosh(t, 1, i % 2 ? -1 : 1));
for (let t = 26; t < S.features[1]; t += BEAT / 8) hat(t, 0.5, 0);
riser(25.5, S.features[1], 0.7);

// Scene 5, experience: half-time breakdown with an arpeggio; silence for a beat before the reveal.
impact(S.experience[0], 0.65);
groove(S.experience[0], 33, { kicks: false, claps: false, bassLine: false });
for (let t = S.experience[0]; t < 33; t += BEAT * 2) kick(t, 0.7);
const ARP = [69, 72, 76, 81, 76, 72];
for (let t = 29, i = 0; t < 33.5; t += BEAT / 2, i++) pluck(t, ARP[i % ARP.length], 1, i % 2 ? 0.35 : -0.35);
for (let t = 31; t < 33.5; t += BEAT / 2) hat(t + BEAT / 4, 0.6, 0.25);
T.experienceCuts.slice(1).forEach((t) => whoosh(t, 0.8));
riser(32.2, 33.75, 0.9);

// Scene 6, reveal: the biggest hit, a final A-minor-9 that rings out, two quiet bells for the type.
impact(S.reveal[0], 1.15);
kick(S.reveal[0], 1);
pad(S.reveal[0], [45, 57, 60, 64, 71], 4.6, 1.2, 1500);
bell(T.taglineAt, 81, 1);
bell(T.urlAt, 88, 0.8);

// ---------- mix ----------
// Reverb: four damped combs into two allpasses (a small Freeverb).
const rev = [new Float32Array(N), new Float32Array(N)];
for (const [ch, spread] of [[0, 0], [1, 23]]) {
  const combs = [1557, 1617, 1491, 1422].map((d) => ({ buf: new Float32Array(d + spread), i: 0, lp: 0 }));
  const aps = [556, 441].map((d) => ({ buf: new Float32Array(d + spread), i: 0 }));
  for (let n = 0; n < N; n++) {
    const x = send[n] * 0.12;
    let y = 0;
    for (const c of combs) {
      const out = c.buf[c.i];
      c.lp = out * 0.7 + c.lp * 0.3;
      c.buf[c.i] = x + c.lp * 0.84;
      c.i = (c.i + 1) % c.buf.length;
      y += out;
    }
    for (const a of aps) {
      const b = a.buf[a.i];
      a.buf[a.i] = y + b * 0.5;
      a.i = (a.i + 1) % a.buf.length;
      y = b - y * 0.5;
    }
    rev[ch][n] = y;
  }
}

const out = [new Float32Array(N), new Float32Array(N)];
let peak = 0;
for (let n = 0; n < N; n++) {
  const sidechain = 1 - 0.55 * Math.min(1, duck[n]);
  for (const ch of [0, 1]) {
    const x = bus.drums[ch][n] + bus.music[ch][n] * sidechain + rev[ch][n] * 0.9;
    out[ch][n] = Math.tanh(x * 1.1);
    peak = Math.max(peak, Math.abs(out[ch][n]));
  }
}
const norm = 0.891 / peak; // -1 dBFS
const fadeIn = SR * 0.05;
const fadeOut = SR * 1.2;
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) {
  const g = norm * Math.min(1, n / fadeIn) * Math.min(1, (N - n) / fadeOut);
  for (const ch of [0, 1]) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, out[ch][n] * g)) * 32767), 44 + n * 4 + ch * 2);
}
mkdirSync(path.join(root, "public/audio"), { recursive: true });
writeFileSync(path.join(root, "public/audio/score.wav"), buf);
console.log(`score.wav written: ${T.duration}s, peak normalised from ${peak.toFixed(3)}`);
