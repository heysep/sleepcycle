/** scripts/icon.html → assets/icon-600.png (정확히 600×600, 각진 정사각형) */
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

mkdirSync('assets', { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 600, height: 600, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(resolve('scripts/icon.html')).href);
await page.screenshot({ path: 'assets/icon-600.png' });
await browser.close();
console.log('icon done: assets/icon-600.png');
