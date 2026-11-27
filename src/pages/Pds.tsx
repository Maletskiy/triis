import { useMemo, useRef, useState } from "react";
import Topbar from "../components/Topbar";
import LikeButton from "../components/LikeButton";
import WakeSlider from "../components/WakeSlider";
import {
  AnimatedHeight,
  Collapse,
  RollingNumber,
  Section,
  Segmented,
  Toggle,
  useSlidingThumb,
} from "../components/ui";
import { compactRub, parseNumber, rub, yearsWord } from "../lib/format";
import { ndfl } from "../lib/rules";
import { simulate } from "../lib/calc";
import type { Scenario } from "../lib/calc";
import {
  PAYOUT_LABELS,
  PDS_DEFAULTS,
  PDS_RULES,
  cofinancingRate,
  simulatePds,
  type PayoutType,
  type PdsScenario,
} from "../lib/pds";

type Tab = "params" | "compare" | "rules";

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
    question: "Что такое ОПС и зачем его переводить?",
    answer:
      "ОПС — обязательное пенсионное страхование, те самые накопительные взносы 2002–2013 годов, замороженные с 2014 года. Их можно перевести на счёт ПДС единовременным взносом: сумма сразу работает, не облагается налогом при выплатах и гарантируется государством без лимита 2,8 млн ₽. Но она не даёт софинансирования и вычета и не выдаётся досрочно — только вместе с выплатами",
  },
  {
    question: "Какие бывают выплаты и от чего зависит размер?",
    answer:
      "Срочная на срок от 10 лет (короче — если фонд разрешает), пожизненная или единовременная. Размер — накопленная сумма, поделённая на срок: за 10 лет это 120 месяцев, пожизненная считается по ожидаемому периоду выплаты (ориентир — 22 года). Чем длиннее срок, тем меньше платёж, но дольше платят",
  },
  {
    question: "Почему важны возраст и пол?",
    answer:
      "Право на выплаты даёт возраст — 55 лет женщинам и 60 мужчинам — или 15 лет с даты первого договора, что наступит раньше. От возраста зависит, сколько лет копится сумма до выплат и каким получится платёж",
  },
  {
    question: "Чем ПДС отличается от ИИС-3?",
    answer:
      "ИИС-3 даёт вычет на взнос и освобождение дохода, но не даёт софинансирования и не наследуется. ПДС добавляет до 36 000 ₽ в год от государства, наследуется, но деньги заперты до 15 лет или 55/60 лет, а лимит вычета у обоих общий — 400 000 ₽ в год",
  },
];

const money = (value: number) => value.toLocaleString("ru-RU");
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
    <span className="param__value">
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
      {suffix ? null : null}
      <WakeSlider value={value} min={min} max={max} step={step} label={label} onChange={onChange} />
      {hint ? <span className="param__hint">{hint}</span> : null}
    </div>
  );
}

