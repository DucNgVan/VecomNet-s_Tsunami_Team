import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FPS = 30;
const DURATION = 4.2; // 4.2 seconds
const TOTAL_FRAMES = Math.floor(FPS * DURATION);

console.log(`Rendering Intro 'Nét Bút' Video: ${TOTAL_FRAMES} frames...`);

const browser = await puppeteer.launch({
  executablePath: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
});

const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
const htmlPath = 'file://' + path.resolve(__dirname, 'render_intro_loader.html');
await page.goto(htmlPath);

const outVideo = path.resolve(__dirname, '../public/assets/NET_Intro_NetBut_Loader.mp4');

const ffmpeg = spawn('ffmpeg', [
  '-y',
  '-f', 'image2pipe',
  '-vcodec', 'png',
  '-r', String(FPS),
  '-i', '-',
  '-c:v', 'libx264',
  '-pix_fmt', 'yuv420p',
  '-preset', 'fast',
  '-crf', '18',
  outVideo
]);

ffmpeg.stderr.on('data', (d) => {
  // console.log(d.toString());
});

for (let i = 0; i < TOTAL_FRAMES; i++) {
  const sec = i / FPS;
  await page.evaluate((s) => window.setProgress(s), sec);
  const buf = await page.screenshot({ type: 'png' });
  ffmpeg.stdin.write(buf);
  if (i % 30 === 0 || i === TOTAL_FRAMES - 1) {
    console.log(`Frame ${i}/${TOTAL_FRAMES} (${((i / TOTAL_FRAMES) * 100).toFixed(1)}%) — ${sec.toFixed(2)}s`);
  }
}

ffmpeg.stdin.end();

await new Promise((resolve) => {
  ffmpeg.on('close', resolve);
});

await browser.close();
console.log(`SUCCESS! Standalone Nét Bút Intro Video generated: ${outVideo}`);
