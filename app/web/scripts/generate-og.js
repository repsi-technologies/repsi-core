const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function createOgImage() {
  const width = 1200;
  const height = 630;

  // Resize white logo to width 480
  const logoBuf = await sharp(path.join(__dirname, '../public/logos/repsi-logo-white.png'))
    .resize({ width: 480 })
    .toBuffer();

  const svgBackground = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Deep carbon background gradient -->
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#12141A"/>
        <stop offset="50%" stop-color="#0A0B0E"/>
        <stop offset="100%" stop-color="#050608"/>
      </linearGradient>

      <!-- Flame orange radial glow aura -->
      <radialGradient id="orangeAura" cx="50%" cy="30%" r="50%">
        <stop offset="0%" stop-color="#E25822" stop-opacity="0.28"/>
        <stop offset="50%" stop-color="#E25822" stop-opacity="0.08"/>
        <stop offset="100%" stop-color="#E25822" stop-opacity="0"/>
      </radialGradient>

      <!-- Tech carbon dot pattern -->
      <pattern id="gridPattern" width="32" height="32" patternUnits="userSpaceOnUse">
        <circle cx="16" cy="16" r="1" fill="#FFFFFF" fill-opacity="0.05"/>
      </pattern>

      <!-- Accent line gradient -->
      <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#E25822" stop-opacity="0"/>
        <stop offset="50%" stop-color="#E25822" stop-opacity="0.75"/>
        <stop offset="100%" stop-color="#E25822" stop-opacity="0"/>
      </linearGradient>
    </defs>

    <!-- Base Background -->
    <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
    <rect width="${width}" height="${height}" fill="url(#gridPattern)"/>
    <rect width="${width}" height="${height}" fill="url(#orangeAura)"/>

    <!-- Subtle framing border -->
    <rect x="24" y="24" width="1152" height="582" rx="20" stroke="#252936" stroke-width="1.5" fill="none" stroke-opacity="0.8"/>

    <!-- Top Badge Pill -->
    <g transform="translate(435, 68)">
      <rect width="330" height="34" rx="17" fill="#E25822" fill-opacity="0.14" stroke="#E25822" stroke-width="1.2"/>
      <circle cx="22" cy="17" r="4" fill="#E25822"/>
      <text x="36" y="22" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="11" fill="#FF7A45" letter-spacing="2.2">GYM MANAGEMENT PLATFORM</text>
    </g>

    <!-- Glowing hairline below logo -->
    <rect x="300" y="285" width="600" height="1.5" fill="url(#lineGrad)"/>

    <!-- Headline -->
    <text x="600" y="348" text-anchor="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="34" fill="#FFFFFF" letter-spacing="-0.02em">
      The Modern Operating System for Gyms
    </text>

    <!-- Subtitle / Value proposition -->
    <text x="600" y="392" text-anchor="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="400" font-size="18" fill="#9BA1AC" letter-spacing="-0.01em">
      Members, attendance, memberships and payments in one place.
    </text>

    <!-- Feature Pills -->
    <g transform="translate(205, 436)">
      <!-- Pill 1 -->
      <rect x="0" y="0" width="140" height="36" rx="18" fill="#14171E" stroke="#262B38" stroke-width="1"/>
      <circle cx="18" cy="18" r="3.5" fill="#E25822"/>
      <text x="30" y="23" font-family="system-ui, sans-serif" font-weight="600" font-size="13" fill="#E1E4EA">Memberships</text>

      <!-- Pill 2 -->
      <rect x="154" y="0" width="134" height="36" rx="18" fill="#14171E" stroke="#262B38" stroke-width="1"/>
      <circle cx="172" cy="18" r="3.5" fill="#E25822"/>
      <text x="184" y="23" font-family="system-ui, sans-serif" font-weight="600" font-size="13" fill="#E1E4EA">Attendance</text>

      <!-- Pill 3 -->
      <rect x="302" y="0" width="170" height="36" rx="18" fill="#14171E" stroke="#262B38" stroke-width="1"/>
      <circle cx="320" cy="18" r="3.5" fill="#E25822"/>
      <text x="332" y="23" font-family="system-ui, sans-serif" font-weight="600" font-size="13" fill="#E1E4EA">Auto Payments</text>

      <!-- Pill 4 -->
      <rect x="486" y="0" width="146" height="36" rx="18" fill="#14171E" stroke="#262B38" stroke-width="1"/>
      <circle cx="504" cy="18" r="3.5" fill="#E25822"/>
      <text x="516" y="23" font-family="system-ui, sans-serif" font-weight="600" font-size="13" fill="#E1E4EA">CRM &amp; Leads</text>

      <!-- Pill 5 -->
      <rect x="646" y="0" width="144" height="36" rx="18" fill="#14171E" stroke="#262B38" stroke-width="1"/>
      <circle cx="664" cy="18" r="3.5" fill="#E25822"/>
      <text x="676" y="23" font-family="system-ui, sans-serif" font-weight="600" font-size="13" fill="#E1E4EA">Mobile Apps</text>
    </g>

    <!-- Bottom Divider Bar -->
    <line x1="60" y1="520" x2="1140" y2="520" stroke="#1A1E27" stroke-width="1"/>
    
    <!-- Domain Tag -->
    <text x="60" y="562" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-weight="700" font-size="16" fill="#E25822" letter-spacing="0.5">repsi.app</text>
    
    <!-- Trust Note -->
    <text x="1140" y="562" text-anchor="end" font-family="system-ui, sans-serif" font-weight="500" font-size="14" fill="#6D7280">Built for Modern Gyms, Studios &amp; Fitness Clubs</text>
  </svg>
  `;

  const ogBuffer = await sharp(Buffer.from(svgBackground))
    .composite([
      {
        input: logoBuf,
        top: 124,
        left: 360,
      }
    ])
    .png({ quality: 95, compressionLevel: 8 })
    .toBuffer();

  // Ensure public/images directory exists
  const publicImagesDir = path.join(__dirname, '../public/images');
  if (!fs.existsSync(publicImagesDir)) {
    fs.mkdirSync(publicImagesDir, { recursive: true });
  }

  // Write to public/images/og-image.png and app/opengraph-image.png
  fs.writeFileSync(path.join(publicImagesDir, 'og-image.png'), ogBuffer);
  fs.writeFileSync(path.join(__dirname, '../app/opengraph-image.png'), ogBuffer);
  console.log('Successfully created OG images! File size:', ogBuffer.length, 'bytes');
}

createOgImage().catch(console.error);
