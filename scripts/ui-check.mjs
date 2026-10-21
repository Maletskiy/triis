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
  if (params !== 6) fail(`параметров ${params} вместо 6`);
  else ok(`параметры в одном блоке: ${params} контролов`);

  const heroValue = () =>
    page.$eval(".layout__summary-desktop .roll", (el) => el.getAttribute("aria-label"));

  const hero = await heroValue();
  if (!hero.includes("₽")) fail(`итог не отрисован: "${hero}"`);
  else ok(`итог отрисован: ${hero}`);

  const thumb = await page.$eval(".tabs .segmented__thumb", (el) => {
    const box = el.getBoundingClientRect();
    return { width: box.width, height: box.height };
  });
  if (thumb.width < 20 || thumb.height < 10) fail(`плашка таба не встала: ${JSON.stringify(thumb)}`);
  else ok(`плашка таба на месте: ${Math.round(thumb.width)}×${Math.round(thumb.height)}`);

  // числа прокручиваются, а не подменяются
  const rolling = await page.evaluate(async () => {
    const scope = ".layout__summary-desktop .summary__hero-value";
    const host = document.querySelector(scope);
    const strips = () => [...host.querySelectorAll(".roll__strip")];
    const transition = getComputedStyle(strips()[0]).transitionProperty;
    const before = strips().map((el) => getComputedStyle(el).transform);
    [...document.querySelectorAll(".inputs .segmented__item")].find((e) => e.textContent.trim() === "Тип Б")?.click();
    await new Promise((r) => setTimeout(r, 120));
    const during = strips().map((el) => getComputedStyle(el).transform);
    await new Promise((r) => setTimeout(r, 700));
    const settled = strips().map((el) => getComputedStyle(el).transform);
    // возвращаем исходный счёт, чтобы не ломать последующие проверки
    [...document.querySelectorAll(".inputs .segmented__item")].find((e) => e.textContent.trim() === "ИИС-3")?.click();
    await new Promise((r) => setTimeout(r, 650));
    return {
      digits: strips().length,
      transition,
      moved:
        during.some((value, index) => value !== before[index]) ||
        settled.some((value, index) => value !== before[index]),
      aria: host.querySelector(".roll")?.getAttribute("aria-label"),
    };
  });
  if (rolling.transition !== "transform" || !rolling.moved) {
    fail(`числа не прокручиваются: ${JSON.stringify(rolling)}`);
  } else ok(`числа прокручиваются одометром: ${rolling.digits} цифр, aria «${rolling.aria}»`);

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
  const before = await heroValue();
  await page.evaluate(() => {
    const items = [...document.querySelectorAll(".inputs .segmented__item")];
    items.find((el) => el.textContent?.trim() === "Тип Б")?.click();
  });
  await new Promise((r) => setTimeout(r, 650));
  const after = await heroValue();
  if (before === after) fail("переключение на ИИС-2 не изменило итог");
  else ok(`переключение счёта меняет итог: ${before} → ${after}`);

  const freqCols = await page.$eval(
    ".param--choice--two .segmented",
    (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
  );
  if (freqCols !== 2) fail(`частота реинвестирования в ${freqCols} колонки вместо 2`);
  else ok("частота реинвестирования: две колонки");

  // слайдер-вейк: столбики вместо бегунка, драг и клавиатура
  const wakeMeta = await page.evaluate(() => {
    const track = document.querySelector(".wks");
    return {
      exists: !!track,
      bars: track ? track.querySelectorAll(".wks__bar").length : 0,
      role: track?.getAttribute("role"),
      native: !!document.querySelector('input[type="range"]'),
    };
  });
  if (!wakeMeta.exists || wakeMeta.bars !== 36 || wakeMeta.role !== "slider" || wakeMeta.native) {
    fail(`слайдер-вейк не заменил прежний: ${JSON.stringify(wakeMeta)}`);
  } else ok(`слайдер-вейк: ${wakeMeta.bars} столбиков, role=slider`);

  const wakeBox = await page.$eval(".wks", (el) => {
    const rect = el.getBoundingClientRect();
    return { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
  });
  const valueBefore = await page.$eval(".wks", (el) => el.getAttribute("aria-valuenow"));
  await page.mouse.move(wakeBox.x + wakeBox.w * 0.2, wakeBox.y + wakeBox.h / 2);
  await page.mouse.down();
  await page.mouse.move(wakeBox.x + wakeBox.w * 0.55, wakeBox.y + wakeBox.h / 2, { steps: 3 });
  await page.mouse.move(wakeBox.x + wakeBox.w * 0.9, wakeBox.y + wakeBox.h / 2, { steps: 3 });
  const wakeDuring = await page.$$eval(".wks__bar", (els) =>
    els.filter((el) => {
      const match = el.style.transform.match(/scaleY\(([\d.]+)\)/);
      return match ? Number(match[1]) > 1.1 : false;
    }).length,
  );
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 900));
  const wakeAfter = await page.$$eval(".wks__bar", (els) =>
    els.filter((el) => {
      const match = el.style.transform.match(/scaleY\(([\d.]+)\)/);
      return match ? Number(match[1]) > 1.05 : false;
    }).length,
  );
  const valueAfter = await page.$eval(".wks", (el) => el.getAttribute("aria-valuenow"));
  if (wakeDuring < 5) fail(`при драге не вскипело столбиков: ${wakeDuring}`);
  else ok(`при драге вскипело ${wakeDuring} столбиков, после затухания осталось ${wakeAfter}`);
  if (valueBefore === valueAfter) fail("драг по слайдеру не изменил значение");
  else ok(`драг меняет значение: ${valueBefore} → ${valueAfter}`);

  await page.focus(".wks");
  await page.keyboard.press("ArrowRight");
  await new Promise((r) => setTimeout(r, 250));
  const valueKey = await page.$eval(".wks", (el) => el.getAttribute("aria-valuenow"));
  if (valueKey === valueAfter) fail("клавиатура не меняет значение слайдера");
  else ok(`клавиатура двигает слайдер: ${valueKey}`);

  // частота реинвестирования и ставка НДФЛ меняют расчёт
  const heroBefore = await heroValue();
  await page.evaluate(() => {
    const items = [...document.querySelectorAll(".param--choice .segmented__item")];
    items.find((el) => el.textContent.trim() === "Раз в месяц")?.click();
  });
  await new Promise((r) => setTimeout(r, 700));
  const heroMonthly = await heroValue();
  if (heroBefore === heroMonthly) fail("частота реинвестирования не влияет на итог");
  else ok(`частота реинвестирования меняет итог: ${heroBefore} → ${heroMonthly}`);

  // тогл живёт в карточке дохода и текст тянется на всю ширину
  const togglePlacement = await page.evaluate(() => {
    const card = [...document.querySelectorAll(".params .param")].find((el) =>
      el.textContent?.includes("Официальный доход в месяц"),
    );
    const toggle = card?.querySelector(".toggle");
    const text = toggle?.querySelector(".toggle__text");
    return {
      inside: !!toggle,
      textWidth: text ? Math.round(text.getBoundingClientRect().width) : 0,
      cardWidth: card ? Math.round(card.getBoundingClientRect().width) : 0,
    };
  });
  if (!togglePlacement.inside) fail("тогл ставки не внутри карточки дохода");
  else if (togglePlacement.textWidth < togglePlacement.cardWidth * 0.6) {
    fail(`текст тогла не на всю ширину: ${togglePlacement.textWidth} из ${togglePlacement.cardWidth}`);
  } else {
    ok(`тогл ставки в карточке дохода, текст ${togglePlacement.textWidth} из ${togglePlacement.cardWidth} px`);
  }

  // ставка НДФЛ включается тоглом
  await page.evaluate(() => {
    const toggle = [...document.querySelectorAll(".toggle")].find((el) =>
      el.textContent?.includes("Задать ставку НДФЛ вручную"),
    );
    toggle?.querySelector(".squish")?.click();
  });
  await new Promise((r) => setTimeout(r, 500));
  const rateShown = await page.evaluate(() =>
    [...document.querySelectorAll(".param--choice .segmented__item")].some(
      (el) => el.textContent.trim() === "15%",
    ),
  );
  if (!rateShown) fail("тогл ставки НДФЛ не показал выбор ставки");
  else ok("тогл ставки НДФЛ показывает выбор ставки");

  await page.evaluate(() => {
    [...document.querySelectorAll(".param--choice .segmented__item")]
      .find((el) => el.textContent.trim() === "15%")
      ?.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  const rateApplied = await page.evaluate(() =>
    [...document.querySelectorAll(".param__hint")].map((e) => e.textContent).join(" | "),
  );
  if (!rateApplied.includes("15%") || !rateApplied.includes("вручную")) {
    fail(`ручная ставка не применилась: ${rateApplied}`);
  } else ok("ручная ставка НДФЛ применяется");

  // разная сумма по годам
  const heroUniform = await heroValue();
  await page.evaluate(() => {
    [...document.querySelectorAll(".param--wide .segmented__item")]
      .find((el) => el.textContent.trim() === "Разные суммы по годам")
      ?.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  const tabGap = await page.evaluate(() => {
    const block = document.querySelector(".param--spaced");
    const seg = block.querySelector(".segmented");
    const plan = block.querySelector(".plan");
    return {
      gap: Math.round(plan.getBoundingClientRect().top - seg.getBoundingClientRect().bottom),
      margin: getComputedStyle(seg).marginBottom,
    };
  });
  if (tabGap.gap < 12) fail(`мало воздуха между табами и планом: ${tabGap.gap} px`);
  else ok(`между табами режима и планом ${tabGap.gap} px`);

  const planState = await page.evaluate(() => {
    const plan = document.querySelector(".plan");
    const rows = [...document.querySelectorAll(".plan__row")];
    return {
      rows: rows.length,
      scroll: plan.scrollHeight > plan.clientHeight + 1,
      overflow: getComputedStyle(plan).overflowY,
      rowAnim: getComputedStyle(rows[0]).animationName,
      delay5: getComputedStyle(rows[5]).animationDelay,
    };
  });
  if (planState.scroll || planState.overflow === "auto" || planState.overflow === "scroll") {
    fail(`в плане внутренний скролл: ${JSON.stringify(planState)}`);
  } else ok(`план без внутреннего скролла: ${planState.rows} строк`);

  if (planState.rowAnim !== "appear" || planState.delay5 === "0s") {
    fail(`строки плана не появляются лесенкой: ${JSON.stringify(planState)}`);
  } else ok(`строки плана появляются лесенкой (задержка 6-й — ${planState.delay5})`);

  const planRows = await page.$$eval(".plan__row", (els) => els.length);
  if (planRows !== 10) fail(`в плане ${planRows} строк вместо 10`);
  else ok(`план по годам: ${planRows} строк`);

  await page.evaluate(() => {
    const input = document.querySelector(".plan__input");
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(input, "1000000");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 700));
  const heroCustom = await heroValue();
  if (heroUniform === heroCustom) fail("своя сумма по годам не повлияла на итог");
  else ok(`своя сумма по годам меняет итог: ${heroUniform} → ${heroCustom}`);

  // дата открытия: календарь выбирает день и меняет минимальный срок
  await page.evaluate(() => {
    const items = [...document.querySelectorAll(".inputs .segmented__item")];
    items.find((el) => el.textContent.trim() === "ИИС-3")?.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  await page.click(".datepicker__field");
  await page.waitForSelector(".calendar");
  ok("календарь открывается");

  const calendarState = await page.evaluate(() => {
    const cal = document.querySelector(".calendar");
    const rect = cal.getBoundingClientRect();
    const clipped = [];
    let el = cal.parentElement;
    while (el && el !== document.body) {
      const cs = getComputedStyle(el);
      if (cs.overflow !== "visible" || cs.overflowY !== "visible") clipped.push(el.className || el.tagName);
      el = el.parentElement;
    }
    const probe = document.elementFromPoint(rect.left + rect.width / 2, rect.bottom - 12);
    return {
      height: Math.round(rect.height),
      inViewport: rect.top >= 0 && rect.bottom <= window.innerHeight + 1,
      clipped,
      topmost: !!probe && !!probe.closest(".calendar"),
      z: getComputedStyle(cal).zIndex,
    };
  });
  if (
    calendarState.height < 300 ||
    calendarState.clipped.length ||
    !calendarState.inViewport ||
    !calendarState.topmost ||
    Number(calendarState.z) < 70
  ) {
    fail(`календарь не виден или перекрыт: ${JSON.stringify(calendarState)}`);
  } else ok(`календарь целиком в окне и сверху (z=${calendarState.z}, ${calendarState.height} px)`);

  const calendarDays = await page.$$eval(".calendar__day", (els) => els.length);
  if (calendarDays < 28) fail(`в календаре ${calendarDays} дней`);
  else ok(`в календаре ${calendarDays} дней`);

  // навигация: месяцы и годы
  await page.click(".calendar__title");
  await new Promise((r) => setTimeout(r, 250));
  const monthsCount = await page.$$eval(".calendar__months .calendar__cell", (els) => els.length);
  if (monthsCount !== 12) fail(`в выборе месяцев ${monthsCount} ячеек`);
  else ok("выбор месяца: 12 ячеек");

  await page.click(".calendar__title");
  await new Promise((r) => setTimeout(r, 250));
  const yearsCount = await page.$$eval(".calendar__years .calendar__cell", (els) => els.length);
  if (yearsCount < 15) fail(`в выборе годов ${yearsCount} ячеек`);
  else ok(`выбор года: ${yearsCount} лет`);

  await page.evaluate(() => {
    [...document.querySelectorAll(".calendar__years .calendar__cell")]
      .find((el) => el.textContent?.trim() === "2031")
      ?.click();
  });
  await new Promise((r) => setTimeout(r, 250));
  await page.evaluate(() => {
    [...document.querySelectorAll(".calendar__months .calendar__cell")]
      .find((el) => el.textContent?.trim() === "Май")
      ?.click();
  });
  await new Promise((r) => setTimeout(r, 250));

  await page.evaluate(() => {
    [...document.querySelectorAll(".calendar__day")].find((el) => el.textContent.trim() === "1")?.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  const pickedLabel = await page.$eval(".datepicker__value", (el) => el.textContent ?? "");
  if (!pickedLabel.includes("мая 2031")) fail(`выбор года и месяца не применился: ${pickedLabel}`);
  else ok(`выбор через год и месяц: ${pickedLabel}`);

  if (await page.$(".calendar")) fail("календарь не закрылся после выбора");
  else ok("календарь закрывается после выбора дня");

  // год из даты управляет минимальным сроком
  await page.goto(APP_URL + "?od=2032-05-01", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 500));
  const metaLong = await page.$eval(".summary__meta", (el) => el.textContent ?? "");
  if (!metaLong.includes("10 лет")) fail(`дата 2032 не подняла срок: ${metaLong}`);
  else ok("дата 2032 → минимальный срок 10 лет");

  await page.goto(APP_URL + "?od=2026-05-01", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 500));
  const metaShort = await page.$eval(".summary__meta", (el) => el.textContent ?? "");
  if (!metaShort.includes("5 лет")) fail(`дата 2026 не дала срок 5 лет: ${metaShort}`);
  else ok("дата 2026 → минимальный срок 5 лет");

  // у старого счёта год подтягивается к 2023
  await page.evaluate(() => {
    const items = [...document.querySelectorAll(".inputs .segmented__item")];
    items.find((el) => el.textContent.trim() === "Тип А")?.click();
  });
  await new Promise((r) => setTimeout(r, 500));
  const dateLabel = await page.$eval(".datepicker__value", (el) => el.textContent ?? "");
  if (!dateLabel.includes("2023")) fail(`старый счёт не подтянул год: ${dateLabel}`);
  else ok(`старый счёт: дата ${dateLabel}`);

  // плавная смена высоты: и таб, и секции
  const sectionHeight = await page.evaluate(() => {
    const el = document.querySelector(".inputs .section .auto-height");
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { transition: cs.transitionProperty, duration: cs.transitionDuration };
  });
  if (!sectionHeight || !sectionHeight.transition.includes("height")) {
    fail(`секции не анимируют высоту: ${JSON.stringify(sectionHeight)}`);
  } else ok(`секции анимируют высоту (${sectionHeight.duration})`);

  const heightsDuringSwitch = await page.evaluate(async () => {
    const host = document.querySelector(".inputs > .section:last-child .auto-height");
    const items = [...document.querySelectorAll(".param--wide .segmented__item")];
    const target = items.find((el) => el.textContent.trim() === "Разные суммы по годам");
    const values = [];
    target?.click();
    for (let i = 0; i < 8; i += 1) {
      values.push(Math.round(host.getBoundingClientRect().height));
      await new Promise((r) => setTimeout(r, 40));
    }
    return values;
  });
  const distinct = new Set(heightsDuringSwitch).size;
  if (distinct < 2) fail(`высота секции не менялась плавно: ${heightsDuringSwitch.join(",")}`);
  else ok(`высота секции меняется плавно: ${heightsDuringSwitch.join(" → ")}`);

  // таб «Сравнение»
  await page.evaluate(() => {
    const items = [...document.querySelectorAll(".tabs .segmented__item")];
    items.find((el) => el.textContent?.includes("Сравнение"))?.click();
  });
  await new Promise((r) => setTimeout(r, 250));
  const tabAnim = await page.evaluate(
    () => getComputedStyle(document.querySelector(".auto-height .appear")).animationName,
  );
  if (tabAnim !== "appear") fail(`контент таба не появляется плавно: ${tabAnim}`);
  else ok("контент таба появляется плавно");
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
  if (!url.includes("c=400000") || !url.includes("od=") || !url.includes("a=iis")) fail(`состояние не в адресе: ${url}`);
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

  // плашка табов серая, текст чёрный
  const thumbColor = await page.$eval(".tabs .segmented__thumb", (el) => getComputedStyle(el).backgroundColor);
  const activeColor = await page.$eval(".tabs .segmented__item.is-active", (el) => getComputedStyle(el).color);
  if (!thumbColor.startsWith("rgba(17, 17, 17")) fail(`плашка табов не серая: ${thumbColor}`);
  else ok(`плашка табов серая: ${thumbColor}, текст ${activeColor}`);

  const btnHeight = await page.$eval(".actions .btn", (el) => el.getBoundingClientRect().height);
  const resetHeight = await page.$eval(".topbar__actions .btn", (el) => el.getBoundingClientRect().height);
  if (Math.round(btnHeight) !== 56) fail(`высота кнопки ${Math.round(btnHeight)}, ожидалась 56`);
  else ok(`высота кнопок 56 px, «Сбросить» — ${Math.round(resetHeight)} px`);

  // лайк в подвале: сердце, кольцо, конфетти и счётчик
  await page.evaluate(() => localStorage.setItem("triis-like", "0"));
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForSelector(".like__btn");
  const likeStart = await page.evaluate(() => ({
    pressed: document.querySelector(".like__btn").getAttribute("aria-pressed"),
    count: document.querySelector(".like__count .roll")?.getAttribute("aria-label"),
    particles: document.querySelectorAll(".like__particle").length,
    hint: document.querySelector(".like__hint")?.textContent,
  }));
  if (likeStart.pressed !== "false" || likeStart.count !== "0" || likeStart.particles !== 8) {
    fail(`лайк в исходном виде неверный: ${JSON.stringify(likeStart)}`);
  } else ok(`лайк на месте: ${likeStart.particles} частиц, подпись «${likeStart.hint}»`);

  await page.click(".like__btn");
  await new Promise((r) => setTimeout(r, 120));
  const likeActive = await page.evaluate(() => ({
    pressed: document.querySelector(".like__btn").getAttribute("aria-pressed"),
    heart: getComputedStyle(document.querySelector(".like__heart")).animationName,
    ring: getComputedStyle(document.querySelector(".like__ring")).animationName,
    particle: getComputedStyle(document.querySelector(".like__particle")).animationName,
    count: document.querySelector(".like__count .roll")?.getAttribute("aria-label"),
    stored: localStorage.getItem("triis-like"),
  }));
  if (
    likeActive.pressed !== "true" ||
    likeActive.heart !== "heart-pop" ||
    likeActive.ring !== "bloom" ||
    likeActive.particle !== "fly" ||
    likeActive.count !== "1" ||
    likeActive.stored !== "1"
  ) {
    fail(`лайк не сработал: ${JSON.stringify(likeActive)}`);
  } else ok(`лайк: сердце ${likeActive.heart}, кольцо ${likeActive.ring}, конфетти ${likeActive.particle}, счётчик ${likeActive.count}`);

  await new Promise((r) => setTimeout(r, 800));
  await page.click(".like__btn");
  await new Promise((r) => setTimeout(r, 300));
  const unlike = await page.evaluate(() => ({
    pressed: document.querySelector(".like__btn").getAttribute("aria-pressed"),
    count: document.querySelector(".like__count .roll")?.getAttribute("aria-label"),
  }));
  if (unlike.pressed !== "false" || unlike.count !== "0") fail(`лайк не снимается: ${JSON.stringify(unlike)}`);
  else ok("лайк снимается и счётчик возвращается к 0");

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
