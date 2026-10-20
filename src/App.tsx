import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Inputs from "./components/Inputs";
import Summary, { collectWarnings } from "./components/Summary";
import Chart from "./components/Chart";
import YearTable from "./components/YearTable";
import Compare from "./components/Compare";
import Rules from "./components/Rules";
import { AutoHeight, CopyButton, Section, Sheet, useSlidingThumb } from "./components/ui";
import { bestAccount, compare } from "./lib/calc";
import type { AccountType, Scenario } from "./lib/calc";
import { compactRub, rub, yearsWord } from "./lib/format";
import { readState, writeState } from "./lib/url";
import type { AppState } from "./lib/url";

type Tab = "params" | "compare" | "rules";

export default function App() {
  const [state, setState] = useState<AppState>(() => readState(window.location.search));
  const [tab, setTab] = useState<Tab>("params");
  const [toast, setToast] = useState<{ text: string; visible: boolean } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [barVisible, setBarVisible] = useState(false);

  const toastTimer = useRef<number | null>(null);
  const mobileSummaryRef = useRef<HTMLDivElement | null>(null);
  const desktopSummaryRef = useRef<HTMLDivElement | null>(null);
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const tabThumb = useSlidingThumb(tabsRef, ".segmented__item.is-active", [tab]);

  const results = useMemo(() => compare(state.scenario), [state.scenario]);
  const best = useMemo(() => bestAccount(results), [results]);
  const active = results[state.account];
  const warnings = collectWarnings(active, state.scenario);

  // Параметры в адресе: ссылкой можно поделиться, состояние не теряется.
  useEffect(() => {
    const next = writeState(state);
    window.history.replaceState(null, "", window.location.pathname + next);
  }, [state]);

  useEffect(() => {
    document.title = "Triis — калькулятор ИИС-3, ИИС-1 и ИИС-2";
  }, []);

  // Нижняя плашка нужна, только когда блок с итогом ушёл за верх экрана.
  // На мобиле итог стоит сверху, на десктопе — в правой колонке, поэтому
  // следим за тем блоком, который сейчас реально виден.
  useEffect(() => {
    const query = window.matchMedia("(max-width: 900px)");
    let observer: IntersectionObserver | null = null;

    const watch = () => {
      observer?.disconnect();
      const el = query.matches ? mobileSummaryRef.current : desktopSummaryRef.current;
      if (!el) return;
      observer = new IntersectionObserver(
        ([entry]) => setBarVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
        { rootMargin: "0px 0px -4px 0px" },
      );
      observer.observe(el);
    };

    watch();
    query.addEventListener("change", watch);
    return () => {
      query.removeEventListener("change", watch);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const flash = useCallback((text: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ text, visible: false });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setToast((cur) => (cur ? { ...cur, visible: true } : cur)));
    });
    toastTimer.current = window.setTimeout(() => {
      setToast((cur) => (cur ? { ...cur, visible: false } : cur));
      toastTimer.current = window.setTimeout(() => setToast(null), 260);
    }, 1800);
  }, []);

  const patchScenario = useCallback((patch: Partial<Scenario>) => {
    setState((prev) => ({ ...prev, scenario: { ...prev.scenario, ...patch } }));
  }, []);

  const pickAccount = useCallback((account: AccountType) => {
    setState((prev) => ({ ...prev, account }));
  }, []);

  const shareUrl = () => window.location.href;

  const printParams = [
    `${state.account === "iis3" ? "ИИС-3" : state.account === "iis1" ? "ИИС-1" : "ИИС-2"}, открыт в ${state.scenario.openYear}`,
    `${rub(state.scenario.annualContribution)} в год`,
    `${state.scenario.years} ${yearsWord(state.scenario.years)}`,
    `доходность ${state.scenario.returnPct}%`,
    `реинвест ${
      (state.scenario.periodsPerYear ?? 1) === 12
        ? "раз в месяц"
        : (state.scenario.periodsPerYear ?? 1) === 4
          ? "раз в квартал"
          : "раз в год"
    }`,
    `инфляция ${state.scenario.inflationPct}%`,
    state.scenario.manualRate
      ? `НДФЛ ${Math.round(state.scenario.manualRate * 100)}%`
      : "НДФЛ по доходу",
  ].join(" · ");

  const downloadCsv = () => {
    const header = "Год;Взнос;Вычет;Доход за год;Капитал";
    const body = active.rows
      .map((row) =>
        [row.year, row.contribution, row.refund, row.growth, Math.round(row.capital)].join(";"),
      )
      .join("\n");
    const blob = new Blob([`\uFEFF${header}\n${body}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `iis-${state.account}-${active.rows.length}-let.csv`;
    link.click();
    URL.revokeObjectURL(url);
    flash("Таблица сохранена");
  };

  const reset = () => {
    setState(readState(""));
    setTab("params");
    flash("Параметры сброшены");
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__mark" aria-hidden="true">
            3
          </span>
          <div>
            <h1>Triis</h1>
            <p>Калькулятор ИИС: вычеты, налоги, доходность</p>
          </div>
        </div>
        <div className="topbar__actions">
          <button type="button" className="btn btn--ghost" onClick={reset}>
            Сбросить
          </button>
        </div>
      </header>

      <div className="print-head">
        <div>
          <strong>Triis — калькулятор ИИС</strong>
          <span>Расчёт от {new Date().toLocaleDateString("ru-RU")}</span>
        </div>
        <div className="print-head__params">{printParams}</div>
      </div>

      <main className="layout">
        <div className="layout__summary-mobile" ref={mobileSummaryRef}>
          <Summary result={active} scenario={state.scenario} />
        </div>

        <div className="layout__main">
          <div className="tabs" ref={tabsRef}>
            <div className="tabs__inner">
              <div className="segmented" role="tablist" aria-label="Разделы">
                {tabThumb && (
                  <span
                    className="segmented__thumb"
                    aria-hidden="true"
                    style={{
                      transform: `translate(${tabThumb.left}px, ${tabThumb.top}px)`,
                      width: tabThumb.width,
                      height: tabThumb.height,
                    }}
                  />
                )}
                {(
                  [
                    ["params", "Параметры"],
                    ["compare", "Сравнение"],
                    ["rules", "Правила"],
                  ] as [Tab, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={tab === value}
                    className={"segmented__item" + (tab === value ? " is-active" : "")}
                    onClick={() => setTab(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <AutoHeight>
            {tab === "params" ? (
              <Inputs
                scenario={state.scenario}
                onChange={patchScenario}
                account={state.account}
                onAccountChange={pickAccount}
              />
            ) : null}

            {tab === "compare" ? (
              <Compare
                results={results}
                best={best}
                onPick={(type) => {
                  pickAccount(type);
                  setTab("params");
                }}
              />
            ) : null}

            {tab === "rules" ? <Rules openYear={state.scenario.openYear} /> : null}
          </AutoHeight>
        </div>

        <aside className="layout__aside">
          <div className="layout__summary-desktop" ref={desktopSummaryRef}>
            <Summary result={active} scenario={state.scenario} />
          </div>

          <div className="actions">
            <CopyButton
              text={shareUrl()}
              label="Скопировать ссылку"
              copiedLabel="Скопировано"
              onResult={(ok) => {
                if (!ok) flash("Браузер не дал скопировать — выделите адрес вручную");
              }}
            />
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => window.print()}
              title="Откроется печать — выберите «Сохранить как PDF»"
            >
              Скачать PDF
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={downloadCsv}
              title="Таблица по годам в CSV"
            >
              Скачать CSV
            </button>
          </div>

          <Chart rows={active.rows} />

          <Section
            title="Таблица по годам"
            hint="Разбор каждого года: взнос, вычет, доход, капитал"
            collapsible
          >
            <YearTable result={active} />
          </Section>
        </aside>
      </main>

      <footer className="footer">
        <span>Правила 2026 года. Не инвестиционная рекомендация.</span>
        <a
          className="footer__author"
          href="https://maletskiy-design.ru"
          target="_blank"
          rel="noopener noreferrer"
        >
          Maletskiy Design
        </a>
      </footer>

      <div className={"bar" + (barVisible ? " is-visible" : "")} aria-hidden={!barVisible}>
        <div className="bar__value">
          <span className="bar__label">на руки</span>
          <span className="bar__number">{compactRub(active.net)}</span>
        </div>
        <div className="bar__actions">
          <button
            type="button"
            className="btn btn--ghost bar__info"
            onClick={() => setSheetOpen(true)}
            aria-label="Детали расчёта"
            title="Детали расчёта"
            tabIndex={barVisible ? 0 : -1}
          >
            <span className="bar__info-icon" aria-hidden="true">
              i
            </span>
            <span className="bar__info-text">Детали</span>
          </button>
          <CopyButton
            text={shareUrl()}
            label="Ссылка"
            copiedLabel="Готово"
            onResult={(ok) => {
              if (!ok) flash("Не удалось скопировать ссылку");
            }}
          />
        </div>
      </div>

      <Sheet open={sheetOpen} title="Коротко о расчёте" onClose={() => setSheetOpen(false)}>
        <div className="sheet-summary">
          <div className="sheet-summary__hero">
            <span className="sheet-summary__label">На руки</span>
            <span className="sheet-summary__value">{rub(active.net)}</span>
          </div>
          <ul className="sheet-summary__list">
            <li>
              <span>Вычеты за срок</span>
              <b>{rub(active.refunds)}</b>
            </li>
            <li>
              <span>Капитал на счёте</span>
              <b>{rub(active.grossCapital)}</b>
            </li>
            <li>
              <span>Налог при закрытии</span>
              <b>{rub(active.exitTax)}</b>
            </li>
            <li>
              <span>В ценах сегодня</span>
              <b>{rub(active.netReal)}</b>
            </li>
          </ul>
          {warnings.length > 0 && (
            <div className="sheet-summary__warnings">
              {warnings.map((warning) => (
                <p key={warning.text} className={"callout callout--" + warning.tone}>
                  <span className="callout__text">{warning.text}</span>
                </p>
              ))}
            </div>
          )}
          <button type="button" className="btn btn--primary btn--wide" onClick={() => setSheetOpen(false)}>
            Понятно
          </button>
        </div>
      </Sheet>

      {toast && (
        <div className={"toast" + (toast.visible ? " is-visible" : "")} role="status">
          {toast.text}
        </div>
      )}
    </div>
  );
}
