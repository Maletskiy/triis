import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const APP_URL = process.env.APP_URL ?? "http://localhost:4173/";
const SHOTS = fileURLToPath(new globalThis.URL("../.shots/", import.meta.url));

mkdirSync(SHOTS, { recursive: true });

let failures = 0;
const fail = (message) => {
  failures += 1;
  console.log(`FAIL ${message}`);
};
const ok = (message) => console.log(`OK   ${message}`);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: [
    "--no-sandbox",
    "--disable-crashpad",
    "--disable-dev-shm-usage",
    "--hide-scrollbars",
    "--force-device-scale-factor=2",
    `--user-data-dir=${SHOTS}profile-run`,
    `--crash-dumps-dir=${SHOTS}crashes`,
  ],
});

async function open(viewport, path = "") {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));
  await page.goto(APP_URL + path, { waitUntil: "networkidle0" });
  await page.waitForSelector(".summary__hero-value");
  await new Promise((r) => setTimeout(r, 500));
  return { page, errors };
}

const metrics = (page) =>
  page.evaluate(() => ({
    innerWidth: window.innerWidth,
    docWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));

/* ---------------- десктоп ---------------- */
{
  const { page, errors } = await open({ width: 1440, height: 900 });
  const m = await metrics(page);
  if (m.docWidth > m.innerWidth + 1) fail(`горизонтальное переполнение: ${m.docWidth} > ${m.innerWidth}`);
  else ok(`нет горизонтального переполнения (${m.docWidth} ≤ ${m.innerWidth})`);

  const brand = await page.$eval(".topbar h1", (el) => el.textContent?.trim() ?? "");
  if (brand !== "Triis") fail(`бренд в шапке: "${brand}"`);
  else ok(`бренд: ${brand}`);

  const params = await page.$$eval(".params .param", (els) => els.length);
  if (params !== 7) fail(`параметров ${params} вместо 7`);
  else ok(`параметры в одном блоке: ${params} контролов`);

  const hero = await page.$eval(".summary__hero-value", (el) => el.textContent?.trim() ?? "");
  if (!hero.includes("₽")) fail(`итог не отрисован: "${hero}"`);
  else ok(`итог отрисован: ${hero}`);

  const thumb = await page.$eval(".tabs .segmented__thumb", (el) => {
    const box = el.getBoundingClientRect();
    return { width: box.width, height: box.height };
  });
  if (thumb.width < 20 || thumb.height < 10) fail(`плашка таба не встала: ${JSON.stringify(thumb)}`);
  else ok(`плашка таба на месте: ${Math.round(thumb.width)}×${Math.round(thumb.height)}`);

  const chart = await page.$eval(".chart__svg", (svg) => ({
    paths: svg.querySelectorAll("path").length,
    height: svg.getBoundingClientRect().height,
    width: svg.getBoundingClientRect().width,
  }));
  if (chart.paths < 4 || chart.width < 100) fail(`график не отрисован: ${JSON.stringify(chart)}`);
  else ok(`график: ${chart.paths} path, ${Math.round(chart.width)}×${Math.round(chart.height)}`);

  const rows = await page.$$eval(".table tbody tr", (trs) => trs.length);
  if (rows !== 10) fail(`в таблице ${rows} строк вместо 10`);
  else ok(`таблица по годам: ${rows} строк`);

  // сегмент типа счёта переключает расчёт
  const before = await page.$eval(".summary__hero-value", (el) => el.textContent);
  await page.evaluate(() => {
    const items = [...document.querySelectorAll(".inputs .segmented__item")];
    items.find((el) => el.textContent?.trim() === "ИИС-2")?.click();
  });
  await new Promise((r) => setTimeout(r, 650));
  const after = await page.$eval(".summary__hero-value", (el) => el.textContent);
  if (before === after) fail("переключение на ИИС-2 не изменило итог");
  else ok(`переключение счёта меняет итог: ${before} → ${after}`);

  // частота реинвестирования и ставка НДФЛ меняют расчёт
  const heroBefore = await page.$eval(".summary__hero-value", (el) => el.textContent);
  await page.evaluate(() => {
    const items = [...document.querySelectorAll(".param--choice .segmented__item")];
    items.find((el) => el.textContent.trim() === "Раз в месяц")?.click();
  });
  await new Promise((r) => setTimeout(r, 700));
  const heroMonthly = await page.$eval(".summary__hero-value", (el) => el.textContent);
  if (heroBefore === heroMonthly) fail("частота реинвестирования не влияет на итог");
  else ok(`частота реинвестирования меняет итог: ${heroBefore} → ${heroMonthly}`);

  await page.evaluate(() => {
    const items = [...document.querySelectorAll(".param--choice .segmented__item")];
    items.find((el) => el.textContent.trim() === "15%")?.click();
  });
  await new Promise((r) => setTimeout(r, 700));
  const rateHint = await page.evaluate(() =>
    [...document.querySelectorAll(".param--choice .param__hint")].map((e) => e.textContent).join(" | "),
  );
  if (!rateHint.includes("вручную")) fail(`ручная ставка не применилась: ${rateHint}`);
  else ok("ручная ставка НДФЛ применяется");

  // год открытия: меняется минимальный срок владения
  const metaText = () => page.$eval(".summary__meta", (el) => el.textContent ?? "");
  const pickAccount = (name) =>
    page.evaluate((n) => {
      const items = [...document.querySelectorAll(".inputs .segmented__item")];
      items.find((el) => el.textContent.trim() === n)?.click();
    }, name);
  const pickYear = (y) =>
    page.evaluate((year) => {
      const items = [...document.querySelectorAll(".inputs__year .segmented__item")];
      items.find((el) => el.textContent.trim() === year)?.click();
    }, y);

  await pickAccount("ИИС-3");
  await new Promise((r) => setTimeout(r, 450));
  await pickYear("2032");
  await new Promise((r) => setTimeout(r, 500));
  if (!(await metaText()).includes("10 лет")) fail("год 2032 не поднял минимальный срок до 10 лет");
  else ok("год открытия 2032 → минимальный срок 10 лет");

  await pickYear("2026");
  await new Promise((r) => setTimeout(r, 500));
  if (!(await metaText()).includes("5 лет")) fail("год 2026 не вернул срок 5 лет");
  else ok("год открытия 2026 → минимальный срок 5 лет");

  // у старых счетов набор годов ограничен
  await pickAccount("ИИС-2");
  await new Promise((r) => setTimeout(r, 450));
  const oldYears = await page.$$eval(".inputs__year .segmented__item", (els) =>
    els.map((el) => el.textContent.trim()),
  );
  if (!oldYears.includes("2021") || oldYears.includes("2028")) {
    fail(`годы для старого счёта: ${oldYears.join(",")}`);
  } else ok(`годы для старого счёта ограничены: ${oldYears.join(", ")}`);

  // таб «Сравнение»
  await page.evaluate(() => {
    const items = [...document.querySelectorAll(".tabs .segmented__item")];
    items.find((el) => el.textContent?.includes("Сравнение"))?.click();
  });
  await page.waitForSelector(".compare .card");
  const cards = await page.$$eval(".compare .card", (els) => els.length);
  if (cards !== 3) fail(`в сравнении ${cards} карточек вместо 3`);
  else ok("сравнение: три карточки счетов");
  await page.screenshot({ path: `${SHOTS}desktop-compare.png`, fullPage: false });

  // таб «Правила»
  await page.evaluate(() => {
    const items = [...document.querySelectorAll(".tabs .segmented__item")];
    items.find((el) => el.textContent?.includes("Правила"))?.click();
  });
  await page.waitForSelector(".rules__block");
  ok("правила отрисованы");

  // назад к параметрам
  await page.evaluate(() => {
    const items = [...document.querySelectorAll(".tabs .segmented__item")];
    items.find((el) => el.textContent?.includes("Параметры"))?.click();
  });
  await page.waitForSelector(".inputs .param__input");

  // URL отражает состояние
  const url = page.url();
  if (!url.includes("c=400000") || !url.includes("a=iis2")) fail(`состояние не в адресе: ${url}`);
  else ok("параметры расчёта в адресе");

  // копирование ссылки
  await browser.defaultBrowserContext().overridePermissions(APP_URL.replace(/\/$/, ""), [
    "clipboard-read",
    "clipboard-write",
  ]);
  await page.evaluate(() => {
    document.querySelector(".actions .btn")?.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  const copyLabel = await page.$eval(".actions .btn", (el) => el.textContent?.trim() ?? "");
  if (!copyLabel.includes("Скопировано")) fail(`кнопка копирования не подтвердила: "${copyLabel}"`);
  else ok(`копирование подтверждается: "${copyLabel}"`);

  await page.screenshot({ path: `${SHOTS}desktop.png`, fullPage: false });

  // плашка табов чёрная, без синего
  const thumbColor = await page.$eval(".tabs .segmented__thumb", (el) => getComputedStyle(el).backgroundColor);
  const activeColor = await page.$eval(".tabs .segmented__item.is-active", (el) => getComputedStyle(el).color);
  if (thumbColor !== "rgb(17, 17, 17)") fail(`плашка табов не чёрная: ${thumbColor}`);
  else ok(`плашка табов чёрная: ${thumbColor}, текст ${activeColor}`);

  // печать: шапка с параметрами, скрытые контролы, развёрнутая таблица
  await page.emulateMediaType("print");
  await new Promise((r) => setTimeout(r, 250));
  const printState = await page.evaluate(() => ({
    head: getComputedStyle(document.querySelector(".print-head")).display,
    inputs: getComputedStyle(document.querySelector(".inputs")).display,
    table: getComputedStyle(document.querySelector(".section__body-wrap")).gridTemplateRows,
  }));
  await page.emulateMediaType("screen");
  if (printState.head !== "flex" || printState.inputs !== "none" || printState.table !== "1fr") {
    fail(`печать: ${JSON.stringify(printState)}`);
  } else ok("печать: шапка с параметрами, таблица развёрнута");

  const gridCheck = await page.evaluate(() => {
    const box = (sel) => document.querySelector(sel)?.getBoundingClientRect();
    const wrap = document.querySelector(".actions");
    const buttons = [...document.querySelectorAll(".actions .btn")];
    const wrapBox = wrap.getBoundingClientRect();
    const primary = box(".actions .btn--primary");
    const others = buttons.filter((b) => !b.classList.contains("btn--primary")).map((b) => b.getBoundingClientRect());
    return {
      overflow: buttons.some((b) => b.getBoundingClientRect().right > wrapBox.right + 1 || b.getBoundingClientRect().left < wrapBox.left - 1),
      primaryFull: Math.abs(primary.width - wrapBox.width) < 2,
      othersTwo: others.length === 2 && Math.abs(others[0].width - others[1].width) < 2,
      sameRow: Math.abs(others[0].top - others[1].top) < 1,
      underPrimary: others[0].top > primary.bottom - 1,
    };
  });
  if (!gridCheck.primaryFull || !gridCheck.othersTwo || !gridCheck.sameRow || !gridCheck.underPrimary) {
    fail(`сетка выгрузок: ${JSON.stringify(gridCheck)}`);
  } else ok("выгрузки: чёрная на всю ширину, PDF и CSV по половине во второй строке");
  if (gridCheck.overflow) fail("кнопки выходят за контейнер выгрузок");

  const pdfButton = await page.evaluate(() =>
    [...document.querySelectorAll(".actions .btn")].some((el) => el.textContent?.includes("Скачать PDF")),
  );
  if (!pdfButton) fail("кнопки «Скачать PDF» нет");
  else ok("кнопка «Скачать PDF» на месте");

  const fontFamily = await page.$eval("body", (el) => getComputedStyle(el).fontFamily);
  if (!fontFamily.includes("SB Sans")) fail(`шрифт не применился: ${fontFamily}`);
  else ok(`шрифт примитивов: ${fontFamily.split(",")[0]}`);

  if (errors.length) fail(`ошибки в консоли: ${errors.slice(0, 3).join(" | ")}`);
  else ok("консоль без ошибок");
  await page.close();
}

/* ---------------- мобильный ---------------- */
{
  const { page, errors } = await open({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const m = await metrics(page);
  if (m.docWidth > m.innerWidth + 1) fail(`мобильное переполнение: ${m.docWidth} > ${m.innerWidth}`);
  else ok(`мобильный: без переполнения (${m.docWidth} ≤ ${m.innerWidth})`);

  const barBefore = await page.$eval(".bar", (el) => el.className);
  if (barBefore.includes("is-visible")) fail("плашка видна до скролла");
  else ok("плашка скрыта в начале страницы");

  const heroBottom = await page.$eval(".layout__summary-mobile", (el) => el.getBoundingClientRect().bottom + window.scrollY);
  await page.evaluate((y) => window.scrollTo(0, y + 220), heroBottom);
  await new Promise((r) => setTimeout(r, 700));
  const barAfter = await page.$eval(".bar", (el) => ({
    className: el.className,
    rect: el.getBoundingClientRect().toJSON(),
    opacity: getComputedStyle(el).opacity,
  }));
  if (!barAfter.className.includes("is-visible")) fail("плашка не выехала при скролле");
  else ok(`плашка выехала при скролле (opacity ${barAfter.opacity})`);

  // шторка «Детали»
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll(".bar .btn")].find((el) =>
      el.textContent?.includes("Детали"),
    );
    btn?.click();
  });
  await page.waitForSelector(".sheet__panel");
  await new Promise((r) => setTimeout(r, 350));
  ok("шторка с деталями открывается");
  await page.screenshot({ path: `${SHOTS}mobile-sheet.png`, fullPage: false });

  await page.evaluate(() => document.querySelector(".sheet__close")?.click());
  await new Promise((r) => setTimeout(r, 400));
  const sheetGone = await page.$(".sheet");
  if (sheetGone) fail("шторка не закрылась");
  else ok("шторка закрывается");

  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: `${SHOTS}mobile.png`, fullPage: false });

  const collapsed = await page.$$eval(".section--collapsible", (els) =>
    els.map((el) => el.classList.contains("is-collapsed")),
  );
  if (!collapsed.includes(true)) fail("секции на мобиле не сворачиваются");
  else ok("секции на мобиле сворачиваемые");

  if (errors.length) fail(`мобильные ошибки в консоли: ${errors.slice(0, 3).join(" | ")}`);
  else ok("мобильная консоль без ошибок");
  await page.close();
}

