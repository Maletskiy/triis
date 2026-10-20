import type { AccountType } from "./calc";
import type { Scenario } from "./calc";

export type AppState = {
  scenario: Scenario;
  account: AccountType;
};

export const DEFAULTS: AppState = {
  scenario: {
    annualContribution: 400_000,
    years: 10,
    returnPct: 10,
    inflationPct: 6,
    officialIncome: 1_200_000,
    reinvestRefunds: true,
    openYear: 2026,
  },
  account: "iis3",
};

const PARAM_KEYS = {
  annualContribution: "c",
  years: "y",
  returnPct: "r",
  inflationPct: "i",
  officialIncome: "d",
  reinvestRefunds: "rr",
  openYear: "o",
} as const;

function readNumber(params: URLSearchParams, key: string, fallback: number): number {
  const raw = params.get(key);
  if (raw === null) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export function readState(search: string): AppState {
  const params = new URLSearchParams(search);
  const account = params.get("a");
  const scenario: Scenario = {
    annualContribution: Math.max(
      0,
      readNumber(params, PARAM_KEYS.annualContribution, DEFAULTS.scenario.annualContribution),
    ),
    years: Math.min(
      50,
      Math.max(1, Math.round(readNumber(params, PARAM_KEYS.years, DEFAULTS.scenario.years))),
    ),
    returnPct: Math.max(0, readNumber(params, PARAM_KEYS.returnPct, DEFAULTS.scenario.returnPct)),
    inflationPct: Math.max(
      0,
      readNumber(params, PARAM_KEYS.inflationPct, DEFAULTS.scenario.inflationPct),
    ),
    officialIncome: Math.max(
      0,
      readNumber(params, PARAM_KEYS.officialIncome, DEFAULTS.scenario.officialIncome),
    ),
    reinvestRefunds: params.get(PARAM_KEYS.reinvestRefunds) !== "0",
    openYear: Math.min(
      2035,
      Math.max(2024, Math.round(readNumber(params, PARAM_KEYS.openYear, DEFAULTS.scenario.openYear))),
    ),
  };

  return {
    scenario,
    account: account === "iis1" || account === "iis2" || account === "iis3" ? account : "iis3",
  };
}

export function writeState(state: AppState): string {
  const params = new URLSearchParams();
  const { scenario } = state;
  params.set(PARAM_KEYS.annualContribution, String(Math.round(scenario.annualContribution)));
  params.set(PARAM_KEYS.years, String(scenario.years));
  params.set(PARAM_KEYS.returnPct, String(scenario.returnPct));
  params.set(PARAM_KEYS.inflationPct, String(scenario.inflationPct));
  params.set(PARAM_KEYS.officialIncome, String(Math.round(scenario.officialIncome)));
  params.set(PARAM_KEYS.reinvestRefunds, scenario.reinvestRefunds ? "1" : "0");
  params.set(PARAM_KEYS.openYear, String(scenario.openYear));
  params.set("a", state.account);
  return `?${params.toString()}`;
}
