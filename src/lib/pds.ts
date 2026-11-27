import { DEDUCTION_BASE_LIMIT, marginalRate, ndfl, taxOnGains } from "./rules";

/**
 * Правила программы долгосрочных сбережений (ПДС) на 2026 год.
 *
 * Источники:
 * - Банк России, «Условия и возможности Программы долгосрочных сбережений»:
 *   софинансирование до 36 000 ₽ в год при взносах от 2 000 ₽, десять лет;
 *   выплаты через 15 лет договора или в 55/60 лет; гарантия 2,8 млн ₽;
 *   освобождение дохода в пределах 30 млн ₽ при выплатах не раньше 10 лет.
 * - НК РФ, вычеты на долгосрочные сбережения: общая база 400 000 ₽ в год
 *   для ИИС-3, ПДС и НПО, ставка — НДФЛ налогоплательщика.
 * - Коэффициенты софинансирования по среднемесячному доходу:
 *   до 80 000 ₽ — 1:1, от 80 000 до 150 000 ₽ — 1:2, выше — 1:4.
 */
export const PDS_RULES = {
  /** Потолок господдержки, ₽ в год */
  cofinancingMax: 36_000,
  /** Минимальные взносы за год, чтобы получить софинансирование, ₽ */
  cofinancingMinContribution: 2_000,
  /** Сколько лет длится софинансирование */
  cofinancingYears: 10,
  /** Лимит освобождения дохода от НДФЛ, ₽ на договор */
  profitExemptLimit: 30_000_000,
  /** Через сколько лет договора наступают выплаты */
  payoutYears: 15,
  /** Возраст выплат для женщин и мужчин */
  payoutAgeWomen: 55,
  payoutAgeMen: 60,
  /** Государственная гарантия АСВ на счёт, ₽ */
  guaranteeLimit: 2_800_000,
  /** Больше трёх договоров — вычет не положен */
  maxContracts: 3,
  /** Ожидаемый период пожизненной выплаты, месяцев — ориентир для оценки */
  lifetimeMonths: 264,
} as const;

/** Варианты выплат: срок в годах, пожизненно или единовременно. */
export type PayoutType = "term1" | "term5" | "term10" | "lifetime" | "lump";

export const PAYOUT_LABELS: Record<PayoutType, string> = {
  term1: "1 год",
  term5: "5 лет",
  term10: "10 лет",
  lifetime: "Пожизненно",
  lump: "Единовременно",
};

export type PdsScenario = {
  /** Пол: от него зависит возраст права на выплаты — 55 или 60 лет */
  gender: "m" | "f";
  /** Возраст вкладчика на момент расчёта */
  age: number;
  /** Среднемесячный доход до НДФЛ, ₽ — от него зависят коэффициент и ставка */
  monthlyIncome: number;
  /** Взнос в год, ₽ */
  annualContribution: number;
  /** Сколько лет пополняем счёт */
  contributionYears: number;
  /** Сколько лет держим до выплат */
  holdingYears: number;
  /** Ожидаемая доходность фонда, % годовых */
  returnPct: number;
  /** Инфляция, % годовых */
  inflationPct: number;
  /** Возвращать вычет обратно на счёт */
  reinvestRefunds: boolean;
  /** Сколько вносим на ИИС-3 за год — этот лимит вычета общий, ₽ */
  iis3Contribution: number;
  /** Договор в свою пользу или близкого родственника */
  ownContract: boolean;
  /** Договоров ПДС не больше трёх */
  fewContracts: boolean;
  /** Учитывать пенсионные накопления из ОПС */
  useOps: boolean;
  /** Сумма накоплений ОПС, ₽ */
  opsAmount: number;
  /** Как получать деньги: срок, пожизненно или разом */
  payoutType: PayoutType;
};

export type PdsRow = {
  year: number;
  contribution: number;
  cofinancing: number;
  refund: number;
  growth: number;
  capital: number;
};