/* ---------------- очень узкий экран ---------------- */
{
  const { page, errors } = await open({ width: 320, height: 700, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const m = await metrics(page);
  if (m.docWidth > m.innerWidth + 1) fail(`320px: переполнение ${m.docWidth} > ${m.innerWidth}`);
  else ok("320px: без переполнения");

  const clipped = await page.evaluate(() => {
    const problems = [];
    document.querySelectorAll(".summary__hero-value, .stat dd, .btn, .segmented__item, .bar__number").forEach((el) => {
      if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== "visible") {
        problems.push(`${el.className}: ${el.scrollWidth}>${el.clientWidth} (${el.textContent?.trim().slice(0, 24)})`);
      }
    });
    return problems;
  });
  if (clipped.length) fail(`320px: обрезанный текст — ${clipped.slice(0, 3).join(" | ")}`);
  else ok("320px: текст в блоках не обрезается");

  await page.screenshot({ path: `${SHOTS}mobile-320.png`, fullPage: false });
  if (errors.length) fail(`320px консоль: ${errors.slice(0, 2).join(" | ")}`);
  else ok("320px: консоль без ошибок");
  await page.close();
}

await browser.close();
console.log(`\n${failures === 0 ? "Интерфейс прошёл проверки" : `Проблем: ${failures}`}`);
if (failures > 0) throw new Error("UI-проверки не пройдены");
