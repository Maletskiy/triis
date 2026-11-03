import type { AccountResult, AccountType, Scenario } from "./calc";
import { ACCOUNT_LABELS } from "./calc";
import { compactRub, rub, yearsWord } from "./format";
import { formatHuman, yearOf } from "./dates";

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 42;
const INK = { r: 0.067, g: 0.067, b: 0.067 };
const MUTED = { r: 0.45, g: 0.45, b: 0.45 };
const LIGHT = { r: 0.8, g: 0.8, b: 0.8 };

type Ctx = {
  doc: any;
  page: any;
  y: number;
  regular: any;
  semibold: any;
  bold: any;
};

function newPage(ctx: Ctx) {
  ctx.page = ctx.doc.addPage([A4.width, A4.height]);
  ctx.y = A4.height - MARGIN;
}

function text(
  ctx: Ctx,
  value: string,
  options: { size?: number; font?: any; color?: any; x?: number; gap?: number } = {},
) {
  const size = options.size ?? 10;
  const font = options.font ?? ctx.regular;
  const color = options.color ?? INK;
  if (ctx.y < MARGIN + size * 2) newPage(ctx);
  ctx.page.drawText(value, {
    x: options.x ?? MARGIN,
    y: ctx.y - size,
    size,
    font,
    color: ctx.doc.context.obj(color).valueOf ? rgbOf(color) : rgbOf(color),
  });
  ctx.y -= size + (options.gap ?? 6);
}

let toColor: ((color: { r: number; g: number; b: number }) => any) | null = null;

function rgbOf(color: { r: number; g: number; b: number }) {
  return toColor ? toColor(color) : color;
}

