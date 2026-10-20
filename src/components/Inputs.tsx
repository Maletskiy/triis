import { useEffect, useState } from "react";
import type { AccountType, Scenario } from "../lib/calc";
import { compactRub, parseNumber, rub, yearsWord } from "../lib/format";
import {
  DEDUCTION_BASE_LIMIT,
  OLD_IIS_CONTRIBUTION_LIMIT,
  marginalRate,
  ndfl,
} from "../lib/rules";
import { Section, Segmented, Toggle } from "./ui";

type Props = {
  scenario: Scenario;
  onChange: (patch: Partial<Scenario>) => void;
  account: AccountType;
  onAccountChange: (type: AccountType) => void;
};

type ParamProps = {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** как показать значение в поле ввода */
  format: (value: number) => string;
  /** как прочитать то, что ввели */
  parse?: (raw: string) => number;
  suffix?: string;
  onChange: (value: number) => void;
};

/**
 * Параметр в духе БКС: подпись, крупное поле значения и слайдер — всё в одной
 * плашке, чтобы глаз читал их как один контрол, а не как два.
 */
function Param({
  label,
  hint,
  value,
  min,
  max,
  step,
  format,
  parse,
  suffix,
  onChange,
}: ParamProps) {
  const [draft, setDraft] = useState(() => format(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (focused) return;
    setDraft(format(value));
  }, [value, focused, format]);

  const clamped = Math.min(Math.max(value, min), max);
  const percent = max > min ? ((clamped - min) / (max - min)) * 100 : 0;

  const commit = (raw: string) => {
    setDraft(raw);
    const next = parse
      ? parse(raw)
      : Number(raw.replace(/[^\d.,]/g, "").replace(",", "."));
    if (!Number.isFinite(next)) return;
    onChange(Math.min(max, Math.max(min, next)));
  };

  return (
    <div className={"param" + (focused ? " is-focused" : "")}>
      <span className="param__label">{label}</span>

      <div className="param__value">
        <input
          className="param__input"
          inputMode="numeric"
          aria-label={label}
          value={draft}
          onChange={(e) => commit(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setDraft(format(value));
          }}
        />
        {suffix ? <span className="param__unit">{suffix}</span> : null}
      </div>

      <div className="range">
        <div className="range__fill" style={{ width: `${percent}%` }} />
        <div className="range__ticks" aria-hidden="true">
          {[25, 50, 75].map((p) => (
            <span key={p} className="range__tick" style={{ left: `${p}%` }} />
          ))}
        </div>
        <div className="range__thumb" style={{ left: `${percent}%` }} />
        <input
          className="range__input"
          type="range"
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={clamped}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>

      {hint ? <span className="param__hint">{hint}</span> : null}
    </div>
  );
}

const YEAR_MIN = 2024;
const YEAR_MAX = 2032;

export default function Inputs({ scenario, onChange, account, onAccountChange }: Props) {
  const contributionLimit = account === "iis3" ? undefined : OLD_IIS_CONTRIBUTION_LIMIT;
  const overLimit =
    contributionLimit !== undefined && scenario.annualContribution > contributionLimit;

  const minHolding =
    account === "iis3"
      ? scenario.openYear <= 2026
        ? 5
        : Math.min(10, 5 + (scenario.openYear - 2026))
      : 3;

  const incomeTax = ndfl(scenario.officialIncome);
  const rate = Math.round(marginalRate(scenario.officialIncome) * 100);

  return (
    <div className="inputs">
      <Section title="Счёт" hint="От типа счёта зависят льготы, срок владения и лимиты">
        <Segmented
          label="Тип счёта"
          value={account}
          onChange={onAccountChange}
          options={[
            { value: "iis3", label: "ИИС-3" },
            { value: "iis1", label: "ИИС-1" },
            { value: "iis2", label: "ИИС-2" },
          ]}
        />
        <div className="inputs__year">
          <Segmented
            label="Год открытия"
            value={String(scenario.openYear)}
            onChange={(v) => onChange({ openYear: Number(v) })}
            options={Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => ({
              value: String(YEAR_MIN + i),
              label: String(YEAR_MIN + i),
            }))}
          />
        </div>
      </Section>

      <Section
        title="Параметры расчёта"
        hint="Взносы, срок, доходность и инфляция — всё, из чего складывается итог"
      >
        <div className="params">
          <Param
            label="Пополняю каждый год"
            value={scenario.annualContribution}
            min={0}
            max={contributionLimit ?? 2_000_000}
            step={1}
            format={(v) => v.toLocaleString("ru-RU")}
            parse={(raw) => parseNumber(raw.replace(/[^\d\s\u202F]/g, ""))}
            suffix="₽"
            onChange={(v) => onChange({ annualContribution: v })}
            hint={
              overLimit
                ? `У этого счёта лимит ${compactRub(OLD_IIS_CONTRIBUTION_LIMIT)} в год — сумма урезана`
                : `это ${compactRub(Math.round(scenario.annualContribution / 12))} в месяц · вычет считается с базы ${compactRub(DEDUCTION_BASE_LIMIT)}`
            }
          />

          <Param
            label="Срок"
            value={scenario.years}
            min={1}
            max={30}
            step={1}
            format={(v) => String(v)}
            suffix={yearsWord(scenario.years)}
            onChange={(v) => onChange({ years: v })}
            hint={
              scenario.years < minHolding
                ? `Минимум для этого счёта — ${minHolding} ${yearsWord(minHolding)}: закроете раньше, вычеты придётся вернуть`
                : `счёт закроется в ${scenario.openYear + scenario.years} году`
            }
          />

          <Param
            label="Доходность"
            value={scenario.returnPct}
            min={0}
            max={30}
            step={0.5}
            format={(v) => v.toLocaleString("ru-RU")}
            suffix="% годовых"
            onChange={(v) => onChange({ returnPct: v })}
            hint="среднегодовая доходность портфеля за весь срок"
          />

          <Param
            label="Инфляция"
            value={scenario.inflationPct}
            min={0}
            max={20}
            step={0.5}
            format={(v) => v.toLocaleString("ru-RU")}
            suffix="% годовых"
            onChange={(v) => onChange({ inflationPct: v })}
            hint="на неё делим итог, чтобы показать деньги в сегодняшних ценах"
          />

          <Param
            label="Официальный доход за год"
            value={scenario.officialIncome}
            min={0}
            max={20_000_000}
            step={1}
            format={(v) => v.toLocaleString("ru-RU")}
            parse={(raw) => parseNumber(raw.replace(/[^\d\s\u202F]/g, ""))}
            suffix="₽"
            onChange={(v) => onChange({ officialIncome: v })}
            hint={`НДФЛ за год ≈ ${rub(incomeTax)} · предельная ставка ${rate}%`}
          />
        </div>

        <Toggle
          checked={scenario.reinvestRefunds}
          onChange={(v) => onChange({ reinvestRefunds: v })}
          label="Возвращать вычет обратно на счёт"
          hint="Основной сценарий — деньги работают дальше, а не лежат на карте"
        />
      </Section>
    </div>
  );
}
