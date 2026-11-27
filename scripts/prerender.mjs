// Пререндер: подставляет готовую разметку в dist/index.html и dist/privacy.html.
//
// Зачем: сайт — клиентское приложение, и без этого поисковики и ИИ-краулеры
// (GPTBot, ClaudeBot, PerplexityBot и другие) видят пустой <div id="root">.
// Рендерим те же компоненты в строку на Node и вшиваем HTML в страницу.
// Клиент по-прежнему монтируется через createRoot и заменяет разметку своей,
// поэтому гидрация не нужна и расхождений не возникает.
import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUT_DIR = resolve(ROOT, ".prerender");
const ENTRY_OUT = resolve(OUT_DIR, "entry.mjs");

/** Заглушка браузерного окружения: компоненты читают его при рендере. */
function installDomStubs(pathname) {
  const noop = () => {};
  const mql = {
    matches: false,
    media: "",
    addEventListener: noop,
    removeEventListener: noop,
    addListener: noop,
    removeListener: noop,
  };
  const location = {
    pathname,
    search: "",
    hash: "",
    href: `https://triis.ru${pathname}`,
    origin: "https://triis.ru",
    hostname: "triis.ru",
  };

  globalThis.window = {
    location,
    history: { replaceState: noop, pushState: noop, state: null },
    matchMedia: () => mql,
    addEventListener: noop,
    removeEventListener: noop,
    setTimeout: () => 0,
    clearTimeout: noop,
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: noop,
    IntersectionObserver: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
    ResizeObserver: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
    devicePixelRatio: 1,
    innerWidth: 1440,
    innerHeight: 900,
    scrollY: 0,
    navigator: { userAgent: "prerender", clipboard: { writeText: noop } },
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  };
  globalThis.document = {
    documentElement: { style: {} },
    body: {},
    addEventListener: noop,
    removeEventListener: noop,
    querySelector: () => null,
    createElement: () => ({ style: {}, setAttribute: noop, appendChild: noop }),
  };
  // В Node navigator и localStorage объявлены только для чтения — задаём через defineProperty.
  define("navigator", globalThis.window.navigator);
  define("localStorage", globalThis.window.localStorage);
}

function define(name, value) {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
}

const stripComments = (html) => html.replace(/<!--[\s\S]*?-->/g, "");

const START = "<!--prerender:start-->";
const END = "<!--prerender:end-->";

function inject(htmlPath, markup) {
  const original = readFileSync(htmlPath, "utf8");
  const block = `<div id="root">${START}${stripComments(markup)}${END}</div>`;

  let filled;
  if (original.includes(START)) {
    // Повторный запуск: заменяем прошлую разметку целиком.
    const from = original.indexOf(START);
    const to = original.indexOf(END) + END.length;
    const rootStart = original.lastIndexOf('<div id="root">', from);
    filled = original.slice(0, rootStart) + block + original.slice(original.indexOf("</div>", to) + 6);
  } else {
    filled = original.replace(/<div id="root"><\/div>/, () => block);
    if (filled === original) {
      throw new Error(`в ${htmlPath} не найден пустой <div id="root"></div>`);
    }
  }

  writeFileSync(htmlPath, filled);
  return filled.length;
}

/** FAQPage в head: те же вопросы и ответы, что в блоке под калькулятором. */
function injectFaq(htmlPath, json, markerName = "faq") {
  const html = readFileSync(htmlPath, "utf8");
  const tag = `    <script type="application/ld+json">\n${json}\n    </script>`;
  const marker = `<!--jsonld:${markerName}-->`;
  if (!html.includes(marker)) {
    throw new Error(`в ${htmlPath} нет места под разметку FAQ (${marker})`);
  }
  writeFileSync(htmlPath, html.replace(marker, tag));
}

/** Дата последнего изменения в карте сайта — по времени сборки. */
function stampSitemap(sitemapPath, iso) {
  const date = iso.slice(0, 10);
  const xml = readFileSync(sitemapPath, "utf8");
  const stamped = xml.replace(/<lastmod>[^<]*<\/lastmod>/g, `<lastmod>${date}</lastmod>`);
  writeFileSync(sitemapPath, stamped);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const time = new Date().toISOString();

  await build({
    entryPoints: [resolve(ROOT, "scripts/prerender-entry.tsx")],
    outfile: ENTRY_OUT,
    bundle: true,
    platform: "node",
    format: "esm",
    jsx: "automatic",
    packages: "external",
    logLevel: "error",
    define: {
      __BUILD_TIME__: JSON.stringify(time),
      __BUILD_COMMIT__: JSON.stringify("prerender"),
    },
  });

  // Предупреждения React про useLayoutEffect на сервере не нужны в выводе сборки.
  const origError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === "string" && args[0].includes("useLayoutEffect does nothing on the server")) return;
    origError(...args);
  };

  installDomStubs("/");
  const mod = await import(pathToFileURL(ENTRY_OUT).href + `?t=${Date.now()}`);
  const home = mod.renderHome();

  installDomStubs("/privacy");
  const privacy = mod.renderPrivacyPage();

  installDomStubs("/pds");
  const pds = mod.renderPdsPage();

  console.error = origError;

  const homeLen = inject(resolve(ROOT, "dist/index.html"), home);
  const privacyLen = inject(resolve(ROOT, "dist/privacy.html"), privacy);
  const pdsLen = inject(resolve(ROOT, "dist/pds.html"), pds);
  injectFaq(resolve(ROOT, "dist/index.html"), mod.faqJsonLd());
  injectFaq(resolve(ROOT, "dist/pds.html"), mod.pdsFaqJsonLd(), "faq-pds");
  stampSitemap(resolve(ROOT, "dist/sitemap.xml"), time);

  const text = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  for (const [name, markup, len] of [
    ["главная", home, homeLen],
    ["политика", privacy, privacyLen],
    ["пдс", pds, pdsLen],
  ]) {
    const words = text(markup).split(" ").filter(Boolean).length;
    console.log(`${name}: ${words} слов текста, файл ${(len / 1024).toFixed(1)} КБ`);
    if (words < 150) throw new Error(`${name}: слишком мало текста в пререндере (${words} слов)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
