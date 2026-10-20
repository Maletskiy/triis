// src/lib/rules.ts
var DEDUCTION_BASE_LIMIT = 4e5;
var OLD_IIS_CONTRIBUTION_LIMIT = 1e6;
var IIS3_PROFIT_EXEMPT_LIMIT = 3e7;
var OLD_IIS_MIN_YEARS = 3;
var NDFL_BRACKETS = [
  { upTo: 24e5, rate: 0.13 },
  { upTo: 5e6, rate: 0.15 },
  { upTo: 2e7, rate: 0.18 },
  { upTo: 5e7, rate: 0.2 },
  { upTo: Infinity, rate: 0.22 }
];
function ndfl(taxableIncome) {
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
function marginalRate(taxableIncome) {
  for (const bracket of NDFL_BRACKETS) {
    if (taxableIncome <= bracket.upTo) return bracket.rate;
  }
  return NDFL_BRACKETS[NDFL_BRACKETS.length - 1].rate;
}
function taxOnGains(gain2) {
  if (gain2 <= 0) return 0;
  const first = Math.min(gain2, NDFL_BRACKETS[0].upTo) * NDFL_BRACKETS[0].rate;
  const rest = Math.max(0, gain2 - NDFL_BRACKETS[0].upTo) * NDFL_BRACKETS[1].rate;
  return first + rest;
}
function iis3MinYears(openYear) {
  if (openYear <= 2026) return 5;
  return Math.min(10, 5 + (openYear - 2026));
}

// src/lib/calc.ts
var ACCOUNT_LABELS = {
  iis3: "\u0418\u0418\u0421-3",
  iis1: "\u0418\u0418\u0421-1",
  iis2: "\u0418\u0418\u0421-2"
};
function nonNegative(value) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}
function minHoldingYears(type, openYear) {
  return type === "iis3" ? iis3MinYears(openYear) : OLD_IIS_MIN_YEARS;
}
function simulateCore(type, scenario, years) {
  const contribution = type === "iis3" ? nonNegative(scenario.annualContribution) : Math.min(
    nonNegative(scenario.annualContribution),
    OLD_IIS_CONTRIBUTION_LIMIT
  );
  const minHolding = minHoldingYears(type, scenario.openYear);
  const rate = nonNegative(scenario.returnPct) / 100;
  const horizon = Math.max(0, Math.floor(years));
  const income = nonNegative(scenario.officialIncome);
  const incomeTax = ndfl(income);
  const baseRate = marginalRate(income);
  const rows = [];
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
    const refund = type === "iis2" ? 0 : Math.min(deductibleBase * baseRate, incomeTax);
    refundsTotal += refund;
    pendingRefund = refund;
    rows.push({
      year,
      contribution,
      refund,
      growth,
      capital
    });
  }
  const grossCapital = capital;
  const profit = grossCapital - contributionsTotal - reinvestedTotal;
  const earlyClose = horizon < minHolding;
  const yearsShort = Math.max(0, minHolding - horizon);
  let exitTax;
  let clawback = 0;
  if (earlyClose) {
    exitTax = taxOnGains(Math.max(0, profit));
    clawback = refundsTotal;
  } else if (type === "iis3") {
    const taxableProfit = Math.max(0, profit - IIS3_PROFIT_EXEMPT_LIMIT);
    exitTax = taxOnGains(taxableProfit);
  } else if (type === "iis1") {
    exitTax = taxOnGains(Math.max(0, profit));
  } else {
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
    clawback
  };
}
function simulate(type, scenario) {
  const core = simulateCore(type, scenario, scenario.years);
  let earlyPenalty = 0;
  if (core.earlyClose) {
    const held = simulateCore(type, scenario, core.minHolding);
    earlyPenalty = Math.max(0, held.net - core.net);
  }
  return { ...core, earlyPenalty };
}
function compare(scenario) {
  return {
    iis3: simulate("iis3", scenario),
    iis1: simulate("iis1", scenario),
    iis2: simulate("iis2", scenario)
  };
}

