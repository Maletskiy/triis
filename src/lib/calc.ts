import {
  DEDUCTION_BASE_LIMIT,
  IIS3_PROFIT_EXEMPT_LIMIT,
  OLD_IIS_CONTRIBUTION_LIMIT,
  OLD_IIS_MIN_YEARS,
  iis3MinYears,
  marginalRate,
  ndfl,
  taxOnGains,
} from "./rules";

export type AccountType = "iis3" | "iis1" | "iis2";

export const ACCOUNT_ORDER: AccountType[] = ["iis3", "iis1", "iis2"];

export const ACCOUNT_LABELS: Record<AccountType, string> = {
  iis3: "ИИС-3",
  iis1: "ИИС-1",
  iis2: "ИИС-2",
};

export type Scenario = {
  /** Сколько вносим каждый год, ₽ */
  annualContribution: number;
  /** На сколько лет открываем счёт */
  years: number;
  /** Ожидаемая доходность, % годовых */
  returnPct: number;
  /** Инфляция, % годовых */
  inflationPct: number;
  /** Официальный годовой доход до НДФЛ, ₽ */
  officialIncome: number;
  /** Возвращать вычет обратно на счёт */
  reinvestRefunds: boolean;
  /** Год открытия счёта */
  openYear: number;
};

export type YearRow = {
  year: number;
  contribution: number;
  /** Вычет за взносы этого года: деньги приходят в следующем году */
  refund: number;
  /** Инвестиционный доход за год, ₽ */
  growth: number;
  /** Капитал на конец года, ₽ */
  capital: number;
};

export type AccountResult = {
  type: AccountType;
  label: string;
  rows: YearRow[];
  /** Сумма собственных взносов за весь срок */
  contributions: number;
  /** Все полученные вычеты за срок */
  refunds: number;
  /** Инвестиционный доход на момент закрытия */
  profit: number;
  /** Капитал на счёте до налога при закрытии */
  grossCapital: number;
  /** Налог на прибыль при закрытии */
  exitTax: number;
  /** Итого на руки: капитал минус налог плюс нереинвестированные вычеты */
  net: number;
  /** То же в ценах сегодняшнего дня */
  netReal: number;
  /** Минимальный срок владения для этого типа счёта */
  minHolding: number;
  /** Счёт закрывается раньше минимального срока */
  earlyClose: boolean;
  /** Сколько лет не хватает до минимального срока */
  yearsShort: number;
  /** Сколько вычетов придётся вернуть при досрочном закрытии */
  clawback: number;
  /** Потерянная выгода от досрочного закрытия, ₽ */
  earlyPenalty: number;
};

type Core = Omit<AccountResult, "earlyPenalty">;

function nonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Минимальный срок владения по типу счёта и году открытия. */
export function minHoldingYears(type: AccountType, openYear: number): number {
  return type === "iis3" ? iis3MinYears(openYear) : OLD_IIS_MIN_YEARS;
}

/**
 * Ядро расчёта на заданном горизонте.
 * Взнос делается в начале года, вычет приходит в начале следующего года.
 */
function simulateCore(type: AccountType, scenario: Scenario, years: number): Core {
  const contribution =
    type === "iis3"
      ? nonNegative(scenario.annualContribution)
      : Math.min(
          nonNegative(scenario.annualContribution),
          OLD_IIS_CONTRIBUTION_LIMIT,
        );

  const minHolding = minHoldingYears(type, scenario.openYear);
  const rate = nonNegative(scenario.returnPct) / 100;
  const horizon = Math.max(0, Math.floor(years));
  const income = nonNegative(scenario.officialIncome);
  const incomeTax = ndfl(income);
  const baseRate = marginalRate(income);

  const rows: YearRow[] = [];
  let capital = 0;
  let contributionsTotal = 0;
  let refundsTotal = 0;
  let reinvestedTotal = 0;
  let pendingRefund = 0;

  for (let year = 1; year <= horizon; year += 1) {
    if (scenario.reinvestRefunds && pendingRefund > 0) {
      capital += pendingRefund;
      reinvestedTotal += pendingRefund;
    }
    pendingRefund = 0;

    const startCapital = capital;
    capital = (capital + contribution) * (1 + rate);
    contributionsTotal += contribution;
    const growth = capital - startCapital - contribution;

    const deductibleBase = Math.min(contribution, DEDUCTION_BASE_LIMIT);
    // Вычет не может превышать реально уплаченный за год НДФЛ.
    const refund =
      type === "iis2" ? 0 : Math.min(deductibleBase * baseRate, incomeTax);
    refundsTotal += refund;
    pendingRefund = refund;

    rows.push({
      year,
      contribution,
      refund,
      growth,
      capital,
    });
  }

  const grossCapital = capital;
  const profit = grossCapital - contributionsTotal - reinvestedTotal;

  const earlyClose = horizon < minHolding;
  const yearsShort = Math.max(0, minHolding - horizon);

  let exitTax: number;
  let clawback = 0;

  if (earlyClose) {
    // Льготы сгорают: полученные вычеты возвращаются, прибыль облагается НДФЛ.
    exitTax = taxOnGains(Math.max(0, profit));
    clawback = refundsTotal;
  } else if (type === "iis3") {
    // Освобождение прибыли с лимитом 30 млн ₽ за весь срок владения.
    const taxableProfit = Math.max(0, profit - IIS3_PROFIT_EXEMPT_LIMIT);
    exitTax = taxOnGains(taxableProfit);
  } else if (type === "iis1") {
    exitTax = taxOnGains(Math.max(0, profit));
  } else {
    // ИИС-2: прибыль освобождена полностью.
    exitTax = 0;
  }

  const cashRefunds = refundsTotal - reinvestedTotal;
  const net = grossCapital - exitTax + cashRefunds - clawback;

  const inflation = nonNegative(scenario.inflationPct) / 100;
  const netReal = net / Math.pow(1 + inflation, horizon);

  return {
    type,
    label: ACCOUNT_LABELS[type],
    rows,
    contributions: contributionsTotal,
    refunds: refundsTotal,
    profit,
    grossCapital,
    exitTax,
    net,
    netReal,
    minHolding,
    earlyClose,
    yearsShort,
    clawback,
  };
}

export function simulate(type: AccountType, scenario: Scenario): AccountResult {
  const core = simulateCore(type, scenario, scenario.years);

  let earlyPenalty = 0;
  if (core.earlyClose) {
    // Что было бы, если додержать до минимального срока, продолжая вносить взносы.
    const held = simulateCore(type, scenario, core.minHolding);
    earlyPenalty = Math.max(0, held.net - core.net);
  }

  return { ...core, earlyPenalty };
}

export function compare(scenario: Scenario): Record<AccountType, AccountResult> {
  return {
    iis3: simulate("iis3", scenario),
    iis1: simulate("iis1", scenario),
    iis2: simulate("iis2", scenario),
  };
}

/** Тип счёта, который при этих параметрах даёт больше всего на руки. */
export function bestAccount(
  results: Record<AccountType, AccountResult>,
): AccountType {
  return ACCOUNT_ORDER.reduce((best, type) =>
    results[type].net > results[best].net ? type : best,
  );
}
