import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const target = resolve("desktop-dist/index.html");
const origin = (process.env.REPSI_DESKTOP_URL || "https://repsi.app").replace(/\/+$/, "");
// The desktop app is the workspace, not the marketing site: open on sign-in like the mobile app.
// Signed-in users are sent on from /login to their dashboard.
const destination = `${origin}/login`;

await mkdir(dirname(target), { recursive: true });
await copyFile(resolve("src-tauri/icons/128x128@2x.png"), resolve("desktop-dist/icon.png"));
await writeFile(
  target,
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>REPSI</title>
    <style>
      html, body { height: 100%; margin: 0; }
      body {
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px;
        background: #F7F9F8; color: #17191C; user-select: none; cursor: default;
        font: 14px/1.4 "Segoe UI", system-ui, -apple-system, sans-serif;
      }
      img { width: 96px; height: 96px; border-radius: 22px; }
      .spinner {
        width: 22px; height: 22px; border-radius: 50%;
        border: 2.5px solid rgba(226, 88, 34, 0.2); border-top-color: #E25822;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      #offline { display: none; text-align: center; }
      #offline p { margin: 0 0 12px; color: #6B6F76; }
      button {
        border: 0; border-radius: 8px; padding: 9px 18px; background: #E25822; color: #fff;
        font: inherit; font-weight: 600; cursor: pointer;
      }
      body.offline .spinner { display: none; }
      body.offline #offline { display: block; }
    </style>
  </head>
  <body>
    <img src="icon.png" alt="REPSI" />
    <div class="spinner" role="status" aria-label="Opening REPSI"></div>
    <div id="offline">
      <p>You're offline. Connect to the internet to open REPSI.</p>
      <button type="button" id="retry">Try again</button>
    </div>
    <script>
      const destination = ${JSON.stringify(destination)};
      function open() {
        if (navigator.onLine) {
          document.body.classList.remove("offline");
          window.location.replace(destination);
        } else {
          document.body.classList.add("offline");
        }
      }
      document.getElementById("retry").addEventListener("click", open);
      window.addEventListener("online", open);
      open();
    </script>
  </body>
</html>
`,
);

console.log(`Prepared desktop launcher for ${destination}`);
