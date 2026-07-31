import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer-core';
const PORT = 4739;
const BASE = `http://127.0.0.1:${PORT}`;
const ALLOWED = [/ReactNativeWebView is not available/, /Failed to load resource/];
let passed = 0;
const ok = (c, l) => { if (!c) throw new Error('FAIL: ' + l); passed++; console.log('  ok - ' + l); };
const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], { shell: true, stdio: 'ignore' });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const setTime = (page, v) => page.evaluate((val) => {
  const el = document.querySelector('.time-input');
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, val);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}, v);
const clickTab = (page, name) => page.evaluate((n) => {
  [...document.querySelectorAll('.tab')].find((t) => t.innerText.includes(n))?.click();
}, name);
let browser;
try {
  let up = false;
  for (let i = 0; i < 40 && !up; i++) { try { up = (await fetch(BASE)).ok; } catch { await wait(250); } }
  ok(up, 'preview 기동');
  browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const errs = [];
  const hook = (p) => {
    p.on('console', (m) => { if (m.type() === 'error' && !ALLOWED.some((re) => re.test(m.text()))) errs.push(m.text()); });
    p.on('pageerror', (e) => { if (!ALLOWED.some((re) => re.test(e.message))) errs.push(e.message); });
  };

  // ── 손상 localStorage 내성: 쓰레기 JSON을 주입해도 크래시 없이 기본값으로 복구 (별도 페이지)
  const dirty = await browser.newPage();
  hook(dirty);
  await dirty.setViewport({ width: 390, height: 844 });
  await dirty.evaluateOnNewDocument(() => {
    localStorage.setItem('sleepcycle.wakeTime', '{broken json!!');
  });
  await dirty.goto(BASE, { waitUntil: 'networkidle0' });
  const dt = await dirty.evaluate(() => document.body.innerText);
  ok(dt.includes('21:46') && dt.includes('23:16') && dt.includes('00:46') && dt.includes('02:16'), '손상 스토리지 → 기본 07:00 역산 4개 (자정 넘김 포함)');
  await dirty.evaluate(() => localStorage.clear());
  await dirty.close();

  // ── 본 플로우 (깨끗한 페이지)
  const page = await browser.newPage();
  hook(page);
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  const text = () => page.evaluate(() => document.body.innerText);
  let t = await text();
  ok(t.includes('꿀잠 사이클'), '홈 타이틀');

  // ── 기상 시각 변경: 06:30 → 6사이클 취침 21:16
  await setTime(page, '06:30'); await wait(150);
  t = await text();
  ok(t.includes('21:16') && t.includes('22:46'), '06:30 기상 → 21:16 / 22:46');

  // ── 저장 후 리로드 영속성
  await page.evaluate(() => { [...document.querySelectorAll('button')].find((b) => b.innerText.includes('저장'))?.click(); });
  await wait(100);
  ok((await text()).includes('저장됨'), '저장 버튼 → 저장됨 표시');
  await page.reload({ waitUntil: 'networkidle0' });
  t = await text();
  ok(t.includes('21:16'), '리로드 후 저장된 06:30 유지');

  // ── 지금 잘래 / 낮잠 / 수면 상식 탭
  await clickTab(page, '지금 잘래'); await wait(150);
  t = await text();
  ok(t.includes('사이클') && t.includes('알람'), '지금 잘래 탭 렌더');
  await clickTab(page, '낮잠'); await wait(150);
  t = await text();
  ok(t.includes('파워냅') && t.includes('풀사이클'), '낮잠 탭 렌더');
  await clickTab(page, '수면 상식'); await wait(150);
  t = await text();
  ok(t.includes('90분 사이클') && t.includes('의학적 조언이 아니에요'), '수면 상식 5카드 + 면책 문구');

  // ── 금지 문자열 전 화면 스캔
  for (const name of ['일어날 시각', '지금 잘래', '낮잠', '수면 상식']) {
    await clickTab(page, name); await wait(120);
    const tt = await text();
    for (const bad of ['NaN', 'undefined', 'Infinity', '[object']) ok(!tt.includes(bad), `${name}: 노출 없음 ${bad}`);
  }
  ok(errs.length === 0, '콘솔 에러 0건' + (errs.length ? ' — ' + errs[0] : ''));
  console.log(`\nE2E SMOKE PASS — ${passed} assertions`);
} finally { await browser?.close(); server.kill(); spawn('taskkill', ['/F', '/T', '/PID', String(server.pid)], { shell: true, stdio: 'ignore' }); }
