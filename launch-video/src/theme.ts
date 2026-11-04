import { loadFont } from "@remotion/google-fonts/IBMPlexSans";
import { Easing, interpolate } from "remotion";
import timeline from "./timeline.json";

// The product's own typeface (app/web/app/layout.tsx) and the tokens from app/web/DESIGN.md and the live site.
export const { fontFamily } = loadFont("normal", { weights: ["300", "400", "500", "600", "700"], subsets: ["latin"] });

export const C = {
  ink: "#0B0C0E", // film black: one step below the product's dark background, so screens read as lit objects
  bg: "#17191C",
  surface: "#24272B",
  raised: "#2E3237",
  line: "#3A3F45",
  text: "#F7F7F5",
  muted: "#A6A8AC",
  faint: "#70747A",
  flame: "#E25822",
  flameLight: "#EB6D3A",
  flameDeep: "#C94715",
  cream: "#F8F6F2", // the website's page colour
  paper: "#FFFFFF",
  charcoal: "#17191C",
};

export const T = timeline;
export const sec = (s: number) => Math.round(s * T.fps);

export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
};

/** interpolate() with clamping on both ends, which is what every move in the film wants. */
export function tween(frame: number, input: number[], output: number[], easing: (t: number) => number = ease.out) {
  return interpolate(frame, input, output, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
}
