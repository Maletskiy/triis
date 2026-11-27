import { useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import LikeButton from "../components/LikeButton";
import WakeSlider from "../components/WakeSlider";
import { RollingNumber, Toggle } from "../components/ui";
import { parseNumber, rub, yearsWord } from "../lib/format";
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

function AmountField({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
  suffix = "₽",
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  suffix?: string;
}) {
  const [draft, setDraft] = useState(() => money(value));
  const [focused, setFocused] = useState(false);

  return (
    <div className="pds__field">
      <label className="pds__label" htmlFor="">
        <span>{label}</span>
        {hint ? <span className="pds__hint">{hint}</span> : null}
      </label>
      <div className="pds__value">
        <input
          className="pds__input ym-disable-keys"
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
          onBlur={() => setFocused(false)}
        />
        <span className="pds__suffix">{suffix}</span>
      </div>
      <WakeSlider
        value={value}
        min={min}
        max={max}
        step={step}
        label={label}
        onChange={onChange}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  suffix: string;
}) {
  return (
    <div className="pds__field">
      <label className="pds__label">
        <span>{label}</span>
      </label>
      <div className="pds__value">
        <input
          className="pds__input ym-disable-keys"
          inputMode="numeric"
          aria-label={label}
          value={String(value)}
          onChange={(event) => {
            const next = parseNumber(event.target.value);
            onChange(Math.min(max, Math.max(min, next)));
          }}
        />
        <span className="pds__suffix">{suffix}</span>
      </div>
      <WakeSlider
        value={value}
        min={min}
        max={max}
        step={1}
        label={label}
        onChange={onChange}
      />
    </div>
  );
}

export default function Pds() {
  const [scenario, setScenario] = useState<PdsScenario>(PDS_DEFAULTS);
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
  if (scenario.reinvestRefunds) {
    warnings.push("Вычеты возвращаются на счёт — они тоже работают и попадают в капитал");
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

      <div className="pds__grid">
        <section className="pds__card pds__card--inputs" aria-label="Параметры">
          <h2 className="pds__card-title">Параметры</h2>

          <AmountField
            label="Доход в месяц"
            hint="до вычета НДФЛ"
            value={scenario.monthlyIncome}
            min={20_000}
            max={500_000}
            step={10_000}
            onChange={(value) => patch({ monthlyIncome: value })}
          />

          <AmountField
            label="Взнос в год"
            hint="сколько вносите на счёт"
            value={scenario.annualContribution}
            min={0}
            max={400_000}
            step={10_000}
            onChange={(value) => patch({ annualContribution: value })}
          />

          <div className="pds__two">
            <NumberField
              label="Лет пополняем"
              value={scenario.contributionYears}
              min={1}
              max={20}
              suffix="лет"
              onChange={(value) => patch({ contributionYears: value })}
            />
            <NumberField
              label="Лет до выплат"
              value={scenario.holdingYears}
              min={1}
              max={30}
              suffix="лет"
              onChange={(value) => patch({ holdingYears: value })}
            />
          </div>

          <div className="pds__two">
            <AmountField
              label="Доходность"
              value={scenario.returnPct}
              min={0}
              max={25}
              step={1}
              suffix="%"
              onChange={(value) => patch({ returnPct: value })}
            />
            <AmountField
              label="Инфляция"
              value={scenario.inflationPct}
              min={0}
              max={15}
              step={1}
              suffix="%"
              onChange={(value) => patch({ inflationPct: value })}
            />
          </div>

          <AmountField
            label="Взносы на ИИС-3 в год"
            hint="лимит вычета 400 000 ₽ общий"
            value={scenario.iis3Contribution}
            min={0}
            max={400_000}
            step={10_000}
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
        </section>

        <aside className="pds__summary" aria-label="Итог">
          <div className="pds__hero">
            <span className="pds__hero-label">На счёте к выплатам</span>
            <span className="pds__hero-value">
              <RollingNumber value={Math.round(result.capital)} format={(n) => rub(n)} />
            </span>
            <span className="pds__hero-sub">
              на руки в сегодняшних ценах — {rub(result.netReal)}
            </span>
          </div>

          <dl className="pds__stats">
            <div className="pds__stat">
              <dt>Господдержка</dt>
              <dd className="is-ok">{rub(result.cofinancing)}</dd>
              <span className="pds__stat-sub">
                {rate === 1 ? "1:1 по взносам" : rate === 0.5 ? "1:2, половина взносов" : "1:4, четверть взносов"}
              </span>
            </div>
            <div className="pds__stat">
              <dt>Вычет за срок</dt>
              <dd>{rub(result.refunds)}</dd>
              <span className="pds__stat-sub">ставка НДФЛ ≈ {(taxRate * 100).toFixed(0)}%</span>
            </div>
            <div className="pds__stat">
              <dt>Налог при выплатах</dt>
              <dd className={result.exitTax > 0 ? "is-warn" : "is-ok"}>
                {result.exitTax > 0 ? rub(result.exitTax) : "0 ₽"}
              </dd>
              <span className="pds__stat-sub">
                {result.taxExempt ? "доход освобождён до 30 млн" : "льготы нет"}
              </span>
            </div>
            <div className="pds__stat">
              <dt>Ваши взносы</dt>
              <dd>{rub(result.contributions)}</dd>
              <span className="pds__stat-sub">за {scenario.contributionYears} {yearsWord(scenario.contributionYears)}</span>
            </div>
          </dl>

          <div className="pds__compare">
            <span className="pds__compare-title">Тот же взнос в ИИС-3</span>
            <span className="pds__compare-value">{rub(iis.net)}</span>
            <span className="pds__compare-sub">
              {result.net >= iis.net
                ? `ПДС даёт на ${rub(result.net - iis.net)} больше`
                : `ПДС даёт на ${rub(iis.net - result.net)} меньше`}{" "}
              — но деньги заперты до {PDS_RULES.payoutYears} лет
            </span>
          </div>
        </aside>
      </div>

      {warnings.length > 0 && (
        <ul className="pds__notes">
          {warnings.map((text) => (
            <li key={text} className="pds__note">
              {text}
            </li>
          ))}
        </ul>
      )}

      <section className="pds__card pds__table" aria-label="Расчёт по годам">
        <h2 className="pds__card-title">Расчёт по годам</h2>
        <div className="pds__table-wrap">
          <table className="pds__table-el">
            <thead>
              <tr>
                <th scope="col">Год</th>
                <th scope="col">Взнос</th>
                <th scope="col">Господдержка</th>
                <th scope="col">Вычет</th>
                <th scope="col">Доход за год</th>
                <th scope="col">Капитал</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.year}>
                  <th scope="row">{row.year}</th>
                  <td>{rub(row.contribution)}</td>
                  <td>{rub(row.cofinancing)}</td>
                  <td>{rub(row.refund)}</td>
                  <td>{rub(row.growth)}</td>
                  <td>{rub(row.capital)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Итого</th>
                <td>{rub(result.contributions)}</td>
                <td>{rub(result.cofinancing)}</td>
                <td>{rub(result.refunds)}</td>
                <td>{rub(result.profit - result.cofinancing)}</td>
                <td>{rub(result.capital)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="pds__about" aria-label="Как это работает">
        <h2 className="pds__h2">Как это работает</h2>
        <div className="pds__cards">
          <article className="pds__card">
            <h3 className="pds__card-title">Софинансирование</h3>
            <p>
              Государство добавляет до 36 000 ₽ в год десять лет подряд, если вносить
              не меньше 2 000 ₽ за год. Коэффициент зависит от среднемесячного дохода:
              до 80 000 ₽ — рубль на рубль, до 150 000 ₽ — половина, выше — четверть
            </p>
          </article>
          <article className="pds__card">
            <h3 className="pds__card-title">Вычет</h3>
            <p>
              Возврат НДФЛ с личных взносов в пределах 400 000 ₽ в год и не больше
              уплаченного налога. Лимит общий с ИИС-3 и НПО, поэтому часть взносов
              может уйти в другой продукт — калькулятор это учитывает
            </p>
          </article>
          <article className="pds__card">
            <h3 className="pds__card-title">Выплаты</h3>
            <p>
              Через 15 лет договора или в 55/60 лет. Доход при выплатах не облагается
              НДФЛ в пределах 30 млн ₽, если договор в свою пользу и выплаты не раньше
              чем через 10 лет. При досрочном расторжении льготы теряются
            </p>
          </article>
        </div>
      </section>

      <section className="pds__faq" aria-label="Частые вопросы">
        <h2 className="pds__h2">Частые вопросы</h2>
        {PDS_FAQ.map((item) => (
          <details key={item.question} className="pds__faq-item">
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
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
