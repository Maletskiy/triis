import type { AccountResult, AccountType } from "../lib/calc";
import { ACCOUNT_ORDER, ACCOUNT_LABELS } from "../lib/calc";
import { compactRub, rub, yearsWord } from "../lib/format";
import { RollingNumber } from "./ui";

type Props = {
  results: Record<AccountType, AccountResult>;
  best: AccountType;
  onPick: (type: AccountType) => void;
};

const SHORT_NOTE: Record<AccountType, string> = {
  iis3: "ИИС-3: оба вычета — взнос и доход. Держать 5–10 лет.",
  iis1: "Тип А: вычет на взнос, доход облагается. 3 года.",
  iis2: "Тип Б: доход без налога, вычета на взнос нет. 3 года.",
};

export default function Compare({ results, best, onPick }: Props) {
  const top = results[best].net;

  return (
    <div className="compare">
      <p className="compare__lead">
        Одинаковые параметры, три типа счёта. Выгода считается от лучшего варианта.
      </p>

      <div className="compare__list">
        {ACCOUNT_ORDER.map((type) => {
          const result = results[type];
          const isBest = type === best;
          const gap = top - result.net;

          return (
            <button
              key={type}
              type="button"
              className={"card" + (isBest ? " card--best" : "") + (result.earlyClose ? " card--early" : "")}
              onClick={() => onPick(type)}
            >
              <span className="card__head">
                <span className="card__name">{ACCOUNT_LABELS[type]}</span>
                {isBest ? <span className="chip chip--best">выгоднее</span> : null}
                {result.earlyClose ? (
                  <span className="chip chip--warn">
                    рано: нужно {result.minHolding} {yearsWord(result.minHolding)}
                  </span>
                ) : null}
              </span>

              <span className="card__net">
                <RollingNumber value={result.net} format={(n) => rub(n)} />
              </span>

              <span className="card__note">{SHORT_NOTE[type]}</span>

              <span className="card__rows">
                <span>
                  Вычеты <b>{compactRub(result.refunds)}</b>
                </span>
                <span>
                  Налог <b>{compactRub(result.exitTax)}</b>
                </span>
                <span>
                  Срок <b>{result.minHolding} {yearsWord(result.minHolding)}</b>
                </span>
              </span>

              {!isBest && gap > 1 ? (
                <span className="card__gap">−{compactRub(gap)} к лучшему варианту</span>
              ) : (
                <span className="card__gap card__gap--best">лучший результат</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="compare__bars" aria-hidden="true">
        {ACCOUNT_ORDER.map((type) => {
          const share = top > 0 ? (results[type].net / top) * 100 : 0;
          return (
            <div key={type} className="compare__bar-row">
              <span className="compare__bar-label">{ACCOUNT_LABELS[type]}</span>
              <span className={"compare__bar" + (type === best ? " is-best" : "")}>
                <span className="compare__bar-fill" style={{ width: `${Math.max(2, share)}%` }} />
              </span>
              <span className="compare__bar-value">{compactRub(results[type].net)}</span>
            </div>
          );
        })}
      </div>

      <p className="compare__hint">
        Нажмите на карточку, чтобы посмотреть детали этого счёта.
      </p>
    </div>
  );
}
