/**
 * 스토어 스크린샷 생성 — 636×1048 (318×524 @2x).
 * 실제 앱 화면 캡처 + 상단 카피 오버레이.
 * 사용법: npm run vite:build && node scripts/store-shots.mjs
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const PORT = 4740;
const BASE = `http://127.0.0.1:${PORT}`;
mkdirSync('store-assets', { recursive: true });
const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], { shell: true, stdio: 'ignore' });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const SHOTS = [
  { file: 'shot1.png', tab: null, copy: '일어날 시각만 고르면\n취침 시각을 역산해요' },
  { file: 'shot2.png', tab: '지금 잘래', copy: '지금 자면 언제 깨야\n개운한지 바로 계산' },
  { file: 'shot3.png', tab: '수면 상식', copy: '90분 사이클,\n과학적인 수면 상식까지' },
];

let browser;
try {
  let up = false;
  for (let i = 0; i < 40 && !up; i++) { try { up = (await fetch(BASE)).ok; } catch { await wait(250); } }
  if (!up) throw new Error('preview server did not start');
  browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  for (const { file, tab, copy } of SHOTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: 318, height: 524, deviceScaleFactor: 2 });
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('sleepcycle.wakeTime', JSON.stringify('07:00'));
    });
    await page.goto(BASE, { waitUntil: 'networkidle0' });
    if (tab) {
      await page.evaluate((n) => {
        [...document.querySelectorAll('.tab')].find((t) => t.innerText.includes(n))?.click();
      }, tab);
    }
    // 상단 카피 오버레이
    await page.evaluate((c) => {
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99;background:#1E3A8A;color:#fff;font-weight:800;font-size:19px;line-height:1.35;padding:18px 20px;white-space:pre-line;word-break:keep-all;font-family:inherit;';
      el.textContent = c;
      document.body.prepend(el);
      document.querySelector('.app').style.paddingTop = '96px';
    }, copy);
    await wait(350);
    await page.screenshot({ path: `store-assets/${file}` });
    await page.close();
    console.log(`captured store-assets/${file}`);
  }
} finally {
  await browser?.close();
  server.kill();
  spawn('taskkill', ['/F', '/T', '/PID', String(server.pid)], { shell: true, stdio: 'ignore' });
}
