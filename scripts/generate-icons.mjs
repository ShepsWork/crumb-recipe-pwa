import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const srcSvgPath = path.join(publicDir, 'icon.svg');

async function ensureExists(p) {
  try {
    await fs.access(p);
  } catch {
    throw new Error(`Missing required file: ${p}`);
  }
}

async function renderPng({ outPath, size }) {
  const svg = await fs.readFile(srcSvgPath);
  await sharp(svg, { density: 256 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

async function run() {
  await ensureExists(srcSvgPath);

  const outputs = [
    // PWA manifest icons
    { file: 'pwa-192x192.png', size: 192 },
    { file: 'pwa-512x512.png', size: 512 },

    // Apple touch icons
    { file: 'apple-touch-icon.png', size: 180 },
    { file: 'apple-touch-icon-152x152.png', size: 152 },
    { file: 'apple-touch-icon-167x167.png', size: 167 },
    { file: 'apple-touch-icon-180x180.png', size: 180 },
  ];

  for (const o of outputs) {
    const outPath = path.join(publicDir, o.file);
    // eslint-disable-next-line no-console
    console.log(`Generating ${o.file} (${o.size}x${o.size})`);
    await renderPng({ outPath, size: o.size });
  }

  // eslint-disable-next-line no-console
  console.log('Done.');
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