export type PdsResult = {
  rows: PdsRow[];
  /** Собственные взносы за весь срок */
  contributions: number;
  /** Сколько добавит государство */
  cofinancing: number;
  /** Вычеты НДФЛ за весь срок */
  refunds: number;
  /** Капитал на счёте к моменту выплат */
  capital: number;
  /** Доход: капитал минус собственные взносы */
  profit: number;
  /** Налог при выплатах */
  exitTax: number;
  /** На руки: капитал минус налог плюс нереинвестированные вычеты */
  net: number;
  /** То же в ценах сегодняшнего дня */
  netReal: number;
  /** Коэффициент софинансирования: 1, 0.5 или 0.25 */
  cofinancingRate: number;
  /** Сколько лимита вычета осталось ПДС после взносов на ИИС-3 */
  deductionRoom: number;
  /** Условия освобождения дохода выполнены */
  taxExempt: boolean;
  /** Сколько лет осталось до выплат по сроку договора */
  yearsToPayout: number;
  /** Возраст права на выплаты: 55 или 60 */
  payoutAge: number;
  /** Через сколько лет наступит возраст права на выплаты */
  yearsByAge: number;
  /** Самый ранний срок выплат: 15 лет договора или возраст */
  earliestYears: number;
  /** Размер выплаты: в месяц для срочных и пожизненных, вся сумма для разовой */
  payoutMonthly: number;
  /** Сколько всего выплатят за срок (для срочных и разовой) */
  payoutTotal: number;
  /** Сколько месяцев длится выплата; 0 — пожизненно */
  payoutMonths: number;
  /** Взнос на счёт от ОПС включён в расчёт */
  opsIncluded: number;
};

function nonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Коэффициент софинансирования по среднемесячному доходу. */
export function cofinancingRate(monthlyIncome: number): number {
  if (monthlyIncome <= 80_000) return 1;
  if (monthlyIncome <= 150_000) return 0.5;
  return 0.25;
}

/** Сколько добавит государство за год при таком взносе и доходе. */
export function cofinancingFor(
  contribution: number,
  monthlyIncome: number,
  yearIndex: number,
): number {
  if (yearIndex > PDS_RULES.cofinancingYears) return 0;
  if (contribution < PDS_RULES.cofinancingMinContribution) return 0;
  const raw = contribution * cofinancingRate(monthlyIncome);
  return Math.min(PDS_RULES.cofinancingMax, raw);
}

/**
 * Расчёт ПДС по годам. Взнос и софинансирование приходят в начале года,
 * доход начисляется за год, вычет — в начале следующего года.
 */
