import { useEffect, useState } from "react";
import type { AccountType, Scenario } from "../lib/calc";
import { compactRub, parseNumber, rub, yearsWord } from "../lib/format";
import { addYears, formatHuman, yearOf } from "../lib/dates";
import {
  DEDUCTION_BASE_LIMIT,
  OLD_IIS_CONTRIBUTION_LIMIT,
  marginalRate,
  ndfl,
} from "../lib/rules";
import { Section, Segmented, Toggle } from "./ui";
import DatePicker from "./DatePicker";

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
  format: (value: number) => string;
  parse?: (raw: string) => number;
  suffix?: string;
  onChange: (value: number) => void;
};

/**
 * Параметр в духе БКС: подпись, крупное поле значения и слайдер — всё в одной
 * плашке, чтобы глаз читал их как один контрол.
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
    const next = parse ? parse(raw) : Number(raw.replace(/[^\d.,]/g, "").replace(",", "."));
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

export default function Inputs({ scenario, onChange, account, onAccountChange }: Props) {
  const contributionLimit = account === "iis3" ? undefined : OLD_IIS_CONTRIBUTION_LIMIT;
  const overLimit =
    contributionLimit !== undefined && scenario.annualContribution > contributionLimit;

  const openYear = yearOf(scenario.openDate);
  const minHolding =
    account === "iis3" ? (openYear <= 2026 ? 5 : Math.min(10, 5 + (openYear - 2026))) : 3;

  const monthlyIncome = Math.round(scenario.officialIncome / 12);
  const incomeTax = ndfl(scenario.officialIncome);
  const rate = Math.round(marginalRate(scenario.officialIncome) * 100);
  const appliedRate = Math.round(
    (scenario.manualRate ?? marginalRate(scenario.officialIncome)) * 100,
  );
  const periods = scenario.periodsPerYear ?? 1;

  // старый счёт не мог быть открыт в будущем: подтягиваем дату к последнему доступному году
  useEffect(() => {
    if (account !== "iis3" && openYear > 2023) {
      onChange({ openDate: "2023-01-01" });
    }
  }, [account, openYear, onChange]);

  return (
    <div className="inputs">
      <Section title="Счёт">
        <Segmented
          label="Тип счёта"
          value={account}
          onChange={onAccountChange}
          options={[
            { value: "iis3", label: "ИИС-3", title: "Оба вычета: взнос и доход" },
            { value: "iis1", label: "Тип А", title: "Вычет на взнос, доход облагается" },
            { value: "iis2", label: "Тип Б", title: "Доход без налога, вычета на взнос нет" },
          ]}
        />
        <p className="inputs__note">
          {account === "iis3"
            ? "ИИС-3 — оба вычета сразу: возврат НДФЛ за взносы и освобождение дохода от налога."
            : account === "iis1"
              ? "Тип А — возврат НДФЛ с взносов. Доход на счёте облагается налогом при закрытии."
              : "Тип Б — доход освобождён от НДФЛ, но вычета на взнос нет."}
        </p>

        <div className="inputs__date">
          <span className="param__label">Дата открытия</span>
          <DatePicker
            label="Дата открытия счёта"
            value={scenario.openDate}
            onChange={(iso) => onChange({ openDate: iso })}
          />
          <p className="inputs__note">
            {account === "iis3" ? (
              <>
                Срок владения для этого счёта — <b>{minHolding} {yearsWord(minHolding)}</b>,
                закрыть без потери льгот можно с{" "}
                <b>{formatHuman(addYears(scenario.openDate, minHolding))}</b>.
              </>
            ) : (
              <>
                С 2024 года новые счета типа А и Б не открывают — здесь считается уже открытый,
                его минимальный срок — <b>3 года</b>.
              </>
            )}
          </p>
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
                : `закрыть можно с ${formatHuman(addYears(scenario.openDate, scenario.years))}`
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

          <div className="param param--choice">
            <span className="param__label">Частота реинвестирования</span>
            <Segmented
              label="Частота реинвестирования"
              value={String(periods)}
              onChange={(v) => onChange({ periodsPerYear: Number(v) })}
              options={[
                { value: "1", label: "Раз в год" },
                { value: "4", label: "Раз в квартал" },
                { value: "12", label: "Раз в месяц" },
              ]}
            />
            <span className="param__hint">
              {periods > 1
                ? `доход капитализируется ${periods} раз в год — итог немного выше`
                : "доход начисляется раз в год"}
            </span>
          </div>

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
            label="Официальный доход в месяц"
            value={monthlyIncome}
            min={0}
            max={2_000_000}
            step={1}
            format={(v) => v.toLocaleString("ru-RU")}
            parse={(raw) => parseNumber(raw.replace(/[^\d\s\u202F]/g, ""))}
            suffix="₽"
            onChange={(v) => onChange({ officialIncome: v * 12 })}
            hint={`в год ${compactRub(scenario.officialIncome)} · НДФЛ ≈ ${rub(incomeTax)} · ставка ${rate}%`}
          />

          <div className="param param--choice">
            <span className="param__label">Ставка НДФЛ</span>
            <Segmented
              label="Ставка НДФЛ"
              value={scenario.manualRate ? String(appliedRate) : "auto"}
              onChange={(v) => onChange({ manualRate: v === "auto" ? null : Number(v) / 100 })}
              options={[
                { value: "auto", label: "По доходу" },
                { value: "13", label: "13%" },
                { value: "15", label: "15%" },
                { value: "18", label: "18%" },
                { value: "20", label: "20%" },
                { value: "22", label: "22%" },
              ]}
            />
            <span className="param__hint">
              {scenario.manualRate
                ? "ставка задана вручную — её применяем к вычету и налогу с прибыли"
                : `сейчас берём предельную ставку по доходу — ${appliedRate}%`}
            </span>
          </div>
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
