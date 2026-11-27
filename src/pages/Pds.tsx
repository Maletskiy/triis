import { useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import LikeButton from "../components/LikeButton";
import WakeSlider from "../components/WakeSlider";
import { Collapse, RollingNumber, Section, Toggle } from "../components/ui";
import { compactRub, parseNumber, rub, yearsWord } from "../lib/format";
import { ndfl } from "../lib/rules";
import { simulate } from "../lib/calc";
import type { Scenario } from "../lib/calc";
import {
  PDS_DEFAULTS,
  PDS_RULES,
  cofinancingRate,
  simulatePds,
  type PdsScenario,
} from "../lib/pds";

/** Вопросы для людей и для разметки FAQPage — один и тот же массив. */
export const PDS_FAQ: { question: string; answer: string }[] = [
  {
    question: "Сколько добавит государство?",
    answer:
      "До 36 000 ₽ в год в течение десяти лет, если вносить не меньше 2 000 ₽ в год. Точная сумма зависит от среднемесячного дохода: до 80 000 ₽ государство добавляет рубль на каждый рубль взносов, от 80 000 до 150 000 ₽ — половину, выше 150 000 ₽ — четверть",
  },
  {
    question: "Какой вычет можно получить?",
    answer:
      "Вычет считается с личных взносов в пределах 400 000 ₽ в год и не больше уплаченного НДФЛ. Лимит общий для ИИС-3, ПДС и НПО: если часть ушла на ИИС-3, на ПДС остаётся меньше. Возврат — по вашей ставке НДФЛ, от 13 до 22%",
  },
  {
    question: "Когда можно забрать деньги?",
    answer:
      "Через 15 лет с даты договора или при достижении 55 лет женщинами и 60 лет мужчинами — что наступит раньше. Личные взносы можно забрать и раньше, но в размере, который определяет договор с фондом; софинансирование и доход от инвестирования при досрочном расторжении остаются на счёте до срока выплат",
  },
  {
    question: "Облагается ли доход налогом?",
    answer:
      "При выплатах не раньше чем через 10 лет, по договору в свою пользу или в пользу близкого родственника и не более трёх договоров ПДС доход освобождён от НДФЛ в пределах 30 млн ₽. При досрочном расторжении фонд удержит НДФЛ с дохода и с взносов, по которым вы получали вычет",
  },
  {
    question: "Что если платить меньше 2 000 ₽ в год?",
    answer:
      "Софинансирования не будет совсем. Право на вычет при этом сохраняется: он считается с любой суммы личных взносов в пределах общего лимита",
  },
  {
    question: "Чем ПДС отличается от ИИС-3?",
    answer:
      "ИИС-3 даёт вычет на взнос и освобождение дохода, но не даёт софинансирования и не наследуется. ПДС добавляет до 36 000 ₽ в год от государства, наследуется, но деньги заперты до 15 лет или 55/60 лет, а лимит вычета у обоих общий — 400 000 ₽ в год",
  },
];

const money = (value: number) => (value > 0 ? value.toLocaleString("ru-RU") : "");
const parseMoney = (raw: string) => parseNumber(raw.replace(/[^\d\s\u202F]/g, ""));

/** Крупное поле значения: то же, что в параметрах калькулятора ИИС. */
function MoneyValue({
  value,
  onChange,
  label,
  suffix,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  suffix?: string;
}) {
  const [draft, setDraft] = useState(() => money(value));
  const [focused, setFocused] = useState(false);

  return (
    <span className={"param__value" + (focused ? "" : "")}>
      <input
        className="param__input ym-disable-keys"
        inputMode="numeric"
        aria-label={label}
        value={focused ? draft : money(value)}
        onChange={(event) => {
          const next = parseMoney(event.target.value);
          setDraft(next > 0 ? next.toLocaleString("ru-RU") : "");
          onChange(next);
        }}
        onFocus={() => {
          setFocused(true);
          setDraft(money(value));
        }}
        onBlur={() => {
          setFocused(false);
          setDraft(money(value));
        }}
      />
      {suffix ? <span className="param__unit">{suffix}</span> : null}
    </span>
  );
}

/** Параметр с подписью, значением и ползунком — как на странице ИИС. */
function Param({
  label,
  hint,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="param">
      <span className="param__label">{label}</span>
      <MoneyValue value={value} onChange={onChange} label={label} suffix={suffix} />
      <WakeSlider value={value} min={min} max={max} step={step} label={label} onChange={onChange} />
      {hint ? <span className="param__hint">{hint}</span> : null}
    </div>
  );
}

export default function Pds() {
  const [scenario, setScenario] = useState<PdsScenario>(PDS_DEFAULTS);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const patch = (next: Partial<PdsScenario>) =>
    setScenario((current) => ({ ...current, ...next }));

  const result = useMemo(() => simulatePds(scenario), [scenario]);

  const updatedLabel = useMemo(() => {
    const stamp = new Date(__BUILD_TIME__);
    const date = new Intl.DateTimeFormat("ru-RU", {
      timeZone: "Europe/Moscow",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(stamp);
    const time = new Intl.DateTimeFormat("ru-RU", {
      timeZone: "Europe/Moscow",
      hour: "2-digit",
      minute: "2-digit",
    }).format(stamp);
    return `Обновлено ${date.replace(/\s*г\.$/, "")}, ${time}\u00A0МСК`;
  }, []);

  // ИИС-3 на тех же параметрах — для сравнения
  const iis = useMemo(() => {
    const contributions = Array.from({ length: scenario.holdingYears }, (_, index) =>
      index < scenario.contributionYears ? scenario.annualContribution : 0,
    );
    const base: Scenario = {
      annualContribution: scenario.annualContribution,
      contributionMode: "custom",
      contributions,
      years: scenario.holdingYears,
      returnPct: scenario.returnPct,
      inflationPct: scenario.inflationPct,
      officialIncome: scenario.monthlyIncome * 12,
      reinvestRefunds: scenario.reinvestRefunds,
      openDate: "2026-01-01",
      periodsPerYear: 1,
      manualRate: null,
    };
    return simulate("iis3", base);
  }, [scenario]);

  const rate = cofinancingRate(scenario.monthlyIncome);
  const warnings: string[] = [];

  if (scenario.annualContribution > 0 && scenario.annualContribution < PDS_RULES.cofinancingMinContribution) {
    warnings.push(
      "Взнос меньше 2 000 ₽ в год — софинансирования не будет совсем, останется только вычет",
    );
  }
  if (rate < 1) {
    warnings.push(
      `При доходе ${rub(scenario.monthlyIncome)} в месяц государство добавляет ${rate === 0.5 ? "половину" : "четверть"} взносов, но не больше 36 000 ₽ в год`,
    );
  }
  if (scenario.iis3Contribution > 0) {
    warnings.push(
      `Лимит вычета общий с ИИС-3: из 400 000 ₽ на ПДС остаётся ${rub(result.deductionRoom)}`,
    );
  }
  if (scenario.holdingYears < PDS_RULES.payoutYears) {
    warnings.push(
      `До выплат по сроку договора ещё ${result.yearsToPayout} ${yearsWord(result.yearsToPayout)} — забрать всё можно только в 55/60 лет или в особой жизненной ситуации`,
    );
  }

  const taxRate = ndfl(scenario.monthlyIncome * 12) / Math.max(1, scenario.monthlyIncome * 12);

  return (
    <div className="app pds">
      <Topbar variant="plain">
        <nav className="topbar__nav" aria-label="Разделы">
          <a className="topbar__link" href="/">
            ИИС-3
          </a>
          <span className="topbar__link is-current">ПДС</span>
        </nav>
      </Topbar>

      <main>
        <h1 className="pds__title">Калькулятор ПДС: софинансирование, вычет и выплаты</h1>
        <p className="pds__lede">
          Программа долгосрочных сбережений: сколько добавит государство, что вернёт налоговая
          и сколько останется к выплатам. Правила 2026 года
        </p>

        <div className="layout pds__layout">
          <div>
            <Section title="Параметры">
              <Param
                label="Доход в месяц"
                hint="до вычета НДФЛ"
                value={scenario.monthlyIncome}
                min={20_000}
                max={500_000}
                step={10_000}
                suffix="₽"
                onChange={(value) => patch({ monthlyIncome: value })}
              />
              <Param
                label="Взнос в год"
                hint="сколько вносите на счёт"
                value={scenario.annualContribution}
                min={0}
                max={400_000}
                step={10_000}
                suffix="₽"
                onChange={(value) => patch({ annualContribution: value })}
              />

              <div className="pds__pair">
                <Param
                  label="Лет пополняем"
                  value={scenario.contributionYears}
                  min={1}
                  max={20}
                  step={1}
                  suffix="лет"
                  onChange={(value) => patch({ contributionYears: value })}
                />
                <Param
                  label="Лет до выплат"
                  value={scenario.holdingYears}
                  min={1}
                  max={30}
                  step={1}
                  suffix="лет"
                  onChange={(value) => patch({ holdingYears: value })}
                />
              </div>

              <div className="pds__pair">
                <Param
                  label="Доходность"
                  value={scenario.returnPct}
                  min={0}
                  max={25}
                  step={1}
                  suffix="%"
                  onChange={(value) => patch({ returnPct: value })}
                />
                <Param
                  label="Инфляция"
                  value={scenario.inflationPct}
                  min={0}
                  max={15}
                  step={1}
                  suffix="%"
                  onChange={(value) => patch({ inflationPct: value })}
                />
              </div>

              <Param
                label="Взносы на ИИС-3 в год"
                hint="лимит вычета 400 000 ₽ общий"
                value={scenario.iis3Contribution}
                min={0}
                max={400_000}
                step={10_000}
                suffix="₽"
                onChange={(value) => patch({ iis3Contribution: value })}
              />

              <div className="pds__toggles">
                <Toggle
                  checked={scenario.reinvestRefunds}
                  onChange={(value) => patch({ reinvestRefunds: value })}
                  label="Возвращать вычет на счёт"
                />
                <Toggle
                  checked={scenario.ownContract}
                  onChange={(value) => patch({ ownContract: value })}
                  label="Договор в свою пользу или близкого родственника"
                />
                <Toggle
                  checked={scenario.fewContracts}
                  onChange={(value) => patch({ fewContracts: value })}
                  label="Договоров ПДС не больше трёх"
                />
              </div>
            </Section>
          </div>

          <aside className="layout__aside">
            <div className="summary">
              <div className="summary__hero">
                <span className="summary__hero-label">На счёте к выплатам</span>
                <span className="summary__hero-value">
                  <RollingNumber value={Math.round(result.capital)} format={(n) => rub(n)} />
                </span>
                <span className="summary__hero-sub">
                  на руки в сегодняшних ценах — <b>{compactRub(result.netReal)}</b>
                </span>
              </div>

              <dl className="stats">
                <div className="stat">
                  <dt>Господдержка</dt>
                  <dd className="is-ok">
                    <RollingNumber value={Math.round(result.cofinancing)} format={(n) => rub(n)} />
                  </dd>
                  <span className="stat__sub">
                    {rate === 1 ? "1:1 по взносам" : rate === 0.5 ? "1:2, половина взносов" : "1:4, четверть взносов"}
                  </span>
                </div>
                <div className="stat">
                  <dt>Вычет за срок</dt>
                  <dd>
                    <RollingNumber value={Math.round(result.refunds)} format={(n) => rub(n)} />
                  </dd>
                  <span className="stat__sub">ставка НДФЛ ≈ {(taxRate * 100).toFixed(0)}%</span>
                </div>
                <div className="stat">
                  <dt>Налог при выплатах</dt>
                  <dd className={result.exitTax > 0 ? "is-warn" : "is-ok"}>
                    {result.exitTax > 0 ? rub(result.exitTax) : "0 ₽"}
                  </dd>
                  <span className="stat__sub">
                    {result.taxExempt ? "доход освобождён до 30 млн" : "льготы нет"}
                  </span>
                </div>
                <div className="stat">
                  <dt>Ваши взносы</dt>
                  <dd>{rub(result.contributions)}</dd>
                  <span className="stat__sub">
                    за {scenario.contributionYears} {yearsWord(scenario.contributionYears)}
                  </span>
                </div>
              </dl>

              {warnings.map((text) => (
                <div key={text} className="callout callout--info">
                  <span className="callout__text">{text}</span>
                </div>
              ))}

              <ul className="pds__facts">
                <li>Гарантия АСВ — 2,8 млн ₽, плюс софинансирование и переведённые накопления</li>
                <li>Наследуется правопреемникам, кроме случая пожизненных выплат</li>
                <li>Личные взносы можно забрать раньше, но софинансирование останется на счёте</li>
              </ul>

              <div className="callout callout--info pds__compare">
                <span className="callout__title">Тот же взнос в ИИС-3 — {rub(iis.net)}</span>
                <span className="callout__text">
                  {result.net >= iis.net
                    ? `ПДС даёт на ${rub(result.net - iis.net)} больше`
                    : `ПДС даёт на ${rub(iis.net - result.net)} меньше`}{" "}
                  — но деньги заперты до {PDS_RULES.payoutYears} лет
                </span>
              </div>

              <div className="summary__meta">
                <span>Правила ПДС {PDS_RULES.payoutYears} лет или 55/60</span>
                <span>До выплат — {result.yearsToPayout} {yearsWord(result.yearsToPayout)}</span>
              </div>
            </div>
          </aside>
        </div>

        <Section title="Расчёт по годам">
          <div className="table__wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Год</th>
                  <th scope="col">Взнос</th>
                  <th scope="col">Господдержка</th>
                  <th scope="col">Вычет</th>
                  <th scope="col" className="table__hide-sm">
                    Доход за год
                  </th>
                  <th scope="col">Капитал</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row) => (
                  <tr key={row.year}>
                    <td>{row.year}</td>
                    <td>{rub(row.contribution)}</td>
                    <td className="table__refund">{row.cofinancing > 0 ? rub(row.cofinancing) : "—"}</td>
                    <td>{row.refund > 0 ? rub(row.refund) : "—"}</td>
                    <td className="table__hide-sm">{rub(row.growth)}</td>
                    <td className="table__capital">{rub(row.capital)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Итого</td>
                  <td>{rub(result.contributions)}</td>
                  <td className="table__refund">{rub(result.cofinancing)}</td>
                  <td>{rub(result.refunds)}</td>
                  <td className="table__hide-sm">{rub(result.profit - result.cofinancing)}</td>
                  <td className="table__capital">{rub(result.capital)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Section>

        <section className="about" aria-labelledby="pds-about">
          <div className="about__col">
            <h2 className="about__title" id="pds-about">
              Как это работает
            </h2>
            <p className="about__text">
              Государство добавляет до 36 000 ₽ в год десять лет подряд, если вносить не меньше
              2 000 ₽ за год. Коэффициент зависит от среднемесячного дохода: до 80 000 ₽ — рубль
              на рубль, до 150 000 ₽ — половина, выше — четверть
            </p>
            <p className="about__text">
              Вычет считается с личных взносов в пределах 400 000 ₽ в год и не больше уплаченного
              НДФЛ. Лимит общий с ИИС-3 и НПО, поэтому часть взносов может уйти в другой продукт —
              калькулятор это учитывает
            </p>
            <p className="about__text about__text--muted">
              Выплаты — через 15 лет договора или в 55/60 лет. Доход при выплатах не облагается
              НДФЛ в пределах 30 млн ₽, если договор в свою пользу и выплаты не раньше чем через
              10 лет. При досрочном расторжении льготы теряются
            </p>
          </div>

          <div className="about__col">
            <h2 className="about__title" id="pds-faq">
              Частые вопросы
            </h2>
            <div className="faq">
              {PDS_FAQ.map((item, index) => {
                const open = openFaq === index;
                return (
                  <div className={"faq__item" + (open ? " is-open" : "")} key={item.question}>
                    <h3 className="faq__heading">
                      <button
                        type="button"
                        className="faq__toggle"
                        aria-expanded={open}
                        aria-controls={`pds-faq-panel-${index}`}
                        onClick={() => setOpenFaq(open ? null : index)}
                      >
                        <span className="faq__question">{item.question}</span>
                        <svg
                          className="faq__chevron"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            d="M6 9l6 6 6-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </h3>
                    <Collapse open={open}>
                      <p className="faq__answer" id={`pds-faq-panel-${index}`}>
                        {item.answer}
                      </p>
                    </Collapse>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer__top">
          <LikeButton hint="Если было полезно, поставь лайк" />
          <a className="footer__link" href="/">
            Калькулятор ИИС-3
          </a>
          <a className="footer__link" href="/privacy">
            Политика конфиденциальности
          </a>
        </div>
        <p className="footer__note">
          Правила 2026 года. Расчёт не учитывает комиссии фонда, смену правил и индивидуальные
          условия договора. Не инвестиционная рекомендация
        </p>
        <div className="footer__bottom">
          <span className="footer__updated">{updatedLabel}</span>
          <span className="footer__built">
            Built by{" "}
            <a
              className="footer__author"
              href="https://maletskiy-design.ru"
              target="_blank"
              rel="noopener noreferrer"
            >
              Maletskiy Design
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