export default function Pds({ initialTab = "params" }: { initialTab?: Tab }) {
  const [scenario, setScenario] = useState<PdsScenario>(PDS_DEFAULTS);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const thumb = useSlidingThumb(tabsRef, ".segmented__item.is-active", [tab]);

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
  if (scenario.age >= result.payoutAge) {
    warnings.push(
      "Возраст выплат уже наступил: забрать сбережения можно в любой момент, взносы после этого смысла не имеют",
    );
  } else if (result.earliestYears === PDS_RULES.payoutYears && scenario.holdingYears === PDS_RULES.payoutYears) {
    warnings.push(
      `Выплаты начнутся через 15 лет договора: до ${result.payoutAge} лет вы ещё не дойдёте`,
    );
  }

  const taxRate = ndfl(scenario.monthlyIncome * 12) / Math.max(1, scenario.monthlyIncome * 12);
  const payoutBigger = result.net >= iis.net;

  return (
    <div className="app pds">
      <Topbar>
        <nav className="topbar__nav" aria-label="Разделы">
          <a className="topbar__link" href="/">
            ИИС-3
          </a>
          <span className="topbar__link is-current">ПДС</span>
        </nav>
      </Topbar>

      <main>
        <h1 className="page-title">Калькулятор ПДС: софинансирование, вычет и выплаты</h1>
        <p className="page-lede">
          Программа долгосрочных сбережений: сколько добавит государство, что вернёт налоговая
          и сколько останется к выплатам. Правила 2026 года
        </p>

        <div className="layout pds__layout">
          <div className="layout__main">
            <div className="tabs" ref={tabsRef}>
              <div className="tabs__inner">
                <div className="segmented" role="tablist" aria-label="Разделы">
                  {thumb ? (
                    <span
                      className="segmented__thumb"
                      aria-hidden="true"
                      style={{
                        transform: `translate(${thumb.left}px, ${thumb.top}px)`,
                        width: thumb.width,
                        height: thumb.height,
                      }}
                    />
                  ) : null}
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

            <AnimatedHeight>
              <div className="appear" key={tab}>
                {tab === "params" ? (
                  <Section
                    title="Параметры"
                    aside={
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => setScenario(PDS_DEFAULTS)}
                      >
                        Сбросить
                      </button>
                    }
                  >
                    <div className="param">
                      <span className="param__label">Пол</span>
                      <Segmented
                        label="Пол"
                        value={scenario.gender}
                        onChange={(value) => {
                          const payoutAge =
                            value === "f" ? PDS_RULES.payoutAgeWomen : PDS_RULES.payoutAgeMen;
                          const earliest = Math.min(
                            PDS_RULES.payoutYears,
                            Math.max(0, payoutAge - scenario.age),
                          );
                          patch({
                            gender: value as "m" | "f",
                            holdingYears: Math.max(scenario.holdingYears, earliest),
                          });
                        }}
                        options={[
                          { value: "m", label: "Мужской" },
                          { value: "f", label: "Женский" },
                        ]}
                      />
                      <span className="param__hint">
                        от пола зависит возраст выплат: 60 лет мужчинам и 55 женщинам
                      </span>
                    </div>

                    <Param
                      label="Возраст"
                      hint="право на выплаты — 55/60 лет или 15 лет договора"
                      value={scenario.age}
                      min={18}
                      max={70}
                      step={1}
                      suffix="лет"
                      onChange={(value) => {
                        const payoutAge =
                          scenario.gender === "f" ? PDS_RULES.payoutAgeWomen : PDS_RULES.payoutAgeMen;
                        const earliest = Math.min(
                          PDS_RULES.payoutYears,
                          Math.max(0, payoutAge - value),
                        );
                        patch({ age: value, holdingYears: Math.max(scenario.holdingYears, earliest) });
                      }}
                    />

                    <Param
                      label="Доход в месяц"
                      hint="до вычета НДФЛ, от него зависят господдержка и ставка"
                      value={scenario.monthlyIncome}
                      min={20_000}
                      max={500_000}
                      step={10_000}
                      suffix="₽"
                      onChange={(value) => patch({ monthlyIncome: value })}
                    />

                    <Param
                      label="Взнос в год"
                      hint="сколько вносите на счёт; от 2 000 ₽ в год дают софинансирование"
                      value={scenario.annualContribution}
                      min={0}
                      max={400_000}
                      step={10_000}
                      suffix="₽"
                      onChange={(value) => patch({ annualContribution: value })}
                    />

                    <div className="pds__row">
                      <Param
                        label="Срок пополнения"
                        hint="сколько лет вносите взносы"
                        value={scenario.contributionYears}
                        min={1}
                        max={20}
                        step={1}
                        suffix="лет"
                        onChange={(value) =>
                          patch({
                            contributionYears: value,
                            holdingYears: Math.max(scenario.holdingYears, value),
                          })
                        }
                      />
                      <Param
                        label="Срок до выплат"
                        hint={`не раньше ${result.earliestYears} лет: возраст ${result.payoutAge} или 15 лет договора`}
                        value={scenario.holdingYears}
                        min={Math.max(1, result.earliestYears)}
                        max={40}
                        step={1}
                        suffix="лет"
                        onChange={(value) =>
                          patch({
                            holdingYears: Math.max(value, result.earliestYears, scenario.contributionYears),
                          })
                        }
                      />
                    </div>

                    <div className="pds__row">
                      <Param
                        label="Доходность"
                        hint="что фонд заработает сверх инфляции"
                        value={scenario.returnPct}
                        min={0}
                        max={25}
                        step={1}
                        suffix="%"
                        onChange={(value) => patch({ returnPct: value })}
                      />
                      <Param
                        label="Инфляция"
                        hint="для пересчёта в сегодняшние цены"
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
                      hint="лимит вычета 400 000 ₽ общий с ИИС-3 и НПО"
                      value={scenario.iis3Contribution}
                      min={0}
                      max={400_000}
                      step={10_000}
                      suffix="₽"
                      onChange={(value) => patch({ iis3Contribution: value })}
                    />

                    <div className="param">
                      <span className="param__label">Вариант выплаты</span>
                      <Segmented
                        label="Вариант выплаты"
                        value={scenario.payoutType}
                        onChange={(value) => patch({ payoutType: value as PayoutType })}
                        options={[
                          { value: "term1", label: "1 год" },
                          { value: "term5", label: "5 лет" },
                          { value: "term10", label: "10 лет" },
                          { value: "lifetime", label: "Пожизненно" },
                          { value: "lump", label: "Разом" },
                        ]}
                      />
                      <span className="param__hint">
                        срочная выплата — не меньше 10 лет по закону; короче можно, если фонд разрешает
                      </span>
                    </div>

                    <div className="param">
                      <Toggle
                        checked={scenario.useOps}
                        onChange={(value) => patch({ useOps: value })}
                        label="Учитывать накопления ОПС"
                        hint="переведённая накопительная часть растёт вместе со счётом, но не даёт софинансирования и вычета"
                      />
                    </div>

                    {scenario.useOps ? (
                      <Param
                        label="Накопления ОПС"
                        hint="сумму можно узнать на Госуслугах в разделе пенсионных накоплений"
                        value={scenario.opsAmount}
                        min={0}
                        max={3_000_000}
                        step={50_000}
                        suffix="₽"
                        onChange={(value) => patch({ opsAmount: value })}
                      />
                    ) : null}

                    <div className="pds__toggles">
                      <Toggle
                        checked={scenario.reinvestRefunds}
                        onChange={(value) => patch({ reinvestRefunds: value })}
                        label="Возвращать вычет на счёт"
                        hint="вычет приходит деньгами или сразу работает на счёте"
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
                ) : null}

                {tab === "params" ? (
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
                              <td className="table__refund">
                                {row.cofinancing > 0 ? rub(row.cofinancing) : "—"}
                              </td>
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
                ) : null}

                {tab === "compare" ? (
                  <div className="pds-compare">
                    <p className="compare__lead">
                      Одни и те же взносы и срок: что даст ПДС, а что ИИС-3
                    </p>

                    <div className="pds-compare__cards">
                      <article className={"pds-compare__card" + (payoutBigger ? " is-best" : "")}>
                        <span className="card__head">
                          <span className="card__name">ПДС</span>
                          {payoutBigger ? <span className="chip chip--best">выгоднее</span> : null}
                        </span>
                        <span className="card__net">
                          <RollingNumber value={result.net} format={(n) => rub(n)} />
                        </span>
                        <span className="card__note">
                          господдержка {compactRub(result.cofinancing)}, вычет{" "}
                          {compactRub(result.refunds)}; деньги заперты до {scenario.holdingYears}{" "}
                          лет
                        </span>
                      </article>

                      <article className={"pds-compare__card" + (!payoutBigger ? " is-best" : "")}>
                        <span className="card__head">
                          <span className="card__name">ИИС-3</span>
                          {!payoutBigger ? <span className="chip chip--best">выгоднее</span> : null}
                        </span>
                        <span className="card__net">
                          <RollingNumber value={iis.net} format={(n) => rub(n)} />
                        </span>
                        <span className="card__note">
                          вычет {compactRub(iis.refunds)}; счёт можно закрыть через{" "}
                          {iis.minHolding} {yearsWord(iis.minHolding)} без потери льгот
                        </span>
                      </article>
                    </div>

                    <table className="pds-compare__table">
                      <tbody>
                        <tr>
                          <th scope="row">Господдержка</th>
                          <td className="is-ok">{rub(result.cofinancing)}</td>
                          <td>нет</td>
                        </tr>
                        <tr>
                          <th scope="row">Вычет НДФЛ</th>
                          <td>{rub(result.refunds)}</td>
                          <td>{rub(iis.refunds)}</td>
                        </tr>
                        <tr>
                          <th scope="row">Налог при выплатах</th>
                          <td>{result.exitTax > 0 ? rub(result.exitTax) : "0 ₽"}</td>
                          <td>{iis.exitTax > 0 ? rub(iis.exitTax) : "0 ₽"}</td>
                        </tr>
                        <tr>
                          <th scope="row">На руки</th>
                          <td>{rub(result.net)}</td>
                          <td>{rub(iis.net)}</td>
                        </tr>
                        <tr>
                          <th scope="row">Когда доступны деньги</th>
                          <td>
                            15 лет или {result.payoutAge} лет
                          </td>
                          <td>через {iis.minHolding} {yearsWord(iis.minHolding)}</td>
                        </tr>
                        <tr>
                          <th scope="row">Наследование</th>
                          <td>да, кроме пожизненных выплат</td>
                          <td>нет</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className={"callout callout--" + (payoutBigger ? "info" : "warn")}>
                      <span className="callout__title">
                        {payoutBigger
                          ? `ПДС даёт на ${rub(result.net - iis.net)} больше`
                          : `ИИС-3 даёт на ${rub(iis.net - result.net)} больше`}
                      </span>
                      <span className="callout__text">
                        {payoutBigger
                          ? "Но деньги заперты до 15 лет договора или 55/60 лет, а ИИС-3 можно закрыть раньше без потери льгот"
                          : "ПДС проигрывает на этих параметрах, но деньги можно забрать раньше и до 36 000 ₽ в год даёт государство"}
                      </span>
                    </div>

                    <a className="pds-cta" href="/">
                      <span className="pds-cta__body">
                        <span className="pds-cta__title">Посчитать ИИС-3</span>
                        <span className="pds-cta__text">
                          Три типа счёта, вычеты, налог при закрытии и доходность с поправкой
                          на инфляцию
                        </span>
                      </span>
                      <span className="pds-cta__arrow" aria-hidden="true">
                        →
                      </span>
                    </a>
                  </div>
                ) : null}

                {tab === "rules" ? (
                  <article className="rules">
                    <p className="rules__lead">
                      Правила ПДС на 2026 год: что даёт государство, что возвращает налоговая
                      и когда отдают деньги
                    </p>

                    <section className="rules__block">
                      <h3>Софинансирование</h3>
                      <ul>
                        <li>
                          До <b>36 000 ₽ в год</b> десять лет подряд, если вносить не меньше
                          2 000 ₽ за год
                        </li>
                        <li>
                          Коэффициент зависит от среднемесячного дохода: до 80 000 ₽ — 1:1,
                          от 80 000 до 150 000 ₽ — 1:2, выше — 1:4
                        </li>
                        <li>
                          Лимит общий по всем договорам ПДС, включая договоры в других фондах
                        </li>
                        <li>
                          Софинансирование прекращается при назначении выплаты или выкупной суммы,
                          кроме особых жизненных ситуаций
                        </li>
                      </ul>
                    </section>

                    <section className="rules__block">
                      <h3>Налоговый вычет</h3>
                      <ul>
                        <li>
                          База — <b>400 000 ₽ в год</b> личных взносов, общая с ИИС-3 и НПО
                        </li>
                        <li>
                          Возврат — 52 000 ₽ при ставке 13%, до 88 000 ₽ при 22%, но не больше
                          уплаченного НДФЛ
                        </li>
                        <li>
                          Для договоров 2024–2026 годов нужно продержать 5 лет, дальше срок растёт
                          до 10 лет к 2031 году
                        </li>
                        <li>
                          Одновременно не больше трёх договоров ПДС, иначе вычет не дадут
                        </li>
                      </ul>
                    </section>

                    <section className="rules__block">
                      <h3>Когда можно забрать</h3>
                      <ul>
                        <li>
                          <b>55 лет женщинам и 60 мужчинам</b> или 15 лет с даты первого договора —
                          что наступит раньше
                        </li>
                        <li>
                          Личные взносы можно забрать и раньше, но в размере по договору; фонд может
                          применить понижающие коэффициенты
                        </li>
                        <li>
                          Софинансирование, переведённые накопления и доход от них остаются на счёте
                          до срока выплат
                        </li>
                        <li>
                          Особые жизненные ситуации — дорогостоящее лечение и потеря кормильца:
                          до 100% без потери льгот
                        </li>
                      </ul>
                    </section>

                    <section className="rules__block">
                      <h3>Выплаты и налог на доход</h3>
                      <ul>
                        <li>Срочная — от 10 лет, пожизненная или единовременная</li>
                        <li>
                          Доход не облагается НДФЛ в пределах <b>30 млн ₽</b> на договор, если
                          выплаты не раньше 10 лет, договор в свою пользу и счетов не больше трёх
                        </li>
                        <li>
                          При досрочном расторжении фонд удержит НДФЛ с дохода и с взносов,
                          по которым вы получали вычет
                        </li>
                      </ul>
                    </section>

                    <section className="rules__block">
                      <h3>ОПС: накопительная часть</h3>
                      <ul>
                        <li>
                          Накопления 2002–2013 годов можно перевести на счёт ПДС единовременным
                          взносом
                        </li>
                        <li>
                          Они не дают софинансирования и вычета, зато гарантируются государством
                          без лимита 2,8 млн ₽
                        </li>
                        <li>Досрочно их не выдают — только вместе с выплатами</li>
                      </ul>
                    </section>

                    <section className="rules__block">
                      <h3>Гарантии и наследство</h3>
                      <ul>
                        <li>
                          Взносы и доход застрахованы АСВ на <b>2,8 млн ₽</b>; софинансирование
                          и накопления ОПС — без ограничения
                        </li>
                        <li>Сбережения наследуются, кроме случая пожизненных выплат</li>
                        <li>
                          Правопреемникам нужно обратиться в фонд в течение шести месяцев
                        </li>
                      </ul>
                    </section>

                    <section className="rules__block">
                      <h3>Частые вопросы</h3>
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
                    </section>

                    <p className="rules__sources">
                      Источники:{" "}
                      <a
                        href="https://www.cbr.ru/faq/pens_k_inv/program/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Банк России о ПДС
                      </a>{" "}
                      и{" "}
                      <a
                        href="https://www.nalog.gov.ru/rn38/news/activities_fts/16549792/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        ФНС о вычете
                      </a>
                      . Правила зафиксированы на 2026 год, это не инвестиционная рекомендация
                    </p>
                  </article>
                ) : null}
              </div>
            </AnimatedHeight>
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
                    <RollingNumber value={Math.round(result.exitTax)} format={(n) => rub(n)} />
                  </dd>
                  <span className="stat__sub">
                    {result.taxExempt ? "доход освобождён до 30 млн" : "льготы нет"}
                  </span>
                </div>
                <div className="stat">
                  <dt>Выплата</dt>
                  <dd className="is-ok">
                    <RollingNumber
                      value={Math.round(result.payoutMonthly)}
                      format={(n) => rub(n)}
                    />
                    {scenario.payoutType === "lump" ? null : (
                      <span className="stat__unit"> / мес</span>
                    )}
                  </dd>
                  <span className="stat__sub">
                    {PAYOUT_LABELS[scenario.payoutType]}
                    {scenario.payoutType === "lifetime" ? " · ориентир на 22 года" : ""}
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
                  {payoutBigger
                    ? `ПДС даёт на ${rub(result.net - iis.net)} больше`
                    : `ПДС даёт на ${rub(iis.net - result.net)} меньше`}{" "}
                  — но деньги заперты до {PDS_RULES.payoutYears} лет
                </span>
              </div>

              <div className="summary__meta">
                <span>Возраст выплат — {result.payoutAge} лет</span>
                <span>
                  До выплат — {scenario.holdingYears} {yearsWord(scenario.holdingYears)}
                </span>
              </div>
            </div>
          </aside>
        </div>
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
