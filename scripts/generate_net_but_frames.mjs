import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.resolve(__dirname, '../demo_captures/net_but_frames');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const FPS = 30;
const DURATION = 7.0; // 7 seconds
const TOTAL_FRAMES = Math.floor(FPS * DURATION);

console.log(`Pre-rendering ${TOTAL_FRAMES} frames of Nét Bút at 1140x776...`);

const browser = await puppeteer.launch({
  executablePath: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1140,776']
});

const page = await browser.newPage();
await page.setViewport({ width: 1140, height: 776 });
const htmlPath = 'file://' + path.resolve(__dirname, 'render_intro_loader.html');
await page.goto(htmlPath);

for (let i = 0; i < TOTAL_FRAMES; i++) {
  const sec = i / FPS;
  await page.evaluate((s) => window.setProgress(s), sec);
  const outPath = path.join(outDir, `frame_${String(i).padStart(4, '0')}.png`);
  await page.screenshot({ path: outPath });
  if (i % 30 === 0 || i === TOTAL_FRAMES - 1) {
    console.log(`Rendered stroke frame ${i}/${TOTAL_FRAMES} (${((i / TOTAL_FRAMES) * 100).toFixed(1)}%)`);
  }
}

await browser.close();
console.log('Finished rendering all Nét Bút frames!');
