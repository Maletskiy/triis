/** Работа с датой открытия счёта: ИИС можно открыть с 2015 года. */
export const MIN_DATE = "2015-02-01";
export const MAX_DATE = "2035-12-31";

export function toIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseIso(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function clampIso(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return MIN_DATE;
  return iso < MIN_DATE ? MIN_DATE : iso > MAX_DATE ? MAX_DATE : iso;
}

export function todayIso(): string {
  return clampIso(toIso(new Date()));
}

const MONTHS_GENITIVE = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

export const MONTHS_NOMINATIVE = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

/** «15 марта 2026». */
export function formatHuman(iso: string): string {
  const date = parseIso(iso);
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]} ${date.getFullYear()}`;
}

/** Прибавляет годы — дата, когда счёт можно закрыть. */
export function addYears(iso: string, years: number): string {
  const date = parseIso(iso);
  date.setFullYear(date.getFullYear() + years);
  return clampIso(toIso(date));
}

export function yearOf(iso: string): number {
  const year = Number(iso.slice(0, 4));
  return Number.isFinite(year) ? year : 2026;
}
