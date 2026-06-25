import puppeteer from 'file:///C:/Users/siewertmo/AppData/Local/Temp/puppeteer-test/node_modules/puppeteer/lib/puppeteer/puppeteer.js';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] ? `-${process.argv[3]}` : '';
const dir = './temporary screenshots';

if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const existing = readdirSync(dir).filter(f => f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.match(/(\d+)/)?.[1] || '0')).filter(Boolean);
const next = nums.length ? Math.max(...nums) + 1 : 1;
const filename = join(dir, `screenshot-${next}${label}.png`);

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });

// Scroll through the full page so IntersectionObserver scroll-reveals fire,
// then return to top before capturing the full-page screenshot.
await page.evaluate(async () => {
  await new Promise((resolve) => {
    let y = 0;
    const step = window.innerHeight * 0.8;
    const timer = setInterval(() => {
      window.scrollBy(0, step);
      y += step;
      if (y >= document.body.scrollHeight) {
        clearInterval(timer);
        // Guarantee every scroll-reveal is shown for the capture.
        document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
        window.scrollTo(0, 0);
        setTimeout(resolve, 500);
      }
    }, 120);
  });
});

await page.screenshot({ path: filename, fullPage: true });
await browser.close();
console.log(`Screenshot saved → ${filename}`);
