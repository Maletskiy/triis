import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import App from "../src/App";
import Privacy from "../src/pages/Privacy";
import Topbar from "../src/components/Topbar";
import { FAQ } from "../src/components/About";
import Pds, { PDS_FAQ } from "../src/pages/Pds";

/** Главная: калькулятор со всеми блоками и текстом под ним. */
export function renderHome(): string {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

/** Политика конфиденциальности — отдельная точка входа, та же шапка. */
export function renderPrivacyPage(): string {
  return renderToString(
    <StrictMode>
      <div className="app">
        <Topbar variant="plain" />
        <Privacy />
      </div>
    </StrictMode>,
  );
}

/** Калькулятор ПДС — своя страница со своей шапкой и навигацией. */
export function renderPdsPage(): string {
  // Для поисковиков и ИИ-краулеров рендерим вкладку с правилами:
  // в ней вся фактура, а клиент всё равно монтируется заново и открывает параметры.
  return renderToString(
    <StrictMode>
      <Pds initialTab="rules" />
    </StrictMode>,
  );
}

/** FAQPage для страницы ПДС — из того же массива, что видит человек. */
export function pdsFaqJsonLd(): string {
  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": "https://triis.ru/pds#faq",
      mainEntity: PDS_FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
    null,
    2,
  );
}

/** Разметка FAQPage собирается из тех же текстов, что видит человек. */
export function faqJsonLd(): string {
  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": "https://triis.ru/#faq",
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
    null,
    2,
  );
}
