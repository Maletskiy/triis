// Генерация картинки для соцсетей (Open Graph): public/og.png, 1200×630.
// Рендерим HTML в Chrome и уменьшаем вдвое — текст получается резким.
// Запуск: npm run og
import puppeteer from "puppeteer-core";
import { readFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b64 = (path) => readFileSync(path).toString("base64");

const logo = b64("public/logo.svg");
const fontRegular = b64("public/fonts/sbsans-ui-regular.woff2");
const fontSemibold = b64("public/fonts/sbsans-ui-semibold.woff2");

// Неразрывные пробелы — как в интерфейсе, чтобы строки не рвались некрасиво.
const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><style>
  @font-face { font-family: "OG"; font-weight: 400; src: url(data:font/woff2;base64,${fontRegular}) format("woff2"); }
  @font-face { font-family: "OG"; font-weight: 600; src: url(data:font/woff2;base64,${fontSemibold}) format("woff2"); }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; background: #f5f5f5; color: #111;
    font-family: "OG", sans-serif; font-variant-numeric: tabular-nums;
    -webkit-font-smoothing: antialiased; display: flex; flex-direction: column;
    justify-content: space-between; padding: 72px 76px;
  }
  .brand { display: flex; align-items: center; gap: 20px; }
  .brand img { width: 44px; height: 32px; }
  .brand span { font-size: 26px; font-weight: 600; letter-spacing: 0.16em; }
  h1 { font-size: 96px; font-weight: 600; letter-spacing: -0.03em; line-height: 0.98; }
  .sub { margin-top: 26px; font-size: 34px; line-height: 1.28; color: #111111a6; max-width: 780px; }
  .foot { display: flex; align-items: baseline; justify-content: space-between; }
  .rules { font-size: 24px; color: #11111166; }
  .site { font-size: 30px; font-weight: 600; letter-spacing: -0.01em; }
</style></head>
<body>
  <div class="brand"><img src="data:image/svg+xml;base64,${logo}" alt=""><span>ТРИИС</span></div>
  <div>
    <h1>Калькулятор ИИС</h1>
    <p class="sub">Вычеты, налог при закрытии, реальная доходность.<br>Три типа счёта в\u00A0одном расчёте.</p>
  </div>
  <div class="foot"><span class="rules">Правила 2026\u00A0года</span><span class="site">triis.ru</span></div>
</body></html>`;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--font-render-hinting=none"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);

const dir = mkdtempSync(join(tmpdir(), "triis-og-"));
const raw = join(dir, "og@2x.png");
await page.screenshot({ path: raw, type: "png" });
await browser.close();

// 2400×1260 → 1200×630
execFileSync("sips", ["-z", "630", "1200", raw, "--out", "public/og.png"], {
  stdio: "ignore",
});
console.log("готово: public/og.png");
