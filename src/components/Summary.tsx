import type { AccountResult, Scenario } from "../lib/calc";
import { compactRub, pct, rub, yearsWord } from "../lib/format";
import { AnimatedValue } from "./ui";

type Props = {
  result: AccountResult;
  scenario: Scenario;
};

export type Warning = { tone: "warn" | "info"; text: string };

export function collectWarnings(result: AccountResult, scenario: Scenario): Warning[] {
  const list: Warning[] = [];

  if (result.earlyClose) {
    list.push({
      tone: "warn",
      text: `Счёт закрывается на ${scenario.years} ${yearsWord(scenario.years)} — это раньше минимального срока в ${result.minHolding} ${yearsWord(result.minHolding)}. Вычеты придётся вернуть (${rub(result.clawback)}), а с прибыли заплатить налог.`,
    });
  }

  if (scenario.officialIncome <= 0) {
    list.push({
      tone: "warn",
      text: "Без официального дохода возвращать нечего: вычет ограничен уплаченным НДФЛ.",
    });
  }

  if (result.refunds < scenario.annualContribution * 0.13 * scenario.years * 0.999 && result.refunds > 0) {
    list.push({
      tone: "info",
      text: "Вычет упёрся в предел: он считается только с 400 000 ₽ взносов в год и не больше уплаченного НДФЛ.",
    });
  }

  if (result.type !== "iis3" && scenario.annualContribution > 1_000_000) {
    list.push({
      tone: "info",
      text: "У ИИС-1 и ИИС-2 есть лимит взноса 1 млн ₽ в год — излишек в расчёте не участвует.",
    });
  }

  return list;
}

export default function Summary({ result, scenario }: Props) {
  const warnings = collectWarnings(result, scenario);
  const profitToUser = result.grossCapital - result.contributions;

  return (
    <div className="summary">
      <div className="summary__hero">
        <span className="summary__hero-label">На руки после закрытия</span>
        <span className="summary__hero-value">
          <AnimatedValue value={result.net} format={(n) => rub(n)} />
        </span>
        <span className="summary__hero-sub">
          в ценах сегодняшнего дня — <b>{compactRub(result.netReal)}</b>
        </span>
      </div>

      <dl className="stats">
        <div className="stat">
          <dt>Вычеты за срок</dt>
          <dd>
            <AnimatedValue value={result.refunds} format={(n) => rub(n)} />
          </dd>
          <span className="stat__sub">вернёт налоговая</span>
        </div>
        <div className="stat">
          <dt>Капитал на счёте</dt>
          <dd>
            <AnimatedValue value={result.grossCapital} format={(n) => rub(n)} />
          </dd>
          <span className="stat__sub">{compactRub(profitToUser)} дохода</span>
        </div>
        <div className="stat">
          <dt>Налог при закрытии</dt>
          <dd className={result.exitTax > 0 ? "is-warn" : "is-ok"}>
            <AnimatedValue value={result.exitTax} format={(n) => rub(n)} />
          </dd>
          <span className="stat__sub">
            {result.type === "iis3"
              ? "прибыль освобождена до 30 млн ₽"
              : result.type === "iis2"
                ? "прибыль не облагается"
                : "13% с прибыли до 2,4 млн, дальше 15%"}
          </span>
        </div>
        <div className="stat">
          <dt>Ваши взносы</dt>
          <dd>{rub(result.contributions)}</dd>
          <span className="stat__sub">
            {scenario.reinvestRefunds ? "вычеты реинвестируются" : "вычеты забираете деньгами"}
          </span>
        </div>
      </dl>

      {result.earlyClose && result.earlyPenalty > 0 ? (
        <div className="callout callout--warn">
          <span className="callout__title">Досрочное закрытие стоит {compactRub(result.earlyPenalty)}</span>
          <span className="callout__text">
            Продержите до {result.minHolding} {yearsWord(result.minHolding)} — и льгота сохранится.
          </span>
        </div>
      ) : null}

      {warnings.map((warning) => (
        <div key={warning.text} className={"callout callout--" + warning.tone}>
          <span className="callout__text">{warning.text}</span>
        </div>
      ))}

      <div className="summary__meta">
        <span>
          Минимальный срок владения — {result.minHolding} {yearsWord(result.minHolding)}
        </span>
        <span>
          Эффективная доходность — {pct(effectiveRate(result, scenario.years), 1)} годовых
        </span>
      </div>
    </div>
  );
}

/** Простая годовая ставка, при которой взносы дали бы такой же итог. */
function effectiveRate(result: AccountResult, years: number): number {
  const invested = result.contributions;
  if (invested <= 0 || years <= 0) return 0;
  const ratio = result.net / invested;
  if (ratio <= 0) return 0;
  return (Math.pow(ratio, 1 / years) - 1) * 100;
}