export function simulatePds(scenario: PdsScenario): PdsResult {
  const monthlyIncome = nonNegative(scenario.monthlyIncome);
  const annualIncome = monthlyIncome * 12;
  const rate = nonNegative(scenario.returnPct) / 100;
  const contributionYears = Math.max(0, Math.floor(scenario.contributionYears));
  const holdingYears = Math.max(contributionYears, Math.floor(scenario.holdingYears));
  const contribution = nonNegative(scenario.annualContribution);
  const iis3 = nonNegative(scenario.iis3Contribution);
  const incomeTax = ndfl(annualIncome);
  const baseRate = marginalRate(annualIncome);
  const deductionRoom = Math.max(0, DEDUCTION_BASE_LIMIT - iis3);

  const rows: PdsRow[] = [];
  // Накопления ОПС приходят на счёт сразу и дальше растут вместе с остальным
  const opsIncluded = scenario.useOps ? nonNegative(scenario.opsAmount) : 0;
  let capital = opsIncluded;
  let contributionsTotal = 0;
  let cofinancingTotal = 0;
  let refundsTotal = 0;
  let reinvestedTotal = 0;
  let pendingRefund = 0;

  for (let year = 1; year <= holdingYears; year += 1) {
    const yearlyContribution = year <= contributionYears ? contribution : 0;
    const yearlyCofinancing =
      year <= contributionYears ? cofinancingFor(yearlyContribution, monthlyIncome, year) : 0;

    if (scenario.reinvestRefunds && pendingRefund > 0) {
      capital += pendingRefund;
      reinvestedTotal += pendingRefund;
    }
    pendingRefund = 0;

    const startCapital = capital;
    capital += yearlyContribution + yearlyCofinancing;
    capital *= 1 + rate;
    const growth = capital - startCapital - yearlyContribution - yearlyCofinancing;

    // Вычет считается только с личных взносов и только в пределах общего лимита
    // с ИИС-3, и не больше уплаченного за год НДФЛ.
    const deductible = Math.min(yearlyContribution, deductionRoom);
    const refund = Math.min(deductible * baseRate, incomeTax);
    refundsTotal += refund;
    pendingRefund = refund;
    contributionsTotal += yearlyContribution;
    cofinancingTotal += yearlyCofinancing;

    rows.push({
      year,
      contribution: yearlyContribution,
      cofinancing: yearlyCofinancing,
      refund,
      growth,
      capital,
    });
  }

  const capitalFinal = capital;
  const profit = Math.max(0, capitalFinal - contributionsTotal - opsIncluded);
  const taxExempt =
    scenario.ownContract &&
    scenario.fewContracts &&
    holdingYears >= 10;

  // Доход освобождён в пределах 30 млн ₽, если выплаты не раньше 10 лет,
  // договор в свою пользу или близкого родственника и счетов не больше трёх.
  const taxableProfit = taxExempt
    ? Math.max(0, profit - PDS_RULES.profitExemptLimit)
    : profit;
  const exitTax = taxOnGains(taxableProfit);

  const cashRefunds = refundsTotal - reinvestedTotal;
  const net = capitalFinal - exitTax + cashRefunds;

  const inflation = nonNegative(scenario.inflationPct) / 100;
  const netReal = net / Math.pow(1 + inflation, holdingYears);

  // Право на выплаты: возраст 55/60 лет или 15 лет договора — что раньше.
  const payoutAge = scenario.gender === "f" ? PDS_RULES.payoutAgeWomen : PDS_RULES.payoutAgeMen;
  const yearsByAge = Math.max(0, payoutAge - Math.floor(nonNegative(scenario.age)));
  const earliestYears = Math.min(PDS_RULES.payoutYears, yearsByAge);

  // Размер выплаты зависит от выбранного варианта.
  const payoutType = scenario.payoutType;
  const payoutMonths =
    payoutType === "term1" ? 12 : payoutType === "term5" ? 60 : payoutType === "term10" ? 120 : payoutType === "lifetime" ? PDS_RULES.lifetimeMonths : 0;
  const payoutBase = Math.max(0, capitalFinal - exitTax + cashRefunds);
  const payoutMonthly =
    payoutType === "lump" ? payoutBase : payoutMonths > 0 ? payoutBase / payoutMonths : 0;
  const payoutTotal = payoutType === "lump" ? payoutBase : payoutMonthly * payoutMonths;

  return {
    rows,
    contributions: contributionsTotal,
    cofinancing: cofinancingTotal,
    refunds: refundsTotal,
    capital: capitalFinal,
    profit,
    exitTax,
    net,
    netReal,
    cofinancingRate: cofinancingRate(monthlyIncome),
    deductionRoom,
    taxExempt,
    yearsToPayout: Math.max(0, PDS_RULES.payoutYears - holdingYears),
    payoutAge,
    yearsByAge,
    earliestYears,
    payoutMonthly,
    payoutTotal,
    payoutMonths,
    opsIncluded,
  };
}

export const PDS_DEFAULTS: PdsScenario = {
  gender: "m",
  age: 35,
  monthlyIncome: 100_000,
  annualContribution: 120_000,
  contributionYears: 10,
  holdingYears: 15,
  returnPct: 8,
  inflationPct: 6,
  reinvestRefunds: false,
  iis3Contribution: 0,
  ownContract: true,
  fewContracts: true,
  useOps: false,
  opsAmount: 300_000,
  payoutType: "term10",
};
