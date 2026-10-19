const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function makeIcons() {
  const publicDir = path.join(__dirname, '../public');

  const svgBg = (size, radius) => Buffer.from(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${radius}" fill="#0E1015"/>
      <rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="${radius - 2}" stroke="#252936" stroke-width="2"/>
    </svg>
  `);

  // 1. apple-icon.png (180x180)
  const appleLogo = await sharp(path.join(publicDir, 'logos/repsi-r-full.png'))
    .resize({ width: 130, fit: 'contain' })
    .toBuffer();

  const appleMeta = await sharp(appleLogo).metadata();
  const appleTop = Math.round((180 - appleMeta.height) / 2);
  const appleLeft = Math.round((180 - appleMeta.width) / 2);

  await sharp(svgBg(180, 40))
    .composite([{ input: appleLogo, top: appleTop, left: appleLeft }])
    .png()
    .toFile(path.join(publicDir, 'apple-icon.png'));

  // 2. icon.png (512x512)
  const iconLogo = await sharp(path.join(publicDir, 'logos/repsi-r-full.png'))
    .resize({ width: 370, fit: 'contain' })
    .toBuffer();

  const iconMeta = await sharp(iconLogo).metadata();
  const iconTop = Math.round((512 - iconMeta.height) / 2);
  const iconLeft = Math.round((512 - iconMeta.width) / 2);

  await sharp(svgBg(512, 110))
    .composite([{ input: iconLogo, top: iconTop, left: iconLeft }])
    .png()
    .toFile(path.join(publicDir, 'icon.png'));

  console.log('Successfully created apple-icon.png and icon.png');
}

makeIcons().catch(console.error);
