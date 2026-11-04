# REPSI launch film

A 40-second launch film built in [Remotion](https://www.remotion.dev), composed separately for two formats:

- `out/REPSI_Launch_Landscape_16x9.mp4`: 1920×1080, for YouTube, the website and LinkedIn
- `out/REPSI_Launch_Reels_9x16.mp4`: 1080×1920, for Reels and Shorts, with type and logo inside the safe area

Both are 30 fps H.264 with AAC audio, and they share one storyline, score and timeline (`src/timeline.json`).

| Time | Scene | What's on screen |
| --- | --- | --- |
| 0–4s | Hook | The R lettermark assembles in the dark. Its slash becomes a window onto an athlete and opens to full frame. |
| 4–9s | Problem | The live site's "there's a lot to manage" section, with the camera landing on each pain point on the beat. It punches into the orange REPSI, then a slash wipe floods the frame orange. |
| 9–16s | Solution | "Meet REPSI." on flame orange, then a wipe to the live homepage. The camera travels down to the dashboard and phone and pushes into the dashboard. |
| 16–27s | Features | Eight beats, each a real gym photo, a large product or website view and a two-line headline, on cream, charcoal or flame backgrounds. Transitions vary: match cut, punch cut, slash wipe, push, rise, slide. |
| 27–34s | Experience | One phone holds still while the gym changes around it (cut, whip, cut). A beat of black and silence follows. |
| 34–40s | Reveal | The athlete returns behind the logo. The R lands centred, then slides into the wordmark. Tagline, then repsi.app. |

## Sources (everything on screen is real)

- **Website**: `node capture/capture-site.mjs` captures the public homepage of https://www.repsi.app (no sign-in) at 3x into `public/site/`.
- **Product**: `node capture/capture-live.mjs` opens Chrome at the login page and waits for **you** to sign in; the script never sees a password. It then captures the dashboard pages into `public/screens/` (gitignored). Sign in to a demo workspace if you can: whatever is on screen can end up in a public video. The rects in `src/assets.ts` (`PRODUCT`) are chosen to leave out member names, phone numbers, emails and payment IDs. Captures that couldn't be cropped clear of them were deleted. Any product view that isn't captured falls back to the matching region of the website.
  - `capture/start-stack.sh` + `capture/capture.mjs` do the same against a local scratch database seeded with the demo gym, where the API's Python is allowed to run.
- **Photography**: REPSI's own gym photos from `app/web/public/images` and `app/mobile/assets/images/goals`, copied to `public/photos/`. The 900×560 goal photos are the weakest link at 1080p; higher-resolution originals will sharpen scenes 4 and 5.
- **Logo**: the official files from `app/web/public/logos`, never redrawn. The lettermark layers line up with the wordmark's R to the pixel.

## Make it

```bash
npm run audio
```
```bash
npm run render
```

`npm run audio` synthesises `public/audio/score.wav` (120 BPM, cut to the timeline). `npm run studio` opens the timeline,
`node scripts/stills.mjs LaunchVertical 300 600` renders review frames, and `node scripts/sheet.mjs` tiles them into a contact sheet.

Rendering uses Playwright's headless Chromium when it's installed (see `remotion.config.ts`). Set `REMOTION_BROWSER` to
use another one.
