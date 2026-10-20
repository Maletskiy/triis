import { useMemo, useRef, useState } from "react";
import type { YearRow } from "../lib/calc";
import { compactRub, rub } from "../lib/format";

type Props = {
  rows: YearRow[];
  height?: number;
};

const PAD = { top: 14, right: 10, bottom: 26, left: 6 };
const W = 720;

export default function Chart({ rows, height = 260 }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const H = height;

  const data = useMemo(() => {
    if (rows.length === 0) return null;

    const contributions: number[] = [];
    let running = 0;
    const capital = rows.map((row) => {
      running += row.contribution;
      contributions.push(running);
      return row.capital;
    });

    const maxCapital = Math.max(...capital, 1);
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const x = (index: number) =>
      PAD.left + (rows.length === 1 ? innerW / 2 : (index / (rows.length - 1)) * innerW);
    const y = (value: number) => PAD.top + innerH - (value / maxCapital) * innerH;

    const line = (values: number[]) =>
      values.map((value, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(value)}`).join(" ");

    const area = (values: number[]) =>
      `${line(values)} L${x(values.length - 1)},${PAD.top + innerH} L${x(0)},${PAD.top + innerH} Z`;

    return { contributions, capital, x, y, line, area, maxCapital, innerH };
  }, [rows, H]);

  if (!data || rows.length === 0) {
    return <div className="chart chart--empty">Задайте взносы и срок — покажу рост капитала</div>;
  }

  const { contributions, capital, x, y, line, area, maxCapital, innerH } = data;

  const gridValues = [0.25, 0.5, 0.75, 1].map((share) => maxCapital * share);

  const pointFromEvent = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scale = W / rect.width;
    const localX = (clientX - rect.left) * scale;
    const innerW = W - PAD.left - PAD.right;
    const ratio = Math.min(1, Math.max(0, (localX - PAD.left) / innerW));
    const index = Math.round(ratio * (rows.length - 1));
    setHover(index);
  };

  const hovered = hover === null ? null : rows[hover];

  return (
    <div className="chart">
      <div className="chart__legend">
        <span className="chart__key chart__key--capital">Капитал</span>
        <span className="chart__key chart__key--contribution">Ваши взносы</span>
      </div>
      <div className="chart__stage">
        <svg
          ref={svgRef}
          className="chart__svg"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Рост капитала по годам"
          onPointerMove={(e) => pointFromEvent(e.clientX)}
          onPointerLeave={() => setHover(null)}
          onPointerDown={(e) => pointFromEvent(e.clientX)}
        >
          <defs>
            <linearGradient id="capitalFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-capital)" stopOpacity="0.26" />
              <stop offset="100%" stopColor="var(--chart-capital)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {gridValues.map((value) => (
            <line
              key={value}
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(value)}
              y2={y(value)}
              className="chart__grid"
            />
          ))}

          <path d={area(capital)} fill="url(#capitalFill)" />
          <path d={line(capital)} className="chart__line" />
          <path d={area(contributions)} className="chart__area-contributions" />
          <path d={line(contributions)} className="chart__line-contributions" />

          {rows.length <= 14 &&
            rows.map((row, index) => (
              <circle
                key={row.year}
                cx={x(index)}
                cy={y(row.capital)}
                r={hover === index ? 4.5 : 2.6}
                className={"chart__dot" + (hover === index ? " is-active" : "")}
              />
            ))}

          {[0, Math.floor((rows.length - 1) / 2), rows.length - 1]
            .filter((v, i, arr) => arr.indexOf(v) === i)
            .map((index) => (
              <text
                key={index}
                x={x(index)}
                y={H - 6}
                className="chart__axis"
                textAnchor={index === 0 ? "start" : index === rows.length - 1 ? "end" : "middle"}
              >
                {rows[index].year}
              </text>
            ))}

          {hover !== null && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              className="chart__crosshair"
            />
          )}
        </svg>

        {hovered && hover !== null && (
          <div
            className="chart__tip"
            style={{
              left: `${(x(hover) / W) * 100}%`,
              transform:
                (x(hover) / W) * 100 > 62 ? "translate(calc(-100% - 0.6rem), 0)" : "translate(0.6rem, 0)",
            }}
          >
            <span className="chart__tip-year">{hovered.year} год</span>
            <span className="chart__tip-row">
              Капитал <b>{rub(hovered.capital)}</b>
            </span>
            <span className="chart__tip-row">
              Взнос <b>{rub(hovered.contribution)}</b>
            </span>
            <span className="chart__tip-row">
              Доход за год <b>{rub(hovered.growth)}</b>
            </span>
          </div>
        )}
      </div>
      <div className="chart__foot">
        <span>за {rows.length} {rows.length === 1 ? "год" : "лет"} капитал дорастёт до {compactRub(capital[capital.length - 1])}</span>
      </div>
    </div>
  );
}
