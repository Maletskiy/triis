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

const money = (value: number) => (value > 0 ? value.toLocaleString("ru-RU") : "");
const parseMoney = (raw: string) => parseNumber(raw.replace(/[^\d\s\u202F]/g, ""));

/** Крупное поле значения: одно число и единица измерения. */
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

  useEffect(() => {
    if (!focused) setDraft(money(value));
  }, [value, focused]);

  return (
    <div className="param__value">
      <input
        className="param__input"
        inputMode="numeric"
        aria-label={label}
        value={draft}
        onChange={(event) => {
          const next = parseMoney(event.target.value);
          setDraft(next > 0 ? next.toLocaleString("ru-RU") : "");
          onChange(next);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setDraft(money(value));
        }}
      />
      {suffix ? <span className="param__unit">{suffix}</span> : null}
    </div>
  );
}

/** Ползунок под значением: заполнение, деления и бегунок. */
function RangeTrack({
  value,
  min,
  max,
  step,
  label,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  label: string;
  onChange: (value: number) => void;
}) {
  const clamped = Math.min(Math.max(value, min), max);
  const percent = max > min ? ((clamped - min) / (max - min)) * 100 : 0;

  return (
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
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

/** Параметр с подписью, значением и ползунком. */
function Param({
  label,
  hint,
  value,
  min,
  max,
  step,
  suffix,
  wide,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  wide?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className={"param" + (wide ? " param--wide" : "")}>
      <span className="param__label">{label}</span>
      <MoneyValue value={value} onChange={onChange} label={label} suffix={suffix} />
      <RangeTrack value={value} min={min} max={max} step={step} label={label} onChange={onChange} />
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
  const custom = scenario.contributionMode === "custom";
  const planTotal = scenario.contributions
    .slice(0, scenario.years)
    .reduce((sum, value) => sum + value, 0);

  // старый счёт не мог быть открыт в будущем: подтягиваем дату к последнему доступному году
  useEffect(() => {
    if (account !== "iis3" && openYear > 2023) {
      onChange({ openDate: "2023-01-01" });
    }
  }, [account, openYear, onChange]);

  // в режиме своих сумм длина списка совпадает со сроком
  useEffect(() => {
    if (!custom) return;
    if (scenario.contributions.length === scenario.years) return;
    const fallback =
      scenario.contributions[scenario.contributions.length - 1] ?? scenario.annualContribution;
    const next = Array.from(
      { length: scenario.years },
      (_, index) => scenario.contributions[index] ?? fallback,
    );
    onChange({ contributions: next });
  }, [custom, scenario.contributions, scenario.years, scenario.annualContribution, onChange]);

  const setContribution = (index: number, value: number) => {
    const next = [...scenario.contributions];
    while (next.length < scenario.years) next.push(next[next.length - 1] ?? 0);
    next[index] = value;
    onChange({ contributions: next });
  };

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
            wide
            label="Официальный доход в месяц"
            value={monthlyIncome}
            min={0}
            max={2_000_000}
            step={1}
            suffix="₽"
            onChange={(v) => onChange({ officialIncome: v * 12 })}
            hint={`в год ${compactRub(scenario.officialIncome)} · НДФЛ ≈ ${rub(incomeTax)} · ставка ${rate}%`}
          />

          <div className="param param--wide">
            <span className="param__label">Взносы на счёт</span>
            <Segmented
              label="Как задаём взносы"
              value={scenario.contributionMode}
              onChange={(v) => onChange({ contributionMode: v })}
              options={[
                { value: "uniform", label: "Одна сумма на все годы" },
                { value: "custom", label: "Разные суммы по годам" },
              ]}
            />

            {custom ? (
              <>
                <div className="plan">
                  {Array.from({ length: scenario.years }, (_, index) => (
                    <label
                      className="plan__row"
                      key={index}
                      style={{ animationDelay: `${Math.min(index, 12) * 28}ms` }}
                    >
                      <span className="plan__year">
                        {openYear + index}
                      </span>
                      <span className="plan__field">
                        <input
                          className="plan__input"
                          inputMode="numeric"
                          aria-label={`Взнос в ${openYear + index} году`}
                          value={money(scenario.contributions[index] ?? 0)}
                          onChange={(event) =>
                            setContribution(index, parseMoney(event.target.value))
                          }
                        />
                        <span className="plan__unit">₽</span>
                      </span>
                    </label>
                  ))}
                </div>
                <span className="param__hint">
                  всего за {scenario.years} {yearsWord(scenario.years)} — {rub(planTotal)} · вычет
                  считается с базы {compactRub(DEDUCTION_BASE_LIMIT)} в год
                </span>
              </>
            ) : (
              <>
                <MoneyValue
                  value={scenario.annualContribution}
                  onChange={(v) => onChange({ annualContribution: v })}
                  label="Пополняю каждый год"
                  suffix="₽"
                />
                <RangeTrack
                  value={Math.min(scenario.annualContribution, contributionLimit ?? 2_000_000)}
                  min={0}
                  max={contributionLimit ?? 2_000_000}
                  step={1000}
                  label="Пополняю каждый год"
                  onChange={(v) => onChange({ annualContribution: v })}
                />
                <span className="param__hint">
                  {overLimit
                    ? `У этого счёта лимит ${compactRub(OLD_IIS_CONTRIBUTION_LIMIT)} в год — сумма урезана`
                    : `это ${compactRub(Math.round(scenario.annualContribution / 12))} в месяц · вычет считается с базы ${compactRub(DEDUCTION_BASE_LIMIT)}`}
                </span>
              </>
            )}
          </div>

          <Param
            label="Срок"
            value={scenario.years}
            min={1}
            max={30}
            step={1}
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
            suffix="% годовых"
            onChange={(v) => onChange({ inflationPct: v })}
            hint="на неё делим итог, чтобы показать деньги в сегодняшних ценах"
          />

          <div className="param param--wide param--choice">
            <span className="param__label">Частота реинвестирования</span>
            <Segmented
              label="Частота реинвестирования"
              value={String(periods)}
              onChange={(v) => onChange({ periodsPerYear: Number(v) })}
              options={[
                { value: "1", label: "Раз в год" },
                { value: "2", label: "Раз в полгода" },
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

          <Toggle
            checked={scenario.manualRate !== null}
            onChange={(enabled) =>
              onChange({ manualRate: enabled ? marginalRate(scenario.officialIncome) : null })
            }
            label="Задать ставку НДФЛ вручную"
            hint={
              scenario.manualRate
                ? "ставка из дохода выше не используется — считаем по выбранной"
                : `по умолчанию берём предельную ставку по доходу — ${appliedRate}%`
            }
          />

          {scenario.manualRate !== null ? (
            <div className="param param--wide param--choice appear" key="rate">
              <span className="param__label">Ставка НДФЛ</span>
              <Segmented
                label="Ставка НДФЛ"
                value={String(appliedRate)}
                onChange={(v) => onChange({ manualRate: Number(v) / 100 })}
                options={[
                  { value: "13", label: "13%" },
                  { value: "15", label: "15%" },
                  { value: "18", label: "18%" },
                  { value: "20", label: "20%" },
                  { value: "22", label: "22%" },
                ]}
              />
              <span className="param__hint">
                применяем эту ставку к вычету на взнос и к налогу с прибыли
              </span>
            </div>
          ) : null}
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