// scripts/check.ts
var failures = 0;
function check(name, actual, expected, tolerance = 1) {
  const ok = Math.abs(actual - expected) <= tolerance;
  if (!ok) failures += 1;
  console.log(
    `${ok ? "OK  " : "FAIL"} ${name}: ${actual.toFixed(2)} (\u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C ${expected.toFixed(2)})`
  );
}
var base = {
  annualContribution: 4e5,
  years: 10,
  returnPct: 10,
  inflationPct: 6,
  officialIncome: 12e5,
  reinvestRefunds: false,
  openYear: 2026
};
var annuity = 4e5 * ((Math.pow(1.1, 11) - 1.1) / (1.1 - 1));
var iis3 = simulate("iis3", base);
check("\u043A\u0430\u043F\u0438\u0442\u0430\u043B, \u0430\u043D\u043D\u0443\u0438\u0442\u0435\u0442-\u043F\u0440\u0435\u043D\u043E\u0440\u0430\u043D\u0434\u043E", iis3.grossCapital, annuity);
check("\u0432\u0437\u043D\u043E\u0441\u044B \u0437\u0430 10 \u043B\u0435\u0442", iis3.contributions, 4e6);
check("\u043F\u0440\u0438\u0431\u044B\u043B\u044C", iis3.profit, annuity - 4e6);
check("\u0432\u044B\u0447\u0435\u0442\u044B \u0437\u0430 10 \u043B\u0435\u0442 (13%)", iis3.refunds, 52e4);
check("\u043D\u0430 \u0440\u0443\u043A\u0438 \u0431\u0435\u0437 \u0440\u0435\u0438\u043D\u0432\u0435\u0441\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F", iis3.net, annuity + 52e4);
check("\u043D\u0430\u043B\u043E\u0433 \u043F\u0440\u0438 \u0437\u0430\u043A\u0440\u044B\u0442\u0438\u0438 \u0432 \u0441\u0440\u043E\u043A", iis3.exitTax, 0);
var lowIncome = simulate("iis3", { ...base, officialIncome: 3e5 });
check("\u0432\u044B\u0447\u0435\u0442 \u043D\u0435 \u0431\u043E\u043B\u044C\u0448\u0435 \u0443\u043F\u043B\u0430\u0447\u0435\u043D\u043D\u043E\u0433\u043E \u041D\u0414\u0424\u041B", lowIncome.refunds, ndfl(3e5) * 10);
var highIncome = simulate("iis3", { ...base, officialIncome: 3e6 });
check("\u043F\u0440\u0435\u0434\u0435\u043B\u044C\u043D\u0430\u044F \u0441\u0442\u0430\u0432\u043A\u0430 \u043F\u0440\u0438 3 \u043C\u043B\u043D", marginalRate(3e6), 0.15);
check("\u0432\u044B\u0447\u0435\u0442 \u043F\u0440\u0438 \u0441\u0442\u0430\u0432\u043A\u0435 15%", highIncome.refunds, 6e4 * 10);
var iis1 = simulate("iis1", base);
var iis2 = simulate("iis2", base);
check("\u0418\u0418\u0421-1: \u0432\u044B\u0447\u0435\u0442\u044B \u0435\u0441\u0442\u044C", iis1.refunds, 52e4);
var gain = annuity - 4e6;
var gainTax = gain <= 24e5 ? gain * 0.13 : 24e5 * 0.13 + (gain - 24e5) * 0.15;
check("\u0418\u0418\u0421-1: \u043D\u0430\u043B\u043E\u0433 \u0441 \u043F\u0440\u0438\u0431\u044B\u043B\u0438 (13/15% \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E\u0439 \u0431\u0430\u0437\u043E\u0439)", iis1.exitTax, gainTax, 2);
check("\u0418\u0418\u0421-2: \u0432\u044B\u0447\u0435\u0442\u043E\u0432 \u043D\u0435\u0442", iis2.refunds, 0);
check("\u0418\u0418\u0421-2: \u043D\u0430\u043B\u043E\u0433\u0430 \u043D\u0435\u0442", iis2.exitTax, 0);
check("\u0418\u0418\u0421-2: \u043D\u0430 \u0440\u0443\u043A\u0438 = \u043A\u0430\u043F\u0438\u0442\u0430\u043B", iis2.net, annuity);
var reinvested = simulate("iis3", { ...base, reinvestRefunds: true });
check(
  "\u0440\u0435\u0438\u043D\u0432\u0435\u0441\u0442: \u043A\u0430\u043F\u0438\u0442\u0430\u043B = \u043F\u0440\u044F\u043C\u043E\u0435 \u0440\u0435\u0438\u043D\u0432\u0435\u0441\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435",
  reinvested.grossCapital,
  (() => {
    let capital = 0;
    let pending = 0;
    for (let y = 0; y < 10; y += 1) {
      capital = (capital + pending + 4e5) * 1.1;
      pending = 52e3;
    }
    return capital;
  })()
);
check("\u0440\u0435\u0438\u043D\u0432\u0435\u0441\u0442: \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0432\u044B\u0447\u0435\u0442 \u043D\u0435 \u043F\u043E\u043F\u0430\u043B \u0432 \u043A\u0430\u043F\u0438\u0442\u0430\u043B", reinvested.net, reinvested.grossCapital + 52e3);
var early = simulate("iis3", { ...base, years: 4 });
check("\u0434\u043E\u0441\u0440\u043E\u0447\u043D\u043E: \u0444\u043B\u0430\u0433", Number(early.earlyClose), 1);
check("\u0434\u043E\u0441\u0440\u043E\u0447\u043D\u043E: \u0432\u0435\u0440\u043D\u0443\u0442\u044C \u0432\u044B\u0447\u0435\u0442\u044B", early.clawback, 208e3);
check("\u0434\u043E\u0441\u0440\u043E\u0447\u043D\u043E: \u0448\u0442\u0440\u0430\u0444 \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0443\u043B\u044F", Number(early.earlyPenalty > 0), 1);
check("\u0441\u0440\u043E\u043A \u0432\u043B\u0430\u0434\u0435\u043D\u0438\u044F \u0434\u043B\u044F 2024", iis3MinYears(2024), 5);
check("\u0441\u0440\u043E\u043A \u0432\u043B\u0430\u0434\u0435\u043D\u0438\u044F \u0434\u043B\u044F 2026", iis3MinYears(2026), 5);
check("\u0441\u0440\u043E\u043A \u0432\u043B\u0430\u0434\u0435\u043D\u0438\u044F \u0434\u043B\u044F 2028", iis3MinYears(2028), 7);
check("\u0441\u0440\u043E\u043A \u0432\u043B\u0430\u0434\u0435\u043D\u0438\u044F \u0434\u043B\u044F 2032 (\u043F\u043E\u0442\u043E\u043B\u043E\u043A 10)", iis3MinYears(2032), 10);
var oldBig = simulate("iis1", { ...base, annualContribution: 15e5 });
check("\u0418\u0418\u0421-1: \u043B\u0438\u043C\u0438\u0442 \u0432\u0437\u043D\u043E\u0441\u0430", oldBig.contributions, 1e7);
var huge = simulate("iis3", {
  ...base,
  annualContribution: 25e6,
  years: 5,
  returnPct: 10,
  officialIncome: 12e5,
  reinvestRefunds: false
});
check("\u0418\u0418\u0421-3: \u043D\u0430\u043B\u043E\u0433 \u0442\u043E\u043B\u044C\u043A\u043E \u0441 \u0441\u0443\u043C\u043C\u044B \u0441\u0432\u0435\u0440\u0445 30 \u043C\u043B\u043D", Number(huge.exitTax > 0), 1);
var excess = Math.max(0, huge.profit - 3e7);
var excessTax = excess <= 24e5 ? excess * 0.13 : 24e5 * 0.13 + (excess - 24e5) * 0.15;
check("\u0418\u0418\u0421-3: \u0431\u0430\u0437\u0430 \u043D\u0430\u043B\u043E\u0433\u0430 = \u043F\u0440\u0438\u0431\u044B\u043B\u044C \u2212 30 \u043C\u043B\u043D", huge.exitTax, excessTax, 3);
check(
  "\u043D\u0430 \u0440\u0443\u043A\u0438 \u0432 \u0441\u0435\u0433\u043E\u0434\u043D\u044F\u0448\u043D\u0438\u0445 \u0446\u0435\u043D\u0430\u0445",
  iis3.netReal,
  (annuity + 52e4) / Math.pow(1.06, 10)
);
var all = compare(base);
check("\u0441\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435: \u0442\u0440\u0438 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0430", Object.keys(all).length, 3);
console.log(`
${failures === 0 ? "\u0412\u0441\u0435 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u043F\u0440\u043E\u0439\u0434\u0435\u043D\u044B" : `\u041F\u0440\u043E\u0432\u0430\u043B\u0435\u043D\u043E \u043F\u0440\u043E\u0432\u0435\u0440\u043E\u043A: ${failures}`}`);
if (failures > 0) throw new Error("\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u043D\u0435 \u043F\u0440\u043E\u0439\u0434\u0435\u043D\u044B");
