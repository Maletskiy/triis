// Проверка собранного сайта на поисковую готовность.
// Запуск: node scripts/seo-check.mjs (после npm run build)
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const DIST = resolve(import.meta.dirname, "../dist");
let failures = 0;

function check(condition, message) {
  if (condition) {
    console.log(`OK   ${message}`);
  } else {
    console.log(`FAIL ${message}`);
    failures++;
  }
}

const read = (name) => readFileSync(resolve(DIST, name), "utf8");

// Неразрывные пробелы сравниваем как обычные: типограф их расставляет, смысл тот же.
const flat = (value) => value.replace(/[\u00A0\u202F\u2009]/g, " ");

const visibleText = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/* ---------- главная ---------- */
const index = read("index.html");
const text = visibleText(index);
const words = text.split(" ").filter(Boolean).length;

const title = index.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
check(title.length >= 20 && title.length <= 70, `title ${title.length} символов: ${title}`);

const description = index.match(/<meta\s+name="description"\s+content="([^"]*)"/s)?.[1] ?? "";
check(description.length >= 70 && description.length <= 200, `description ${description.length} символов`);

check(/<link rel="canonical" href="https:\/\/triis\.ru\/"/.test(index), "canonical на главную");
check(/<html lang="ru"/.test(index), "язык страницы указан");
check(/og:image" content="https:\/\/triis\.ru\/og\.png"/.test(index), "og:image");
check(/twitter:card" content="summary_large_image"/.test(index), "twitter:card");
check(/name="robots" content="[^"]*max-image-preview:large/.test(index), "robots с крупным превью");
check(/rel="preload"[^>]*sbsans-ui-regular\.woff2/.test(index), "шрифт предзагружается");

const h1Count = (index.match(/<h1[\s>]/g) ?? []).length;
check(h1Count === 1, `один h1 в статическом HTML (${h1Count})`);
check(/<h1[^>]*>[\s\S]{0,200}?Калькулятор ИИС/.test(index), "в h1 есть ключевой запрос");

check(words >= 700, `текст без JavaScript: ${words} слов`);
for (const phrase of ["Что считает калькулятор", "Частые вопросы", "ИИС-3", "400 000", "30 млн"]) {
  check(text.includes(phrase), `в статическом тексте есть «${phrase}»`);
}

check(/<!--prerender:start-->/.test(index), "разметка вставлена пререндером");

/* ---------- микроразметка ---------- */
const blocks = [...index.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
check(blocks.length >= 2, `блоков JSON-LD: ${blocks.length}`);

const types = new Set();
let faq = null;
for (const [, body] of blocks) {
  let data;
  try {
    data = JSON.parse(body);
  } catch (error) {
    check(false, `JSON-LD не парсится: ${error.message}`);
    continue;
  }
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (node && typeof node === "object") {
      if (node["@type"] === "FAQPage") faq = node;
      if (typeof node["@type"] === "string") types.add(node["@type"]);
      Object.values(node).forEach(walk);
    }
  };
  walk(data);
}

for (const type of ["WebSite", "WebApplication", "Organization", "FAQPage"]) {
  check(types.has(type), `разметка ${type}`);
}

check(Boolean(faq), "FAQPage найден");
if (faq) {
  const items = faq.mainEntity ?? [];
  check(items.length >= 6, `вопросов в FAQPage: ${items.length}`);
  const broken = items.filter(
    (item) => !item.name || !item.acceptedAnswer?.text || item.acceptedAnswer.text.length < 40,
  );
  check(broken.length === 0, "у всех вопросов есть внятный ответ");
  const missing = items.filter((item) => !flat(text).includes(flat(item.name)));
  check(missing.length === 0, "вопросы из разметки есть в тексте страницы");
  // Ответы свёрнуты в аккордеон, но обязаны оставаться в HTML: иначе
  // ИИ-краулер прочитает вопрос без ответа.
  const hidden = items.filter((item) => !flat(text).includes(flat(item.acceptedAnswer.text)));
  check(hidden.length === 0, "все ответы есть в HTML, хотя и свёрнуты");
}

/* ---------- политика ---------- */
const privacy = read("privacy.html");
const privacyText = visibleText(privacy);
check(privacyText.split(" ").length >= 300, `политика без JavaScript: ${privacyText.split(" ").filter(Boolean).length} слов`);
check(/canonical" href="https:\/\/triis\.ru\/privacy"/.test(privacy), "canonical у политики");
check((privacy.match(/<h1[\s>]/g) ?? []).length === 1, "один h1 на странице политики");

/* ---------- файлы для краулеров ---------- */
const robots = read("robots.txt");
check(/Sitemap: https:\/\/triis\.ru\/sitemap\.xml/.test(robots), "robots.txt со ссылкой на карту сайта");
for (const bot of ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"]) {
  check(robots.includes(bot), `robots.txt упоминает ${bot}`);
}

const sitemap = read("sitemap.xml");
check((sitemap.match(/<loc>/g) ?? []).length === 2, "два адреса в карте сайта");
check(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(sitemap), "в карте сайта есть lastmod");

const llms = read("llms.txt");
check(llms.length > 700, `llms.txt: ${llms.length} символов`);
check(/https:\/\/triis\.ru\//.test(llms), "llms.txt ссылается на сайт");

check(existsSync(resolve(DIST, "og.png")), "есть og.png");
const png = readFileSync(resolve(DIST, "og.png"));
check(png.readUInt32BE(16) === 1200 && png.readUInt32BE(20) === 630, "og.png размером 1200×630");

/* ---------- итог ---------- */
if (failures > 0) {
  console.error(`\nПроблем: ${failures}`);
  process.exit(1);
}
console.log("\nПоисковая готовность в порядке");
