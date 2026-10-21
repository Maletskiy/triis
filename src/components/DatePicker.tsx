import { useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_DATE,
  MIN_DATE,
  MONTHS_NOMINATIVE,
  clampIso,
  formatHuman,
  parseIso,
  toIso,
} from "../lib/dates";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS_SHORT = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

type View = "days" | "months" | "years";

export default function DatePicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (iso: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false);
  const [view, setView] = useState<View>("days");
  const [cursor, setCursor] = useState(() => parseIso(value));
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setCursor(parseIso(value)), [value]);

  useEffect(() => {
    if (!open) {
      setView("days");
      return;
    }
    const onDown = (event: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const years = useMemo(() => {
    const first = Number(MIN_DATE.slice(0, 4));
    const last = Number(MAX_DATE.slice(0, 4));
    return Array.from({ length: last - first + 1 }, (_, index) => first + index);
  }, []);

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = Array.from({ length: offset }, () => null);
    for (let day = 1; day <= total; day += 1) cells.push(toIso(new Date(year, month, day)));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const shift = (delta: number) => {
    setCursor((prev) => {
      if (view === "days") return new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
      if (view === "months") return new Date(prev.getFullYear() + delta, prev.getMonth(), 1);
      return new Date(prev.getFullYear() + delta * 10, prev.getMonth(), 1);
    });
  };

  const pick = (iso: string) => {
    onChange(clampIso(iso));
    setOpen(false);
  };

  const title =
    view === "days"
      ? `${MONTHS_NOMINATIVE[cursor.getMonth()]} ${cursor.getFullYear()}`
      : view === "months"
        ? String(cursor.getFullYear())
        : "Выбор года";

  return (
    <div className="datepicker" ref={wrapRef}>
      <button
        type="button"
        className={"datepicker__field" + (open ? " is-open" : "")}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setUp(window.innerHeight - rect.bottom < 400 && rect.top > 400);
          setOpen((was) => !was);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
      >
        <span className="datepicker__value">{formatHuman(value)}</span>
        <svg className="datepicker__icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className={"calendar" + (up ? " is-up" : "")} role="dialog" aria-label={label}>
          <div className="calendar__head">
            <button type="button" className="calendar__nav" onClick={() => shift(-1)} aria-label="Назад">
              ‹
            </button>
            <button
              type="button"
              className="calendar__title"
              onClick={() => setView(view === "days" ? "months" : view === "months" ? "years" : "days")}
              title={view === "days" ? "Выбрать месяц и год" : view === "months" ? "Выбрать год" : "Вернуться к дням"}
            >
              {title}
            </button>
            <button type="button" className="calendar__nav" onClick={() => shift(1)} aria-label="Вперёд">
              ›
            </button>
          </div>

          {view === "days" && (
            <>
              <div className="calendar__weekdays" aria-hidden="true">
                {WEEKDAYS.map((day) => (
                  <span key={day} className="calendar__weekday">{day}</span>
                ))}
              </div>
              <div className="calendar__grid">
                {days.map((iso, index) =>
                  iso === null ? (
                    <span key={`empty-${index}`} className="calendar__empty" />
                  ) : (
                    <button
                      key={iso}
                      type="button"
                      className={
                        "calendar__day" +
                        (iso === value ? " is-selected" : "") +
                        (iso < MIN_DATE || iso > MAX_DATE ? " is-disabled" : "")
                      }
                      onClick={() => pick(iso)}
                      disabled={iso < MIN_DATE || iso > MAX_DATE}
                    >
                      {Number(iso.slice(8, 10))}
                    </button>
                  ),
                )}
              </div>
            </>
          )}

          {view === "months" && (
            <div className="calendar__months">
              {MONTHS_SHORT.map((month, index) => {
                const active =
                  cursor.getFullYear() === parseIso(value).getFullYear() &&
                  index === parseIso(value).getMonth();
                return (
                  <button
                    key={month}
                    type="button"
                    className={"calendar__cell" + (active ? " is-selected" : "")}
                    onClick={() => {
                      setCursor(new Date(cursor.getFullYear(), index, 1));
                      setView("days");
                    }}
                  >
                    {month}
                  </button>
                );
              })}
            </div>
          )}

          {view === "years" && (
            <div className="calendar__years">
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  className={"calendar__cell" + (year === cursor.getFullYear() ? " is-selected" : "")}
                  onClick={() => {
                    setCursor(new Date(year, cursor.getMonth(), 1));
                    setView("months");
                  }}
                >
                  {year}
                </button>
              ))}
            </div>
          )}

          <div className="calendar__foot">
            <button
              type="button"
              className="calendar__today"
              onClick={() => {
                const now = new Date();
                pick(toIso(now));
                setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
              }}
            >
              Сегодня
            </button>
            <button
              type="button"
              className="calendar__today"
              onClick={() => setView(view === "days" ? "months" : "days")}
            >
              {view === "days" ? "Месяц и год" : "К дням"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
