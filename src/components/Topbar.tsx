import type { ReactNode } from "react";

/**
 * Шапка сайта.
 *
 * hero — главная: единственный h1 страницы, внутри имя бренда и описание,
 *        поэтому в заголовке есть и название, и ключевой запрос.
 * plain — политика: бренд это ссылка на главную, а h1 остаётся за заголовком
 *        документа, чтобы на странице не было двух h1.
 */
export default function Topbar({
  variant = "hero",
  children,
}: {
  variant?: "hero" | "plain";
  children?: ReactNode;
}) {
  const mark = <img className="topbar__mark" src="/logo.svg" alt="" aria-hidden="true" />;

  if (variant === "hero") {
    return (
      <header className="topbar">
        <div className="topbar__brand">
          {mark}
          <h1 className="topbar__title">
            <span className="topbar__name">ТРИИС</span>
            <span className="topbar__lede">Калькулятор ИИС: вычеты, налоги, доходность</span>
          </h1>
        </div>
        {children}
      </header>
    );
  }

  return (
    <header className="topbar">
      <a className="topbar__brand" href="/" aria-label="ТРИИС — на главную">
        {mark}
        <span className="topbar__title">
          <span className="topbar__name">ТРИИС</span>
          <span className="topbar__lede">Калькулятор ИИС: вычеты, налоги, доходность</span>
        </span>
      </a>
      {children}
    </header>
  );
}
