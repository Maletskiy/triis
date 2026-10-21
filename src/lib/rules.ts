/**
 * Правила и ставки на 2026 год.
 *
 * Источники:
 * - НДФЛ: пятиступенчатая шкала с 2025 года (ФНС, 13/15/18/20/22%).
 * - Вычет на взносы по ИИС: база до 400 000 ₽ в год, ставка НДФЛ налогоплательщика.
 * - ИИС-3: освобождение прибыли с лимитом 30 млн ₽, лимита взносов нет,
 *   минимальный срок 5 лет для счетов 2024–2026 годов, далее +1 год ежегодно до 10.
 * - Тип А (бывший ИИС-1) / тип Б (бывший ИИС-2): срок 3 года, лимит взноса 1 млн ₽.
 */

export const RULES_YEAR = 2026;

/** База вычета на взносы: не более 400 000 ₽ в год (общая с ПДС и НПО). */
export const DEDUCTION_BASE_LIMIT = 400_000;

/** Лимит взносов на ИИС старого типа (1 и 2) — 1 млн ₽ в год. */
export const OLD_IIS_CONTRIBUTION_LIMIT = 1_000_000;

/** Лимит освобождения прибыли на ИИС-3 — 30 млн ₽ за весь срок владения. */
export const IIS3_PROFIT_EXEMPT_LIMIT = 30_000_000;

/** Минимальный срок владения для типов А и Б (бывшие ИИС-1 и ИИС-2). */
export const OLD_IIS_MIN_YEARS = 3;

export type Bracket = { upTo: number; rate: number };

/** Шкала НДФЛ 2026: ставка применяется только к сумме превышения. */
export const NDFL_BRACKETS: Bracket[] = [
  { upTo: 2_400_000, rate: 0.13 },
  { upTo: 5_000_000, rate: 0.15 },
  { upTo: 20_000_000, rate: 0.18 },
  { upTo: 50_000_000, rate: 0.2 },
  { upTo: Infinity, rate: 0.22 },
];

/** НДФЛ с годового дохода по прогрессивной шкале. */
export function ndfl(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  let previous = 0;
  for (const bracket of NDFL_BRACKETS) {
    const slice = Math.min(taxableIncome, bracket.upTo) - previous;
    if (slice > 0) tax += slice * bracket.rate;
    if (taxableIncome <= bracket.upTo) break;
    previous = bracket.upTo;
  }
  return tax;
}

/** Предельная (последняя применяемая) ставка для дохода. */
export function marginalRate(taxableIncome: number): number {
  for (const bracket of NDFL_BRACKETS) {
    if (taxableIncome <= bracket.upTo) return bracket.rate;
  }
  return NDFL_BRACKETS[NDFL_BRACKETS.length - 1].rate;
}

/** Налог на добавку к доходу: разница НДФЛ по шкале, а не «плоская» ставка. */
export function ndflOnTop(income: number, extra: number): number {
  if (extra <= 0) return 0;
  return ndfl(income + extra) - ndfl(income);
}

/**
 * НДФЛ с прибыли от инвестиций считается по отдельной базе —
 * двухступенчатая шкала 13/15%, как у дивидендов.
 */
export function taxOnGains(gain: number, manualRate?: number | null): number {
  if (gain <= 0) return 0;
  if (manualRate && manualRate > 0) return gain * manualRate;
  const first = Math.min(gain, NDFL_BRACKETS[0].upTo) * NDFL_BRACKETS[0].rate;
  const rest = Math.max(0, gain - NDFL_BRACKETS[0].upTo) * NDFL_BRACKETS[1].rate;
  return first + rest;
}

/**
 * Минимальный срок владения ИИС-3 по году открытия.
 * 2024–2026 — 5 лет; с 2027 года +1 год ежегодно до 10.
 */
export function iis3MinYears(openYear: number): number {
  if (openYear <= 2026) return 5;
  return Math.min(10, 5 + (openYear - 2026));
}
