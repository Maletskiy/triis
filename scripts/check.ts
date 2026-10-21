import { compare, simulate, type Scenario } from "../src/lib/calc";
import { iis3MinYears, marginalRate, ndfl } from "../src/lib/rules";

let failures = 0;

function check(name: string, actual: number, expected: number, tolerance = 1): void {
  const ok = Math.abs(actual - expected) <= tolerance;
  if (!ok) failures += 1;
  console.log(
    `${ok ? "OK  " : "FAIL"} ${name}: ${actual.toFixed(2)} (ожидалось ${expected.toFixed(2)})`,
  );
}

const base: Scenario = {
  annualContribution: 400_000,
  contributionMode: "uniform" as const,
  contributions: [400_000],
  years: 10,
  returnPct: 10,
  inflationPct: 6,
  officialIncome: 1_200_000,
  reinvestRefunds: false,
  openDate: "2026-01-15",
  periodsPerYear: 1,
  manualRate: null,
};

// 1. Аннуитет с взносом в начале года: 400 000 × Σ 1.1^k, k = 1..10
const annuity =
  400_000 * ((Math.pow(1.1, 11) - 1.1) / (1.1 - 1));
const iis3 = simulate("iis3", base);
check("капитал, аннуитет-пренорандо", iis3.grossCapital, annuity);
check("взносы за 10 лет", iis3.contributions, 4_000_000);
check("прибыль", iis3.profit, annuity - 4_000_000);
check("вычеты за 10 лет (13%)", iis3.refunds, 520_000);
check("на руки без реинвестирования", iis3.net, annuity + 520_000);
check("налог при закрытии в срок", iis3.exitTax, 0);

// 2. Вычет ограничен реально уплаченным НДФЛ
const lowIncome = simulate("iis3", { ...base, officialIncome: 300_000 });
check("вычет не больше уплаченного НДФЛ", lowIncome.refunds, ndfl(300_000) * 10);

// 3. Ставка 15%: доход 3 млн → вычет 400 000 × 15%
const highIncome = simulate("iis3", { ...base, officialIncome: 3_000_000 });
check("предельная ставка при 3 млн", marginalRate(3_000_000), 0.15);
check("вычет при ставке 15%", highIncome.refunds, 60_000 * 10);

// 4. ИИС-1: прибыль облагается, ИИС-2: только освобождение, вычетов нет
const iis1 = simulate("iis1", base);
const iis2 = simulate("iis2", base);
check("ИИС-1: вычеты есть", iis1.refunds, 520_000);
// отдельная база: 13% до 2,4 млн, 15% с превышения
const gain = annuity - 4_000_000;
const gainTax =
  gain <= 2_400_000 ? gain * 0.13 : 2_400_000 * 0.13 + (gain - 2_400_000) * 0.15;
check("ИИС-1: налог с прибыли (13/15% отдельной базой)", iis1.exitTax, gainTax, 2);
check("ИИС-2: вычетов нет", iis2.refunds, 0);
check("ИИС-2: налога нет", iis2.exitTax, 0);
check("ИИС-2: на руки = капитал", iis2.net, annuity);

// 5. Реинвестирование вычетов увеличивает капитал, но не «на руки» дважды
const reinvested = simulate("iis3", { ...base, reinvestRefunds: true });
check(
  "реинвест: капитал = прямое реинвестирование",
  reinvested.grossCapital,
  (() => {
    let capital = 0;
    let pending = 0;
    for (let y = 0; y < 10; y += 1) {
      capital = (capital + pending + 400_000) * 1.1;
      pending = 52_000;
    }
    return capital;
  })(),
);
// вычет за последний год приходит после закрытия и остаётся деньгами на руках
check("реинвест: последний вычет не попал в капитал", reinvested.net, reinvested.grossCapital + 52_000);

// 6. Досрочное закрытие: вычеты возвращаются, прибыль облагается
const early = simulate("iis3", { ...base, years: 4 });
check("досрочно: флаг", Number(early.earlyClose), 1);
check("досрочно: вернуть вычеты", early.clawback, 208_000);
check("досрочно: штраф больше нуля", Number(early.earlyPenalty > 0), 1);

// 7. Минимальный срок по году открытия
check("срок владения для 2024", iis3MinYears(2024), 5);
check("срок владения для 2026", iis3MinYears(2026), 5);
check("срок владения для 2028", iis3MinYears(2028), 7);
check("срок владения для 2032 (потолок 10)", iis3MinYears(2032), 10);

// 8. Лимит взносов старого ИИС: 1 млн в год
const oldBig = simulate("iis1", { ...base, annualContribution: 1_500_000 });
check("ИИС-1: лимит взноса", oldBig.contributions, 10_000_000);

// 9. Лимит освобождения 30 млн на ИИС-3
const huge = simulate("iis3", {
  ...base,
  annualContribution: 25_000_000,
  years: 5,
  returnPct: 10,
  officialIncome: 1_200_000,
  reinvestRefunds: false,
});
check("ИИС-3: налог только с суммы сверх 30 млн", Number(huge.exitTax > 0), 1);
const excess = Math.max(0, huge.profit - 30_000_000);
const excessTax =
  excess <= 2_400_000 ? excess * 0.13 : 2_400_000 * 0.13 + (excess - 2_400_000) * 0.15;
check("ИИС-3: база налога = прибыль − 30 млн", huge.exitTax, excessTax, 3);

// 10. Реальная доходность дефлируется
check(
  "на руки в сегодняшних ценах",
  iis3.netReal,
  (annuity + 520_000) / Math.pow(1.06, 10),
);

// 11. Частота реинвестирования: доход капитализируется несколько раз в год
const monthly = simulate("iis3", { ...base, periodsPerYear: 12 });
const monthlyFactor = Math.pow(1 + 0.1 / 12, 12);
const monthlyCapital =
  400_000 * ((Math.pow(monthlyFactor, 11) - monthlyFactor) / (monthlyFactor - 1));
check("реинвест раз в месяц: капитал по эффективной ставке", monthly.grossCapital, monthlyCapital, 2);
check("реинвест раз в месяц больше годового", Number(monthly.grossCapital > iis3.grossCapital), 1);

// 12. Ручная ставка НДФЛ перекрывает расчёт по доходу
const manual15 = simulate("iis3", { ...base, manualRate: 0.15 });
check("ручная ставка 15%: вычет 60 000 за год", manual15.refunds, 600_000);
check("ручная ставка применяется к прибыли (ИИС-1)",
  simulate("iis1", { ...base, manualRate: 0.15 }).exitTax,
  (annuity - 4_000_000) * 0.15,
  2);

// 13. Свои суммы по годам
const plan = simulate("iis3", {
  ...base,
  contributionMode: "custom",
  contributions: [100_000, 200_000, 300_000, 400_000, 500_000, 600_000, 700_000, 800_000, 900_000, 1_000_000],
  reinvestRefunds: false,
});
check("свои суммы: всего взносов", plan.contributions, 5_500_000);
check("свои суммы: вычеты с базы 400 000 в год", plan.refunds, 442_000);

// 14. Сравнение возвращает три счёта
const all = compare(base);
check("сравнение: три результата", Object.keys(all).length, 3);

console.log(`\n${failures === 0 ? "Все проверки пройдены" : `Провалено проверок: ${failures}`}`);
if (failures > 0) throw new Error("Проверки не пройдены");
