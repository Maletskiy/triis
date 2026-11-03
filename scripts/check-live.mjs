// Проверка реально задеплоенного сайта на хостинге reg.ru.
// Запуск: node scripts/check-live.mjs
import puppeteer from "puppeteer-core";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const HOST_IP = "37.140.192.199";
const OUT = ".shots/live";
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  userDataDir: mkdtempSync(join(tmpdir(), "triis-live-")),
  args: [
    "--no-sandbox",
    `--host-resolver-rules=MAP www.triis.ru ${HOST_IP}, MAP triis.ru ${HOST_IP}`,
    "--disable-features=HttpsUpgrades,HttpsFirstBalancedModeAutoEnable",
  ],
  defaultViewport: { width: 1440, height: 1000, deviceScaleFactor: 2 },
});

const errors = [];
const results = [];

async function check(label, url, fn) {
  const page = await browser.newPage();
  page.on("pageerror", (e) => errors.push(`${label}: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`${label}: console ${m.text()}`);
  });
  page.on("requestfailed", (r) =>
    errors.push(`${label}: failed ${r.url()} ${r.failure()?.errorText}`)
  );
  const t0 = Date.now();
  const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector(".app", { timeout: 25000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1200));
  const load = Date.now() - t0;
  const info = await fn(page);
  results.push({ label, url: page.url(), status: resp?.status(), load, ...info });
  await page.close();
  return info;
}

await check("главная desktop", "http://triis.ru/", async (page) => {
  await page.screenshot({ path: `${OUT}/live-desktop.png`, fullPage: true });
  return page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector("h1")?.textContent?.trim(),
    capital: document.querySelector(".summary__value")?.textContent?.trim(),
    fontLoaded: document.fonts.check('16px "SB Sans Interface"'),
    cards: document.querySelectorAll(".param").length,
    logo: !!document.querySelector('.topbar__mark[src="/logo.svg"]'),
  }));
});

await check("политика", "http://triis.ru/privacy", async (page) => {
  await page.screenshot({ path: `${OUT}/live-privacy.png`, fullPage: false });
  return page.evaluate(() => ({
    h1: document.querySelector("h1")?.textContent?.trim(),
    sections: document.querySelectorAll("section, .legal__section").length,
  }));
});

await check("мобильная", "http://triis.ru/", async (page) => {
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.screenshot({ path: `${OUT}/live-mobile.png`, fullPage: true });
  return page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - window.innerWidth,
  }));
});

console.log("=== страницы ===");
for (const r of results) console.log(JSON.stringify(r));
console.log("=== ошибки ===", errors.length ? errors : "нет");
await browser.close();
process.exit(errors.length ? 1 : 0);