function wrap(font: any, value: string, size: number, width: number): string[] {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export type PdfInput = {
  scenario: Scenario;
  account: AccountType;
  result: AccountResult;
  results: Record<AccountType, AccountResult>;
  best: AccountType;
  updatedLabel: string;
};

/** Собирает PDF-отчёт без браузерных колонтитулов и ссылок. */
export async function buildPdf(input: PdfInput): Promise<Blob> {
  const [{ PDFDocument, rgb: makeRgb }, fontkit] = await Promise.all([
    import("pdf-lib"),
    import("@pdf-lib/fontkit"),
  ]);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit.default ?? (fontkit as any));
  toColor = (color) => makeRgb(color.r, color.g, color.b);

  const load = async (file: string) => {
    const bytes = await fetch(`/fonts/${file}`).then((response) => response.arrayBuffer());
    return doc.embedFont(bytes, { subset: true });
  };
  const regular = await load("sbsans-regular.otf");
  const semibold = await load("sbsans-semibold.otf");
  const bold = await load("sbsans-bold.otf");

  const ctx: Ctx = { doc, page: null, y: 0, regular, semibold, bold };
  newPage(ctx);

  const width = A4.width - MARGIN * 2;
  const draw = (value: string, opts: Parameters<typeof text>[2] = {}) =>
    text(ctx, value, opts);

  // шапка
  draw("ТРИИС", { size: 22, font: bold, gap: 2 });
  draw("Калькулятор ИИС", { size: 10, color: MUTED, gap: 14 });

  const params = [
    `${ACCOUNT_LABELS[input.account]}, открыт ${formatHuman(input.scenario.openDate)}`,
    input.scenario.contributionMode === "custom"
      ? `взносы по годам, всего ${rub(input.result.contributions)}`
      : `${rub(input.scenario.annualContribution)} в год`,
    `${input.scenario.years} ${yearsWord(input.scenario.years)}`,
    `доходность ${input.scenario.returnPct}%`,
    `инфляция ${input.scenario.inflationPct}%`,
  ].join(" · ");
  for (const line of wrap(regular, params, 9, width)) {
    draw(line, { size: 9, color: MUTED, gap: 2 });
  }
  ctx.y -= 10;

  // главный итог
  draw("На руки после закрытия", { size: 9, color: MUTED, gap: 4 });
  draw(rub(input.result.net), { size: 26, font: bold, gap: 4 });
  draw(`В ценах сегодняшнего дня — ${compactRub(input.result.netReal)}`, {
    size: 10,
    color: MUTED,
    gap: 16,
  });

  // статистика
  const stats: [string, string][] = [
    ["Вычеты за срок", rub(input.result.refunds)],
    ["Капитал на счёте", rub(input.result.grossCapital)],
    ["Налог при закрытии", rub(input.result.exitTax)],
    ["Ваши взносы", rub(input.result.contributions)],
  ];
  for (const [label, value] of stats) {
    draw(`${label}: ${value}`, { size: 11, font: semibold, gap: 7 });
  }
  draw(`Минимальный срок владения — ${input.result.minHolding} ${yearsWord(input.result.minHolding)}`, {
    size: 9,
    color: MUTED,
    gap: 16,
  });

  // сравнение счетов
  draw("Сравнение счетов", { size: 13, font: bold, gap: 8 });
  for (const type of ["iis3", "iis1", "iis2"] as AccountType[]) {
    const result = input.results[type];
    const mark = type === input.best ? " — выгоднее" : "";
    draw(`${ACCOUNT_LABELS[type]}: ${rub(result.net)}${mark}`, { size: 10, gap: 6 });
  }
  ctx.y -= 10;

  // таблица по годам
  const openYear = yearOf(input.scenario.openDate);
  draw("Таблица по годам", { size: 13, font: bold, gap: 10 });

  const columns = [
    { title: "Год", width: 52, align: "left" as const, value: (row: any) => String(openYear + row.year - 1) },
    { title: "Взнос", width: 96, align: "right" as const, value: (row: any) => rub(row.contribution) },
    { title: "Вычет", width: 92, align: "right" as const, value: (row: any) => (row.refund > 0 ? rub(row.refund) : "—") },
    { title: "Доход за год", width: 110, align: "right" as const, value: (row: any) => rub(row.growth) },
    { title: "Капитал", width: 118, align: "right" as const, value: (row: any) => rub(row.capital) },
  ];

  const drawRow = (values: string[], isHeader = false, isTotal = false) => {
    const font = isHeader || isTotal ? semibold : regular;
    const size = 9;
    if (ctx.y < MARGIN + 24) newPage(ctx);
    let x = MARGIN;
    for (let index = 0; index < columns.length; index += 1) {
      const column = columns[index];
      const value = values[index];
      const textWidth = font.widthOfTextAtSize(value, size);
      const offset = column.align === "right" ? column.width - textWidth : 0;
      ctx.page.drawText(value, {
        x: x + offset,
        y: ctx.y - size,
        size,
        font,
        color: rgbOf(isHeader ? MUTED : INK),
      });
      x += column.width;
    }
    ctx.y -= size + 6;
    if (isHeader) {
      ctx.page.drawLine({
        start: { x: MARGIN, y: ctx.y + 3 },
        end: { x: A4.width - MARGIN, y: ctx.y + 3 },
        thickness: 0.7,
        color: rgbOf(LIGHT),
      });
    }
  };

  drawRow(columns.map((column) => column.title), true);
  for (const row of input.result.rows) {
    drawRow(columns.map((column) => column.value(row)));
  }
  drawRow(
    ["Итого", rub(input.result.contributions), rub(input.result.refunds), rub(input.result.profit), rub(input.result.grossCapital)],
    false,
    true,
  );

  // сноска без ссылок
  ctx.y -= 8;
  for (const line of wrap(
    regular,
    "Правила 2026 года. Не инвестиционная рекомендация.",
    8,
    width,
  )) {
    draw(line, { size: 8, color: MUTED, gap: 4 });
  }

  // без сжатия объектных потоков структура PDF остаётся читаемой
  const bytes = await doc.save({ useObjectStreams: false });
  return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
}

export function downloadPdf(input: PdfInput) {
  buildPdf(input).then((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `triis-raschet-${new Date().toISOString().slice(0, 10)}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  });
}
