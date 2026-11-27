import type { ReactNode } from "react";

/**
 * Шапка сайта: бренд-ссылка на главную и универсальное описание.
 * Одинакова на всех страницах — заголовок страницы задаётся ниже, в её теле,
 * чтобы h1 всегда был один и нёс ключевой запрос конкретной страницы.
 */
export default function Topbar({
  tagline = "Калькуляторы ИИС и ПДС",
  children,
}: {
  tagline?: string;
  children?: ReactNode;
}) {
  return (
    <header className="topbar">
      <a className="topbar__brand" href="/" aria-label="ТРИИС — на главную">
        <img className="topbar__mark" src="/logo.svg" alt="" aria-hidden="true" />
        <span className="topbar__title">
          <span className="topbar__name">ТРИИС</span>
          <span className="topbar__lede">{tagline}</span>
        </span>
      </a>
      {children}
    </header>
  );
}
