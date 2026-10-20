const nbsp = "\u202F";

export function rub(value: number, fractionDigits = 0): string {
  const rounded = Number.isFinite(value) ? value : 0;
  return (
    rounded.toLocaleString("ru-RU", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }) +
    nbsp +
    "₽"
  );
}

/** Компактная запись: 7,01 млн ₽ / 520 тыс ₽. */
export function compactRub(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${trim(value / 1_000_000_000)}${nbsp}млрд${nbsp}₽`;
  if (abs >= 1_000_000) return `${trim(value / 1_000_000)}${nbsp}млн${nbsp}₽`;
  if (abs >= 10_000) return `${trim(value / 1_000)}${nbsp}тыс${nbsp}₽`;
  return rub(value);
}

function trim(value: number): string {
  return value
    .toLocaleString("ru-RU", { maximumFractionDigits: 2, minimumFractionDigits: 0 })
    .replace(/\s/g, "");
}

export function pct(value: number, fractionDigits = 0): string {
  return `${value.toLocaleString("ru-RU", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}%`;
}

/** «1 год», «2 года», «5 лет». */
export function yearsWord(value: number): string {
  const abs = Math.abs(value) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return "лет";
  if (last === 1) return "год";
  if (last >= 2 && last <= 4) return "года";
  return "лет";
}

/** Разбор числа из инпута: допускает пробелы и запятую как разделитель. */
export function parseNumber(raw: string): number {
  const cleaned = raw.replace(/\s|\u202F|\u00A0/g, "").replace(",", ".");
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : 0;
}
