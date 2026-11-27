// scripts/prerender-entry.tsx
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";

// src/App.tsx
import { useCallback as useCallback4, useEffect as useEffect7, useMemo as useMemo4, useRef as useRef5, useState as useState8 } from "react";

// src/components/Inputs.tsx
import { useEffect as useEffect4, useState as useState4 } from "react";

// src/lib/format.ts
var nbsp = "\u202F";
function rub(value, fractionDigits = 0) {
  const rounded = Number.isFinite(value) ? value : 0;
  return rounded.toLocaleString("ru-RU", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }) + nbsp + "\u20BD";
}
function compactRub(value) {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${trim(value / 1e9)}${nbsp}\u043C\u043B\u0440\u0434${nbsp}\u20BD`;
  if (abs >= 1e6) return `${trim(value / 1e6)}${nbsp}\u043C\u043B\u043D${nbsp}\u20BD`;
  if (abs >= 1e4) return `${trim(value / 1e3)}${nbsp}\u0442\u044B\u0441${nbsp}\u20BD`;
  return rub(value);
}
function trim(value) {
  return value.toLocaleString("ru-RU", { maximumFractionDigits: 2, minimumFractionDigits: 0 }).replace(/\s/g, "");
}
function pct(value, fractionDigits = 0) {
  return `${value.toLocaleString("ru-RU", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  })}%`;
}
function yearsWord(value) {
  const abs = Math.abs(value) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return "\u043B\u0435\u0442";
  if (last === 1) return "\u0433\u043E\u0434";
  if (last >= 2 && last <= 4) return "\u0433\u043E\u0434\u0430";
  return "\u043B\u0435\u0442";
}
function parseNumber(raw) {
  const cleaned = raw.replace(/\s|\u202F|\u00A0/g, "").replace(",", ".");
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : 0;
}

// src/lib/dates.ts
var MIN_DATE = "2015-02-01";
var MAX_DATE = "2035-12-31";
function toIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function parseIso(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}
function clampIso(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return MIN_DATE;
  return iso < MIN_DATE ? MIN_DATE : iso > MAX_DATE ? MAX_DATE : iso;
}
function todayIso() {
  return clampIso(toIso(/* @__PURE__ */ new Date()));
}
var MONTHS_GENITIVE = [
  "\u044F\u043D\u0432\u0430\u0440\u044F",
  "\u0444\u0435\u0432\u0440\u0430\u043B\u044F",
  "\u043C\u0430\u0440\u0442\u0430",
  "\u0430\u043F\u0440\u0435\u043B\u044F",
  "\u043C\u0430\u044F",
  "\u0438\u044E\u043D\u044F",
  "\u0438\u044E\u043B\u044F",
  "\u0430\u0432\u0433\u0443\u0441\u0442\u0430",
  "\u0441\u0435\u043D\u0442\u044F\u0431\u0440\u044F",
  "\u043E\u043A\u0442\u044F\u0431\u0440\u044F",
  "\u043D\u043E\u044F\u0431\u0440\u044F",
  "\u0434\u0435\u043A\u0430\u0431\u0440\u044F"
];
var MONTHS_NOMINATIVE = [
  "\u042F\u043D\u0432\u0430\u0440\u044C",
  "\u0424\u0435\u0432\u0440\u0430\u043B\u044C",
  "\u041C\u0430\u0440\u0442",
  "\u0410\u043F\u0440\u0435\u043B\u044C",
  "\u041C\u0430\u0439",
  "\u0418\u044E\u043D\u044C",
  "\u0418\u044E\u043B\u044C",
  "\u0410\u0432\u0433\u0443\u0441\u0442",
  "\u0421\u0435\u043D\u0442\u044F\u0431\u0440\u044C",
  "\u041E\u043A\u0442\u044F\u0431\u0440\u044C",
  "\u041D\u043E\u044F\u0431\u0440\u044C",
  "\u0414\u0435\u043A\u0430\u0431\u0440\u044C"
];
function formatHuman(iso) {
  const date = parseIso(iso);
  return `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]} ${date.getFullYear()}`;
}
function addYears(iso, years) {
  const date = parseIso(iso);
  date.setFullYear(date.getFullYear() + years);
  return clampIso(toIso(date));
}
function yearOf(iso) {
  const year = Number(iso.slice(0, 4));
  return Number.isFinite(year) ? year : 2026;
}

// src/lib/rules.ts
var RULES_YEAR = 2026;
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
function taxOnGains(gain, manualRate) {
  if (gain <= 0) return 0;
  if (manualRate && manualRate > 0) return gain * manualRate;
  const first = Math.min(gain, NDFL_BRACKETS[0].upTo) * NDFL_BRACKETS[0].rate;
  const rest = Math.max(0, gain - NDFL_BRACKETS[0].upTo) * NDFL_BRACKETS[1].rate;
  return first + rest;
}
function iis3MinYears(openYear) {
  if (openYear <= 2026) return 5;
  return Math.min(10, 5 + (openYear - 2026));
}

// src/components/ui.tsx
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function Digit({ digit }) {
  return /* @__PURE__ */ jsx("span", { className: "roll__digit", children: /* @__PURE__ */ jsx("span", { className: "roll__strip", style: { transform: `translateY(-${digit}em)` }, children: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((value) => /* @__PURE__ */ jsx("span", { className: "roll__slot", children: value }, value)) }) });
}
function RollingNumberInner({
  value,
  format
}) {
  const text2 = format(Math.round(value));
  const chars = useMemo(() => [...text2], [text2]);
  const lastChange = useRef(0);
  const [instant, setInstant] = useState(false);
  const instantTimer = useRef(null);
  useEffect(() => {
    const now = performance.now();
    const rapid = now - lastChange.current < 180;
    lastChange.current = now;
    if (rapid) {
      setInstant(true);
      if (instantTimer.current) window.clearTimeout(instantTimer.current);
      instantTimer.current = window.setTimeout(() => setInstant(false), 220);
    }
    return () => {
      if (instantTimer.current) window.clearTimeout(instantTimer.current);
    };
  }, [text2]);
  return /* @__PURE__ */ jsx("span", { className: "roll" + (instant ? " roll--instant" : ""), "aria-label": text2, children: chars.map(
    (char, index) => /\d/.test(char) ? /* @__PURE__ */ jsx(Digit, { digit: Number(char) }, index) : /* @__PURE__ */ jsx("span", { className: "roll__static", "aria-hidden": "true", children: char }, index)
  ) });
}
var RollingNumber = memo(RollingNumberInner);
function useSlidingThumb(ref, activeSelector, deps) {
  const [thumb, setThumb] = useState(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const active = el.querySelector(activeSelector);
      if (!active) {
        setThumb(null);
        return;
      }
      const box = el.getBoundingClientRect();
      const item = active.getBoundingClientRect();
      setThumb({
        left: item.left - box.left - el.clientLeft,
        top: item.top - box.top - el.clientTop,
        width: item.width,
        height: item.height
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, deps);
  return thumb;
}
function Segmented({
  value,
  options,
  onChange,
  stack,
  label
}) {
  const trackRef = useRef(null);
  const thumb = useSlidingThumb(trackRef, ".segmented__item.is-active", [
    value,
    options.length,
    stack
  ]);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: trackRef,
      className: "segmented" + (stack ? " segmented--stack" : ""),
      role: "tablist",
      "aria-label": label,
      children: [
        thumb && /* @__PURE__ */ jsx(
          "span",
          {
            className: "segmented__thumb",
            "aria-hidden": "true",
            style: {
              transform: `translate(${thumb.left}px, ${thumb.top}px)`,
              width: thumb.width,
              height: thumb.height
            }
          }
        ),
        options.map((option) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            role: "tab",
            "aria-selected": option.value === value,
            title: option.title,
            className: "segmented__item" + (option.value === value ? " is-active" : ""),
            onClick: () => onChange(option.value),
            children: option.label
          },
          option.value
        ))
      ]
    }
  );
}
function Toggle({
  checked,
  onChange,
  label,
  hint
}) {
  const fromSwitch = useRef(false);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "toggle",
      onPointerDown: (e) => {
        fromSwitch.current = !!e.target.closest(".toggle__switch");
      },
      onPointerUp: () => {
        if (fromSwitch.current) {
          fromSwitch.current = false;
          return;
        }
        onChange(!checked);
      },
      children: [
        /* @__PURE__ */ jsx("span", { className: "toggle__switch", children: /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            role: "switch",
            "aria-checked": checked,
            "aria-label": label,
            className: "squish" + (checked ? " is-on" : ""),
            onClick: () => onChange(!checked),
            children: /* @__PURE__ */ jsx("span", { className: "squish__thumb" })
          }
        ) }),
        /* @__PURE__ */ jsxs("span", { className: "toggle__text", children: [
          /* @__PURE__ */ jsx("span", { className: "toggle__label", children: label }),
          hint ? /* @__PURE__ */ jsx("span", { className: "toggle__hint", children: hint }) : null
        ] })
      ]
    }
  );
}
function Section({
  title,
  hint,
  children,
  aside,
  collapsible = false,
  defaultOpen
}) {
  const [open, setOpen] = useState(defaultOpen ?? !collapsible);
  const [animating, setAnimating] = useState(false);
  const toggle = () => {
    setAnimating(true);
    setOpen((was) => !was);
    window.setTimeout(() => setAnimating(false), 380);
  };
  return /* @__PURE__ */ jsxs(
    "section",
    {
      className: "section" + (collapsible ? " section--collapsible" : "") + (!open ? " is-collapsed" : "") + (animating ? " is-animating" : ""),
      children: [
        /* @__PURE__ */ jsxs("header", { className: "section__head", children: [
          collapsible ? /* @__PURE__ */ jsxs("button", { type: "button", className: "section__toggle", "aria-expanded": open, onClick: toggle, children: [
            /* @__PURE__ */ jsx("h2", { className: "section__title", children: title }),
            /* @__PURE__ */ jsx(Chevron, {})
          ] }) : /* @__PURE__ */ jsx("h2", { className: "section__title", children: title }),
          aside
        ] }),
        hint ? /* @__PURE__ */ jsx("p", { className: "section__hint", children: hint }) : null,
        /* @__PURE__ */ jsx("div", { className: "section__body-wrap", children: /* @__PURE__ */ jsx("div", { className: "section__body-clip", children: /* @__PURE__ */ jsx("div", { className: "section__body", children: collapsible ? children : /* @__PURE__ */ jsx(AnimatedHeight, { children }) }) }) })
      ]
    }
  );
}
function Chevron() {
  return /* @__PURE__ */ jsx("svg", { className: "section__chevron", width: "1.1em", height: "1.1em", viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ jsx(
    "path",
    {
      d: "M6 9l6 6 6-6",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }
  ) });
}
function Collapse({
  open,
  children
}) {
  return /* @__PURE__ */ jsx("div", { className: "collapse" + (open ? " is-open" : ""), "aria-hidden": !open, children: /* @__PURE__ */ jsx("div", { className: "collapse__clip", children: /* @__PURE__ */ jsx("div", { className: "collapse__inner", children }) }) });
}
function AnimatedHeight({ children }) {
  const innerRef = useRef(null);
  const [height, setHeight] = useState(void 0);
  const [animating, setAnimating] = useState(false);
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    let timer;
    let first = true;
    const sync = () => {
      const next = el.getBoundingClientRect().height;
      setHeight((prev) => {
        if (first) {
          first = false;
          return next;
        }
        if (prev !== void 0 && Math.abs(prev - next) > 0.5) {
          setAnimating(true);
          if (timer) window.clearTimeout(timer);
          timer = window.setTimeout(() => setAnimating(false), 340);
        }
        return next;
      });
    };
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    sync();
    return () => {
      observer.disconnect();
      if (timer) window.clearTimeout(timer);
    };
  }, []);
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "auto-height" + (animating ? " is-animating" : ""),
      style: height === void 0 ? void 0 : { height },
      children: /* @__PURE__ */ jsx("div", { ref: innerRef, children })
    }
  );
}
function CheckMark() {
  return /* @__PURE__ */ jsx("svg", { width: "1em", height: "1em", viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ jsx(
    "path",
    {
      d: "M20 6L9 17l-5-5",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2.6",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }
  ) });
}
function useCopyState(timeout = 1600) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);
  const flash = useCallback(() => {
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), timeout);
  }, [timeout]);
  return { copied, flash };
}
async function copyToClipboard(text2) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text2);
      return true;
    }
  } catch {
  }
  try {
    const area = document.createElement("textarea");
    area.value = text2;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
function CopyButton({
  text: text2,
  label,
  copiedLabel,
  onResult,
  variant = "primary"
}) {
  const { copied, flash } = useCopyState();
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      className: "btn" + (variant === "primary" ? " btn--primary" : " btn--ghost") + (copied ? " is-done" : ""),
      onClick: async () => {
        const ok = await copyToClipboard(text2);
        onResult?.(ok);
        if (ok) flash();
      },
      "aria-live": "polite",
      children: [
        /* @__PURE__ */ jsx("span", { className: "btn__icon", "aria-hidden": "true", children: copied ? /* @__PURE__ */ jsx(CheckMark, {}) : /* @__PURE__ */ jsx(LinkIcon, {}) }),
        copied ? copiedLabel : label
      ]
    }
  );
}
function LinkIcon() {
  return /* @__PURE__ */ jsx("svg", { width: "1em", height: "1em", viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ jsx(
    "path",
    {
      d: "M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1L10.6 5.3M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.4-1.4",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }
  ) });
}
function Sheet({
  open,
  title,
  onClose,
  children
}) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const timer = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, 240);
    return () => window.clearTimeout(timer);
  }, [open]);
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mounted, onClose]);
  if (!mounted) return null;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "sheet" + (closing ? " is-closing" : ""),
      role: "dialog",
      "aria-modal": "true",
      "aria-label": title,
      children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "sheet__backdrop", "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", onClick: onClose }),
        /* @__PURE__ */ jsxs("div", { className: "sheet__panel", children: [
          /* @__PURE__ */ jsx("span", { className: "sheet__handle", "aria-hidden": "true" }),
          /* @__PURE__ */ jsxs("div", { className: "sheet__head", children: [
            /* @__PURE__ */ jsx("h3", { className: "sheet__title", children: title }),
            /* @__PURE__ */ jsx("button", { type: "button", className: "sheet__close", "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", onClick: onClose, children: /* @__PURE__ */ jsx("svg", { width: "0.9em", height: "0.9em", viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ jsx(
              "path",
              {
                d: "M6 6l12 12M18 6L6 18",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2.4",
                strokeLinecap: "round"
              }
            ) }) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "sheet__body", children })
        ] })
      ]
    }
  );
}

// src/components/WakeSlider.tsx
import { useCallback as useCallback2, useEffect as useEffect2, useRef as useRef2, useState as useState2 } from "react";
import { jsx as jsx2 } from "react/jsx-runtime";
var BAR = 4;
var GAP = 2;
var MAX_BARS = 200;
var DECAY = 6.5;
function WakeSlider({ value, min, max, step = 1, label, onChange }) {
  const trackRef = useRef2(null);
  const barsRef = useRef2([]);
  const [count, setCount] = useState2(36);
  const energyRef = useRef2(new Float32Array(MAX_BARS));
  const rafRef = useRef2(null);
  const draggingRef = useRef2(false);
  const lastRef = useRef2({ x: 0, t: 0 });
  const lastIndexRef = useRef2(-1);
  const span = max > min ? max - min : 1;
  const clamped = Math.min(Math.max(value, min), max);
  const indexOf = (v) => Math.round((v - min) / span * (count - 1));
  const applyEnergy = useCallback2(() => {
    const energy = energyRef.current;
    barsRef.current.forEach((bar, index) => {
      if (!bar) return;
      bar.style.transform = `scaleY(${1 + energy[index] * 1.6})`;
    });
  }, []);
  const startDecay = useCallback2(() => {
    if (rafRef.current !== null) return;
    let previous = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - previous) / 1e3);
      previous = now;
      const energy = energyRef.current;
      let alive = false;
      const factor = Math.exp(-dt * DECAY);
      for (let i = 0; i < energy.length; i += 1) {
        energy[i] *= factor;
        if (energy[i] > 0.01) alive = true;
        else energy[i] = 0;
      }
      applyEnergy();
      if (alive) rafRef.current = requestAnimationFrame(tick);
      else {
        rafRef.current = null;
        applyEnergy();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [applyEnergy]);
  useEffect2(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);
  useEffect2(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const width = track.getBoundingClientRect().width;
      const next = Math.min(MAX_BARS, Math.max(12, Math.floor((width + GAP) / (BAR + GAP))));
      setCount((previous) => previous === next ? previous : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);
  const valueFromClientX = (clientX) => {
    const track = trackRef.current;
    if (!track) return clamped;
    const rect = track.getBoundingClientRect();
    const ratio = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
    const raw = min + Math.min(1, Math.max(0, ratio)) * span;
    const stepped = Math.round((raw - min) / step) * step + min;
    return Math.min(max, Math.max(min, Number(stepped.toFixed(4))));
  };
  const wake = (from, to, speed) => {
    const strength = 1 - Math.exp(-speed / 9);
    const energy = energyRef.current;
    const start = Math.min(from, to);
    const end = Math.max(from, to);
    for (let i = start; i <= end; i += 1) {
      energy[i] = Math.max(energy[i], strength);
    }
    startDecay();
  };
  const handlePointer = (event, down) => {
    const now = performance.now();
    const next = valueFromClientX(event.clientX);
    const nextIndex = indexOf(next);
    if (!down && lastIndexRef.current >= 0 && nextIndex !== lastIndexRef.current) {
      const dt = Math.max(1, now - lastRef.current.t);
      const speed = Math.abs(event.clientX - lastRef.current.x) / dt;
      wake(lastIndexRef.current, nextIndex, speed);
    }
    lastRef.current = { x: event.clientX, t: now };
    lastIndexRef.current = nextIndex;
    if (next !== clamped) onChange(next);
  };
  const onKeyDown = (event) => {
    const big = step * 10;
    const map = {
      ArrowRight: step,
      ArrowUp: step,
      ArrowLeft: -step,
      ArrowDown: -step,
      PageUp: big,
      PageDown: -big
    };
    if (event.key === "Home") {
      event.preventDefault();
      onChange(min);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      onChange(max);
      return;
    }
    const delta = map[event.key];
    if (delta === void 0) return;
    event.preventDefault();
    const next = Math.min(max, Math.max(min, clamped + delta));
    onChange(Number(next.toFixed(4)));
    const from = indexOf(clamped);
    const to = indexOf(next);
    wake(from, to, 2.4);
    lastIndexRef.current = to;
  };
  const filled = indexOf(clamped);
  return /* @__PURE__ */ jsx2(
    "div",
    {
      ref: trackRef,
      className: "wks",
      role: "slider",
      tabIndex: 0,
      "aria-label": label,
      "aria-valuemin": min,
      "aria-valuemax": max,
      "aria-valuenow": Math.round(clamped),
      "aria-valuetext": clamped.toLocaleString("ru-RU"),
      "data-dragging": draggingRef.current || void 0,
      onPointerDown: (event) => {
        draggingRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        lastIndexRef.current = -1;
        handlePointer(event, true);
        lastIndexRef.current = indexOf(valueFromClientX(event.clientX));
      },
      onPointerMove: (event) => {
        if (!draggingRef.current) return;
        handlePointer(event, false);
      },
      onPointerUp: (event) => {
        draggingRef.current = false;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      },
      onPointerCancel: () => {
        draggingRef.current = false;
      },
      onKeyDown,
      children: Array.from({ length: count }, (_, index) => /* @__PURE__ */ jsx2(
        "span",
        {
          ref: (node) => {
            barsRef.current[index] = node;
          },
          className: "wks__bar" + (index <= filled ? " is-on" : ""),
          "aria-hidden": "true"
        },
        index
      ))
    }
  );
}

// src/components/DatePicker.tsx
import { useCallback as useCallback3, useEffect as useEffect3, useLayoutEffect as useLayoutEffect2, useMemo as useMemo2, useRef as useRef3, useState as useState3 } from "react";
import { createPortal } from "react-dom";
import { Fragment as Fragment2, jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
var WEEKDAYS = ["\u041F\u043D", "\u0412\u0442", "\u0421\u0440", "\u0427\u0442", "\u041F\u0442", "\u0421\u0431", "\u0412\u0441"];
var MONTHS_SHORT = ["\u042F\u043D\u0432", "\u0424\u0435\u0432", "\u041C\u0430\u0440", "\u0410\u043F\u0440", "\u041C\u0430\u0439", "\u0418\u044E\u043D", "\u0418\u044E\u043B", "\u0410\u0432\u0433", "\u0421\u0435\u043D", "\u041E\u043A\u0442", "\u041D\u043E\u044F", "\u0414\u0435\u043A"];
function DatePicker({
  value,
  onChange,
  label
}) {
  const [open, setOpen] = useState3(false);
  const [view, setView] = useState3("days");
  const [cursor, setCursor] = useState3(() => parseIso(value));
  const [pos, setPos] = useState3(null);
  const wrapRef = useRef3(null);
  const fieldRef = useRef3(null);
  const panelRef = useRef3(null);
  const place = useCallback3(() => {
    const field = fieldRef.current;
    if (!field) return;
    const rect = field.getBoundingClientRect();
    const panelHeight = panelRef.current?.offsetHeight ?? 404;
    const below = window.innerHeight - rect.bottom;
    const up = below < panelHeight + 16 && rect.top > below;
    const wanted = up ? rect.top - panelHeight - 8 : rect.bottom + 8;
    const maxTop = Math.max(8, window.innerHeight - panelHeight - 8);
    setPos({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - 344)),
      top: Math.max(8, Math.min(wanted, maxTop))
    });
  }, []);
  useEffect3(() => setCursor(parseIso(value)), [value]);
  useLayoutEffect2(() => {
    if (!open) return;
    place();
    const panel = panelRef.current;
    if (!panel || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => place());
    observer.observe(panel);
    return () => observer.disconnect();
  }, [open, place, view]);
  useEffect3(() => {
    if (!open) {
      setView("days");
      return;
    }
    place();
    const onScroll = () => place();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, place]);
  useEffect3(() => {
    if (!open) return;
    const onDown = (event) => {
      const target = event.target;
      if (panelRef.current?.contains(target) || wrapRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);
  const years = useMemo2(() => {
    const first = Number(MIN_DATE.slice(0, 4));
    const last = Number(MAX_DATE.slice(0, 4));
    return Array.from({ length: last - first + 1 }, (_, index) => first + index);
  }, []);
  const days = useMemo2(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();
    const cells = Array.from({ length: offset }, () => null);
    for (let day = 1; day <= total; day += 1) cells.push(toIso(new Date(year, month, day)));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);
  const shift = (delta) => {
    setCursor((prev) => {
      if (view === "days") return new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
      if (view === "months") return new Date(prev.getFullYear() + delta, prev.getMonth(), 1);
      return new Date(prev.getFullYear() + delta * 10, prev.getMonth(), 1);
    });
  };
  const pick = (iso) => {
    onChange(clampIso(iso));
    setOpen(false);
  };
  const title = view === "days" ? `${MONTHS_NOMINATIVE[cursor.getMonth()]} ${cursor.getFullYear()}` : view === "months" ? String(cursor.getFullYear()) : "\u0412\u044B\u0431\u043E\u0440 \u0433\u043E\u0434\u0430";
  return /* @__PURE__ */ jsxs2("div", { className: "datepicker", ref: wrapRef, children: [
    /* @__PURE__ */ jsxs2(
      "button",
      {
        ref: fieldRef,
        type: "button",
        className: "datepicker__field" + (open ? " is-open" : ""),
        onClick: () => setOpen((was) => !was),
        "aria-haspopup": "dialog",
        "aria-expanded": open,
        "aria-label": label,
        children: [
          /* @__PURE__ */ jsx3("span", { className: "datepicker__value", children: formatHuman(value) }),
          /* @__PURE__ */ jsxs2("svg", { className: "datepicker__icon", width: "18", height: "18", viewBox: "0 0 24 24", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsx3("rect", { x: "3", y: "5", width: "18", height: "16", rx: "4", fill: "none", stroke: "currentColor", strokeWidth: "1.8" }),
            /* @__PURE__ */ jsx3("path", { d: "M3 10h18M8 3v4M16 3v4", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" })
          ] })
        ]
      }
    ),
    open && pos && createPortal(
      /* @__PURE__ */ jsxs2(
        "div",
        {
          ref: panelRef,
          className: "calendar",
          role: "dialog",
          "aria-label": label,
          style: { position: "fixed", left: pos.left, top: pos.top },
          children: [
            /* @__PURE__ */ jsxs2("div", { className: "calendar__head", children: [
              /* @__PURE__ */ jsx3("button", { type: "button", className: "calendar__nav", onClick: () => shift(-1), "aria-label": "\u041D\u0430\u0437\u0430\u0434", children: "\u2039" }),
              /* @__PURE__ */ jsx3(
                "button",
                {
                  type: "button",
                  className: "calendar__title",
                  onClick: () => setView(view === "days" ? "months" : view === "months" ? "years" : "days"),
                  title: view === "days" ? "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u043C\u0435\u0441\u044F\u0446 \u0438\xA0\u0433\u043E\u0434" : view === "months" ? "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0433\u043E\u0434" : "\u0412\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u043A\xA0\u0434\u043D\u044F\u043C",
                  children: title
                }
              ),
              /* @__PURE__ */ jsx3("button", { type: "button", className: "calendar__nav", onClick: () => shift(1), "aria-label": "\u0412\u043F\u0435\u0440\u0451\u0434", children: "\u203A" })
            ] }),
            view === "days" && /* @__PURE__ */ jsxs2(Fragment2, { children: [
              /* @__PURE__ */ jsx3("div", { className: "calendar__weekdays", "aria-hidden": "true", children: WEEKDAYS.map((day) => /* @__PURE__ */ jsx3("span", { className: "calendar__weekday", children: day }, day)) }),
              /* @__PURE__ */ jsx3("div", { className: "calendar__grid", children: days.map(
                (iso, index) => iso === null ? /* @__PURE__ */ jsx3("span", { className: "calendar__empty" }, `empty-${index}`) : /* @__PURE__ */ jsx3(
                  "button",
                  {
                    type: "button",
                    className: "calendar__day" + (iso === value ? " is-selected" : "") + (iso < MIN_DATE || iso > MAX_DATE ? " is-disabled" : ""),
                    onClick: () => pick(iso),
                    disabled: iso < MIN_DATE || iso > MAX_DATE,
                    children: Number(iso.slice(8, 10))
                  },
                  iso
                )
              ) })
            ] }),
            view === "months" && /* @__PURE__ */ jsx3("div", { className: "calendar__months", children: MONTHS_SHORT.map((month, index) => {
              const active = cursor.getFullYear() === parseIso(value).getFullYear() && index === parseIso(value).getMonth();
              return /* @__PURE__ */ jsx3(
                "button",
                {
                  type: "button",
                  className: "calendar__cell" + (active ? " is-selected" : ""),
                  onClick: () => {
                    setCursor(new Date(cursor.getFullYear(), index, 1));
                    setView("days");
                  },
                  children: month
                },
                month
              );
            }) }),
            view === "years" && /* @__PURE__ */ jsx3("div", { className: "calendar__years", children: years.map((year) => /* @__PURE__ */ jsx3(
              "button",
              {
                type: "button",
                className: "calendar__cell" + (year === cursor.getFullYear() ? " is-selected" : ""),
                onClick: () => {
                  setCursor(new Date(year, cursor.getMonth(), 1));
                  setView("months");
                },
                children: year
              },
              year
            )) }),
            /* @__PURE__ */ jsxs2("div", { className: "calendar__foot", children: [
              /* @__PURE__ */ jsx3(
                "button",
                {
                  type: "button",
                  className: "calendar__today",
                  onClick: () => {
                    const now = /* @__PURE__ */ new Date();
                    pick(toIso(now));
                    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
                  },
                  children: "\u0421\u0435\u0433\u043E\u0434\u043D\u044F"
                }
              ),
              /* @__PURE__ */ jsx3(
                "button",
                {
                  type: "button",
                  className: "calendar__today",
                  onClick: () => setView(view === "days" ? "months" : "days"),
                  children: view === "days" ? "\u041C\u0435\u0441\u044F\u0446 \u0438\xA0\u0433\u043E\u0434" : "\u041A \u0434\u043D\u044F\u043C"
                }
              )
            ] })
          ]
        }
      ),
      document.body
    )
  ] });
}

// src/components/Inputs.tsx
import { Fragment as Fragment3, jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
var money = (value) => value > 0 ? value.toLocaleString("ru-RU") : "";
var parseMoney = (raw) => parseNumber(raw.replace(/[^\d\s\u202F]/g, ""));
function MoneyValue({
  value,
  onChange,
  label,
  suffix
}) {
  const [draft, setDraft] = useState4(() => money(value));
  const [focused, setFocused] = useState4(false);
  useEffect4(() => {
    if (!focused) setDraft(money(value));
  }, [value, focused]);
  return /* @__PURE__ */ jsxs3("div", { className: "param__value", children: [
    /* @__PURE__ */ jsx4(
      "input",
      {
        className: "param__input ym-disable-keys",
        inputMode: "numeric",
        "aria-label": label,
        value: draft,
        onChange: (event) => {
          const next = parseMoney(event.target.value);
          setDraft(next > 0 ? next.toLocaleString("ru-RU") : "");
          onChange(next);
        },
        onFocus: () => setFocused(true),
        onBlur: () => {
          setFocused(false);
          setDraft(money(value));
        }
      }
    ),
    suffix ? /* @__PURE__ */ jsx4("span", { className: "param__unit", children: suffix }) : null
  ] });
}
function Param({
  label,
  hint,
  value,
  min,
  max,
  step,
  suffix,
  wide,
  onChange
}) {
  return /* @__PURE__ */ jsxs3("div", { className: "param" + (wide ? " param--wide" : ""), children: [
    /* @__PURE__ */ jsx4("span", { className: "param__label", children: label }),
    /* @__PURE__ */ jsx4(MoneyValue, { value, onChange, label, suffix }),
    /* @__PURE__ */ jsx4(WakeSlider, { value, min, max, step, label, onChange }),
    hint ? /* @__PURE__ */ jsx4("span", { className: "param__hint", children: hint }) : null
  ] });
}
function Inputs({
  scenario,
  onChange,
  account,
  onAccountChange,
  onReset
}) {
  const contributionLimit = account === "iis3" ? void 0 : OLD_IIS_CONTRIBUTION_LIMIT;
  const overLimit = contributionLimit !== void 0 && scenario.annualContribution > contributionLimit;
  const openYear = yearOf(scenario.openDate);
  const minHolding = account === "iis3" ? openYear <= 2026 ? 5 : Math.min(10, 5 + (openYear - 2026)) : 3;
  const monthlyIncome = Math.round(scenario.officialIncome / 12);
  const incomeTax = ndfl(scenario.officialIncome);
  const appliedRate = Math.round(
    (scenario.manualRate ?? marginalRate(scenario.officialIncome)) * 100
  );
  const periods = scenario.periodsPerYear ?? 1;
  const custom = scenario.contributionMode === "custom";
  const planTotal = scenario.contributions.slice(0, scenario.years).reduce((sum, value) => sum + value, 0);
  useEffect4(() => {
    if (account !== "iis3" && openYear > 2023) {
      onChange({ openDate: "2023-01-01" });
    }
  }, [account, openYear, onChange]);
  useEffect4(() => {
    if (!custom) return;
    if (scenario.contributions.length === scenario.years) return;
    const fallback = scenario.contributions[scenario.contributions.length - 1] ?? scenario.annualContribution;
    const next = Array.from(
      { length: scenario.years },
      (_, index) => scenario.contributions[index] ?? fallback
    );
    onChange({ contributions: next });
  }, [custom, scenario.contributions, scenario.years, scenario.annualContribution, onChange]);
  const setContribution = (index, value) => {
    const next = [...scenario.contributions];
    while (next.length < scenario.years) next.push(next[next.length - 1] ?? 0);
    next[index] = value;
    onChange({ contributions: next });
  };
  return /* @__PURE__ */ jsxs3("div", { className: "inputs", children: [
    /* @__PURE__ */ jsxs3(
      Section,
      {
        title: "\u0421\u0447\u0451\u0442",
        aside: /* @__PURE__ */ jsx4("button", { type: "button", className: "btn btn--ghost btn--sm", onClick: onReset, children: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C" }),
        children: [
          /* @__PURE__ */ jsx4(
            Segmented,
            {
              label: "\u0422\u0438\u043F \u0441\u0447\u0451\u0442\u0430",
              value: account,
              onChange: onAccountChange,
              options: [
                { value: "iis3", label: "\u0418\u0418\u0421-3", title: "\u041E\u0431\u0430 \u0432\u044B\u0447\u0435\u0442\u0430: \u0432\u0437\u043D\u043E\u0441 \u0438\xA0\u0434\u043E\u0445\u043E\u0434" },
                { value: "iis1", label: "\u0422\u0438\u043F \u0410", title: "\u0412\u044B\u0447\u0435\u0442 \u043D\u0430\xA0\u0432\u0437\u043D\u043E\u0441, \u0434\u043E\u0445\u043E\u0434 \u043E\u0431\u043B\u0430\u0433\u0430\u0435\u0442\u0441\u044F" },
                { value: "iis2", label: "\u0422\u0438\u043F \u0411", title: "\u0414\u043E\u0445\u043E\u0434 \u0431\u0435\u0437\xA0\u043D\u0430\u043B\u043E\u0433\u0430, \u0432\u044B\u0447\u0435\u0442\u0430 \u043D\u0430\xA0\u0432\u0437\u043D\u043E\u0441 \u043D\u0435\u0442" }
              ]
            }
          ),
          /* @__PURE__ */ jsx4("p", { className: "inputs__note", children: account === "iis3" ? "\u0418\u0418\u0421-3\xA0\u2014 \u043E\u0431\u0430 \u0432\u044B\u0447\u0435\u0442\u0430 \u0441\u0440\u0430\u0437\u0443: \u0432\u043E\u0437\u0432\u0440\u0430\u0442 \u041D\u0414\u0424\u041B \u0437\u0430\xA0\u0432\u0437\u043D\u043E\u0441\u044B \u0438\xA0\u043E\u0441\u0432\u043E\u0431\u043E\u0436\u0434\u0435\u043D\u0438\u0435 \u0434\u043E\u0445\u043E\u0434\u0430 \u043E\u0442\xA0\u043D\u0430\u043B\u043E\u0433\u0430" : account === "iis1" ? "\u0422\u0438\u043F \u0410\xA0\u2014 \u0432\u043E\u0437\u0432\u0440\u0430\u0442 \u041D\u0414\u0424\u041B \u0441\xA0\u0432\u0437\u043D\u043E\u0441\u043E\u0432. \u0414\u043E\u0445\u043E\u0434 \u043D\u0430\xA0\u0441\u0447\u0451\u0442\u0435 \u043E\u0431\u043B\u0430\u0433\u0430\u0435\u0442\u0441\u044F \u043D\u0430\u043B\u043E\u0433\u043E\u043C \u043F\u0440\u0438\xA0\u0437\u0430\u043A\u0440\u044B\u0442\u0438\u0438" : "\u0422\u0438\u043F \u0411\xA0\u2014 \u0434\u043E\u0445\u043E\u0434 \u043E\u0441\u0432\u043E\u0431\u043E\u0436\u0434\u0451\u043D \u043E\u0442\xA0\u041D\u0414\u0424\u041B, \u043D\u043E\xA0\u0432\u044B\u0447\u0435\u0442\u0430 \u043D\u0430\xA0\u0432\u0437\u043D\u043E\u0441 \u043D\u0435\u0442" }),
          /* @__PURE__ */ jsxs3("div", { className: "inputs__date", children: [
            /* @__PURE__ */ jsx4("span", { className: "param__label", children: "\u0414\u0430\u0442\u0430 \u043E\u0442\u043A\u0440\u044B\u0442\u0438\u044F" }),
            /* @__PURE__ */ jsx4(
              DatePicker,
              {
                label: "\u0414\u0430\u0442\u0430 \u043E\u0442\u043A\u0440\u044B\u0442\u0438\u044F \u0441\u0447\u0451\u0442\u0430",
                value: scenario.openDate,
                onChange: (iso) => onChange({ openDate: iso })
              }
            ),
            /* @__PURE__ */ jsx4("p", { className: "inputs__note", children: account === "iis3" ? /* @__PURE__ */ jsxs3(Fragment3, { children: [
              "\u0421\u0440\u043E\u043A \u0432\u043B\u0430\u0434\u0435\u043D\u0438\u044F \u0434\u043B\u044F\xA0\u044D\u0442\u043E\u0433\u043E \u0441\u0447\u0451\u0442\u0430\xA0\u2014 ",
              /* @__PURE__ */ jsxs3("b", { children: [
                minHolding,
                " ",
                yearsWord(minHolding)
              ] }),
              ", \u0437\u0430\u043A\u0440\u044B\u0442\u044C \u0431\u0435\u0437\xA0\u043F\u043E\u0442\u0435\u0440\u0438 \u043B\u044C\u0433\u043E\u0442 \u043C\u043E\u0436\u043D\u043E \u0441",
              " ",
              /* @__PURE__ */ jsx4("b", { children: formatHuman(addYears(scenario.openDate, minHolding)) }),
              "."
            ] }) : /* @__PURE__ */ jsxs3(Fragment3, { children: [
              "\u0421 2024\u202F\u0433\u043E\u0434\u0430 \u043D\u043E\u0432\u044B\u0435 \u0441\u0447\u0435\u0442\u0430 \u0442\u0438\u043F\u0430 \u0410 \u0438\xA0\u0411 \u043D\u0435\xA0\u043E\u0442\u043A\u0440\u044B\u0432\u0430\u044E\u0442\xA0\u2014 \u0437\u0434\u0435\u0441\u044C \u0441\u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u0443\u0436\u0435 \u043E\u0442\u043A\u0440\u044B\u0442\u044B\u0439, \u0435\u0433\u043E\xA0\u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0439 \u0441\u0440\u043E\u043A\xA0\u2014 ",
              /* @__PURE__ */ jsx4("b", { children: "3\u202F\u0433\u043E\u0434\u0430" }),
              "."
            ] }) })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxs3(
      Section,
      {
        title: "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0440\u0430\u0441\u0447\u0451\u0442\u0430",
        hint: "\u0412\u0437\u043D\u043E\u0441\u044B, \u0441\u0440\u043E\u043A, \u0434\u043E\u0445\u043E\u0434\u043D\u043E\u0441\u0442\u044C \u0438\xA0\u0438\u043D\u0444\u043B\u044F\u0446\u0438\u044F\xA0\u2014 \u0432\u0441\u0451, \u0438\u0437\xA0\u0447\u0435\u0433\u043E \u0441\u043A\u043B\u0430\u0434\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0438\u0442\u043E\u0433",
        children: [
          /* @__PURE__ */ jsxs3("div", { className: "params", children: [
            /* @__PURE__ */ jsxs3("div", { className: "param param--wide", children: [
              /* @__PURE__ */ jsx4("span", { className: "param__label", children: "\u041E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u044B\u0439 \u0434\u043E\u0445\u043E\u0434 \u0432\xA0\u043C\u0435\u0441\u044F\u0446" }),
              /* @__PURE__ */ jsx4(
                MoneyValue,
                {
                  value: monthlyIncome,
                  onChange: (v) => onChange({ officialIncome: v * 12 }),
                  label: "\u041E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u044B\u0439 \u0434\u043E\u0445\u043E\u0434 \u0432\xA0\u043C\u0435\u0441\u044F\u0446",
                  suffix: "\u20BD"
                }
              ),
              /* @__PURE__ */ jsx4(
                WakeSlider,
                {
                  value: monthlyIncome,
                  min: 0,
                  max: 2e6,
                  step: 1e3,
                  label: "\u041E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u044B\u0439 \u0434\u043E\u0445\u043E\u0434 \u0432\xA0\u043C\u0435\u0441\u044F\u0446",
                  onChange: (v) => onChange({ officialIncome: v * 12 })
                }
              ),
              /* @__PURE__ */ jsxs3("span", { className: "param__hint", children: [
                "\u0432\xA0\u0433\u043E\u0434 ",
                compactRub(scenario.officialIncome),
                " \xB7 \u041D\u0414\u0424\u041B \u2248 ",
                rub(incomeTax),
                " \xB7 \u0441\u0442\u0430\u0432\u043A\u0430",
                " ",
                appliedRate,
                "%",
                scenario.manualRate ? " (\u0432\u0440\u0443\u0447\u043D\u0443\u044E)" : ""
              ] }),
              /* @__PURE__ */ jsxs3("div", { className: "param__nested", children: [
                /* @__PURE__ */ jsx4(
                  Toggle,
                  {
                    checked: scenario.manualRate !== null,
                    onChange: (enabled) => onChange({ manualRate: enabled ? marginalRate(scenario.officialIncome) : null }),
                    label: "\u0417\u0430\u0434\u0430\u0442\u044C \u0441\u0442\u0430\u0432\u043A\u0443 \u041D\u0414\u0424\u041B \u0432\u0440\u0443\u0447\u043D\u0443\u044E",
                    hint: scenario.manualRate ? "\u0441\u0442\u0430\u0432\u043A\u0430 \u0438\u0437\xA0\u0434\u043E\u0445\u043E\u0434\u0430 \u0432\u044B\u0448\u0435 \u043D\u0435\xA0\u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F\xA0\u2014 \u0441\u0447\u0438\u0442\u0430\u0435\u043C \u043F\u043E\xA0\u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0439" : `\u043F\u043E\xA0\u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E \u0431\u0435\u0440\u0451\u043C \u043F\u0440\u0435\u0434\u0435\u043B\u044C\u043D\u0443\u044E \u0441\u0442\u0430\u0432\u043A\u0443 \u043F\u043E\xA0\u0434\u043E\u0445\u043E\u0434\u0443\xA0\u2014 ${appliedRate}%`
                  }
                ),
                /* @__PURE__ */ jsx4(Collapse, { open: scenario.manualRate !== null, children: /* @__PURE__ */ jsx4("div", { className: "param--choice", children: /* @__PURE__ */ jsx4(
                  Segmented,
                  {
                    label: "\u0421\u0442\u0430\u0432\u043A\u0430 \u041D\u0414\u0424\u041B",
                    value: String(appliedRate),
                    onChange: (v) => onChange({ manualRate: Number(v) / 100 }),
                    options: [
                      { value: "13", label: "13%" },
                      { value: "15", label: "15%" },
                      { value: "18", label: "18%" },
                      { value: "20", label: "20%" },
                      { value: "22", label: "22%" }
                    ]
                  }
                ) }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs3("div", { className: "param param--wide param--spaced", children: [
              /* @__PURE__ */ jsx4("span", { className: "param__label", children: "\u0412\u0437\u043D\u043E\u0441\u044B \u043D\u0430\xA0\u0441\u0447\u0451\u0442" }),
              /* @__PURE__ */ jsx4(
                Segmented,
                {
                  label: "\u041A\u0430\u043A \u0437\u0430\u0434\u0430\u0451\u043C \u0432\u0437\u043D\u043E\u0441\u044B",
                  value: scenario.contributionMode,
                  onChange: (v) => onChange({ contributionMode: v }),
                  options: [
                    { value: "uniform", label: "\u041E\u0434\u043D\u0430 \u0441\u0443\u043C\u043C\u0430 \u043D\u0430\xA0\u0432\u0441\u0435 \u0433\u043E\u0434\u044B" },
                    { value: "custom", label: "\u0420\u0430\u0437\u043D\u044B\u0435 \u0441\u0443\u043C\u043C\u044B \u043F\u043E\xA0\u0433\u043E\u0434\u0430\u043C" }
                  ]
                }
              ),
              /* @__PURE__ */ jsxs3(Collapse, { open: custom, children: [
                /* @__PURE__ */ jsx4("div", { className: "plan", children: Array.from({ length: scenario.years }, (_, index) => /* @__PURE__ */ jsxs3(
                  "label",
                  {
                    className: "plan__row",
                    style: { animationDelay: `${Math.min(index, 12) * 28}ms` },
                    children: [
                      /* @__PURE__ */ jsx4("span", { className: "plan__year", children: openYear + index }),
                      /* @__PURE__ */ jsxs3("span", { className: "plan__field", children: [
                        /* @__PURE__ */ jsx4(
                          "input",
                          {
                            className: "plan__input ym-disable-keys",
                            inputMode: "numeric",
                            "aria-label": `\u0412\u0437\u043D\u043E\u0441 \u0432 ${openYear + index} \u0433\u043E\u0434\u0443`,
                            value: money(scenario.contributions[index] ?? 0),
                            onChange: (event) => setContribution(index, parseMoney(event.target.value))
                          }
                        ),
                        /* @__PURE__ */ jsx4("span", { className: "plan__unit", children: "\u20BD" })
                      ] })
                    ]
                  },
                  index
                )) }),
                /* @__PURE__ */ jsxs3("span", { className: "param__hint", children: [
                  "\u0432\u0441\u0435\u0433\u043E \u0437\u0430 ",
                  scenario.years,
                  " ",
                  yearsWord(scenario.years),
                  " \u2014 ",
                  rub(planTotal),
                  " \xB7 \u0432\u044B\u0447\u0435\u0442 \u0441\u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u0441\xA0\u0431\u0430\u0437\u044B ",
                  compactRub(DEDUCTION_BASE_LIMIT),
                  " \u0432\xA0\u0433\u043E\u0434"
                ] })
              ] }),
              /* @__PURE__ */ jsxs3(Collapse, { open: !custom, children: [
                /* @__PURE__ */ jsx4(
                  MoneyValue,
                  {
                    value: scenario.annualContribution,
                    onChange: (v) => onChange({ annualContribution: v }),
                    label: "\u041F\u043E\u043F\u043E\u043B\u043D\u044F\u044E \u043A\u0430\u0436\u0434\u044B\u0439 \u0433\u043E\u0434",
                    suffix: "\u20BD"
                  }
                ),
                /* @__PURE__ */ jsx4(
                  WakeSlider,
                  {
                    value: Math.min(scenario.annualContribution, contributionLimit ?? 2e6),
                    min: 0,
                    max: contributionLimit ?? 2e6,
                    step: 5e3,
                    label: "\u041F\u043E\u043F\u043E\u043B\u043D\u044F\u044E \u043A\u0430\u0436\u0434\u044B\u0439 \u0433\u043E\u0434",
                    onChange: (v) => onChange({ annualContribution: v })
                  }
                ),
                /* @__PURE__ */ jsx4("span", { className: "param__hint", children: overLimit ? `\u0423 \u044D\u0442\u043E\u0433\u043E \u0441\u0447\u0451\u0442\u0430 \u043B\u0438\u043C\u0438\u0442 ${compactRub(OLD_IIS_CONTRIBUTION_LIMIT)} \u0432\xA0\u0433\u043E\u0434\xA0\u2014 \u0441\u0443\u043C\u043C\u0430 \u0443\u0440\u0435\u0437\u0430\u043D\u0430` : `\u044D\u0442\u043E ${compactRub(Math.round(scenario.annualContribution / 12))} \u0432\xA0\u043C\u0435\u0441\u044F\u0446 \xB7 \u0432\u044B\u0447\u0435\u0442 \u0441\u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u0441\xA0\u0431\u0430\u0437\u044B ${compactRub(DEDUCTION_BASE_LIMIT)}` })
              ] })
            ] }),
            /* @__PURE__ */ jsx4(
              Param,
              {
                label: "\u0421\u0440\u043E\u043A",
                value: scenario.years,
                min: 1,
                max: 30,
                step: 1,
                suffix: yearsWord(scenario.years),
                onChange: (v) => onChange({ years: v }),
                hint: scenario.years < minHolding ? `\u041C\u0438\u043D\u0438\u043C\u0443\u043C \u0434\u043B\u044F\xA0\u044D\u0442\u043E\u0433\u043E \u0441\u0447\u0451\u0442\u0430\xA0\u2014 ${minHolding} ${yearsWord(minHolding)}: \u0437\u0430\u043A\u0440\u043E\u0435\u0442\u0435 \u0440\u0430\u043D\u044C\u0448\u0435, \u0432\u044B\u0447\u0435\u0442\u044B \u043F\u0440\u0438\u0434\u0451\u0442\u0441\u044F \u0432\u0435\u0440\u043D\u0443\u0442\u044C` : `\u0437\u0430\u043A\u0440\u044B\u0442\u044C \u043C\u043E\u0436\u043D\u043E \u0441 ${formatHuman(addYears(scenario.openDate, scenario.years))}`
              }
            ),
            /* @__PURE__ */ jsx4(
              Param,
              {
                label: "\u0414\u043E\u0445\u043E\u0434\u043D\u043E\u0441\u0442\u044C",
                value: scenario.returnPct,
                min: 0,
                max: 30,
                step: 0.5,
                suffix: "% \u0433\u043E\u0434\u043E\u0432\u044B\u0445",
                onChange: (v) => onChange({ returnPct: v }),
                hint: "\u0441\u0440\u0435\u0434\u043D\u0435\u0433\u043E\u0434\u043E\u0432\u0430\u044F \u0434\u043E\u0445\u043E\u0434\u043D\u043E\u0441\u0442\u044C \u043F\u043E\u0440\u0442\u0444\u0435\u043B\u044F \u0437\u0430\xA0\u0432\u0435\u0441\u044C \u0441\u0440\u043E\u043A"
              }
            ),
            /* @__PURE__ */ jsx4(
              Param,
              {
                label: "\u0418\u043D\u0444\u043B\u044F\u0446\u0438\u044F",
                value: scenario.inflationPct,
                min: 0,
                max: 20,
                step: 0.5,
                suffix: "% \u0433\u043E\u0434\u043E\u0432\u044B\u0445",
                onChange: (v) => onChange({ inflationPct: v }),
                hint: "\u043D\u0430\xA0\u043D\u0435\u0451 \u0434\u0435\u043B\u0438\u043C \u0438\u0442\u043E\u0433, \u0447\u0442\u043E\u0431\u044B \u043F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0434\u0435\u043D\u044C\u0433\u0438 \u0432\xA0\u0441\u0435\u0433\u043E\u0434\u043D\u044F\u0448\u043D\u0438\u0445 \u0446\u0435\u043D\u0430\u0445"
              }
            ),
            /* @__PURE__ */ jsxs3("div", { className: "param param--wide param--choice param--choice--two", children: [
              /* @__PURE__ */ jsx4("span", { className: "param__label", children: "\u0427\u0430\u0441\u0442\u043E\u0442\u0430 \u0440\u0435\u0438\u043D\u0432\u0435\u0441\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F" }),
              /* @__PURE__ */ jsx4(
                Segmented,
                {
                  label: "\u0427\u0430\u0441\u0442\u043E\u0442\u0430 \u0440\u0435\u0438\u043D\u0432\u0435\u0441\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F",
                  value: String(periods),
                  onChange: (v) => onChange({ periodsPerYear: Number(v) }),
                  options: [
                    { value: "1", label: "\u0420\u0430\u0437 \u0432\xA0\u0433\u043E\u0434" },
                    { value: "2", label: "\u0420\u0430\u0437 \u0432\xA0\u043F\u043E\u043B\u0433\u043E\u0434\u0430" },
                    { value: "4", label: "\u0420\u0430\u0437 \u0432\xA0\u043A\u0432\u0430\u0440\u0442\u0430\u043B" },
                    { value: "12", label: "\u0420\u0430\u0437 \u0432\xA0\u043C\u0435\u0441\u044F\u0446" }
                  ]
                }
              ),
              /* @__PURE__ */ jsx4("span", { className: "param__hint", children: periods > 1 ? `\u0434\u043E\u0445\u043E\u0434 \u043A\u0430\u043F\u0438\u0442\u0430\u043B\u0438\u0437\u0438\u0440\u0443\u0435\u0442\u0441\u044F ${periods} \u0440\u0430\u0437 \u0432\xA0\u0433\u043E\u0434\xA0\u2014 \u0438\u0442\u043E\u0433 \u043D\u0435\u043C\u043D\u043E\u0433\u043E \u0432\u044B\u0448\u0435` : "\u0434\u043E\u0445\u043E\u0434 \u043D\u0430\u0447\u0438\u0441\u043B\u044F\u0435\u0442\u0441\u044F \u0440\u0430\u0437 \u0432\xA0\u0433\u043E\u0434" })
            ] })
          ] }),
          /* @__PURE__ */ jsx4(
            Toggle,
            {
              checked: scenario.reinvestRefunds,
              onChange: (v) => onChange({ reinvestRefunds: v }),
              label: "\u0412\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0442\u044C \u0432\u044B\u0447\u0435\u0442 \u043E\u0431\u0440\u0430\u0442\u043D\u043E \u043D\u0430\xA0\u0441\u0447\u0451\u0442",
              hint: "\u041E\u0441\u043D\u043E\u0432\u043D\u043E\u0439 \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0439\xA0\u2014 \u0434\u0435\u043D\u044C\u0433\u0438 \u0440\u0430\u0431\u043E\u0442\u0430\u044E\u0442 \u0434\u0430\u043B\u044C\u0448\u0435, \u0430\xA0\u043D\u0435\xA0\u043B\u0435\u0436\u0430\u0442 \u043D\u0430\xA0\u043A\u0430\u0440\u0442\u0435"
            }
          )
        ]
      }
    )
  ] });
}

// src/components/Summary.tsx
import { jsx as jsx5, jsxs as jsxs4 } from "react/jsx-runtime";
function collectWarnings(result, scenario) {
  const list = [];
  if (result.earlyClose) {
    list.push({
      tone: "warn",
      text: `\u0421\u0447\u0451\u0442 \u0437\u0430\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043D\u0430 ${scenario.years} ${yearsWord(scenario.years)} \u2014 \u044D\u0442\u043E\xA0\u0440\u0430\u043D\u044C\u0448\u0435 \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0441\u0440\u043E\u043A\u0430 \u0432 ${result.minHolding} ${yearsWord(result.minHolding)}. \u0412\u044B\u0447\u0435\u0442\u044B \u043F\u0440\u0438\u0434\u0451\u0442\u0441\u044F \u0432\u0435\u0440\u043D\u0443\u0442\u044C (${rub(result.clawback)}), \u0430\xA0\u0441\xA0\u043F\u0440\u0438\u0431\u044B\u043B\u0438 \u0437\u0430\u043F\u043B\u0430\u0442\u0438\u0442\u044C \u043D\u0430\u043B\u043E\u0433`
    });
  }
  if (scenario.officialIncome <= 0) {
    list.push({
      tone: "warn",
      text: "\u0411\u0435\u0437 \u043E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0434\u043E\u0445\u043E\u0434\u0430 \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0442\u044C \u043D\u0435\u0447\u0435\u0433\u043E: \u0432\u044B\u0447\u0435\u0442 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D \u0443\u043F\u043B\u0430\u0447\u0435\u043D\u043D\u044B\u043C \u041D\u0414\u0424\u041B"
    });
  }
  if (result.refunds < scenario.annualContribution * 0.13 * scenario.years * 0.999 && result.refunds > 0) {
    list.push({
      tone: "info",
      text: "\u0412\u044B\u0447\u0435\u0442 \u0443\u043F\u0451\u0440\u0441\u044F \u0432\xA0\u043F\u0440\u0435\u0434\u0435\u043B: \u043E\u043D\xA0\u0441\u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0441\xA0400 000\u202F\u20BD \u0432\u0437\u043D\u043E\u0441\u043E\u0432 \u0432\xA0\u0433\u043E\u0434 \u0438\xA0\u043D\u0435\xA0\u0431\u043E\u043B\u044C\u0448\u0435 \u0443\u043F\u043B\u0430\u0447\u0435\u043D\u043D\u043E\u0433\u043E \u041D\u0414\u0424\u041B"
    });
  }
  if (result.type !== "iis3" && scenario.annualContribution > 1e6) {
    list.push({
      tone: "info",
      text: "\u0423 \u0442\u0438\u043F\u043E\u0432 \u0410 \u0438\xA0\u0411 \u0435\u0441\u0442\u044C \u043B\u0438\u043C\u0438\u0442 \u0432\u0437\u043D\u043E\u0441\u0430 1\u202F\u043C\u043B\u043D \u20BD \u0432\xA0\u0433\u043E\u0434\xA0\u2014 \u0438\u0437\u043B\u0438\u0448\u0435\u043A \u0432\xA0\u0440\u0430\u0441\u0447\u0451\u0442\u0435 \u043D\u0435\xA0\u0443\u0447\u0430\u0441\u0442\u0432\u0443\u0435\u0442"
    });
  }
  return list;
}
function Summary({ result, scenario }) {
  const warnings = collectWarnings(result, scenario);
  const profitToUser = result.grossCapital - result.contributions;
  return /* @__PURE__ */ jsxs4("div", { className: "summary", children: [
    /* @__PURE__ */ jsxs4("div", { className: "summary__hero", children: [
      /* @__PURE__ */ jsx5("span", { className: "summary__hero-label", children: "\u041D\u0430 \u0440\u0443\u043A\u0438 \u043F\u043E\u0441\u043B\u0435 \u0437\u0430\u043A\u0440\u044B\u0442\u0438\u044F" }),
      /* @__PURE__ */ jsx5("span", { className: "summary__hero-value", children: /* @__PURE__ */ jsx5(RollingNumber, { value: result.net, format: (n) => rub(n) }) }),
      /* @__PURE__ */ jsxs4("span", { className: "summary__hero-sub", children: [
        "\u0432\xA0\u0446\u0435\u043D\u0430\u0445 \u0441\u0435\u0433\u043E\u0434\u043D\u044F\u0448\u043D\u0435\u0433\u043E \u0434\u043D\u044F\xA0\u2014 ",
        /* @__PURE__ */ jsx5("b", { children: compactRub(result.netReal) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs4("dl", { className: "stats", children: [
      /* @__PURE__ */ jsxs4("div", { className: "stat", children: [
        /* @__PURE__ */ jsx5("dt", { children: "\u0412\u044B\u0447\u0435\u0442\u044B \u0437\u0430\xA0\u0441\u0440\u043E\u043A" }),
        /* @__PURE__ */ jsx5("dd", { children: /* @__PURE__ */ jsx5(RollingNumber, { value: result.refunds, format: (n) => rub(n) }) }),
        /* @__PURE__ */ jsx5("span", { className: "stat__sub", children: "\u0432\u0435\u0440\u043D\u0451\u0442 \u043D\u0430\u043B\u043E\u0433\u043E\u0432\u0430\u044F" })
      ] }),
      /* @__PURE__ */ jsxs4("div", { className: "stat", children: [
        /* @__PURE__ */ jsx5("dt", { children: "\u041A\u0430\u043F\u0438\u0442\u0430\u043B \u043D\u0430\xA0\u0441\u0447\u0451\u0442\u0435" }),
        /* @__PURE__ */ jsx5("dd", { children: /* @__PURE__ */ jsx5(RollingNumber, { value: result.grossCapital, format: (n) => rub(n) }) }),
        /* @__PURE__ */ jsxs4("span", { className: "stat__sub", children: [
          compactRub(profitToUser),
          " \u0434\u043E\u0445\u043E\u0434\u0430"
        ] })
      ] }),
      /* @__PURE__ */ jsxs4("div", { className: "stat", children: [
        /* @__PURE__ */ jsx5("dt", { children: "\u041D\u0430\u043B\u043E\u0433 \u043F\u0440\u0438\xA0\u0437\u0430\u043A\u0440\u044B\u0442\u0438\u0438" }),
        /* @__PURE__ */ jsx5("dd", { className: result.exitTax > 0 ? "is-warn" : "is-ok", children: /* @__PURE__ */ jsx5(RollingNumber, { value: result.exitTax, format: (n) => rub(n) }) }),
        /* @__PURE__ */ jsx5("span", { className: "stat__sub", children: result.type === "iis3" ? "\u043F\u0440\u0438\u0431\u044B\u043B\u044C \u043E\u0441\u0432\u043E\u0431\u043E\u0436\u0434\u0435\u043D\u0430 \u0434\u043E\xA030\u202F\u043C\u043B\u043D \u20BD" : result.type === "iis2" ? "\u043F\u0440\u0438\u0431\u044B\u043B\u044C \u043D\u0435\xA0\u043E\u0431\u043B\u0430\u0433\u0430\u0435\u0442\u0441\u044F" : "13% \u0441\xA0\u043F\u0440\u0438\u0431\u044B\u043B\u0438 \u0434\u043E\xA02,4\u202F\u043C\u043B\u043D, \u0434\u0430\u043B\u044C\u0448\u0435 15%" })
      ] }),
      /* @__PURE__ */ jsxs4("div", { className: "stat", children: [
        /* @__PURE__ */ jsx5("dt", { children: "\u0412\u0430\u0448\u0438 \u0432\u0437\u043D\u043E\u0441\u044B" }),
        /* @__PURE__ */ jsx5("dd", { children: rub(result.contributions) }),
        /* @__PURE__ */ jsx5("span", { className: "stat__sub", children: scenario.reinvestRefunds ? "\u0432\u044B\u0447\u0435\u0442\u044B \u0440\u0435\u0438\u043D\u0432\u0435\u0441\u0442\u0438\u0440\u0443\u044E\u0442\u0441\u044F" : "\u0432\u044B\u0447\u0435\u0442\u044B \u0437\u0430\u0431\u0438\u0440\u0430\u0435\u0442\u0435 \u0434\u0435\u043D\u044C\u0433\u0430\u043C\u0438" })
      ] })
    ] }),
    /* @__PURE__ */ jsx5(Collapse, { open: result.earlyClose && result.earlyPenalty > 0, children: /* @__PURE__ */ jsxs4("div", { className: "callout callout--warn", children: [
      /* @__PURE__ */ jsxs4("span", { className: "callout__title", children: [
        "\u0414\u043E\u0441\u0440\u043E\u0447\u043D\u043E\u0435 \u0437\u0430\u043A\u0440\u044B\u0442\u0438\u0435 \u0441\u0442\u043E\u0438\u0442 ",
        compactRub(result.earlyPenalty)
      ] }),
      /* @__PURE__ */ jsxs4("span", { className: "callout__text", children: [
        "\u041F\u0440\u043E\u0434\u0435\u0440\u0436\u0438\u0442\u0435 \u0434\u043E ",
        result.minHolding,
        " ",
        yearsWord(result.minHolding),
        " \u2014 \u0438\xA0\u043B\u044C\u0433\u043E\u0442\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F."
      ] })
    ] }) }),
    /* @__PURE__ */ jsx5(Collapse, { open: warnings.length > 0, children: warnings.map((warning) => /* @__PURE__ */ jsx5("div", { className: "callout callout--" + warning.tone, children: /* @__PURE__ */ jsx5("span", { className: "callout__text", children: warning.text }) }, warning.text)) }),
    /* @__PURE__ */ jsxs4("div", { className: "summary__meta", children: [
      /* @__PURE__ */ jsxs4("span", { children: [
        "\u041C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0439 \u0441\u0440\u043E\u043A \u0432\u043B\u0430\u0434\u0435\u043D\u0438\u044F\xA0\u2014 ",
        result.minHolding,
        " ",
        yearsWord(result.minHolding)
      ] }),
      /* @__PURE__ */ jsxs4("span", { children: [
        "\u042D\u0444\u0444\u0435\u043A\u0442\u0438\u0432\u043D\u0430\u044F \u0434\u043E\u0445\u043E\u0434\u043D\u043E\u0441\u0442\u044C\xA0\u2014 ",
        pct(effectiveRate(result, scenario.years), 1),
        " \u0433\u043E\u0434\u043E\u0432\u044B\u0445"
      ] })
    ] })
  ] });
}
function effectiveRate(result, years) {
  const invested = result.contributions;
  if (invested <= 0 || years <= 0) return 0;
  const ratio = result.net / invested;
  if (ratio <= 0) return 0;
  return (Math.pow(ratio, 1 / years) - 1) * 100;
}

// src/components/LikeButton.tsx
import { useEffect as useEffect5, useState as useState5 } from "react";
import { jsx as jsx6, jsxs as jsxs5 } from "react/jsx-runtime";
var STORAGE_KEY = "triis-like";
var PARTICLES = Array.from({ length: 8 }, (_, index) => {
  const angle = index / 8 * Math.PI * 2 - Math.PI / 2;
  return { dx: Math.cos(angle) * 26, dy: Math.sin(angle) * 26 };
});
function LikeButton({ hint }) {
  const [liked, setLiked] = useState5(false);
  const [burst, setBurst] = useState5(0);
  useEffect5(() => {
    setLiked(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);
  const toggle = () => {
    const next = !liked;
    setLiked(next);
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    if (next) setBurst((value) => value + 1);
  };
  return /* @__PURE__ */ jsxs5("div", { className: "like", children: [
    /* @__PURE__ */ jsx6("span", { className: "like__hint", children: hint }),
    /* @__PURE__ */ jsxs5(
      "button",
      {
        type: "button",
        className: "like__btn" + (liked ? " is-liked" : ""),
        "aria-pressed": liked,
        "aria-label": liked ? "\u0423\u0431\u0440\u0430\u0442\u044C \u043B\u0430\u0439\u043A" : "\u041F\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043B\u0430\u0439\u043A",
        onClick: toggle,
        children: [
          /* @__PURE__ */ jsx6(
            "span",
            {
              className: "like__ring" + (burst > 0 ? " is-burst" : ""),
              "aria-hidden": "true"
            },
            `ring-${burst}`
          ),
          PARTICLES.map((particle, index) => /* @__PURE__ */ jsx6(
            "span",
            {
              className: "like__particle" + (burst > 0 ? " is-burst" : ""),
              style: {
                ["--dx"]: `${particle.dx}px`,
                ["--dy"]: `${particle.dy}px`,
                animationDelay: `${index * 12}ms`
              },
              "aria-hidden": "true"
            },
            `p-${burst}-${index}`
          )),
          /* @__PURE__ */ jsx6("svg", { className: "like__heart", width: "20", height: "20", viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ jsx6(
            "path",
            {
              d: "M12 20.5S3.5 15.2 3.5 9.4A4.9 4.9 0 0 1 12 6.2a4.9 4.9 0 0 1 8.5 3.2c0 5.8-8.5 11.1-8.5 11.1Z",
              fill: liked ? "currentColor" : "none",
              stroke: "currentColor",
              strokeWidth: "1.8",
              strokeLinejoin: "round"
            }
          ) }),
          /* @__PURE__ */ jsx6("span", { className: "like__count", children: /* @__PURE__ */ jsx6(RollingNumber, { value: liked ? 1 : 0, format: (n) => String(n) }) })
        ]
      }
    )
  ] });
}

// src/components/Topbar.tsx
import { jsx as jsx7, jsxs as jsxs6 } from "react/jsx-runtime";
function Topbar({
  tagline = "\u041A\u0430\u043B\u044C\u043A\u0443\u043B\u044F\u0442\u043E\u0440\u044B \u0418\u0418\u0421 \u0438\xA0\u041F\u0414\u0421",
  children
}) {
  return /* @__PURE__ */ jsxs6("header", { className: "topbar", children: [
    /* @__PURE__ */ jsxs6("a", { className: "topbar__brand", href: "/", "aria-label": "\u0422\u0420\u0418\u0418\u0421\xA0\u2014 \u043D\u0430\xA0\u0433\u043B\u0430\u0432\u043D\u0443\u044E", children: [
      /* @__PURE__ */ jsx7("img", { className: "topbar__mark", src: "/logo.svg", alt: "", "aria-hidden": "true" }),
      /* @__PURE__ */ jsxs6("span", { className: "topbar__title", children: [
        /* @__PURE__ */ jsx7("span", { className: "topbar__name", children: "\u0422\u0420\u0418\u0418\u0421" }),
        /* @__PURE__ */ jsx7("span", { className: "topbar__lede", children: tagline })
      ] })
    ] }),
    children
  ] });
}

// src/components/About.tsx
import { useState as useState6 } from "react";
import { jsx as jsx8, jsxs as jsxs7 } from "react/jsx-runtime";
var FAQ = [
  {
    question: "\u0421\u043A\u043E\u043B\u044C\u043A\u043E \u0434\u0435\u043D\u0435\u0433 \u0432\u0435\u0440\u043D\u0443\u0442 \u043F\u043E\xA0\u0418\u0418\u0421-3 \u0437\u0430\xA0\u0433\u043E\u0434?",
    answer: `\u0414\u043E 52 000\u202F\u20BD \u043F\u0440\u0438\xA0\u0441\u0442\u0430\u0432\u043A\u0435 \u041D\u0414\u0424\u041B 13% \u0438\xA0\u0434\u043E\xA060 000\u202F\u20BD \u043F\u0440\u0438\xA015%. \u0412\u044B\u0447\u0435\u0442 \u0441\u0447\u0438\u0442\u0430\u044E\u0442 \u043E\u0442\xA0\u0432\u0437\u043D\u043E\u0441\u043E\u0432 \u0437\u0430\xA0\u0433\u043E\u0434, \u043D\u043E\xA0\u043D\u0435\xA0\u0431\u043E\u043B\u044C\u0448\u0435 ${compactRub(DEDUCTION_BASE_LIMIT)}, \u0438\xA0\u043E\u043D\xA0\u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D \u0441\u0443\u043C\u043C\u043E\u0439 \u041D\u0414\u0424\u041B, \u043A\u043E\u0442\u043E\u0440\u0443\u044E \u0432\u044B\xA0\u0437\u0430\u043F\u043B\u0430\u0442\u0438\u043B\u0438 \u0437\u0430\xA0\u0442\u043E\u0442 \u0436\u0435\xA0\u0433\u043E\u0434. \u0411\u0435\u0437 \u043E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0434\u043E\u0445\u043E\u0434\u0430 \u0432\u044B\u0447\u0435\u0442\u0430 \u043D\u0435\xA0\u0431\u0443\u0434\u0435\u0442`
  },
  {
    question: "\u0427\u0435\u0440\u0435\u0437 \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u043B\u0435\u0442 \u043C\u043E\u0436\u043D\u043E \u0437\u0430\u043A\u0440\u044B\u0442\u044C \u0418\u0418\u0421-3?",
    answer: "\u0415\u0441\u043B\u0438 \u0441\u0447\u0451\u0442 \u043E\u0442\u043A\u0440\u044B\u0442 \u0432\xA02024\u20132026 \u0433\u043E\u0434\u0430\u0445\xA0\u2014 \u0447\u0435\u0440\u0435\u0437\xA05\u202F\u043B\u0435\u0442. \u0414\u0430\u043B\u044C\u0448\u0435 \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0439 \u0441\u0440\u043E\u043A \u0440\u0430\u0441\u0442\u0451\u0442 \u043D\u0430\xA0\u0433\u043E\u0434 \u0435\u0436\u0435\u0433\u043E\u0434\u043D\u043E \u0438\xA0\u0434\u043E\u0445\u043E\u0434\u0438\u0442 \u0434\u043E\xA010\u202F\u043B\u0435\u0442. \u0414\u043B\u044F \u0441\u0447\u0435\u0442\u043E\u0432 \u0442\u0438\u043F\u0430 \u0410 \u0438\xA0\u0442\u0438\u043F\u0430 \u0411 \u0441\u0440\u043E\u043A 3\u202F\u0433\u043E\u0434\u0430"
  },
  {
    question: "\u0427\u0435\u043C \u0418\u0418\u0421-3 \u043E\u0442\u043B\u0438\u0447\u0430\u0435\u0442\u0441\u044F \u043E\u0442\xA0\u0442\u0438\u043F\u0430 \u0410 \u0438\xA0\u0442\u0438\u043F\u0430 \u0411?",
    answer: "\u0418\u0418\u0421-3 \u0434\u0430\u0451\u0442 \u0438\xA0\u0432\u044B\u0447\u0435\u0442 \u043D\u0430\xA0\u0432\u0437\u043D\u043E\u0441, \u0438\xA0\u043E\u0441\u0432\u043E\u0431\u043E\u0436\u0434\u0435\u043D\u0438\u0435 \u043F\u0440\u0438\u0431\u044B\u043B\u0438 \u043E\u0442\xA0\u043D\u0430\u043B\u043E\u0433\u0430, \u043D\u043E\xA0\u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u0432\u043B\u0430\u0434\u0435\u0442\u044C \u0441\u0447\u0451\u0442\u043E\u043C 5\u201310\u202F\u043B\u0435\u0442 \u0438\xA0\u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0438\u0432\u0430\u0435\u0442 \u043E\u0441\u0432\u043E\u0431\u043E\u0436\u0434\u0435\u043D\u0438\u0435 \u0441\u0443\u043C\u043C\u043E\u0439 30\u202F\u043C\u043B\u043D \u20BD. \u0422\u0438\u043F \u0410\xA0\u2014 \u0431\u044B\u0432\u0448\u0438\u0439 \u0418\u0418\u0421-1: \u0442\u043E\u043B\u044C\u043A\u043E \u0432\u044B\u0447\u0435\u0442 \u043D\u0430\xA0\u0432\u0437\u043D\u043E\u0441, 3\u202F\u0433\u043E\u0434\u0430, \u0432\u0437\u043D\u043E\u0441\u044B \u0434\u043E\xA01\u202F\u043C\u043B\u043D \u20BD \u0432\xA0\u0433\u043E\u0434. \u0422\u0438\u043F \u0411\xA0\u2014 \u0431\u044B\u0432\u0448\u0438\u0439 \u0418\u0418\u0421-2: \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u0441\u0432\u043E\u0431\u043E\u0436\u0434\u0435\u043D\u0438\u0435 \u043F\u0440\u0438\u0431\u044B\u043B\u0438, 3\u202F\u0433\u043E\u0434\u0430. \u041D\u043E\u0432\u044B\u0435 \u0441\u0447\u0435\u0442\u0430 \u0442\u0438\u043F\u043E\u0432 \u0410 \u0438\xA0\u0411 \u0441\xA02024\u202F\u0433\u043E\u0434\u0430 \u043D\u0435\xA0\u043E\u0442\u043A\u0440\u044B\u0432\u0430\u044E\u0442"
  },
  {
    question: "\u041D\u0443\u0436\u043D\u043E \u043B\u0438\xA0\u043F\u043B\u0430\u0442\u0438\u0442\u044C \u043D\u0430\u043B\u043E\u0433 \u043F\u0440\u0438\xA0\u0437\u0430\u043A\u0440\u044B\u0442\u0438\u0438 \u0418\u0418\u0421-3?",
    answer: `\u041F\u0440\u0438\u0431\u044B\u043B\u044C \u043E\u0441\u0432\u043E\u0431\u043E\u0436\u0434\u0435\u043D\u0430 \u043E\u0442\xA0\u041D\u0414\u0424\u041B, \u0435\u0441\u043B\u0438 \u0443\u043A\u043B\u0430\u0434\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0432 ${compactRub(IIS3_PROFIT_EXEMPT_LIMIT)} \u0437\u0430\xA0\u0432\u0435\u0441\u044C \u0441\u0440\u043E\u043A \u0432\u043B\u0430\u0434\u0435\u043D\u0438\u044F. \u0421 \u0441\u0443\u043C\u043C\u044B \u0432\u044B\u0448\u0435 \u043D\u0430\u043B\u043E\u0433 \u043F\u0440\u0438\u0434\u0451\u0442\u0441\u044F \u0437\u0430\u043F\u043B\u0430\u0442\u0438\u0442\u044C. \u0414\u0438\u0432\u0438\u0434\u0435\u043D\u0434\u044B \u043E\u0431\u043B\u0430\u0433\u0430\u044E\u0442\u0441\u044F \u0432\u0441\u0435\u0433\u0434\u0430\xA0\u2014 \u043B\u044C\u0433\u043E\u0442\u0430 \u043D\u0430\xA0\u043D\u0438\u0445 \u043D\u0435\xA0\u0440\u0430\u0441\u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u044F\u0435\u0442\u0441\u044F`
  },
  {
    question: "\u0427\u0442\u043E \u0431\u0443\u0434\u0435\u0442, \u0435\u0441\u043B\u0438 \u0437\u0430\u043A\u0440\u044B\u0442\u044C \u0441\u0447\u0451\u0442 \u0440\u0430\u043D\u044C\u0448\u0435 \u0441\u0440\u043E\u043A\u0430?",
    answer: "\u041F\u043E\u043B\u0443\u0447\u0435\u043D\u043D\u044B\u0435 \u0432\u044B\u0447\u0435\u0442\u044B \u043F\u0440\u0438\u0434\u0451\u0442\u0441\u044F \u0432\u0435\u0440\u043D\u0443\u0442\u044C, \u0430\xA0\u0441\xA0\u043F\u0440\u0438\u0431\u044B\u043B\u0438 \u0437\u0430\u043F\u043B\u0430\u0442\u0438\u0442\u044C \u041D\u0414\u0424\u041B. \u0418\u0441\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435\xA0\u2014 \u043E\u0441\u043E\u0431\u044B\u0435 \u0436\u0438\u0437\u043D\u0435\u043D\u043D\u044B\u0435 \u0441\u0438\u0442\u0443\u0430\u0446\u0438\u0438, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 \u0434\u043E\u0440\u043E\u0433\u043E\u0441\u0442\u043E\u044F\u0449\u0435\u0435 \u043B\u0435\u0447\u0435\u043D\u0438\u0435"
  },
  {
    question: "\u041C\u043E\u0436\u043D\u043E \u043B\u0438\xA0\u043E\u0442\u043A\u0440\u044B\u0442\u044C \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0418\u0418\u0421-3?",
    answer: `\u0414\u0430, \u0434\u043E\xA0\u0442\u0440\u0451\u0445 \u043E\u0434\u043D\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E. \u041B\u0438\u043C\u0438\u0442 \u0432\u044B\u0447\u0435\u0442\u0430 ${compactRub(DEDUCTION_BASE_LIMIT)} \u0432\xA0\u0433\u043E\u0434 \u043E\u0431\u0449\u0438\u0439 \u0434\u043B\u044F\xA0\u0418\u0418\u0421-3, \u041F\u0414\u0421 \u0438\xA0\u0434\u043E\u0433\u043E\u0432\u043E\u0440\u043E\u0432 \u043D\u0435\u0433\u043E\u0441\u0443\u0434\u0430\u0440\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0433\u043E \u043F\u0435\u043D\u0441\u0438\u043E\u043D\u043D\u043E\u0433\u043E \u043E\u0431\u0435\u0441\u043F\u0435\u0447\u0435\u043D\u0438\u044F`
  },
  {
    question: "\u041A\u0430\u043B\u044C\u043A\u0443\u043B\u044F\u0442\u043E\u0440 \u0443\u0447\u0438\u0442\u044B\u0432\u0430\u0435\u0442 \u0438\u043D\u0444\u043B\u044F\u0446\u0438\u044E?",
    answer: "\u0414\u0430: \u0438\u043D\u0444\u043B\u044F\u0446\u0438\u044F \u0437\u0430\u0434\u0430\u0451\u0442\u0441\u044F \u0432\xA0\u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0430\u0445, \u0438\xA0\u0440\u044F\u0434\u043E\u043C \u0441\xA0\u043D\u043E\u043C\u0438\u043D\u0430\u043B\u044C\u043D\u043E\u0439 \u0441\u0443\u043C\u043C\u043E\u0439 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u0432\xA0\u0446\u0435\u043D\u0430\u0445 \u0441\u0435\u0433\u043E\u0434\u043D\u044F"
  },
  {
    question: "\u042D\u0442\u043E \u0438\u043D\u0432\u0435\u0441\u0442\u0438\u0446\u0438\u043E\u043D\u043D\u0430\u044F \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u044F?",
    answer: "\u041D\u0435\u0442. \u041A\u0430\u043B\u044C\u043A\u0443\u043B\u044F\u0442\u043E\u0440 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u0430\u0440\u0438\u0444\u043C\u0435\u0442\u0438\u043A\u0443 \u043F\u043E\xA0\u0434\u0435\u0439\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u043C \u043F\u0440\u0430\u0432\u0438\u043B\u0430\u043C \u0438\xA0\u043D\u0435\xA0\u0443\u0447\u0438\u0442\u044B\u0432\u0430\u0435\u0442 \u0432\u0430\u0448\u0443 \u0441\u0438\u0442\u0443\u0430\u0446\u0438\u044E \u0446\u0435\u043B\u0438\u043A\u043E\u043C. \u0420\u0435\u0448\u0435\u043D\u0438\u0435 \u043E\xA0\u0441\u0447\u0451\u0442\u0435 \u043F\u0440\u0438\u043D\u0438\u043C\u0430\u0439\u0442\u0435 \u0441\u0430\u043C\u0438 \u0438\u043B\u0438\xA0\u0441\xA0\u043A\u043E\u043D\u0441\u0443\u043B\u044C\u0442\u0430\u043D\u0442\u043E\u043C"
  }
];
function About() {
  const [openIndex, setOpenIndex] = useState6(0);
  return /* @__PURE__ */ jsxs7("section", { className: "about", "aria-labelledby": "about-title", children: [
    /* @__PURE__ */ jsxs7("div", { className: "about__col", children: [
      /* @__PURE__ */ jsx8("h2", { className: "about__title", id: "about-title", children: "\u0427\u0442\u043E \u0441\u0447\u0438\u0442\u0430\u0435\u0442 \u043A\u0430\u043B\u044C\u043A\u0443\u043B\u044F\u0442\u043E\u0440" }),
      /* @__PURE__ */ jsx8("p", { className: "about__text", children: "\u041A\u0430\u043B\u044C\u043A\u0443\u043B\u044F\u0442\u043E\u0440 \u0441\u0447\u0438\u0442\u0430\u0435\u0442 \u0442\u0440\u0438 \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u044F \u043D\u0430\xA0\u043E\u0434\u043D\u043E\u043C \u043D\u0430\u0431\u043E\u0440\u0435 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u043E\u0432: \u0418\u0418\u0421-3, \u0441\u0447\u0451\u0442 \u0442\u0438\u043F\u0430 \u0410 \u0438\xA0\u0441\u0447\u0451\u0442 \u0442\u0438\u043F\u0430 \u0411. \u0414\u043B\u044F \u043A\u0430\u0436\u0434\u043E\u0433\u043E\xA0\u2014 \u0432\u044B\u0447\u0435\u0442\u044B \u043F\u043E\xA0\u0433\u043E\u0434\u0430\u043C, \u043D\u0430\u043B\u043E\u0433 \u043F\u0440\u0438\xA0\u0437\u0430\u043A\u0440\u044B\u0442\u0438\u0438, \u043A\u0430\u043F\u0438\u0442\u0430\u043B \u043D\u0430\xA0\u0441\u0447\u0451\u0442\u0435 \u0438\xA0\u0441\u0443\u043C\u043C\u0430 \u043D\u0430\xA0\u0440\u0443\u043A\u0438 \u0432\xA0\u0446\u0435\u043D\u0430\u0445 \u0441\u0435\u0433\u043E\u0434\u043D\u044F." }),
      /* @__PURE__ */ jsxs7("p", { className: "about__text", children: [
        "\u0420\u0430\u0441\u0447\u0451\u0442 \u0438\u0434\u0451\u0442 \u043F\u043E \u043F\u0440\u0430\u0432\u0438\u043B\u0430\u043C ",
        RULES_YEAR,
        " \u0433\u043E\u0434\u0430: \u0431\u0430\u0437\u0430 \u0432\u044B\u0447\u0435\u0442\u0430",
        " ",
        compactRub(DEDUCTION_BASE_LIMIT),
        " \u0432 \u0433\u043E\u0434, \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441\u0438\u0432\u043D\u044B\u0435 \u0441\u0442\u0430\u0432\u043A\u0438 \u041D\u0414\u0424\u041B, \u043E\u0441\u0432\u043E\u0431\u043E\u0436\u0434\u0435\u043D\u0438\u0435 \u043F\u0440\u0438\u0431\u044B\u043B\u0438 \u043F\u043E \u0418\u0418\u0421-3 \u0434\u043E ",
        compactRub(IIS3_PROFIT_EXEMPT_LIMIT),
        ", \u0441\u0440\u043E\u043A \u0432\u043B\u0430\u0434\u0435\u043D\u0438\u044F \u043E\u0442 5 \u043B\u0435\u0442 \u0434\u043B\u044F \u0441\u0447\u0435\u0442\u043E\u0432 2024\u20132026 \u0433\u043E\u0434\u043E\u0432 \u0438 \u043B\u0438\u043C\u0438\u0442 \u0432\u0437\u043D\u043E\u0441\u043E\u0432",
        " ",
        compactRub(OLD_IIS_CONTRIBUTION_LIMIT),
        " \u0432 \u0433\u043E\u0434 \u0434\u043B\u044F \u0442\u0438\u043F\u043E\u0432 \u0410 \u0438 \u0411."
      ] }),
      /* @__PURE__ */ jsx8("p", { className: "about__text about__text--muted", children: "\u0422\u0420\u0418\u0418\u0421\xA0\u2014 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u043A\u0430\u043B\u044C\u043A\u0443\u043B\u044F\u0442\u043E\u0440, \u043D\u0435\xA0\u0431\u0440\u043E\u043A\u0435\u0440 \u0438\xA0\u043D\u0435\xA0\u0443\u043F\u0440\u0430\u0432\u043B\u044F\u044E\u0449\u0430\u044F \u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044F: \u0441\u0447\u0435\u0442\u0430 \u043D\u0435\xA0\u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u043C, \u0434\u0430\u043D\u043D\u044B\u0435 \u043D\u0435\xA0\u0441\u043E\u0431\u0438\u0440\u0430\u0435\u043C. \u0421\u0434\u0435\u043B\u0430\u043D\u043E \u0441\u0442\u0443\u0434\u0438\u0435\u0439 Maletskiy Design." })
    ] }),
    /* @__PURE__ */ jsxs7("div", { className: "about__col", children: [
      /* @__PURE__ */ jsx8("h2", { className: "about__title", id: "faq-title", children: "\u0427\u0430\u0441\u0442\u044B\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B" }),
      /* @__PURE__ */ jsx8("div", { className: "faq", children: FAQ.map((item, index) => {
        const open = openIndex === index;
        return /* @__PURE__ */ jsxs7("div", { className: "faq__item" + (open ? " is-open" : ""), children: [
          /* @__PURE__ */ jsx8("h3", { className: "faq__heading", children: /* @__PURE__ */ jsxs7(
            "button",
            {
              type: "button",
              className: "faq__toggle",
              "aria-expanded": open,
              "aria-controls": `faq-panel-${index}`,
              onClick: () => setOpenIndex(open ? null : index),
              children: [
                /* @__PURE__ */ jsx8("span", { className: "faq__question", children: item.question }),
                /* @__PURE__ */ jsx8(
                  "svg",
                  {
                    className: "faq__chevron",
                    width: "18",
                    height: "18",
                    viewBox: "0 0 24 24",
                    "aria-hidden": "true",
                    children: /* @__PURE__ */ jsx8(
                      "path",
                      {
                        d: "M6 9l6 6 6-6",
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "2",
                        strokeLinecap: "round",
                        strokeLinejoin: "round"
                      }
                    )
                  }
                )
              ]
            }
          ) }),
          /* @__PURE__ */ jsx8(Collapse, { open, children: /* @__PURE__ */ jsx8("p", { className: "faq__answer", id: `faq-panel-${index}`, children: item.answer }) })
        ] }, item.question);
      }) })
    ] })
  ] });
}

// src/pages/Privacy.tsx
import { useEffect as useEffect6 } from "react";
import { jsx as jsx9, jsxs as jsxs8 } from "react/jsx-runtime";
function Privacy() {
  useEffect6(() => {
    document.title = "\u041F\u043E\u043B\u0438\u0442\u0438\u043A\u0430 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438\xA0\u2014 \u0422\u0420\u0418\u0418\u0421";
  }, []);
  return /* @__PURE__ */ jsxs8("main", { className: "legal", children: [
    /* @__PURE__ */ jsx9("a", { className: "legal__back", href: "/", children: "\u2190 \u0412\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u043A\xA0\u043A\u0430\u043B\u044C\u043A\u0443\u043B\u044F\u0442\u043E\u0440\u0443" }),
    /* @__PURE__ */ jsx9("h1", { className: "legal__title", children: "\u041F\u043E\u043B\u0438\u0442\u0438\u043A\u0430 \u0432\xA0\u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u0438 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445" }),
    /* @__PURE__ */ jsx9("p", { className: "legal__meta", children: "\u0414\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442 \u0434\u043B\u044F\xA0\u0441\u0430\u0439\u0442\u0430 triis.ru \xB7 \u0440\u0435\u0434\u0430\u043A\u0446\u0438\u044F \u043E\u0442\xA028 \u043D\u043E\u044F\u0431\u0440\u044F 2026\u202F\u0433\u043E\u0434\u0430" }),
    /* @__PURE__ */ jsxs8("section", { className: "legal__block", children: [
      /* @__PURE__ */ jsx9("h2", { children: "1. \u041E\u0431\u0449\u0438\u0435 \u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u044F" }),
      /* @__PURE__ */ jsx9("p", { children: "\u041D\u0430\u0441\u0442\u043E\u044F\u0449\u0430\u044F \u043F\u043E\u043B\u0438\u0442\u0438\u043A\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445 \u0441\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0430 \u0432\xA0\u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u0438 \u0441\xA0\u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F\u043C\u0438 \u0424\u0435\u0434\u0435\u0440\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0437\u0430\u043A\u043E\u043D\u0430 \u043E\u0442\xA027.07.2006 \u2116 152-\u0424\u0417 \xAB\u041E \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445\xBB (\u0434\u0430\u043B\u0435\u0435\xA0\u2014 \u0417\u0430\u043A\u043E\u043D \u043E\xA0\u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445) \u0438\xA0\u043E\u043F\u0440\u0435\u0434\u0435\u043B\u044F\u0435\u0442 \u043F\u043E\u0440\u044F\u0434\u043E\u043A \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445 \u0438\xA0\u043C\u0435\u0440\u044B \u043F\u043E\xA0\u043E\u0431\u0435\u0441\u043F\u0435\u0447\u0435\u043D\u0438\u044E \u0438\u0445\xA0\u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u0438, \u043F\u0440\u0435\u0434\u043F\u0440\u0438\u043D\u0438\u043C\u0430\u0435\u043C\u044B\u0435 \u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440\u043E\u043C." }),
      /* @__PURE__ */ jsx9("p", { children: "1.1. \u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440 \u0441\u0442\u0430\u0432\u0438\u0442 \u0441\u0432\u043E\u0435\u0439 \u0432\u0430\u0436\u043D\u0435\u0439\u0448\u0435\u0439 \u0446\u0435\u043B\u044C\u044E \u0438\xA0\u0443\u0441\u043B\u043E\u0432\u0438\u0435\u043C \u043E\u0441\u0443\u0449\u0435\u0441\u0442\u0432\u043B\u0435\u043D\u0438\u044F \u0434\u0435\u044F\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u0438 \u0441\u043E\u0431\u043B\u044E\u0434\u0435\u043D\u0438\u0435 \u043F\u0440\u0430\u0432 \u0438\xA0\u0441\u0432\u043E\u0431\u043E\u0434 \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430 \u0438\xA0\u0433\u0440\u0430\u0436\u0434\u0430\u043D\u0438\u043D\u0430 \u043F\u0440\u0438\xA0\u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0435 \u0435\u0433\u043E\xA0\u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445, \u0432\xA0\u0442\u043E\u043C \u0447\u0438\u0441\u043B\u0435 \u0437\u0430\u0449\u0438\u0442\u044B \u043F\u0440\u0430\u0432 \u043D\u0430\xA0\u043D\u0435\u043F\u0440\u0438\u043A\u043E\u0441\u043D\u043E\u0432\u0435\u043D\u043D\u043E\u0441\u0442\u044C \u0447\u0430\u0441\u0442\u043D\u043E\u0439 \u0436\u0438\u0437\u043D\u0438, \u043B\u0438\u0447\u043D\u0443\u044E \u0438\xA0\u0441\u0435\u043C\u0435\u0439\u043D\u0443\u044E \u0442\u0430\u0439\u043D\u0443." }),
      /* @__PURE__ */ jsx9("p", { children: "1.2. \u041F\u043E\u043B\u0438\u0442\u0438\u043A\u0430 \u043F\u0440\u0438\u043C\u0435\u043D\u044F\u0435\u0442\u0441\u044F \u043A\u043E\xA0\u0432\u0441\u0435\u0439 \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u0438, \u043A\u043E\u0442\u043E\u0440\u0443\u044E \u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440 \u043C\u043E\u0436\u0435\u0442 \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043E\xA0\u043F\u043E\u0441\u0435\u0442\u0438\u0442\u0435\u043B\u044F\u0445 \u0441\u0430\u0439\u0442\u0430 https://triis.ru (\u0434\u0430\u043B\u0435\u0435\xA0\u2014 \u0421\u0430\u0439\u0442)." }),
      /* @__PURE__ */ jsx9("p", { children: "1.3. \u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440\u043E\u043C \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445 \u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F \u0421\u0430\u0439\u0442\u0430." }),
      /* @__PURE__ */ jsx9("p", { children: "1.4. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044F \u0421\u0430\u0439\u0442, \u0432\u044B\xA0\u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0430\u0435\u0442\u0435 \u0441\u043E\u0433\u043B\u0430\u0441\u0438\u0435 \u0441\xA0\u0443\u0441\u043B\u043E\u0432\u0438\u044F\u043C\u0438 \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0435\u0439 \u041F\u043E\u043B\u0438\u0442\u0438\u043A\u0438. \u0415\u0441\u043B\u0438 \u0432\u044B\xA0\u043D\u0435\xA0\u0441\u043E\u0433\u043B\u0430\u0441\u043D\u044B \u0441\xA0\u0435\u0451 \u0443\u0441\u043B\u043E\u0432\u0438\u044F\u043C\u0438, \u043F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u0432\u043E\u0437\u0434\u0435\u0440\u0436\u0438\u0442\u0435\u0441\u044C \u043E\u0442\xA0\u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u044F \u0421\u0430\u0439\u0442\u0430." })
    ] }),
    /* @__PURE__ */ jsxs8("section", { className: "legal__block", children: [
      /* @__PURE__ */ jsx9("h2", { children: "2. \u041E\u0441\u043D\u043E\u0432\u043D\u044B\u0435 \u043F\u043E\u043D\u044F\u0442\u0438\u044F" }),
      /* @__PURE__ */ jsx9("p", { children: "2.1. \u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445\xA0\u2014 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445 \u0441\xA0\u043F\u043E\u043C\u043E\u0449\u044C\u044E \u0441\u0440\u0435\u0434\u0441\u0442\u0432 \u0432\u044B\u0447\u0438\u0441\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0439 \u0442\u0435\u0445\u043D\u0438\u043A\u0438." }),
      /* @__PURE__ */ jsx9("p", { children: "2.2. \u0411\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445\xA0\u2014 \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E\u0435 \u043F\u0440\u0435\u043A\u0440\u0430\u0449\u0435\u043D\u0438\u0435 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445, \u0437\u0430\xA0\u0438\u0441\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435\u043C \u0441\u043B\u0443\u0447\u0430\u0435\u0432, \u043A\u043E\u0433\u0434\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u0430 \u0434\u043B\u044F\xA0\u0438\u0445\xA0\u0443\u0442\u043E\u0447\u043D\u0435\u043D\u0438\u044F." }),
      /* @__PURE__ */ jsx9("p", { children: "2.3. \u0421\u0430\u0439\u0442\xA0\u2014 \u0441\u043E\u0432\u043E\u043A\u0443\u043F\u043D\u043E\u0441\u0442\u044C \u0433\u0440\u0430\u0444\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u0438\xA0\u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0445 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u043E\u0432, \u0430\xA0\u0442\u0430\u043A\u0436\u0435 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C \u0434\u043B\u044F\xA0\u042D\u0412\u041C \u0438\xA0\u0431\u0430\u0437 \u0434\u0430\u043D\u043D\u044B\u0445, \u043E\u0431\u0435\u0441\u043F\u0435\u0447\u0438\u0432\u0430\u044E\u0449\u0438\u0445 \u0438\u0445\xA0\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0441\u0442\u044C \u0432\xA0\u0441\u0435\u0442\u0438 \u0438\u043D\u0442\u0435\u0440\u043D\u0435\u0442 \u043F\u043E\xA0\u0430\u0434\u0440\u0435\u0441\u0443 https://triis.ru." }),
      /* @__PURE__ */ jsx9("p", { children: "2.4. \u041E\u0431\u0435\u0437\u043B\u0438\u0447\u0438\u0432\u0430\u043D\u0438\u0435 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445\xA0\u2014 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F, \u0432\xA0\u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0435 \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u043D\u0435\u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E \u0431\u0435\u0437\xA0\u0434\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0439 \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u0438 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0438\u0442\u044C \u043F\u0440\u0438\u043D\u0430\u0434\u043B\u0435\u0436\u043D\u043E\u0441\u0442\u044C \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445 \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u043E\u043C\u0443 \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044E." }),
      /* @__PURE__ */ jsx9("p", { children: "2.5. \u041E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445\xA0\u2014 \u043B\u044E\u0431\u043E\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u0438\u043B\u0438\xA0\u0441\u043E\u0432\u043E\u043A\u0443\u043F\u043D\u043E\u0441\u0442\u044C \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439 \u0441\xA0\u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u043C\u0438 \u0434\u0430\u043D\u043D\u044B\u043C\u0438, \u0432\u043A\u043B\u044E\u0447\u0430\u044F \u0441\u0431\u043E\u0440, \u0437\u0430\u043F\u0438\u0441\u044C, \u0441\u0438\u0441\u0442\u0435\u043C\u0430\u0442\u0438\u0437\u0430\u0446\u0438\u044E, \u043D\u0430\u043A\u043E\u043F\u043B\u0435\u043D\u0438\u0435, \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435, \u0443\u0442\u043E\u0447\u043D\u0435\u043D\u0438\u0435, \u0438\u0437\u0432\u043B\u0435\u0447\u0435\u043D\u0438\u0435, \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0435, \u043F\u0435\u0440\u0435\u0434\u0430\u0447\u0443, \u043E\u0431\u0435\u0437\u043B\u0438\u0447\u0438\u0432\u0430\u043D\u0438\u0435, \u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435, \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u0438\xA0\u0443\u043D\u0438\u0447\u0442\u043E\u0436\u0435\u043D\u0438\u0435." }),
      /* @__PURE__ */ jsx9("p", { children: "2.6. \u041F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435\xA0\u2014 \u043B\u044E\u0431\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F, \u043E\u0442\u043D\u043E\u0441\u044F\u0449\u0430\u044F\u0441\u044F \u043F\u0440\u044F\u043C\u043E \u0438\u043B\u0438\xA0\u043A\u043E\u0441\u0432\u0435\u043D\u043D\u043E \u043A\xA0\u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0451\u043D\u043D\u043E\u043C\u0443 \u0438\u043B\u0438\xA0\u043E\u043F\u0440\u0435\u0434\u0435\u043B\u044F\u0435\u043C\u043E\u043C\u0443 \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044E \u0421\u0430\u0439\u0442\u0430." }),
      /* @__PURE__ */ jsx9("p", { children: "2.7. \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C\xA0\u2014 \u043B\u044E\u0431\u043E\u0439 \u043F\u043E\u0441\u0435\u0442\u0438\u0442\u0435\u043B\u044C \u0421\u0430\u0439\u0442\u0430." }),
      /* @__PURE__ */ jsx9("p", { children: "2.8. \u0421\u0435\u0440\u0432\u0438\u0441 \u0432\u0435\u0431-\u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0438\xA0\u2014 \u0432\u043D\u0435\u0448\u043D\u0438\u0439 \u0441\u0435\u0440\u0432\u0438\u0441, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u0441\u043E\u0431\u0438\u0440\u0430\u0435\u0442 \u043E\u0431\u0435\u0437\u043B\u0438\u0447\u0435\u043D\u043D\u0443\u044E \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0443 \u043F\u043E\u0441\u0435\u0449\u0435\u043D\u0438\u0439 \u0438\xA0\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439 \u043D\u0430\xA0\u0441\u0430\u0439\u0442\u0435." })
    ] }),
    /* @__PURE__ */ jsxs8("section", { className: "legal__block", children: [
      /* @__PURE__ */ jsx9("h2", { children: "3. \u041A\u0430\u043A\u0438\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u043E\u0431\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u044E\u0442\u0441\u044F" }),
      /* @__PURE__ */ jsx9("p", { children: "3.1. \u0412\u0441\u0435 \u0432\u044B\u0447\u0438\u0441\u043B\u0435\u043D\u0438\u044F \u043D\u0430\xA0\u0421\u0430\u0439\u0442\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u044E\u0442\u0441\u044F \u0438\u0441\u043A\u043B\u044E\u0447\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u043D\u0430\xA0\u0441\u0442\u043E\u0440\u043E\u043D\u0435 \u043A\u043B\u0438\u0435\u043D\u0442\u0430\xA0\u2014 \u0432\xA0\u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435 \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F. \u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440 \u043D\u0435\xA0\u043F\u043E\u043B\u0443\u0447\u0430\u0435\u0442, \u043D\u0435\xA0\u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442 \u0438\xA0\u043D\u0435\xA0\u043E\u0431\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0435\u0442 \u0432\u0432\u0435\u0434\u0451\u043D\u043D\u044B\u0435 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0440\u0430\u0441\u0447\u0451\u0442\u0430, \u0441\u0443\u043C\u043C\u044B, \u0441\u0442\u0430\u0432\u043A\u0438 \u0438\xA0\u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u044B \u0432\u044B\u0447\u0438\u0441\u043B\u0435\u043D\u0438\u0439." }),
      /* @__PURE__ */ jsx9("p", { children: "3.2. \u0421\u0430\u0439\u0442 \u043D\u0435\xA0\u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438, \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0443\u0447\u0451\u0442\u043D\u043E\u0439 \u0437\u0430\u043F\u0438\u0441\u0438 \u0438\u043B\u0438\xA0\u0443\u043A\u0430\u0437\u0430\u043D\u0438\u044F \u0430\u0434\u0440\u0435\u0441\u0430 \u044D\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u043E\u0439 \u043F\u043E\u0447\u0442\u044B. \u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440 \u043D\u0435\xA0\u0441\u043E\u0431\u0438\u0440\u0430\u0435\u0442 \u0438\u043C\u0435\u043D\u0430, \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u0438\xA0\u0438\u043D\u0443\u044E \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044E, \u043F\u043E\u0437\u0432\u043E\u043B\u044F\u044E\u0449\u0443\u044E \u0438\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u0446\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u043B\u0438\u0447\u043D\u043E." }),
      /* @__PURE__ */ jsx9("p", { children: "3.3. \u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0440\u0430\u0441\u0447\u0451\u0442\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u044E\u0442\u0441\u044F \u0432\xA0\u043F\u0430\u043C\u044F\u0442\u0438 \u0432\u043A\u043B\u0430\u0434\u043A\u0438 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0430 \u0438\xA0\u043F\u043E\u043F\u0430\u0434\u0430\u044E\u0442 \u0432\xA0\u0441\u0441\u044B\u043B\u043A\u0443, \u0442\u043E\u043B\u044C\u043A\u043E \u043A\u043E\u0433\u0434\u0430 \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0441\u0430\u043C \u043D\u0430\u0436\u0438\u043C\u0430\u0435\u0442 \xAB\u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F \u0440\u0430\u0441\u0447\u0451\u0442\u043E\u043C\xBB. \u0412 \u0430\u0434\u0440\u0435\u0441\u043D\u043E\u0439 \u0441\u0442\u0440\u043E\u043A\u0435 \u0438\xA0\u043D\u0430\xA0\u0441\u0435\u0440\u0432\u0435\u0440\u0435 \u0438\u0445\xA0\u043D\u0435\u0442, \u0432\xA0\u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0443 \u043F\u043E\u0441\u0435\u0449\u0435\u043D\u0438\u0439 \u043E\u043D\u0438 \u043D\u0435\xA0\u043F\u043E\u043F\u0430\u0434\u0430\u044E\u0442." }),
      /* @__PURE__ */ jsx9("p", { children: "3.4. \u041E\u0442\u043C\u0435\u0442\u043A\u0430 \u043E\xA0\u043B\u0430\u0439\u043A\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442\u0441\u044F \u0438\u0441\u043A\u043B\u044E\u0447\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0432\xA0\u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u043C \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0430 (localStorage) \u043D\u0430\xA0\u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0435 \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u0438\xA0\u043D\u0435\xA0\u043F\u0435\u0440\u0435\u0434\u0430\u0451\u0442\u0441\u044F \u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440\u0443." }),
      /* @__PURE__ */ jsx9("p", { children: "3.5. \u0414\u043B\u044F \u043F\u043E\u043D\u0438\u043C\u0430\u043D\u0438\u044F \u0442\u043E\u0433\u043E, \u043A\u0430\u043A\u0438\u043C\u0438 \u0440\u0430\u0437\u0434\u0435\u043B\u0430\u043C\u0438 \u0421\u0430\u0439\u0442\u0430 \u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442\u0441\u044F \u0438\xA0\u0433\u0434\u0435 \u0432\u043E\u0437\u043D\u0438\u043A\u0430\u044E\u0442 \u0442\u0440\u0443\u0434\u043D\u043E\u0441\u0442\u0438, \u043D\u0430\xA0\u0421\u0430\u0439\u0442\u0435 \u043C\u043E\u0436\u0435\u0442 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C\u0441\u044F \u0441\u0435\u0440\u0432\u0438\u0441 \u0432\u0435\u0431-\u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0438 \u042F\u043D\u0434\u0435\u043A\u0441 \u041C\u0435\u0442\u0440\u0438\u043A\u0430. \u041E\u043D \u0441\u043E\u0431\u0438\u0440\u0430\u0435\u0442 \u043E\u0431\u0435\u0437\u043B\u0438\u0447\u0435\u043D\u043D\u044B\u0435 \u0442\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0441\u0432\u0435\u0434\u0435\u043D\u0438\u044F: \u0430\u0434\u0440\u0435\u0441 \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u043D\u043D\u043E\u0439 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B, \u0442\u0438\u043F \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430 \u0438\xA0\u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0430, \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u0430, \u043F\u0440\u0438\u0431\u043B\u0438\u0437\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0440\u0435\u0433\u0438\u043E\u043D \u0438\xA0\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u043D\u0430\xA0\u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 (\u043F\u0440\u043E\u043A\u0440\u0443\u0442\u043A\u0430, \u043D\u0430\u0436\u0430\u0442\u0438\u044F)." }),
      /* @__PURE__ */ jsx9("p", { children: "3.6. \u0412\u0432\u0435\u0434\u0451\u043D\u043D\u044B\u0435 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0440\u0430\u0441\u0447\u0451\u0442\u0430\xA0\u2014 \u0441\u0443\u043C\u043C\u044B, \u0441\u0442\u0430\u0432\u043A\u0438, \u0434\u0430\u0442\u044B\xA0\u2014 \u0432\xA0\u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0443 \u043D\u0435\xA0\u043F\u0435\u0440\u0435\u0434\u0430\u044E\u0442\u0441\u044F \u0438\xA0\u0441\xA0\u0441\u043E\u0431\u0440\u0430\u043D\u043D\u043E\u0439 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u043E\u0439 \u043D\u0435\xA0\u0441\u0432\u044F\u0437\u044B\u0432\u0430\u044E\u0442\u0441\u044F. \u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 \u043D\u0435\xA0\u043F\u043E\u0437\u0432\u043E\u043B\u044F\u0435\u0442 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0438\u0442\u044C \u043B\u0438\u0447\u043D\u043E\u0441\u0442\u044C \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F." })
    ] }),
    /* @__PURE__ */ jsxs8("section", { className: "legal__block", children: [
      /* @__PURE__ */ jsx9("h2", { children: "4. \u041F\u0440\u0430\u0432\u0430 \u0438\xA0\u043E\u0431\u044F\u0437\u0430\u043D\u043D\u043E\u0441\u0442\u0438 \u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440\u0430" }),
      /* @__PURE__ */ jsx9("p", { children: "4.1. \u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440 \u0438\u043C\u0435\u0435\u0442 \u043F\u0440\u0430\u0432\u043E \u0441\u0430\u043C\u043E\u0441\u0442\u043E\u044F\u0442\u0435\u043B\u044C\u043D\u043E \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u044F\u0442\u044C \u0441\u043E\u0441\u0442\u0430\u0432 \u0438\xA0\u043F\u0435\u0440\u0435\u0447\u0435\u043D\u044C \u043C\u0435\u0440, \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u044B\u0445 \u0434\u043B\u044F\xA0\u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F \u043E\u0431\u044F\u0437\u0430\u043D\u043D\u043E\u0441\u0442\u0435\u0439, \u043F\u0440\u0435\u0434\u0443\u0441\u043C\u043E\u0442\u0440\u0435\u043D\u043D\u044B\u0445 \u0417\u0430\u043A\u043E\u043D\u043E\u043C \u043E\xA0\u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445." }),
      /* @__PURE__ */ jsx9("p", { children: "4.2. \u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440 \u043E\u0431\u044F\u0437\u0430\u043D \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0442\u044C \u0441\u0443\u0431\u044A\u0435\u043A\u0442\u0443 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445 \u043F\u043E\xA0\u0435\u0433\u043E\xA0\u043F\u0440\u043E\u0441\u044C\u0431\u0435 \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044E, \u043A\u0430\u0441\u0430\u044E\u0449\u0443\u044E\u0441\u044F \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u0435\u0433\u043E\xA0\u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445; \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u043E\u0432\u044B\u0432\u0430\u0442\u044C \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0443 \u0432\xA0\u043F\u043E\u0440\u044F\u0434\u043A\u0435, \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u043E\u043C \u0437\u0430\u043A\u043E\u043D\u043E\u0434\u0430\u0442\u0435\u043B\u044C\u0441\u0442\u0432\u043E\u043C \u0420\u0424; \u043E\u0442\u0432\u0435\u0447\u0430\u0442\u044C \u043D\u0430\xA0\u043E\u0431\u0440\u0430\u0449\u0435\u043D\u0438\u044F \u0438\xA0\u0437\u0430\u043F\u0440\u043E\u0441\u044B; \u043E\u0431\u0435\u0441\u043F\u0435\u0447\u0438\u0432\u0430\u0442\u044C \u043D\u0435\u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u043D\u044B\u0439 \u0434\u043E\u0441\u0442\u0443\u043F \u043A\xA0\u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0435\u0439 \u041F\u043E\u043B\u0438\u0442\u0438\u043A\u0435; \u043F\u0440\u0438\u043D\u0438\u043C\u0430\u0442\u044C \u043F\u0440\u0430\u0432\u043E\u0432\u044B\u0435, \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0435 \u0438\xA0\u0442\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u043C\u0435\u0440\u044B \u0434\u043B\u044F\xA0\u0437\u0430\u0449\u0438\u0442\u044B \u0434\u0430\u043D\u043D\u044B\u0445." })
    ] }),
    /* @__PURE__ */ jsxs8("section", { className: "legal__block", children: [
      /* @__PURE__ */ jsx9("h2", { children: "5. \u041F\u0440\u0430\u0432\u0430 \u0441\u0443\u0431\u044A\u0435\u043A\u0442\u043E\u0432 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445" }),
      /* @__PURE__ */ jsx9("p", { children: "5.1. \u0421\u0443\u0431\u044A\u0435\u043A\u0442\u044B \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445 \u0438\u043C\u0435\u044E\u0442 \u043F\u0440\u0430\u0432\u043E \u043F\u043E\u043B\u0443\u0447\u0430\u0442\u044C \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044E \u043E\u0431\xA0\u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0435 \u0441\u0432\u043E\u0438\u0445 \u0434\u0430\u043D\u043D\u044B\u0445, \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u0442\u044C \u0438\u0445\xA0\u0443\u0442\u043E\u0447\u043D\u0435\u043D\u0438\u044F, \u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u0438\u043B\u0438\xA0\u0443\u043D\u0438\u0447\u0442\u043E\u0436\u0435\u043D\u0438\u044F, \u043E\u0442\u0437\u044B\u0432\u0430\u0442\u044C \u0441\u043E\u0433\u043B\u0430\u0441\u0438\u0435 \u043D\u0430\xA0\u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0443, \u043E\u0431\u0436\u0430\u043B\u043E\u0432\u0430\u0442\u044C \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440\u0430 \u0432\xA0\u0443\u043F\u043E\u043B\u043D\u043E\u043C\u043E\u0447\u0435\u043D\u043D\u043E\u043C \u043E\u0440\u0433\u0430\u043D\u0435 \u0438\u043B\u0438\xA0\u0432\xA0\u0441\u0443\u0434\u0435." }),
      /* @__PURE__ */ jsx9("p", { children: "5.2. \u041F\u043E\u0441\u043A\u043E\u043B\u044C\u043A\u0443 \u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440 \u043D\u0435\xA0\u0441\u043E\u0431\u0438\u0440\u0430\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0435, \u043F\u043E\u0437\u0432\u043E\u043B\u044F\u044E\u0449\u0438\u0435 \u0438\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u0446\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F, \u0437\u0430\u043F\u0440\u043E\u0441 \u043D\u0430\xA0\u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u0438\u043B\u0438\xA0\u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u0442\u0430\u043A\u0438\u0445 \u0434\u0430\u043D\u043D\u044B\u0445, \u043A\u0430\u043A\xA0\u043F\u0440\u0430\u0432\u0438\u043B\u043E, \u043D\u0435\xA0\u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F. \u041E\u0442\u043A\u0430\u0437\u0430\u0442\u044C\u0441\u044F \u043E\u0442\xA0\u0441\u0431\u043E\u0440\u0430 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0438 \u043C\u043E\u0436\u043D\u043E \u0441\u0430\u043C\u043E\u0441\u0442\u043E\u044F\u0442\u0435\u043B\u044C\u043D\u043E\xA0\u2014 \u0441\u043F\u043E\u0441\u043E\u0431\u043E\u043C \u0438\u0437\xA0\u043F\u0443\u043D\u043A\u0442\u0430 7.4." })
    ] }),
    /* @__PURE__ */ jsxs8("section", { className: "legal__block", children: [
      /* @__PURE__ */ jsx9("h2", { children: "6. \u041F\u0440\u0438\u043D\u0446\u0438\u043F\u044B \u0438\xA0\u0446\u0435\u043B\u0438 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438" }),
      /* @__PURE__ */ jsx9("p", { children: "6.1. \u041E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445 \u043E\u0441\u0443\u0449\u0435\u0441\u0442\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u043D\u0430\xA0\u0437\u0430\u043A\u043E\u043D\u043D\u043E\u0439 \u0438\xA0\u0441\u043F\u0440\u0430\u0432\u0435\u0434\u043B\u0438\u0432\u043E\u0439 \u043E\u0441\u043D\u043E\u0432\u0435 \u0438\xA0\u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0434\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u0435\u043C \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u044B\u0445, \u0437\u0430\u0440\u0430\u043D\u0435\u0435 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0451\u043D\u043D\u044B\u0445 \u0438\xA0\u0437\u0430\u043A\u043E\u043D\u043D\u044B\u0445 \u0446\u0435\u043B\u0435\u0439." }),
      /* @__PURE__ */ jsx9("p", { children: "6.2. \u041E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0435 \u043F\u043E\u0434\u043B\u0435\u0436\u0430\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u0434\u0430\u043D\u043D\u044B\u0435, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u043E\u0442\u0432\u0435\u0447\u0430\u044E\u0442 \u0446\u0435\u043B\u044F\u043C \u0438\u0445\xA0\u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438. \u041D\u0435 \u0434\u043E\u043F\u0443\u0441\u043A\u0430\u0435\u0442\u0441\u044F \u0438\u0437\u0431\u044B\u0442\u043E\u0447\u043D\u043E\u0441\u0442\u044C \u043E\u0431\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0435\u043C\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445 \u043F\u043E\xA0\u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u044E \u043A\xA0\u0437\u0430\u044F\u0432\u043B\u0435\u043D\u043D\u044B\u043C \u0446\u0435\u043B\u044F\u043C." }),
      /* @__PURE__ */ jsx9("p", { children: "6.3. \u041F\u0440\u0430\u0432\u043E\u0432\u044B\u0435 \u043E\u0441\u043D\u043E\u0432\u0430\u043D\u0438\u044F: \u0424\u0435\u0434\u0435\u0440\u0430\u043B\u044C\u043D\u044B\u0439 \u0437\u0430\u043A\u043E\u043D \u043E\u0442\xA027.07.2006 \u2116 152-\u0424\u0417 \xAB\u041E \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445\xBB, \u0424\u0435\u0434\u0435\u0440\u0430\u043B\u044C\u043D\u044B\u0439 \u0437\u0430\u043A\u043E\u043D \u043E\u0442\xA027.07.2006 \u2116 149-\u0424\u0417 \xAB\u041E\u0431 \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u0438, \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u0445 \u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u044F\u0445 \u0438\xA0\u043E\xA0\u0437\u0430\u0449\u0438\u0442\u0435 \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u0438\xBB." }),
      /* @__PURE__ */ jsx9("p", { children: "6.4. \u0426\u0435\u043B\u044C \u0441\u0431\u043E\u0440\u0430 \u043E\u0431\u0435\u0437\u043B\u0438\u0447\u0435\u043D\u043D\u043E\u0439 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0438\xA0\u2014 \u0441\u0434\u0435\u043B\u0430\u0442\u044C \u043A\u0430\u043B\u044C\u043A\u0443\u043B\u044F\u0442\u043E\u0440 \u043F\u043E\u043D\u044F\u0442\u043D\u0435\u0435: \u0443\u0432\u0438\u0434\u0435\u0442\u044C, \u043A\u0430\u043A\u0438\u0435 \u0440\u0430\u0437\u0434\u0435\u043B\u044B \u0447\u0438\u0442\u0430\u044E\u0442, \u043A\u0430\u043A\u0438\u0435 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u043C\u0435\u043D\u044F\u044E\u0442, \u043D\u0430\xA0\u043A\u0430\u043A\u043E\u043C \u0448\u0430\u0433\u0435 \u0443\u0445\u043E\u0434\u044F\u0442. \u0414\u043B\u044F \u0440\u0435\u043A\u043B\u0430\u043C\u044B, \u043F\u0440\u043E\u0444\u0438\u043B\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u0438\xA0\u043F\u0435\u0440\u0435\u0434\u0430\u0447\u0438 \u0442\u0440\u0435\u0442\u044C\u0438\u043C \u043B\u0438\u0446\u0430\u043C \u0432\xA0\u0438\u043D\u044B\u0445 \u0446\u0435\u043B\u044F\u0445 \u044D\u0442\u0438 \u0434\u0430\u043D\u043D\u044B\u0435 \u043D\u0435\xA0\u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E\u0442\u0441\u044F." })
    ] }),
    /* @__PURE__ */ jsxs8("section", { className: "legal__block", children: [
      /* @__PURE__ */ jsx9("h2", { children: "7. \u0424\u0430\u0439\u043B\u044B cookie \u0438\xA0\u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u0435 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435" }),
      /* @__PURE__ */ jsx9("p", { children: "7.1. \u0421\u0430\u0439\u0442 \u043D\u0435\xA0\u0443\u0441\u0442\u0430\u043D\u0430\u0432\u043B\u0438\u0432\u0430\u0435\u0442 \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0435 \u0444\u0430\u0439\u043B\u044B cookie \u0434\u043B\u044F\xA0\u0440\u0435\u043A\u043B\u0430\u043C\u044B \u0438\u043B\u0438\xA0\u0438\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u0438 \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F." }),
      /* @__PURE__ */ jsx9("p", { children: "7.2. \u0412 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u043C \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442\u0441\u044F \u043E\u0442\u043C\u0435\u0442\u043A\u0430 \u043E\xA0\u043B\u0430\u0439\u043A\u0435 \u0438\xA0\u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F. \u042D\u0442\u0438 \u0434\u0430\u043D\u043D\u044B\u0435 \u043D\u0435\xA0\u043F\u043E\u043A\u0438\u0434\u0430\u044E\u0442 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u0438\xA0\u0443\u0434\u0430\u043B\u044F\u044E\u0442\u0441\u044F \u0432\u043C\u0435\u0441\u0442\u0435 \u0441\xA0\u0434\u0430\u043D\u043D\u044B\u043C\u0438 \u0441\u0430\u0439\u0442\u0430 \u0432\xA0\u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0430." }),
      /* @__PURE__ */ jsx9("p", { children: "7.3. \u0421\u0435\u0440\u0432\u0438\u0441 \u0432\u0435\u0431-\u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0438, \u0435\u0441\u043B\u0438 \u043E\u043D\xA0\u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F, \u0443\u0441\u0442\u0430\u043D\u0430\u0432\u043B\u0438\u0432\u0430\u0435\u0442 \u0444\u0430\u0439\u043B\u044B cookie, \u0447\u0442\u043E\u0431\u044B \u043E\u0442\u043B\u0438\u0447\u0430\u0442\u044C \u043E\u0434\u0438\u043D \u0432\u0438\u0437\u0438\u0442 \u043E\u0442\xA0\u0434\u0440\u0443\u0433\u043E\u0433\u043E \u0438\xA0\u043D\u0435\xA0\u0441\u0447\u0438\u0442\u0430\u0442\u044C \u043F\u043E\u0432\u0442\u043E\u0440\u043D\u044B\u0435 \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u044B \u043D\u043E\u0432\u044B\u043C\u0438 \u043F\u043E\u0441\u0435\u0442\u0438\u0442\u0435\u043B\u044F\u043C\u0438. \u042D\u0442\u0438 \u0444\u0430\u0439\u043B\u044B \u043D\u0435\xA0\u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442 \u0432\u0432\u0435\u0434\u0451\u043D\u043D\u044B\u0445 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u043E\u0432 \u0440\u0430\u0441\u0447\u0451\u0442\u0430." }),
      /* @__PURE__ */ jsx9("p", { children: "7.4. \u041E\u0442\u043A\u0430\u0437\u0430\u0442\u044C\u0441\u044F \u043E\u0442\xA0\u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0438 \u043C\u043E\u0436\u043D\u043E \u0432\xA0\u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0430, \u0437\u0430\u043F\u0440\u0435\u0442\u0438\u0432 \u0444\u0430\u0439\u043B\u044B cookie \u0434\u043B\u044F\xA0\u0441\u0430\u0439\u0442\u0430 triis.ru, \u0438\u043B\u0438\xA0\u0432\u043A\u043B\u044E\u0447\u0438\u0432 \u0440\u0435\u0436\u0438\u043C \u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u043A\u0438 \u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0445 \u0441\u0447\u0451\u0442\u0447\u0438\u043A\u043E\u0432. \u041D\u0430 \u0440\u0430\u0431\u043E\u0442\u0443 \u043A\u0430\u043B\u044C\u043A\u0443\u043B\u044F\u0442\u043E\u0440\u0430 \u044D\u0442\u043E\xA0\u043D\u0435\xA0\u0432\u043B\u0438\u044F\u0435\u0442\xA0\u2014 \u0432\u0441\u0435 \u0440\u0430\u0441\u0447\u0451\u0442\u044B \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u044E\u0442\u0441\u044F \u0431\u0435\u0437\xA0\u043E\u0431\u0440\u0430\u0449\u0435\u043D\u0438\u044F \u043A\xA0\u0441\u0435\u0442\u0438." })
    ] }),
    /* @__PURE__ */ jsxs8("section", { className: "legal__block", children: [
      /* @__PURE__ */ jsx9("h2", { children: "8. \u041F\u043E\u0440\u044F\u0434\u043E\u043A \u0441\u0431\u043E\u0440\u0430, \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u0438\xA0\u043F\u0435\u0440\u0435\u0434\u0430\u0447\u0438 \u0434\u0430\u043D\u043D\u044B\u0445" }),
      /* @__PURE__ */ jsx9("p", { children: "8.1. \u0411\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u044C \u043E\u0431\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0435\u043C\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445 \u043E\u0431\u0435\u0441\u043F\u0435\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u043F\u0440\u0430\u0432\u043E\u0432\u044B\u043C\u0438, \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u043E\u043D\u043D\u044B\u043C\u0438 \u0438\xA0\u0442\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u043C\u0438 \u043C\u0435\u0440\u0430\u043C\u0438, \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u044B\u043C\u0438 \u0434\u043B\u044F\xA0\u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u0439 \u0437\u0430\u043A\u043E\u043D\u043E\u0434\u0430\u0442\u0435\u043B\u044C\u0441\u0442\u0432\u0430." }),
      /* @__PURE__ */ jsx9("p", { children: "8.2. \u041F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u043D\u0435\xA0\u043F\u0440\u043E\u0434\u0430\u044E\u0442\u0441\u044F \u0438\xA0\u043D\u0435\xA0\u043F\u0435\u0440\u0435\u0434\u0430\u044E\u0442\u0441\u044F \u0442\u0440\u0435\u0442\u044C\u0438\u043C \u043B\u0438\u0446\u0430\u043C \u0434\u043B\u044F \u0440\u0435\u043A\u043B\u0430\u043C\u044B. \u041E\u0431\u0435\u0437\u043B\u0438\u0447\u0435\u043D\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0438, \u043F\u0435\u0440\u0435\u0447\u0438\u0441\u043B\u0435\u043D\u043D\u044B\u0435 \u0432\xA0\u043F\u0443\u043D\u043A\u0442\u0435 3.5, \u043F\u0435\u0440\u0435\u0434\u0430\u044E\u0442\u0441\u044F \u0441\u0435\u0440\u0432\u0438\u0441\u0443 \u0432\u0435\u0431-\u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0438 \u0432\xA0\u043E\u0431\u044A\u0451\u043C\u0435, \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E\u043C \u0434\u043B\u044F\xA0\u0440\u0430\u0431\u043E\u0442\u044B \u043E\u0442\u0447\u0451\u0442\u043E\u0432. \u0418\u043D\u044B\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u0447\u0438 \u0432\u043E\u0437\u043C\u043E\u0436\u043D\u044B \u0442\u043E\u043B\u044C\u043A\u043E \u0432\xA0\u0441\u043B\u0443\u0447\u0430\u0435, \u043F\u0440\u0435\u0434\u0443\u0441\u043C\u043E\u0442\u0440\u0435\u043D\u043D\u043E\u043C \u0437\u0430\u043A\u043E\u043D\u043E\u0434\u0430\u0442\u0435\u043B\u044C\u0441\u0442\u0432\u043E\u043C." }),
      /* @__PURE__ */ jsx9("p", { children: "8.3. \u0421\u0430\u0439\u0442 \u0440\u0430\u0437\u043C\u0435\u0449\u0451\u043D \u043D\u0430\xA0\u0445\u043E\u0441\u0442\u0438\u043D\u0433\u0435 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430 \u0434\u043E\u043C\u0435\u043D\u043D\u044B\u0445 \u0438\u043C\u0451\u043D \u0420\u0415\u0413.\u0420\u0423 (\u041E\u041E\u041E \xAB\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440 \u0434\u043E\u043C\u0435\u043D\u043D\u044B\u0445 \u0438\u043C\u0451\u043D \u0420\u0415\u0413.\u0420\u0423\xBB), \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u043E\u0431\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0435\u0442 \u0442\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u043E\xA0\u0437\u0430\u043F\u0440\u043E\u0441\u0430\u0445 \u0432\xA0\u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u0438 \u0441\u043E\xA0\u0441\u0432\u043E\u0435\u0439 \u043F\u043E\u043B\u0438\u0442\u0438\u043A\u043E\u0439 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438." }),
      /* @__PURE__ */ jsx9("p", { children: "8.4. \u0421\u0430\u0439\u0442 \u043C\u043E\u0436\u0435\u0442 \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0438 \u043D\u0430\xA0\u0441\u0442\u043E\u0440\u043E\u043D\u043D\u0438\u0435 \u0441\u0430\u0439\u0442\u044B, \u0432\xA0\u0442\u043E\u043C \u0447\u0438\u0441\u043B\u0435 \u043D\u0430\xA0\u0441\u0430\u0439\u0442\u044B \u0431\u0440\u043E\u043A\u0435\u0440\u043E\u0432, \u0431\u0430\u043D\u043A\u043E\u0432 \u0438\xA0\u0434\u0440\u0443\u0433\u0438\u0445 \u0444\u0438\u043D\u0430\u043D\u0441\u043E\u0432\u044B\u0445 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0439. \u041F\u0435\u0440\u0435\u0445\u043E\u0434 \u043F\u043E\xA0\u0442\u0430\u043A\u043E\u0439 \u0441\u0441\u044B\u043B\u043A\u0435 \u043E\u0437\u043D\u0430\u0447\u0430\u0435\u0442, \u0447\u0442\u043E \u0434\u0430\u043B\u044C\u043D\u0435\u0439\u0448\u0430\u044F \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u0434\u0430\u043D\u043D\u044B\u0445 \u0440\u0435\u0433\u0443\u043B\u0438\u0440\u0443\u0435\u0442\u0441\u044F \u043F\u043E\u043B\u0438\u0442\u0438\u043A\u043E\u0439 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u044E\u0449\u0435\u0433\u043E \u0441\u0430\u0439\u0442\u0430; \u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440 \u043D\u0435\xA0\u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442 \u0437\u0430\xA0\u043D\u0435\u0451. \u041F\u0435\u0440\u0435\u0434\u0430\u0432\u0430\u0442\u044C \u0441\u0432\u043E\u0438 \u0434\u0430\u043D\u043D\u044B\u0435 \u043D\u0430\xA0\u0441\u0442\u043E\u0440\u043E\u043D\u043D\u0438\u0445 \u0441\u0430\u0439\u0442\u0430\u0445 \u0438\u043B\u0438\xA0\u043D\u0435\u0442, \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0440\u0435\u0448\u0430\u0435\u0442 \u0441\u0430\u043C." }),
      /* @__PURE__ */ jsx9("p", { children: "8.5. \u041E\u0431\u0435\u0437\u043B\u0438\u0447\u0435\u043D\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0438 \u0445\u0440\u0430\u043D\u044F\u0442\u0441\u044F \u0432\xA0\u0441\u0435\u0440\u0432\u0438\u0441\u0435 \u0432\u0435\u0431-\u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0438 \u0432\xA0\u0442\u0435\u0447\u0435\u043D\u0438\u0435 \u0441\u0440\u043E\u043A\u0430, \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u043E\u0433\u043E \u044D\u0442\u0438\u043C \u0441\u0435\u0440\u0432\u0438\u0441\u043E\u043C. \u0421\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0445 \u0431\u0430\u0437 \u0434\u0430\u043D\u043D\u044B\u0445 \u0441\xA0\u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u0435\u0439 \u043E\xA0\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F\u0445 \u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440 \u043D\u0435\xA0\u0432\u0435\u0434\u0451\u0442." })
    ] }),
    /* @__PURE__ */ jsxs8("section", { className: "legal__block", children: [
      /* @__PURE__ */ jsx9("h2", { children: "9. \u041F\u0435\u0440\u0435\u0447\u0435\u043D\u044C \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439 \u0441\xA0\u0434\u0430\u043D\u043D\u044B\u043C\u0438" }),
      /* @__PURE__ */ jsx9("p", { children: "9.1. \u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440 \u043D\u0435\xA0\u0441\u043E\u0431\u0438\u0440\u0430\u0435\u0442, \u043D\u0435\xA0\u043D\u0430\u043A\u0430\u043F\u043B\u0438\u0432\u0430\u0435\u0442 \u0438\xA0\u043D\u0435\xA0\u043F\u0435\u0440\u0435\u0434\u0430\u0451\u0442 \u0432\u0432\u0435\u0434\u0451\u043D\u043D\u044B\u0435 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0440\u0430\u0441\u0447\u0451\u0442\u0430\xA0\u2014 \u0442\u0430\u043A\u0438\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u043D\u0435\xA0\u043F\u043E\u0441\u0442\u0443\u043F\u0430\u044E\u0442 \u0432\xA0\u0435\u0433\u043E\xA0\u0440\u0430\u0441\u043F\u043E\u0440\u044F\u0436\u0435\u043D\u0438\u0435. \u0412 \u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u0438 \u043E\u0431\u0435\u0437\u043B\u0438\u0447\u0435\u043D\u043D\u043E\u0439 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u044B \u0435\u0451 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0435\u043C \u0432\xA0\u0441\u0432\u043E\u0434\u043D\u044B\u0445 \u043E\u0442\u0447\u0451\u0442\u0430\u0445 \u0441\u0435\u0440\u0432\u0438\u0441\u0430 \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0438 \u0438\xA0\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u043E\u043C \u044D\u0442\u0438\u0445 \u043E\u0442\u0447\u0451\u0442\u043E\u0432 \u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440\u043E\u043C." })
    ] }),
    /* @__PURE__ */ jsxs8("section", { className: "legal__block", children: [
      /* @__PURE__ */ jsx9("h2", { children: "10. \u0422\u0440\u0430\u043D\u0441\u0433\u0440\u0430\u043D\u0438\u0447\u043D\u0430\u044F \u043F\u0435\u0440\u0435\u0434\u0430\u0447\u0430" }),
      /* @__PURE__ */ jsx9("p", { children: "10.1. \u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440 \u043D\u0435\xA0\u043E\u0441\u0443\u0449\u0435\u0441\u0442\u0432\u043B\u044F\u0435\u0442 \u0442\u0440\u0430\u043D\u0441\u0433\u0440\u0430\u043D\u0438\u0447\u043D\u0443\u044E \u043F\u0435\u0440\u0435\u0434\u0430\u0447\u0443 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445. \u0414\u0430\u043D\u043D\u044B\u0435 \u0432\u0435\u0431-\u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0438 \u043E\u0431\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u044E\u0442\u0441\u044F \u0432\xA0\u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u0438 \u0441\xA0\u0443\u0441\u043B\u043E\u0432\u0438\u044F\u043C\u0438 \u0441\u0435\u0440\u0432\u0438\u0441\u0430 \u0438\xA0\u043D\u0430\xA0\u0441\u0435\u0440\u0432\u0435\u0440\u0430\u0445, \u0440\u0430\u0441\u043F\u043E\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0445 \u043D\u0430\xA0\u0442\u0435\u0440\u0440\u0438\u0442\u043E\u0440\u0438\u0438 \u0420\u043E\u0441\u0441\u0438\u0439\u0441\u043A\u043E\u0439 \u0424\u0435\u0434\u0435\u0440\u0430\u0446\u0438\u0438." })
    ] }),
    /* @__PURE__ */ jsxs8("section", { className: "legal__block", children: [
      /* @__PURE__ */ jsx9("h2", { children: "11. \u041A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u044C" }),
      /* @__PURE__ */ jsx9("p", { children: "\u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440 \u0438\xA0\u0438\u043D\u044B\u0435 \u043B\u0438\u0446\u0430, \u043F\u043E\u043B\u0443\u0447\u0438\u0432\u0448\u0438\u0435 \u0434\u043E\u0441\u0442\u0443\u043F \u043A\xA0\u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u043C \u0434\u0430\u043D\u043D\u044B\u043C, \u043E\u0431\u044F\u0437\u0430\u043D\u044B \u043D\u0435\xA0\u0440\u0430\u0441\u043A\u0440\u044B\u0432\u0430\u0442\u044C \u0442\u0440\u0435\u0442\u044C\u0438\u043C \u043B\u0438\u0446\u0430\u043C \u0438\xA0\u043D\u0435\xA0\u0440\u0430\u0441\u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u044F\u0442\u044C \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u0431\u0435\u0437\xA0\u0441\u043E\u0433\u043B\u0430\u0441\u0438\u044F \u0441\u0443\u0431\u044A\u0435\u043A\u0442\u0430 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445, \u0435\u0441\u043B\u0438 \u0438\u043D\u043E\u0435 \u043D\u0435\xA0\u043F\u0440\u0435\u0434\u0443\u0441\u043C\u043E\u0442\u0440\u0435\u043D\u043E \u0444\u0435\u0434\u0435\u0440\u0430\u043B\u044C\u043D\u044B\u043C \u0437\u0430\u043A\u043E\u043D\u043E\u043C." })
    ] }),
    /* @__PURE__ */ jsxs8("section", { className: "legal__block", children: [
      /* @__PURE__ */ jsx9("h2", { children: "12. \u0417\u0430\u043A\u043B\u044E\u0447\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u044F" }),
      /* @__PURE__ */ jsxs8("p", { children: [
        "12.1. \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043C\u043E\u0436\u0435\u0442 \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0440\u0430\u0437\u044A\u044F\u0441\u043D\u0435\u043D\u0438\u044F \u043F\u043E \u0432\u043E\u043F\u0440\u043E\u0441\u0430\u043C \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445, \u043E\u0431\u0440\u0430\u0442\u0438\u0432\u0448\u0438\u0441\u044C \u043A \u041E\u043F\u0435\u0440\u0430\u0442\u043E\u0440\u0443 \u0447\u0435\u0440\u0435\u0437 \u0441\u0430\u0439\u0442 \u0430\u0432\u0442\u043E\u0440\u0430 \u0441\u0435\u0440\u0432\u0438\u0441\u0430:",
        " ",
        /* @__PURE__ */ jsx9("a", { href: "https://maletskiy-design.ru", target: "_blank", rel: "noopener noreferrer", children: "maletskiy-design.ru" }),
        "."
      ] }),
      /* @__PURE__ */ jsx9("p", { children: "12.2. \u0412 \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0435\u043C \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0435 \u0431\u0443\u0434\u0443\u0442 \u043E\u0442\u0440\u0430\u0436\u0435\u043D\u044B \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u043F\u043E\u043B\u0438\u0442\u0438\u043A\u0438 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445. \u041F\u043E\u043B\u0438\u0442\u0438\u043A\u0430 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442 \u0431\u0435\u0441\u0441\u0440\u043E\u0447\u043D\u043E \u0434\u043E\xA0\u0437\u0430\u043C\u0435\u043D\u044B \u0435\u0451 \u043D\u043E\u0432\u043E\u0439 \u0432\u0435\u0440\u0441\u0438\u0435\u0439. \u041F\u0440\u0438 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0445 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F\u0445 \u043E\u0431\u043D\u043E\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0434\u0430\u0442\u0430 \u0440\u0435\u0434\u0430\u043A\u0446\u0438\u0438 \u0432\xA0\u043D\u0430\u0447\u0430\u043B\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430." }),
      /* @__PURE__ */ jsx9("p", { children: "12.3. \u0410\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u0430\u044F \u0432\u0435\u0440\u0441\u0438\u044F \u041F\u043E\u043B\u0438\u0442\u0438\u043A\u0438 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430 \u0432\xA0\u0441\u0435\u0442\u0438 \u0438\u043D\u0442\u0435\u0440\u043D\u0435\u0442 \u043F\u043E\xA0\u0430\u0434\u0440\u0435\u0441\u0443 https://triis.ru/privacy." })
    ] })
  ] });
}

// src/lib/calc.ts
var ACCOUNT_ORDER = ["iis3", "iis1", "iis2"];
var ACCOUNT_LABELS = {
  iis3: "\u0418\u0418\u0421-3",
  iis1: "\u0422\u0438\u043F \u0410",
  iis2: "\u0422\u0438\u043F \u0411"
};
function nonNegative(value) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}
function minHoldingYears(type, openYear) {
  return type === "iis3" ? iis3MinYears(openYear) : OLD_IIS_MIN_YEARS;
}
function simulateCore(type, scenario, years) {
  const limitContribution = (raw) => type === "iis3" ? nonNegative(raw) : Math.min(nonNegative(raw), OLD_IIS_CONTRIBUTION_LIMIT);
  const contributionFor = (year) => limitContribution(
    scenario.contributionMode === "custom" ? scenario.contributions[year - 1] ?? 0 : scenario.annualContribution
  );
  const openYear = Number(scenario.openDate.slice(0, 4)) || 2026;
  const minHolding = minHoldingYears(type, openYear);
  const rate = nonNegative(scenario.returnPct) / 100;
  const horizon = Math.max(0, Math.floor(years));
  const income = nonNegative(scenario.officialIncome);
  const incomeTax = ndfl(income);
  const baseRate = scenario.manualRate && scenario.manualRate > 0 ? scenario.manualRate : marginalRate(income);
  const periods = Math.min(12, Math.max(1, Math.round(scenario.periodsPerYear || 1)));
  const ratePerPeriod = rate / periods;
  const rows = [];
  let capital = 0;
  let contributionsTotal = 0;
  let refundsTotal = 0;
  let reinvestedTotal = 0;
  let pendingRefund = 0;
  for (let year = 1; year <= horizon; year += 1) {
    const contribution = contributionFor(year);
    if (scenario.reinvestRefunds && pendingRefund > 0) {
      capital += pendingRefund;
      reinvestedTotal += pendingRefund;
    }
    pendingRefund = 0;
    const startCapital = capital;
    capital += contribution;
    for (let period = 0; period < periods; period += 1) {
      capital *= 1 + ratePerPeriod;
    }
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
    exitTax = taxOnGains(Math.max(0, profit), scenario.manualRate);
    clawback = refundsTotal;
  } else if (type === "iis3") {
    const taxableProfit = Math.max(0, profit - IIS3_PROFIT_EXEMPT_LIMIT);
    exitTax = taxOnGains(taxableProfit, scenario.manualRate);
  } else if (type === "iis1") {
    exitTax = taxOnGains(Math.max(0, profit), scenario.manualRate);
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
function bestAccount(results) {
  return ACCOUNT_ORDER.reduce(
    (best, type) => results[type].net > results[best].net ? type : best
  );
}

// src/lib/pdf.ts
var A4 = { width: 595.28, height: 841.89 };
var MARGIN = 42;
var INK = { r: 0.067, g: 0.067, b: 0.067 };
var MUTED = { r: 0.45, g: 0.45, b: 0.45 };
var LIGHT = { r: 0.8, g: 0.8, b: 0.8 };
function newPage(ctx) {
  ctx.page = ctx.doc.addPage([A4.width, A4.height]);
  ctx.y = A4.height - MARGIN;
}
function text(ctx, value, options = {}) {
  const size = options.size ?? 10;
  const font = options.font ?? ctx.regular;
  const color = options.color ?? INK;
  if (ctx.y < MARGIN + size * 2) newPage(ctx);
  ctx.page.drawText(value, {
    x: options.x ?? MARGIN,
    y: ctx.y - size,
    size,
    font,
    color: ctx.doc.context.obj(color).valueOf ? rgbOf(color) : rgbOf(color)
  });
  ctx.y -= size + (options.gap ?? 6);
}
var toColor = null;
function rgbOf(color) {
  return toColor ? toColor(color) : color;
}
function wrap(font, value, size, width) {
  const words = value.split(/\s+/);
  const lines = [];
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
async function buildPdf(input) {
  const [{ PDFDocument, rgb: makeRgb }, fontkit] = await Promise.all([
    import("pdf-lib"),
    import("@pdf-lib/fontkit")
  ]);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit.default ?? fontkit);
  toColor = (color) => makeRgb(color.r, color.g, color.b);
  const load = async (file) => {
    const bytes2 = await fetch(`/fonts/${file}`).then((response) => response.arrayBuffer());
    return doc.embedFont(bytes2, { subset: true });
  };
  const regular = await load("sbsans-regular.otf");
  const semibold = await load("sbsans-semibold.otf");
  const bold = await load("sbsans-bold.otf");
  const ctx = { doc, page: null, y: 0, regular, semibold, bold };
  newPage(ctx);
  const width = A4.width - MARGIN * 2;
  const draw = (value, opts = {}) => text(ctx, value, opts);
  draw("\u0422\u0420\u0418\u0418\u0421", { size: 22, font: bold, gap: 2 });
  draw("\u041A\u0430\u043B\u044C\u043A\u0443\u043B\u044F\u0442\u043E\u0440 \u0418\u0418\u0421", { size: 10, color: MUTED, gap: 14 });
  const params = [
    `${ACCOUNT_LABELS[input.account]}, \u043E\u0442\u043A\u0440\u044B\u0442 ${formatHuman(input.scenario.openDate)}`,
    input.scenario.contributionMode === "custom" ? `\u0432\u0437\u043D\u043E\u0441\u044B \u043F\u043E\xA0\u0433\u043E\u0434\u0430\u043C, \u0432\u0441\u0435\u0433\u043E ${rub(input.result.contributions)}` : `${rub(input.scenario.annualContribution)} \u0432\xA0\u0433\u043E\u0434`,
    `${input.scenario.years} ${yearsWord(input.scenario.years)}`,
    `\u0434\u043E\u0445\u043E\u0434\u043D\u043E\u0441\u0442\u044C ${input.scenario.returnPct}%`,
    `\u0438\u043D\u0444\u043B\u044F\u0446\u0438\u044F ${input.scenario.inflationPct}%`
  ].join(" \xB7 ");
  for (const line of wrap(regular, params, 9, width)) {
    draw(line, { size: 9, color: MUTED, gap: 2 });
  }
  ctx.y -= 10;
  draw("\u041D\u0430 \u0440\u0443\u043A\u0438 \u043F\u043E\u0441\u043B\u0435 \u0437\u0430\u043A\u0440\u044B\u0442\u0438\u044F", { size: 9, color: MUTED, gap: 4 });
  draw(rub(input.result.net), { size: 26, font: bold, gap: 4 });
  draw(`\u0412 \u0446\u0435\u043D\u0430\u0445 \u0441\u0435\u0433\u043E\u0434\u043D\u044F\u0448\u043D\u0435\u0433\u043E \u0434\u043D\u044F\xA0\u2014 ${compactRub(input.result.netReal)}`, {
    size: 10,
    color: MUTED,
    gap: 16
  });
  const stats = [
    ["\u0412\u044B\u0447\u0435\u0442\u044B \u0437\u0430\xA0\u0441\u0440\u043E\u043A", rub(input.result.refunds)],
    ["\u041A\u0430\u043F\u0438\u0442\u0430\u043B \u043D\u0430\xA0\u0441\u0447\u0451\u0442\u0435", rub(input.result.grossCapital)],
    ["\u041D\u0430\u043B\u043E\u0433 \u043F\u0440\u0438\xA0\u0437\u0430\u043A\u0440\u044B\u0442\u0438\u0438", rub(input.result.exitTax)],
    ["\u0412\u0430\u0448\u0438 \u0432\u0437\u043D\u043E\u0441\u044B", rub(input.result.contributions)]
  ];
  for (const [label, value] of stats) {
    draw(`${label}: ${value}`, { size: 11, font: semibold, gap: 7 });
  }
  draw(`\u041C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0439 \u0441\u0440\u043E\u043A \u0432\u043B\u0430\u0434\u0435\u043D\u0438\u044F\xA0\u2014 ${input.result.minHolding} ${yearsWord(input.result.minHolding)}`, {
    size: 9,
    color: MUTED,
    gap: 16
  });
  draw("\u0421\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435 \u0441\u0447\u0435\u0442\u043E\u0432", { size: 13, font: bold, gap: 8 });
  for (const type of ["iis3", "iis1", "iis2"]) {
    const result = input.results[type];
    const mark = type === input.best ? " \u2014 \u0432\u044B\u0433\u043E\u0434\u043D\u0435\u0435" : "";
    draw(`${ACCOUNT_LABELS[type]}: ${rub(result.net)}${mark}`, { size: 10, gap: 6 });
  }
  ctx.y -= 10;
  const openYear = yearOf(input.scenario.openDate);
  draw("\u0422\u0430\u0431\u043B\u0438\u0446\u0430 \u043F\u043E\xA0\u0433\u043E\u0434\u0430\u043C", { size: 13, font: bold, gap: 10 });
  const columns = [
    { title: "\u0413\u043E\u0434", width: 52, align: "left", value: (row) => String(openYear + row.year - 1) },
    { title: "\u0412\u0437\u043D\u043E\u0441", width: 96, align: "right", value: (row) => rub(row.contribution) },
    { title: "\u0412\u044B\u0447\u0435\u0442", width: 92, align: "right", value: (row) => row.refund > 0 ? rub(row.refund) : "\u2014" },
    { title: "\u0414\u043E\u0445\u043E\u0434 \u0437\u0430\xA0\u0433\u043E\u0434", width: 110, align: "right", value: (row) => rub(row.growth) },
    { title: "\u041A\u0430\u043F\u0438\u0442\u0430\u043B", width: 118, align: "right", value: (row) => rub(row.capital) }
  ];
  const drawRow = (values, isHeader = false, isTotal = false) => {
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
        color: rgbOf(isHeader ? MUTED : INK)
      });
      x += column.width;
    }
    ctx.y -= size + 6;
    if (isHeader) {
      ctx.page.drawLine({
        start: { x: MARGIN, y: ctx.y + 3 },
        end: { x: A4.width - MARGIN, y: ctx.y + 3 },
        thickness: 0.7,
        color: rgbOf(LIGHT)
      });
    }
  };
  drawRow(columns.map((column) => column.title), true);
  for (const row of input.result.rows) {
    drawRow(columns.map((column) => column.value(row)));
  }
  drawRow(
    ["\u0418\u0442\u043E\u0433\u043E", rub(input.result.contributions), rub(input.result.refunds), rub(input.result.profit), rub(input.result.grossCapital)],
    false,
    true
  );
  ctx.y -= 8;
  for (const line of wrap(
    regular,
    "\u041F\u0440\u0430\u0432\u0438\u043B\u0430 2026\xA0\u0433\u043E\u0434\u0430. \u041D\u0435\xA0\u0438\u043D\u0432\u0435\u0441\u0442\u0438\u0446\u0438\u043E\u043D\u043D\u0430\u044F \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u044F",
    8,
    width
  )) {
    draw(line, { size: 8, color: MUTED, gap: 4 });
  }
  const bytes = await doc.save({ useObjectStreams: false });
  return new Blob([bytes], { type: "application/pdf" });
}
function downloadPdf(input) {
  buildPdf(input).then((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `triis-raschet-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  });
}

// src/components/Chart.tsx
import { useMemo as useMemo3, useRef as useRef4, useState as useState7 } from "react";
import { jsx as jsx10, jsxs as jsxs9 } from "react/jsx-runtime";
var PAD = { top: 14, right: 10, bottom: 26, left: 6 };
var W = 720;
function Chart({ rows, height = 260 }) {
  const svgRef = useRef4(null);
  const [hover, setHover] = useState7(null);
  const H = height;
  const data = useMemo3(() => {
    if (rows.length === 0) return null;
    const contributions2 = [];
    let running = 0;
    const capital2 = rows.map((row) => {
      running += row.contribution;
      contributions2.push(running);
      return row.capital;
    });
    const maxCapital2 = Math.max(...capital2, 1);
    const innerW = W - PAD.left - PAD.right;
    const innerH2 = H - PAD.top - PAD.bottom;
    const x2 = (index) => PAD.left + (rows.length === 1 ? innerW / 2 : index / (rows.length - 1) * innerW);
    const y2 = (value) => PAD.top + innerH2 - value / maxCapital2 * innerH2;
    const line2 = (values) => values.map((value, index) => `${index === 0 ? "M" : "L"}${x2(index)},${y2(value)}`).join(" ");
    const area2 = (values) => `${line2(values)} L${x2(values.length - 1)},${PAD.top + innerH2} L${x2(0)},${PAD.top + innerH2} Z`;
    return { contributions: contributions2, capital: capital2, x: x2, y: y2, line: line2, area: area2, maxCapital: maxCapital2, innerH: innerH2 };
  }, [rows, H]);
  if (!data || rows.length === 0) {
    return /* @__PURE__ */ jsx10("div", { className: "chart chart--empty", children: "\u0417\u0430\u0434\u0430\u0439\u0442\u0435 \u0432\u0437\u043D\u043E\u0441\u044B \u0438\xA0\u0441\u0440\u043E\u043A\xA0\u2014 \u043F\u043E\u043A\u0430\u0436\u0443 \u0440\u043E\u0441\u0442 \u043A\u0430\u043F\u0438\u0442\u0430\u043B\u0430" });
  }
  const { contributions, capital, x, y, line, area, maxCapital, innerH } = data;
  const gridValues = [0.25, 0.5, 0.75, 1].map((share) => maxCapital * share);
  const pointFromEvent = (clientX) => {
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
  return /* @__PURE__ */ jsxs9("div", { className: "chart", children: [
    /* @__PURE__ */ jsxs9("div", { className: "chart__legend", children: [
      /* @__PURE__ */ jsx10("span", { className: "chart__key chart__key--capital", children: "\u041A\u0430\u043F\u0438\u0442\u0430\u043B" }),
      /* @__PURE__ */ jsx10("span", { className: "chart__key chart__key--contribution", children: "\u0412\u0430\u0448\u0438 \u0432\u0437\u043D\u043E\u0441\u044B" })
    ] }),
    /* @__PURE__ */ jsxs9("div", { className: "chart__stage", children: [
      /* @__PURE__ */ jsxs9(
        "svg",
        {
          ref: svgRef,
          className: "chart__svg",
          viewBox: `0 0 ${W} ${H}`,
          preserveAspectRatio: "none",
          role: "img",
          "aria-label": "\u0420\u043E\u0441\u0442 \u043A\u0430\u043F\u0438\u0442\u0430\u043B\u0430 \u043F\u043E\xA0\u0433\u043E\u0434\u0430\u043C",
          onPointerMove: (e) => pointFromEvent(e.clientX),
          onPointerLeave: () => setHover(null),
          onPointerDown: (e) => pointFromEvent(e.clientX),
          children: [
            /* @__PURE__ */ jsx10("defs", { children: /* @__PURE__ */ jsxs9("linearGradient", { id: "capitalFill", x1: "0", y1: "0", x2: "0", y2: "1", children: [
              /* @__PURE__ */ jsx10("stop", { offset: "0%", stopColor: "var(--chart-capital)", stopOpacity: "0.26" }),
              /* @__PURE__ */ jsx10("stop", { offset: "100%", stopColor: "var(--chart-capital)", stopOpacity: "0.02" })
            ] }) }),
            gridValues.map((value) => /* @__PURE__ */ jsx10(
              "line",
              {
                x1: PAD.left,
                x2: W - PAD.right,
                y1: y(value),
                y2: y(value),
                className: "chart__grid"
              },
              value
            )),
            /* @__PURE__ */ jsx10("path", { d: area(capital), fill: "url(#capitalFill)" }),
            /* @__PURE__ */ jsx10("path", { d: line(capital), className: "chart__line" }),
            /* @__PURE__ */ jsx10("path", { d: area(contributions), className: "chart__area-contributions" }),
            /* @__PURE__ */ jsx10("path", { d: line(contributions), className: "chart__line-contributions" }),
            rows.length <= 14 && rows.map((row, index) => /* @__PURE__ */ jsx10(
              "circle",
              {
                cx: x(index),
                cy: y(row.capital),
                r: hover === index ? 4.5 : 2.6,
                className: "chart__dot" + (hover === index ? " is-active" : "")
              },
              row.year
            )),
            [0, Math.floor((rows.length - 1) / 2), rows.length - 1].filter((v, i, arr) => arr.indexOf(v) === i).map((index) => /* @__PURE__ */ jsx10(
              "text",
              {
                x: x(index),
                y: H - 6,
                className: "chart__axis",
                textAnchor: index === 0 ? "start" : index === rows.length - 1 ? "end" : "middle",
                children: rows[index].year
              },
              index
            )),
            hover !== null && /* @__PURE__ */ jsx10(
              "line",
              {
                x1: x(hover),
                x2: x(hover),
                y1: PAD.top,
                y2: PAD.top + innerH,
                className: "chart__crosshair"
              }
            )
          ]
        }
      ),
      hovered && hover !== null && /* @__PURE__ */ jsxs9(
        "div",
        {
          className: "chart__tip",
          style: {
            left: `${x(hover) / W * 100}%`,
            transform: x(hover) / W * 100 > 62 ? "translate(calc(-100% - 0.6rem), 0)" : "translate(0.6rem, 0)"
          },
          children: [
            /* @__PURE__ */ jsxs9("span", { className: "chart__tip-year", children: [
              hovered.year,
              " \u0433\u043E\u0434"
            ] }),
            /* @__PURE__ */ jsxs9("span", { className: "chart__tip-row", children: [
              "\u041A\u0430\u043F\u0438\u0442\u0430\u043B ",
              /* @__PURE__ */ jsx10("b", { children: rub(hovered.capital) })
            ] }),
            /* @__PURE__ */ jsxs9("span", { className: "chart__tip-row", children: [
              "\u0412\u0437\u043D\u043E\u0441 ",
              /* @__PURE__ */ jsx10("b", { children: rub(hovered.contribution) })
            ] }),
            /* @__PURE__ */ jsxs9("span", { className: "chart__tip-row", children: [
              "\u0414\u043E\u0445\u043E\u0434 \u0437\u0430\xA0\u0433\u043E\u0434 ",
              /* @__PURE__ */ jsx10("b", { children: rub(hovered.growth) })
            ] })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx10("div", { className: "chart__foot", children: /* @__PURE__ */ jsxs9("span", { children: [
      "\u0437\u0430 ",
      rows.length,
      " ",
      rows.length === 1 ? "\u0433\u043E\u0434" : "\u043B\u0435\u0442",
      " \u043A\u0430\u043F\u0438\u0442\u0430\u043B \u0434\u043E\u0440\u0430\u0441\u0442\u0451\u0442 \u0434\u043E ",
      compactRub(capital[capital.length - 1])
    ] }) })
  ] });
}

// src/components/YearTable.tsx
import { jsx as jsx11, jsxs as jsxs10 } from "react/jsx-runtime";
function YearTable({
  result,
  openYear
}) {
  if (result.rows.length === 0) {
    return /* @__PURE__ */ jsx11("p", { className: "table__empty", children: "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F\xA0\u0442\u0430\u0431\u043B\u0438\u0446\u044B" });
  }
  return /* @__PURE__ */ jsx11("div", { className: "table__wrap", children: /* @__PURE__ */ jsxs10("table", { className: "table", children: [
    /* @__PURE__ */ jsx11("thead", { children: /* @__PURE__ */ jsxs10("tr", { children: [
      /* @__PURE__ */ jsx11("th", { scope: "col", children: "\u0413\u043E\u0434" }),
      /* @__PURE__ */ jsx11("th", { scope: "col", children: "\u0412\u0437\u043D\u043E\u0441" }),
      /* @__PURE__ */ jsx11("th", { scope: "col", children: "\u0412\u044B\u0447\u0435\u0442" }),
      /* @__PURE__ */ jsx11("th", { scope: "col", className: "table__hide-sm", children: "\u0414\u043E\u0445\u043E\u0434 \u0437\u0430\xA0\u0433\u043E\u0434" }),
      /* @__PURE__ */ jsx11("th", { scope: "col", children: "\u041A\u0430\u043F\u0438\u0442\u0430\u043B" })
    ] }) }),
    /* @__PURE__ */ jsx11("tbody", { children: result.rows.map((row) => /* @__PURE__ */ jsxs10("tr", { children: [
      /* @__PURE__ */ jsx11("td", { children: openYear + row.year - 1 }),
      /* @__PURE__ */ jsx11("td", { children: rub(row.contribution) }),
      /* @__PURE__ */ jsx11("td", { className: "table__refund", children: row.refund > 0 ? rub(row.refund) : "\u2014" }),
      /* @__PURE__ */ jsx11("td", { className: "table__hide-sm", children: rub(row.growth) }),
      /* @__PURE__ */ jsx11("td", { className: "table__capital", children: rub(row.capital) })
    ] }, row.year)) }),
    /* @__PURE__ */ jsx11("tfoot", { children: /* @__PURE__ */ jsxs10("tr", { children: [
      /* @__PURE__ */ jsx11("td", { children: "\u0418\u0442\u043E\u0433\u043E" }),
      /* @__PURE__ */ jsx11("td", { children: rub(result.contributions) }),
      /* @__PURE__ */ jsx11("td", { className: "table__refund", children: rub(result.refunds) }),
      /* @__PURE__ */ jsx11("td", { className: "table__hide-sm", children: rub(result.profit) }),
      /* @__PURE__ */ jsx11("td", { className: "table__capital", children: rub(result.grossCapital) })
    ] }) })
  ] }) });
}

// src/components/Compare.tsx
import { jsx as jsx12, jsxs as jsxs11 } from "react/jsx-runtime";
var SHORT_NOTE = {
  iis3: "\u0418\u0418\u0421-3: \u043E\u0431\u0430 \u0432\u044B\u0447\u0435\u0442\u0430\xA0\u2014 \u0432\u0437\u043D\u043E\u0441 \u0438\xA0\u0434\u043E\u0445\u043E\u0434. \u0414\u0435\u0440\u0436\u0430\u0442\u044C 5\u201310\u202F\u043B\u0435\u0442",
  iis1: "\u0422\u0438\u043F \u0410: \u0432\u044B\u0447\u0435\u0442 \u043D\u0430\xA0\u0432\u0437\u043D\u043E\u0441, \u0434\u043E\u0445\u043E\u0434 \u043E\u0431\u043B\u0430\u0433\u0430\u0435\u0442\u0441\u044F. 3\u202F\u0433\u043E\u0434\u0430",
  iis2: "\u0422\u0438\u043F \u0411: \u0434\u043E\u0445\u043E\u0434 \u0431\u0435\u0437\xA0\u043D\u0430\u043B\u043E\u0433\u0430, \u0432\u044B\u0447\u0435\u0442\u0430 \u043D\u0430\xA0\u0432\u0437\u043D\u043E\u0441 \u043D\u0435\u0442. 3\u202F\u0433\u043E\u0434\u0430"
};
function Compare({ results, best, onPick }) {
  const top = results[best].net;
  return /* @__PURE__ */ jsxs11("div", { className: "compare", children: [
    /* @__PURE__ */ jsx12("p", { className: "compare__lead", children: "\u041E\u0434\u0438\u043D\u0430\u043A\u043E\u0432\u044B\u0435 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B, \u0442\u0440\u0438 \u0442\u0438\u043F\u0430 \u0441\u0447\u0451\u0442\u0430. \u0412\u044B\u0433\u043E\u0434\u0430 \u0441\u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u043E\u0442\xA0\u043B\u0443\u0447\u0448\u0435\u0433\u043E \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u0430." }),
    /* @__PURE__ */ jsx12("div", { className: "compare__list", children: ACCOUNT_ORDER.map((type) => {
      const result = results[type];
      const isBest = type === best;
      const gap = top - result.net;
      return /* @__PURE__ */ jsxs11(
        "button",
        {
          type: "button",
          className: "card" + (isBest ? " card--best" : "") + (result.earlyClose ? " card--early" : ""),
          onClick: () => onPick(type),
          children: [
            /* @__PURE__ */ jsxs11("span", { className: "card__head", children: [
              /* @__PURE__ */ jsx12("span", { className: "card__name", children: ACCOUNT_LABELS[type] }),
              isBest ? /* @__PURE__ */ jsx12("span", { className: "chip chip--best", children: "\u0432\u044B\u0433\u043E\u0434\u043D\u0435\u0435" }) : null,
              result.earlyClose ? /* @__PURE__ */ jsxs11("span", { className: "chip chip--warn", children: [
                "\u0440\u0430\u043D\u043E: \u043D\u0443\u0436\u043D\u043E ",
                result.minHolding,
                " ",
                yearsWord(result.minHolding)
              ] }) : null
            ] }),
            /* @__PURE__ */ jsx12("span", { className: "card__net", children: /* @__PURE__ */ jsx12(RollingNumber, { value: result.net, format: (n) => rub(n) }) }),
            /* @__PURE__ */ jsx12("span", { className: "card__note", children: SHORT_NOTE[type] }),
            /* @__PURE__ */ jsxs11("span", { className: "card__rows", children: [
              /* @__PURE__ */ jsxs11("span", { children: [
                "\u0412\u044B\u0447\u0435\u0442\u044B ",
                /* @__PURE__ */ jsx12("b", { children: compactRub(result.refunds) })
              ] }),
              /* @__PURE__ */ jsxs11("span", { children: [
                "\u041D\u0430\u043B\u043E\u0433 ",
                /* @__PURE__ */ jsx12("b", { children: compactRub(result.exitTax) })
              ] }),
              /* @__PURE__ */ jsxs11("span", { children: [
                "\u0421\u0440\u043E\u043A ",
                /* @__PURE__ */ jsxs11("b", { children: [
                  result.minHolding,
                  " ",
                  yearsWord(result.minHolding)
                ] })
              ] })
            ] }),
            !isBest && gap > 1 ? /* @__PURE__ */ jsxs11("span", { className: "card__gap", children: [
              "\u2212",
              compactRub(gap),
              " \u043A\xA0\u043B\u0443\u0447\u0448\u0435\u043C\u0443 \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u0443"
            ] }) : /* @__PURE__ */ jsx12("span", { className: "card__gap card__gap--best", children: "\u043B\u0443\u0447\u0448\u0438\u0439 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442" })
          ]
        },
        type
      );
    }) }),
    /* @__PURE__ */ jsx12("div", { className: "compare__bars", "aria-hidden": "true", children: ACCOUNT_ORDER.map((type) => {
      const share = top > 0 ? results[type].net / top * 100 : 0;
      return /* @__PURE__ */ jsxs11("div", { className: "compare__bar-row", children: [
        /* @__PURE__ */ jsx12("span", { className: "compare__bar-label", children: ACCOUNT_LABELS[type] }),
        /* @__PURE__ */ jsx12("span", { className: "compare__bar" + (type === best ? " is-best" : ""), children: /* @__PURE__ */ jsx12("span", { className: "compare__bar-fill", style: { width: `${Math.max(2, share)}%` } }) }),
        /* @__PURE__ */ jsx12("span", { className: "compare__bar-value", children: compactRub(results[type].net) })
      ] }, type);
    }) }),
    /* @__PURE__ */ jsx12("p", { className: "compare__hint", children: "\u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u043D\u0430\xA0\u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0443, \u0447\u0442\u043E\u0431\u044B \u043F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u0434\u0435\u0442\u0430\u043B\u0438 \u044D\u0442\u043E\u0433\u043E \u0441\u0447\u0451\u0442\u0430." })
  ] });
}

// src/components/Rules.tsx
import { jsx as jsx13, jsxs as jsxs12 } from "react/jsx-runtime";
function Rules({ openYear }) {
  const minYears = iis3MinYears(openYear);
  return /* @__PURE__ */ jsxs12("article", { className: "rules", children: [
    /* @__PURE__ */ jsxs12("p", { className: "rules__lead", children: [
      "\u0420\u0430\u0441\u0447\u0451\u0442 \u043F\u043E\xA0\u043F\u0440\u0430\u0432\u0438\u043B\u0430\u043C ",
      RULES_YEAR,
      " \u0433\u043E\u0434\u0430. \u041D\u0438\u0436\u0435\xA0\u2014 \u0442\u043E, \u0447\u0442\u043E\xA0\u0440\u0435\u0430\u043B\u044C\u043D\u043E \u0432\u043B\u0438\u044F\u0435\u0442 \u043D\u0430\xA0\u0446\u0438\u0444\u0440\u044B."
    ] }),
    /* @__PURE__ */ jsx13("p", { className: "rules__text", children: "\u0422\u0438\u043F \u0410\xA0\u2014 \u044D\u0442\u043E\xA0\u0431\u044B\u0432\u0448\u0438\u0439 \u0418\u0418\u0421-1, \u0442\u0438\u043F \u0411\xA0\u2014 \u0431\u044B\u0432\u0448\u0438\u0439 \u0418\u0418\u0421-2. \u041D\u043E\u0432\u044B\u0435 \u0442\u0430\u043A\u0438\u0435 \u0441\u0447\u0435\u0442\u0430 \u043D\u0435\xA0\u043E\u0442\u043A\u0440\u044B\u0432\u0430\u044E\u0442 \u0441\xA02024\xA0\u0433\u043E\u0434\u0430, \u043D\u043E\xA0\u0443\u0436\u0435 \u043E\u0442\u043A\u0440\u044B\u0442\u044B\u0435 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u044E\u0442 \u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C." }),
    /* @__PURE__ */ jsxs12("section", { className: "rules__block", children: [
      /* @__PURE__ */ jsx13("h3", { children: "\u0412\u044B\u0447\u0435\u0442 \u043D\u0430\xA0\u0432\u0437\u043D\u043E\u0441" }),
      /* @__PURE__ */ jsxs12("ul", { children: [
        /* @__PURE__ */ jsxs12("li", { children: [
          "\u0411\u0430\u0437\u0430\xA0\u2014 \u0434\u043E\xA0",
          /* @__PURE__ */ jsx13("b", { children: compactRub(DEDUCTION_BASE_LIMIT) }),
          " \u0432\u0437\u043D\u043E\u0441\u043E\u0432 \u0437\u0430\xA0\u0433\u043E\u0434. \u0412\u043D\u043E\u0441\u0438\u0442\u044C \u0431\u043E\u043B\u044C\u0448\u0435 \u043C\u043E\u0436\u043D\u043E, \u043D\u043E\xA0\u043D\u0430\u043B\u043E\u0433 \u0432\u0435\u0440\u043D\u0443\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u0441\xA0\u044D\u0442\u043E\u0439 \u0441\u0443\u043C\u043C\u044B"
        ] }),
        /* @__PURE__ */ jsxs12("li", { children: [
          "\u0412\u043E\u0437\u0432\u0440\u0430\u0442\xA0\u2014 \u043F\u043E\xA0\u0432\u0430\u0448\u0435\u0439 \u0441\u0442\u0430\u0432\u043A\u0435: 13% \u2192 ",
          /* @__PURE__ */ jsx13("b", { children: "52\u202F000\u202F\u20BD" }),
          " \u0432\xA0\u0433\u043E\u0434, 15% \u2192 ",
          /* @__PURE__ */ jsx13("b", { children: "60\u202F000\u202F\u20BD" })
        ] }),
        /* @__PURE__ */ jsx13("li", { children: "\u0412\u0435\u0440\u043D\u0443\u0442\u044C \u043C\u043E\u0436\u043D\u043E \u043D\u0435\xA0\u0431\u043E\u043B\u044C\u0448\u0435 \u041D\u0414\u0424\u041B, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u0432\u044B\xA0\u0440\u0435\u0430\u043B\u044C\u043D\u043E \u0437\u0430\u043F\u043B\u0430\u0442\u0438\u043B\u0438 \u0437\u0430\xA0\u0433\u043E\u0434. \u041D\u0435\u0442 \u043E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0434\u043E\u0445\u043E\u0434\u0430\xA0\u2014 \u043D\u0435\u0442 \u0432\u044B\u0447\u0435\u0442\u0430" }),
        /* @__PURE__ */ jsxs12("li", { children: [
          "\u041B\u0438\u043C\u0438\u0442 ",
          compactRub(DEDUCTION_BASE_LIMIT),
          " \u043E\u0431\u0449\u0438\u0439 \u0434\u043B\u044F\xA0\u0418\u0418\u0421-3, \u041F\u0414\u0421 \u0438\xA0\u0434\u043E\u0433\u043E\u0432\u043E\u0440\u043E\u0432 \u041D\u041F\u041E"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs12("section", { className: "rules__block", children: [
      /* @__PURE__ */ jsx13("h3", { children: "\u0421\u0440\u043E\u043A \u0432\u043B\u0430\u0434\u0435\u043D\u0438\u044F" }),
      /* @__PURE__ */ jsxs12("ul", { children: [
        /* @__PURE__ */ jsx13("li", { children: "\u0422\u0438\u043F \u0410 \u0438\xA0\u0442\u0438\u043F \u0411\xA0\u2014 3\xA0\u0433\u043E\u0434\u0430" }),
        /* @__PURE__ */ jsxs12("li", { children: [
          "\u0418\u0418\u0421-3, \u043E\u0442\u043A\u0440\u044B\u0442\u044B\u0439 \u0432\xA0",
          openYear,
          " \u0433\u043E\u0434\u0443, \u2014 ",
          minYears,
          " \u043B\u0435\u0442. \u0414\u043B\u044F \u0441\u0447\u0435\u0442\u043E\u0432 2024\u20132026 \u0433\u043E\u0434\u043E\u0432 \u044D\u0442\u043E 5 \u043B\u0435\u0442, \u0434\u0430\u043B\u044C\u0448\u0435 \u043F\u043B\u0430\u043D\u043A\u0430 \u0440\u0430\u0441\u0442\u0451\u0442 \u043D\u0430\xA0\u0433\u043E\u0434 \u0435\u0436\u0435\u0433\u043E\u0434\u043D\u043E \u0434\u043E\xA010"
        ] }),
        /* @__PURE__ */ jsx13("li", { children: "\u0417\u0430\u043A\u0440\u044B\u043B\u0438 \u0440\u0430\u043D\u044C\u0448\u0435\xA0\u2014 \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442\u0435 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043D\u044B\u0435 \u0432\u044B\u0447\u0435\u0442\u044B \u0438\xA0\u043F\u043B\u0430\u0442\u0438\u0442\u0435 \u043D\u0430\u043B\u043E\u0433 \u0441\xA0\u043F\u0440\u0438\u0431\u044B\u043B\u0438. \u0418\u0441\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435\xA0\u2014 \u043E\u0441\u043E\u0431\u044B\u0435 \u0436\u0438\u0437\u043D\u0435\u043D\u043D\u044B\u0435 \u0441\u0438\u0442\u0443\u0430\u0446\u0438\u0438 \u0432\u0440\u043E\u0434\u0435 \u0434\u043E\u0440\u043E\u0433\u043E\u0441\u0442\u043E\u044F\u0449\u0435\u0433\u043E \u043B\u0435\u0447\u0435\u043D\u0438\u044F" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs12("section", { className: "rules__block", children: [
      /* @__PURE__ */ jsx13("h3", { children: "\u041D\u0430\u043B\u043E\u0433 \u043D\u0430\xA0\u043F\u0440\u0438\u0431\u044B\u043B\u044C" }),
      /* @__PURE__ */ jsxs12("ul", { children: [
        /* @__PURE__ */ jsx13("li", { children: "\u0422\u0438\u043F \u0411 \u0438\xA0\u0418\u0418\u0421-3 \u043E\u0441\u0432\u043E\u0431\u043E\u0436\u0434\u0430\u044E\u0442 \u043F\u0440\u0438\u0431\u044B\u043B\u044C \u043E\u0442\xA0\u041D\u0414\u0424\u041B" }),
        /* @__PURE__ */ jsxs12("li", { children: [
          "\u0423 \u0418\u0418\u0421-3 \u043E\u0441\u0432\u043E\u0431\u043E\u0436\u0434\u0435\u043D\u0438\u0435 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u043E ",
          compactRub(IIS3_PROFIT_EXEMPT_LIMIT),
          " \u0437\u0430\xA0\u0432\u0435\u0441\u044C \u0441\u0440\u043E\u043A \u0432\u043B\u0430\u0434\u0435\u043D\u0438\u044F\xA0\u2014 \u0441\xA0\u0441\u0443\u043C\u043C\u044B \u0432\u044B\u0448\u0435 \u043D\u0430\u043B\u043E\u0433 \u043F\u0440\u0438\u0434\u0451\u0442\u0441\u044F \u0437\u0430\u043F\u043B\u0430\u0442\u0438\u0442\u044C"
        ] }),
        /* @__PURE__ */ jsx13("li", { children: "\u0423 \u0442\u0438\u043F\u0430 \u0410 \u043F\u0440\u0438\u0431\u044B\u043B\u044C \u043E\u0431\u043B\u0430\u0433\u0430\u0435\u0442\u0441\u044F \u043F\u043E\xA0\u0434\u0432\u0443\u0445\u0441\u0442\u0443\u043F\u0435\u043D\u0447\u0430\u0442\u043E\u0439 \u0448\u043A\u0430\u043B\u0435 13 / 15%" }),
        /* @__PURE__ */ jsx13("li", { children: "\u0414\u0438\u0432\u0438\u0434\u0435\u043D\u0434\u044B \u043E\u0431\u043B\u0430\u0433\u0430\u044E\u0442\u0441\u044F \u0432\u0441\u0435\u0433\u0434\u0430\xA0\u2014 \u043B\u044C\u0433\u043E\u0442\u0430 \u043D\u0430\xA0\u043D\u0438\u0445 \u043D\u0435\xA0\u0440\u0430\u0441\u043F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u044F\u0435\u0442\u0441\u044F" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs12("section", { className: "rules__block", children: [
      /* @__PURE__ */ jsx13("h3", { children: "\u0412\u0437\u043D\u043E\u0441\u044B" }),
      /* @__PURE__ */ jsxs12("ul", { children: [
        /* @__PURE__ */ jsxs12("li", { children: [
          "\u0422\u0438\u043F \u0410 \u0438\xA0\u0442\u0438\u043F \u0411\xA0\u2014 \u043B\u0438\u043C\u0438\u0442 ",
          compactRub(OLD_IIS_CONTRIBUTION_LIMIT),
          " \u0432\xA0\u0433\u043E\u0434"
        ] }),
        /* @__PURE__ */ jsx13("li", { children: "\u0423 \u0418\u0418\u0421-3 \u043B\u0438\u043C\u0438\u0442\u0430 \u0432\u0437\u043D\u043E\u0441\u043E\u0432 \u043D\u0435\u0442" }),
        /* @__PURE__ */ jsx13("li", { children: "\u041C\u043E\u0436\u043D\u043E \u0434\u0435\u0440\u0436\u0430\u0442\u044C \u0434\u043E\xA0\u0442\u0440\u0451\u0445 \u0418\u0418\u0421-3 \u043E\u0434\u043D\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs12("section", { className: "rules__block", children: [
      /* @__PURE__ */ jsxs12("h3", { children: [
        "\u041D\u0414\u0424\u041B ",
        RULES_YEAR
      ] }),
      /* @__PURE__ */ jsx13("p", { className: "rules__text", children: "\u0421\u0442\u0430\u0432\u043A\u0430 \u043F\u0440\u0438\u043C\u0435\u043D\u044F\u0435\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u043A\xA0\u0441\u0443\u043C\u043C\u0435 \u043F\u0440\u0435\u0432\u044B\u0448\u0435\u043D\u0438\u044F \u043F\u043E\u0440\u043E\u0433\u0430, \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u043F\u0440\u0435\u0434\u0435\u043B\u044C\u043D\u0430\u044F \u0441\u0442\u0430\u0432\u043A\u0430 \u0437\u0430\u0432\u0438\u0441\u0438\u0442 \u043E\u0442\xA0\u0432\u0430\u0448\u0435\u0433\u043E \u0434\u043E\u0445\u043E\u0434\u0430." }),
      /* @__PURE__ */ jsx13("ul", { className: "rules__brackets", children: NDFL_BRACKETS.map((bracket, index) => /* @__PURE__ */ jsxs12("li", { children: [
        /* @__PURE__ */ jsxs12("b", { children: [
          Math.round(bracket.rate * 100),
          "%"
        ] }),
        /* @__PURE__ */ jsx13("span", { children: index === 0 ? `\u0434\u043E ${compactRub(bracket.upTo)}` : Number.isFinite(bracket.upTo) ? `\u0447\u0430\u0441\u0442\u044C \u0432\u044B\u0448\u0435 ${compactRub(NDFL_BRACKETS[index - 1].upTo)}` : `\u0432\u044B\u0448\u0435 ${compactRub(NDFL_BRACKETS[index - 1].upTo)}` })
      ] }, String(bracket.upTo))) })
    ] }),
    /* @__PURE__ */ jsxs12("section", { className: "rules__block", children: [
      /* @__PURE__ */ jsx13("h3", { children: "\u0427\u0442\u043E \u043A\u0430\u043B\u044C\u043A\u0443\u043B\u044F\u0442\u043E\u0440 \u043D\u0435\xA0\u0443\u0447\u0438\u0442\u044B\u0432\u0430\u0435\u0442" }),
      /* @__PURE__ */ jsxs12("ul", { children: [
        /* @__PURE__ */ jsx13("li", { children: "\u041A\u043E\u043C\u0438\u0441\u0441\u0438\u0438 \u0431\u0440\u043E\u043A\u0435\u0440\u0430 \u0438\xA0\u0444\u043E\u043D\u0434\u043E\u0432, \u043D\u0430\u043B\u043E\u0433 \u043D\u0430\xA0\u043A\u0443\u043F\u043E\u043D\u044B, \u041D\u0414\u0424\u041B \u0441\xA0\u0434\u0438\u0432\u0438\u0434\u0435\u043D\u0434\u043E\u0432" }),
        /* @__PURE__ */ jsxs12("li", { children: [
          "\u0412\u043E\u0437\u043C\u043E\u0436\u043D\u0443\u044E \u0441\u043C\u0435\u043D\u0443 \u043F\u0440\u0430\u0432\u0438\u043B: \u0440\u0430\u0441\u0447\u0451\u0442 \u043F\u043E\xA0\u043D\u043E\u0440\u043C\u0430\u043C ",
          RULES_YEAR,
          " \u0433\u043E\u0434\u0430"
        ] }),
        /* @__PURE__ */ jsx13("li", { children: "\u041D\u0435\u0440\u0430\u0432\u043D\u043E\u043C\u0435\u0440\u043D\u043E\u0441\u0442\u044C \u0432\u0437\u043D\u043E\u0441\u043E\u0432 \u0432\u043D\u0443\u0442\u0440\u0438 \u0433\u043E\u0434\u0430\xA0\u2014 \u0441\u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F, \u0447\u0442\u043E\xA0\u0432\u0437\u043D\u043E\u0441 \u0434\u0435\u043B\u0430\u0435\u0442\u0441\u044F \u0432\xA0\u043D\u0430\u0447\u0430\u043B\u0435 \u0433\u043E\u0434\u0430" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs12("p", { className: "rules__sources", children: [
      "\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A\u0438:",
      " ",
      /* @__PURE__ */ jsx13("a", { href: "https://investmint.ru/iis3/", target: "_blank", rel: "noopener noreferrer", children: "\u0440\u0430\u0437\u0431\u043E\u0440 \u0418\u0418\u0421-3" }),
      ",",
      " ",
      /* @__PURE__ */ jsx13(
        "a",
        {
          href: "https://www.nalog.gov.ru/rn26/news/activities_fts/16653428/",
          target: "_blank",
          rel: "noopener noreferrer",
          children: "\u0424\u041D\u0421 \u043E\xA0\u0448\u043A\u0430\u043B\u0435 \u041D\u0414\u0424\u041B"
        }
      ),
      ". \u042D\u0442\u043E \u043D\u0435\xA0\u0438\u043D\u0432\u0435\u0441\u0442\u0438\u0446\u0438\u043E\u043D\u043D\u0430\u044F \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u044F."
    ] })
  ] });
}

// src/lib/url.ts
var DEFAULTS = {
  scenario: {
    annualContribution: 4e5,
    contributionMode: "uniform",
    contributions: [4e5],
    years: 10,
    returnPct: 10,
    inflationPct: 6,
    officialIncome: 12e5,
    reinvestRefunds: true,
    openDate: todayIso(),
    periodsPerYear: 1,
    manualRate: null
  },
  account: "iis3"
};
var PARAM_KEYS = {
  annualContribution: "c",
  contributionMode: "cm",
  contributions: "ct",
  years: "y",
  returnPct: "r",
  inflationPct: "i",
  officialIncome: "d",
  reinvestRefunds: "rr",
  openDate: "od",
  periodsPerYear: "m",
  manualRate: "n"
};
function readNumber(params, key, fallback) {
  const raw = params.get(key);
  if (raw === null) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}
function readState(search) {
  const params = new URLSearchParams(search);
  const account = params.get("a");
  const scenario = {
    annualContribution: Math.max(
      0,
      readNumber(params, PARAM_KEYS.annualContribution, DEFAULTS.scenario.annualContribution)
    ),
    contributionMode: params.get(PARAM_KEYS.contributionMode) === "custom" ? "custom" : "uniform",
    contributions: (() => {
      const raw = params.get(PARAM_KEYS.contributions);
      if (!raw) return [DEFAULTS.scenario.annualContribution];
      const list = raw.split(",").map((part) => Number(part)).filter((value) => Number.isFinite(value) && value >= 0);
      return list.length > 0 ? list : [DEFAULTS.scenario.annualContribution];
    })(),
    years: Math.min(
      50,
      Math.max(1, Math.round(readNumber(params, PARAM_KEYS.years, DEFAULTS.scenario.years)))
    ),
    returnPct: Math.max(0, readNumber(params, PARAM_KEYS.returnPct, DEFAULTS.scenario.returnPct)),
    inflationPct: Math.max(
      0,
      readNumber(params, PARAM_KEYS.inflationPct, DEFAULTS.scenario.inflationPct)
    ),
    officialIncome: Math.max(
      0,
      readNumber(params, PARAM_KEYS.officialIncome, DEFAULTS.scenario.officialIncome)
    ),
    reinvestRefunds: params.get(PARAM_KEYS.reinvestRefunds) !== "0",
    openDate: clampIso(params.get(PARAM_KEYS.openDate) ?? DEFAULTS.scenario.openDate),
    periodsPerYear: [1, 4, 12].includes(
      Math.round(readNumber(params, PARAM_KEYS.periodsPerYear, DEFAULTS.scenario.periodsPerYear ?? 1))
    ) ? Math.round(readNumber(params, PARAM_KEYS.periodsPerYear, DEFAULTS.scenario.periodsPerYear ?? 1)) : 1,
    manualRate: (() => {
      const raw = params.get(PARAM_KEYS.manualRate);
      if (raw === null) return null;
      const value = Number(raw);
      return [0.13, 0.15, 0.18, 0.2, 0.22].includes(value) ? value : null;
    })()
  };
  return {
    scenario,
    account: account === "iis1" || account === "iis2" || account === "iis3" ? account : "iis3"
  };
}
function writeState(state) {
  const params = new URLSearchParams();
  const { scenario } = state;
  params.set(PARAM_KEYS.annualContribution, String(Math.round(scenario.annualContribution)));
  params.set(PARAM_KEYS.contributionMode, scenario.contributionMode ?? "uniform");
  if (scenario.contributionMode === "custom") {
    params.set(
      PARAM_KEYS.contributions,
      scenario.contributions.slice(0, scenario.years).map((value) => Math.round(value)).join(",")
    );
  }
  params.set(PARAM_KEYS.years, String(scenario.years));
  params.set(PARAM_KEYS.returnPct, String(scenario.returnPct));
  params.set(PARAM_KEYS.inflationPct, String(scenario.inflationPct));
  params.set(PARAM_KEYS.officialIncome, String(Math.round(scenario.officialIncome)));
  params.set(PARAM_KEYS.reinvestRefunds, scenario.reinvestRefunds ? "1" : "0");
  params.set(PARAM_KEYS.openDate, scenario.openDate);
  params.set(PARAM_KEYS.periodsPerYear, String(scenario.periodsPerYear ?? 1));
  if (scenario.manualRate) params.set(PARAM_KEYS.manualRate, String(scenario.manualRate));
  params.set("a", state.account);
  return `#${params.toString()}`;
}

// src/App.tsx
import { jsx as jsx14, jsxs as jsxs13 } from "react/jsx-runtime";
var STATE_KEY = "triis:state";
function useMediaQuery(query) {
  const [matches, setMatches] = useState8(() => window.matchMedia(query).matches);
  useEffect7(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    setMatches(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}
function App() {
  const isPrivacy = window.location.pathname.replace(/\/$/, "").endsWith("/privacy");
  const [state, setState] = useState8(() => {
    const fromLink = window.location.hash.slice(1) || window.location.search;
    const saved = typeof sessionStorage === "undefined" ? "" : sessionStorage.getItem(STATE_KEY) ?? "";
    return readState(fromLink || saved);
  });
  const [tab, setTab] = useState8("params");
  const [toast, setToast] = useState8(null);
  const [sheetOpen, setSheetOpen] = useState8(false);
  const [barVisible, setBarVisible] = useState8(false);
  const toastTimer = useRef5(null);
  const isNarrow = useMediaQuery("(max-width: 1024px)");
  const mobileSummaryRef = useRef5(null);
  const desktopSummaryRef = useRef5(null);
  const tabsRef = useRef5(null);
  const tabThumb = useSlidingThumb(tabsRef, ".segmented__item.is-active", [tab]);
  const results = useMemo4(() => compare(state.scenario), [state.scenario]);
  const best = useMemo4(() => bestAccount(results), [results]);
  const active = results[state.account];
  const warnings = collectWarnings(active, state.scenario);
  useEffect7(() => {
    try {
      sessionStorage.setItem(STATE_KEY, writeState(state).slice(1));
    } catch {
    }
    if (window.location.hash || window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [state]);
  useEffect7(() => {
    const query = window.matchMedia("(max-width: 900px)");
    let observer = null;
    const watch = () => {
      observer?.disconnect();
      const el = query.matches ? mobileSummaryRef.current : desktopSummaryRef.current;
      if (!el) return;
      observer = new IntersectionObserver(
        ([entry]) => setBarVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
        { rootMargin: "0px 0px -4px 0px" }
      );
      observer.observe(el);
    };
    watch();
    query.addEventListener("change", watch);
    return () => {
      query.removeEventListener("change", watch);
      observer?.disconnect();
    };
  }, []);
  useEffect7(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);
  const flash = useCallback4((text2) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ text: text2, visible: false });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setToast((cur) => cur ? { ...cur, visible: true } : cur));
    });
    toastTimer.current = window.setTimeout(() => {
      setToast((cur) => cur ? { ...cur, visible: false } : cur);
      toastTimer.current = window.setTimeout(() => setToast(null), 260);
    }, 1800);
  }, []);
  const patchScenario = useCallback4((patch) => {
    setState((prev) => ({ ...prev, scenario: { ...prev.scenario, ...patch } }));
  }, []);
  const pickAccount = useCallback4((account) => {
    setState((prev) => ({ ...prev, account }));
  }, []);
  const shareUrl = () => window.location.origin + window.location.pathname + writeState(state);
  const updatedLabel = useMemo4(() => {
    const stamp = /* @__PURE__ */ new Date("2026-11-27T23:45:37.518Z");
    const date = new Intl.DateTimeFormat("ru-RU", {
      timeZone: "Europe/Moscow",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(stamp);
    const time = new Intl.DateTimeFormat("ru-RU", {
      timeZone: "Europe/Moscow",
      hour: "2-digit",
      minute: "2-digit"
    }).format(stamp);
    return `\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E ${date.replace(/\s*г\.$/, "")}, ${time}\xA0\u041C\u0421\u041A`;
  }, []);
  const printParams = [
    `${state.account === "iis3" ? "\u0418\u0418\u0421-3" : state.account === "iis1" ? "\u0422\u0438\u043F \u0410" : "\u0422\u0438\u043F \u0411"}, \u043E\u0442\u043A\u0440\u044B\u0442 ${formatHuman(state.scenario.openDate)}`,
    state.scenario.contributionMode === "custom" ? `\u0432\u0437\u043D\u043E\u0441\u044B \u043F\u043E\xA0\u0433\u043E\u0434\u0430\u043C, \u0432\u0441\u0435\u0433\u043E ${rub(state.scenario.contributions.slice(0, state.scenario.years).reduce((sum, v) => sum + v, 0))}` : `${rub(state.scenario.annualContribution)} \u0432\xA0\u0433\u043E\u0434`,
    `${state.scenario.years} ${yearsWord(state.scenario.years)}`,
    `\u0434\u043E\u0445\u043E\u0434\u043D\u043E\u0441\u0442\u044C ${state.scenario.returnPct}%`,
    `\u0440\u0435\u0438\u043D\u0432\u0435\u0441\u0442 ${(state.scenario.periodsPerYear ?? 1) === 12 ? "\u0440\u0430\u0437 \u0432\xA0\u043C\u0435\u0441\u044F\u0446" : (state.scenario.periodsPerYear ?? 1) === 4 ? "\u0440\u0430\u0437 \u0432\xA0\u043A\u0432\u0430\u0440\u0442\u0430\u043B" : "\u0440\u0430\u0437 \u0432\xA0\u0433\u043E\u0434"}`,
    `\u0438\u043D\u0444\u043B\u044F\u0446\u0438\u044F ${state.scenario.inflationPct}%`,
    state.scenario.manualRate ? `\u041D\u0414\u0424\u041B ${Math.round(state.scenario.manualRate * 100)}%` : "\u041D\u0414\u0424\u041B \u043F\u043E\xA0\u0434\u043E\u0445\u043E\u0434\u0443"
  ].join(" \xB7 ");
  const handlePdf = () => {
    downloadPdf({
      scenario: state.scenario,
      account: state.account,
      result: active,
      results,
      best,
      updatedLabel
    });
    flash("PDF \u0441\u043E\u0431\u0438\u0440\u0430\u0435\u0442\u0441\u044F\u2026");
  };
  const downloadCsv = () => {
    const header = "\u0413\u043E\u0434;\u0412\u0437\u043D\u043E\u0441;\u0412\u044B\u0447\u0435\u0442;\u0414\u043E\u0445\u043E\u0434 \u0437\u0430\xA0\u0433\u043E\u0434;\u041A\u0430\u043F\u0438\u0442\u0430\u043B";
    const body = active.rows.map(
      (row) => [row.year, row.contribution, row.refund, row.growth, Math.round(row.capital)].join(";")
    ).join("\n");
    const blob = new Blob([`\uFEFF${header}
${body}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `iis-${state.account}-${active.rows.length}-let.csv`;
    link.click();
    URL.revokeObjectURL(url);
    flash("\u0422\u0430\u0431\u043B\u0438\u0446\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0430");
  };
  const reset = () => {
    setState(readState(""));
    setTab("params");
    flash("\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u044B");
  };
  if (isPrivacy) {
    return /* @__PURE__ */ jsxs13("div", { className: "app", children: [
      /* @__PURE__ */ jsx14(Topbar, {}),
      /* @__PURE__ */ jsx14(Privacy, {})
    ] });
  }
  return /* @__PURE__ */ jsxs13("div", { className: "app", children: [
    /* @__PURE__ */ jsx14(Topbar, { children: /* @__PURE__ */ jsxs13("nav", { className: "topbar__nav", "aria-label": "\u0420\u0430\u0437\u0434\u0435\u043B\u044B", children: [
      /* @__PURE__ */ jsx14("span", { className: "topbar__link is-current", children: "\u0418\u0418\u0421-3" }),
      /* @__PURE__ */ jsx14("a", { className: "topbar__link", href: "/pds", children: "\u041F\u0414\u0421" })
    ] }) }),
    /* @__PURE__ */ jsxs13("div", { className: "page-head", children: [
      /* @__PURE__ */ jsx14("h1", { className: "page-title", children: "\u041A\u0430\u043B\u044C\u043A\u0443\u043B\u044F\u0442\u043E\u0440 \u0418\u0418\u0421-3: \u0432\u044B\u0447\u0435\u0442\u044B, \u043D\u0430\u043B\u043E\u0433\u0438, \u0434\u043E\u0445\u043E\u0434\u043D\u043E\u0441\u0442\u044C" }),
      /* @__PURE__ */ jsx14("p", { className: "page-lede", children: "\u0422\u0440\u0438 \u0442\u0438\u043F\u0430 \u0441\u0447\u0451\u0442\u0430 \u043D\u0430\xA0\u043E\u0434\u043D\u043E\u043C \u043D\u0430\u0431\u043E\u0440\u0435 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u043E\u0432: \u0432\u044B\u0447\u0435\u0442\u044B \u043F\u043E\xA0\u0433\u043E\u0434\u0430\u043C, \u043D\u0430\u043B\u043E\u0433 \u043F\u0440\u0438\xA0\u0437\u0430\u043A\u0440\u044B\u0442\u0438\u0438 \u0438\xA0\u0434\u043E\u0445\u043E\u0434\u043D\u043E\u0441\u0442\u044C \u0441\xA0\u043F\u043E\u043F\u0440\u0430\u0432\u043A\u043E\u0439 \u043D\u0430\xA0\u0438\u043D\u0444\u043B\u044F\u0446\u0438\u044E. \u041F\u0440\u0430\u0432\u0438\u043B\u0430 2026\u202F\u0433\u043E\u0434\u0430" })
    ] }),
    /* @__PURE__ */ jsxs13("div", { className: "print-head", children: [
      /* @__PURE__ */ jsxs13("div", { children: [
        /* @__PURE__ */ jsx14("strong", { children: "\u0422\u0420\u0418\u0418\u0421\xA0\u2014 \u043A\u0430\u043B\u044C\u043A\u0443\u043B\u044F\u0442\u043E\u0440 \u0418\u0418\u0421" }),
        /* @__PURE__ */ jsxs13("span", { children: [
          "\u0420\u0430\u0441\u0447\u0451\u0442 \u043E\u0442 ",
          (/* @__PURE__ */ new Date()).toLocaleDateString("ru-RU")
        ] })
      ] }),
      /* @__PURE__ */ jsx14("div", { className: "print-head__params", children: printParams })
    ] }),
    /* @__PURE__ */ jsxs13("main", { className: "layout", children: [
      isNarrow ? /* @__PURE__ */ jsx14("div", { className: "layout__summary-mobile", ref: mobileSummaryRef, children: /* @__PURE__ */ jsx14(Summary, { result: active, scenario: state.scenario }) }) : null,
      /* @__PURE__ */ jsxs13("div", { className: "layout__main", children: [
        /* @__PURE__ */ jsx14("div", { className: "tabs", ref: tabsRef, children: /* @__PURE__ */ jsx14("div", { className: "tabs__inner", children: /* @__PURE__ */ jsxs13("div", { className: "segmented", role: "tablist", "aria-label": "\u0420\u0430\u0437\u0434\u0435\u043B\u044B", children: [
          tabThumb && /* @__PURE__ */ jsx14(
            "span",
            {
              className: "segmented__thumb",
              "aria-hidden": "true",
              style: {
                transform: `translate(${tabThumb.left}px, ${tabThumb.top}px)`,
                width: tabThumb.width,
                height: tabThumb.height
              }
            }
          ),
          [
            ["params", "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B"],
            ["compare", "\u0421\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435"],
            ["rules", "\u041F\u0440\u0430\u0432\u0438\u043B\u0430"]
          ].map(([value, label]) => /* @__PURE__ */ jsx14(
            "button",
            {
              type: "button",
              role: "tab",
              "aria-selected": tab === value,
              className: "segmented__item" + (tab === value ? " is-active" : ""),
              onClick: () => setTab(value),
              children: label
            },
            value
          ))
        ] }) }) }),
        /* @__PURE__ */ jsx14(AnimatedHeight, { children: /* @__PURE__ */ jsxs13("div", { className: "appear", children: [
          tab === "params" ? /* @__PURE__ */ jsx14(
            Inputs,
            {
              scenario: state.scenario,
              onChange: patchScenario,
              account: state.account,
              onAccountChange: pickAccount,
              onReset: reset
            }
          ) : null,
          tab === "compare" ? /* @__PURE__ */ jsx14(
            Compare,
            {
              results,
              best,
              onPick: (type) => {
                pickAccount(type);
                setTab("params");
              }
            }
          ) : null,
          tab === "rules" ? /* @__PURE__ */ jsx14(Rules, { openYear: yearOf(state.scenario.openDate) }) : null
        ] }, tab) })
      ] }),
      /* @__PURE__ */ jsxs13("aside", { className: "layout__aside", children: [
        isNarrow ? null : /* @__PURE__ */ jsx14("div", { className: "layout__summary-desktop", ref: desktopSummaryRef, children: /* @__PURE__ */ jsx14(Summary, { result: active, scenario: state.scenario }) }),
        /* @__PURE__ */ jsxs13("div", { className: "actions", children: [
          /* @__PURE__ */ jsx14(
            CopyButton,
            {
              text: shareUrl(),
              label: "\u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F \u0440\u0430\u0441\u0447\u0451\u0442\u043E\u043C",
              copiedLabel: "\u0421\u0441\u044B\u043B\u043A\u0430 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0430",
              onResult: (ok) => {
                if (!ok) flash("\u0411\u0440\u0430\u0443\u0437\u0435\u0440 \u043D\u0435\xA0\u0434\u0430\u043B \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C\xA0\u2014 \u0432\u044B\u0434\u0435\u043B\u0438\u0442\u0435 \u0430\u0434\u0440\u0435\u0441 \u0432\u0440\u0443\u0447\u043D\u0443\u044E");
              }
            }
          ),
          /* @__PURE__ */ jsx14(
            "button",
            {
              type: "button",
              className: "btn btn--ghost",
              onClick: handlePdf,
              title: "\u0413\u043E\u0442\u043E\u0432\u044B\u0439 PDF \u0441\xA0\u0440\u0430\u0441\u0447\u0451\u0442\u043E\u043C \u0438\xA0\u0442\u0430\u0431\u043B\u0438\u0446\u0435\u0439 \u043F\u043E\xA0\u0433\u043E\u0434\u0430\u043C",
              children: "\u0421\u043A\u0430\u0447\u0430\u0442\u044C PDF"
            }
          )
        ] }),
        /* @__PURE__ */ jsx14(Chart, { rows: active.rows }),
        /* @__PURE__ */ jsxs13(
          Section,
          {
            title: "\u0422\u0430\u0431\u043B\u0438\u0446\u0430 \u043F\u043E\xA0\u0433\u043E\u0434\u0430\u043C",
            hint: "\u0420\u0430\u0437\u0431\u043E\u0440 \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u0433\u043E\u0434\u0430: \u0432\u0437\u043D\u043E\u0441, \u0432\u044B\u0447\u0435\u0442, \u0434\u043E\u0445\u043E\u0434, \u043A\u0430\u043F\u0438\u0442\u0430\u043B",
            children: [
              /* @__PURE__ */ jsx14(YearTable, { result: active, openYear: yearOf(state.scenario.openDate) }),
              /* @__PURE__ */ jsx14("div", { className: "table__actions", children: /* @__PURE__ */ jsx14(
                "button",
                {
                  type: "button",
                  className: "btn btn--ghost",
                  onClick: downloadCsv,
                  title: "\u042D\u0442\u0430 \u0442\u0430\u0431\u043B\u0438\u0446\u0430 \u0432 CSV",
                  children: "\u0421\u043A\u0430\u0447\u0430\u0442\u044C CSV"
                }
              ) })
            ]
          }
        ),
        /* @__PURE__ */ jsxs13("div", { className: "table__note", children: [
          /* @__PURE__ */ jsx14("span", { children: "\u041F\u0440\u0430\u0432\u0438\u043B\u0430 2026\xA0\u0433\u043E\u0434\u0430" }),
          /* @__PURE__ */ jsx14("span", { children: "\u041D\u0435\xA0\u0438\u043D\u0432\u0435\u0441\u0442\u0438\u0446\u0438\u043E\u043D\u043D\u0430\u044F \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u044F" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx14(About, {}),
    /* @__PURE__ */ jsx14("aside", { className: "cross-link", "aria-label": "\u0414\u0440\u0443\u0433\u043E\u0439 \u043A\u0430\u043B\u044C\u043A\u0443\u043B\u044F\u0442\u043E\u0440", children: /* @__PURE__ */ jsxs13("a", { className: "cross-link__a", href: "/pds", children: [
      /* @__PURE__ */ jsxs13("span", { className: "cross-link__body", children: [
        /* @__PURE__ */ jsx14("span", { className: "cross-link__title", children: "\u041F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430 \u0434\u043E\u043B\u0433\u043E\u0441\u0440\u043E\u0447\u043D\u044B\u0445 \u0441\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u0438\u0439" }),
        /* @__PURE__ */ jsx14("span", { className: "cross-link__text", children: "\u0421\u043E\u0444\u0438\u043D\u0430\u043D\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0434\u043E\xA036 000\u202F\u20BD \u0432\xA0\u0433\u043E\u0434, \u0432\u044B\u0447\u0435\u0442 \u0438\xA0\u0432\u044B\u043F\u043B\u0430\u0442\u044B\xA0\u2014 \u043A\u0430\u043B\u044C\u043A\u0443\u043B\u044F\u0442\u043E\u0440 \u041F\u0414\u0421" })
      ] }),
      /* @__PURE__ */ jsx14("span", { className: "cross-link__arrow", "aria-hidden": "true", children: "\u2192" })
    ] }) }),
    /* @__PURE__ */ jsxs13("footer", { className: "footer", children: [
      /* @__PURE__ */ jsxs13("div", { className: "footer__top", children: [
        /* @__PURE__ */ jsx14(LikeButton, { hint: "\u0415\u0441\u043B\u0438 \u0431\u044B\u043B\u043E \u043F\u043E\u043B\u0435\u0437\u043D\u043E, \u043F\u043E\u0441\u0442\u0430\u0432\u044C \u043B\u0430\u0439\u043A" }),
        /* @__PURE__ */ jsx14("a", { className: "footer__link", href: "/pds", children: "\u041A\u0430\u043B\u044C\u043A\u0443\u043B\u044F\u0442\u043E\u0440 \u041F\u0414\u0421" }),
        /* @__PURE__ */ jsx14("a", { className: "footer__link", href: "/privacy", children: "\u041F\u043E\u043B\u0438\u0442\u0438\u043A\u0430 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438" })
      ] }),
      /* @__PURE__ */ jsxs13("div", { className: "footer__bottom", children: [
        /* @__PURE__ */ jsx14("span", { className: "footer__updated", children: updatedLabel }),
        /* @__PURE__ */ jsxs13("span", { className: "footer__built", children: [
          "Built by",
          " ",
          /* @__PURE__ */ jsx14(
            "a",
            {
              className: "footer__author",
              href: "https://maletskiy-design.ru",
              target: "_blank",
              rel: "noopener noreferrer",
              children: "Maletskiy Design"
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx14("div", { className: "bar-dock", children: /* @__PURE__ */ jsxs13("div", { className: "bar" + (barVisible ? " is-visible" : ""), "aria-hidden": !barVisible, children: [
      /* @__PURE__ */ jsxs13("div", { className: "bar__value", children: [
        /* @__PURE__ */ jsx14("span", { className: "bar__label", children: "\u043D\u0430\xA0\u0440\u0443\u043A\u0438" }),
        /* @__PURE__ */ jsx14("span", { className: "bar__number", children: /* @__PURE__ */ jsx14(RollingNumber, { value: active.net, format: (n) => compactRub(n) }) })
      ] }),
      /* @__PURE__ */ jsxs13("div", { className: "bar__actions", children: [
        /* @__PURE__ */ jsx14(
          "button",
          {
            type: "button",
            className: "btn btn--ghost bar__pdf",
            onClick: handlePdf,
            title: "\u0413\u043E\u0442\u043E\u0432\u044B\u0439 PDF \u0441\xA0\u0440\u0430\u0441\u0447\u0451\u0442\u043E\u043C \u0438\xA0\u0442\u0430\u0431\u043B\u0438\u0446\u0435\u0439 \u043F\u043E\xA0\u0433\u043E\u0434\u0430\u043C",
            children: "\u0421\u043A\u0430\u0447\u0430\u0442\u044C PDF"
          }
        ),
        /* @__PURE__ */ jsxs13(
          "button",
          {
            type: "button",
            className: "btn btn--ghost bar__info",
            onClick: () => setSheetOpen(true),
            "aria-label": "\u0414\u0435\u0442\u0430\u043B\u0438 \u0440\u0430\u0441\u0447\u0451\u0442\u0430",
            title: "\u0414\u0435\u0442\u0430\u043B\u0438 \u0440\u0430\u0441\u0447\u0451\u0442\u0430",
            tabIndex: barVisible ? 0 : -1,
            children: [
              /* @__PURE__ */ jsx14("span", { className: "bar__info-icon", "aria-hidden": "true", children: "i" }),
              /* @__PURE__ */ jsx14("span", { className: "bar__info-text", children: "\u0414\u0435\u0442\u0430\u043B\u0438" })
            ]
          }
        ),
        /* @__PURE__ */ jsx14(
          CopyButton,
          {
            text: shareUrl(),
            label: "\u0421\u0441\u044B\u043B\u043A\u0430",
            copiedLabel: "\u0413\u043E\u0442\u043E\u0432\u043E",
            onResult: (ok) => {
              if (!ok) flash("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0443");
            }
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx14(Sheet, { open: sheetOpen, title: "\u041A\u043E\u0440\u043E\u0442\u043A\u043E \u043E\xA0\u0440\u0430\u0441\u0447\u0451\u0442\u0435", onClose: () => setSheetOpen(false), children: /* @__PURE__ */ jsxs13("div", { className: "sheet-summary", children: [
      /* @__PURE__ */ jsxs13("div", { className: "sheet-summary__hero", children: [
        /* @__PURE__ */ jsx14("span", { className: "sheet-summary__label", children: "\u041D\u0430 \u0440\u0443\u043A\u0438" }),
        /* @__PURE__ */ jsx14("span", { className: "sheet-summary__value", children: /* @__PURE__ */ jsx14(RollingNumber, { value: active.net, format: (n) => rub(n) }) })
      ] }),
      /* @__PURE__ */ jsxs13("ul", { className: "sheet-summary__list", children: [
        /* @__PURE__ */ jsxs13("li", { children: [
          /* @__PURE__ */ jsx14("span", { children: "\u0412\u044B\u0447\u0435\u0442\u044B \u0437\u0430\xA0\u0441\u0440\u043E\u043A" }),
          /* @__PURE__ */ jsx14("b", { children: /* @__PURE__ */ jsx14(RollingNumber, { value: active.refunds, format: (n) => rub(n) }) })
        ] }),
        /* @__PURE__ */ jsxs13("li", { children: [
          /* @__PURE__ */ jsx14("span", { children: "\u041A\u0430\u043F\u0438\u0442\u0430\u043B \u043D\u0430\xA0\u0441\u0447\u0451\u0442\u0435" }),
          /* @__PURE__ */ jsx14("b", { children: /* @__PURE__ */ jsx14(RollingNumber, { value: active.grossCapital, format: (n) => rub(n) }) })
        ] }),
        /* @__PURE__ */ jsxs13("li", { children: [
          /* @__PURE__ */ jsx14("span", { children: "\u041D\u0430\u043B\u043E\u0433 \u043F\u0440\u0438\xA0\u0437\u0430\u043A\u0440\u044B\u0442\u0438\u0438" }),
          /* @__PURE__ */ jsx14("b", { children: /* @__PURE__ */ jsx14(RollingNumber, { value: active.exitTax, format: (n) => rub(n) }) })
        ] }),
        /* @__PURE__ */ jsxs13("li", { children: [
          /* @__PURE__ */ jsx14("span", { children: "\u0412 \u0446\u0435\u043D\u0430\u0445 \u0441\u0435\u0433\u043E\u0434\u043D\u044F" }),
          /* @__PURE__ */ jsx14("b", { children: /* @__PURE__ */ jsx14(RollingNumber, { value: active.netReal, format: (n) => rub(n) }) })
        ] })
      ] }),
      warnings.length > 0 && /* @__PURE__ */ jsx14("div", { className: "sheet-summary__warnings", children: warnings.map((warning) => /* @__PURE__ */ jsx14("p", { className: "callout callout--" + warning.tone, children: /* @__PURE__ */ jsx14("span", { className: "callout__text", children: warning.text }) }, warning.text)) }),
      /* @__PURE__ */ jsx14("button", { type: "button", className: "btn btn--primary btn--wide", onClick: () => setSheetOpen(false), children: "\u041F\u043E\u043D\u044F\u0442\u043D\u043E" })
    ] }) }),
    toast && /* @__PURE__ */ jsx14("div", { className: "toast" + (toast.visible ? " is-visible" : ""), role: "status", children: toast.text })
  ] });
}

// src/pages/Pds.tsx
import { useMemo as useMemo5, useRef as useRef6, useState as useState9 } from "react";

// src/lib/pds.ts
var PDS_RULES = {
  /** Потолок господдержки, ₽ в год */
  cofinancingMax: 36e3,
  /** Минимальные взносы за год, чтобы получить софинансирование, ₽ */
  cofinancingMinContribution: 2e3,
  /** Сколько лет длится софинансирование */
  cofinancingYears: 10,
  /** Лимит освобождения дохода от НДФЛ, ₽ на договор */
  profitExemptLimit: 3e7,
  /** Через сколько лет договора наступают выплаты */
  payoutYears: 15,
  /** Возраст выплат для женщин и мужчин */
  payoutAgeWomen: 55,
  payoutAgeMen: 60,
  /** Государственная гарантия АСВ на счёт, ₽ */
  guaranteeLimit: 28e5,
  /** Больше трёх договоров — вычет не положен */
  maxContracts: 3,
  /** Ожидаемый период пожизненной выплаты, месяцев — ориентир для оценки */
  lifetimeMonths: 264
};
var PAYOUT_LABELS = {
  term1: "1\u202F\u0433\u043E\u0434",
  term5: "5\u202F\u043B\u0435\u0442",
  term10: "10\u202F\u043B\u0435\u0442",
  lifetime: "\u041F\u043E\u0436\u0438\u0437\u043D\u0435\u043D\u043D\u043E",
  lump: "\u0415\u0434\u0438\u043D\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E"
};
function nonNegative2(value) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}
function cofinancingRate(monthlyIncome) {
  if (monthlyIncome <= 8e4) return 1;
  if (monthlyIncome <= 15e4) return 0.5;
  return 0.25;
}
function cofinancingFor(contribution, monthlyIncome, yearIndex) {
  if (yearIndex > PDS_RULES.cofinancingYears) return 0;
  if (contribution < PDS_RULES.cofinancingMinContribution) return 0;
  const raw = contribution * cofinancingRate(monthlyIncome);
  return Math.min(PDS_RULES.cofinancingMax, raw);
}
function simulatePds(scenario) {
  const monthlyIncome = nonNegative2(scenario.monthlyIncome);
  const annualIncome = monthlyIncome * 12;
  const rate = nonNegative2(scenario.returnPct) / 100;
  const contributionYears = Math.max(0, Math.floor(scenario.contributionYears));
  const holdingYears = Math.max(contributionYears, Math.floor(scenario.holdingYears));
  const contribution = nonNegative2(scenario.annualContribution);
  const iis3 = nonNegative2(scenario.iis3Contribution);
  const incomeTax = ndfl(annualIncome);
  const baseRate = marginalRate(annualIncome);
  const deductionRoom = Math.max(0, DEDUCTION_BASE_LIMIT - iis3);
  const rows = [];
  const opsIncluded = scenario.useOps ? nonNegative2(scenario.opsAmount) : 0;
  let capital = opsIncluded;
  let contributionsTotal = 0;
  let cofinancingTotal = 0;
  let refundsTotal = 0;
  let reinvestedTotal = 0;
  let pendingRefund = 0;
  for (let year = 1; year <= holdingYears; year += 1) {
    const yearlyContribution = year <= contributionYears ? contribution : 0;
    const yearlyCofinancing = year <= contributionYears ? cofinancingFor(yearlyContribution, monthlyIncome, year) : 0;
    if (scenario.reinvestRefunds && pendingRefund > 0) {
      capital += pendingRefund;
      reinvestedTotal += pendingRefund;
    }
    pendingRefund = 0;
    const startCapital = capital;
    capital += yearlyContribution + yearlyCofinancing;
    capital *= 1 + rate;
    const growth = capital - startCapital - yearlyContribution - yearlyCofinancing;
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
      capital
    });
  }
  const capitalFinal = capital;
  const profit = Math.max(0, capitalFinal - contributionsTotal - opsIncluded);
  const taxExempt = scenario.ownContract && scenario.fewContracts && holdingYears >= 10;
  const taxableProfit = taxExempt ? Math.max(0, profit - PDS_RULES.profitExemptLimit) : profit;
  const exitTax = taxOnGains(taxableProfit);
  const cashRefunds = refundsTotal - reinvestedTotal;
  const net = capitalFinal - exitTax + cashRefunds;
  const inflation = nonNegative2(scenario.inflationPct) / 100;
  const netReal = net / Math.pow(1 + inflation, holdingYears);
  const payoutAge = scenario.gender === "f" ? PDS_RULES.payoutAgeWomen : PDS_RULES.payoutAgeMen;
  const yearsByAge = Math.max(0, payoutAge - Math.floor(nonNegative2(scenario.age)));
  const earliestYears = Math.min(PDS_RULES.payoutYears, yearsByAge);
  const payoutType = scenario.payoutType;
  const payoutMonths = payoutType === "term1" ? 12 : payoutType === "term5" ? 60 : payoutType === "term10" ? 120 : payoutType === "lifetime" ? PDS_RULES.lifetimeMonths : 0;
  const payoutBase = Math.max(0, capitalFinal - exitTax + cashRefunds);
  const payoutMonthly = payoutType === "lump" ? payoutBase : payoutMonths > 0 ? payoutBase / payoutMonths : 0;
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
    opsIncluded
  };
}
var PDS_DEFAULTS = {
  gender: "m",
  age: 35,
  monthlyIncome: 1e5,
  annualContribution: 12e4,
  contributionYears: 10,
  holdingYears: 15,
  returnPct: 8,
  inflationPct: 6,
  reinvestRefunds: false,
  iis3Contribution: 0,
  ownContract: true,
  fewContracts: true,
  useOps: false,
  opsAmount: 3e5,
  payoutType: "term10"
};

// src/pages/Pds.tsx
import { jsx as jsx15, jsxs as jsxs14 } from "react/jsx-runtime";
var PDS_FAQ = [
  {
    question: "\u0421\u043A\u043E\u043B\u044C\u043A\u043E \u0434\u043E\u0431\u0430\u0432\u0438\u0442 \u0433\u043E\u0441\u0443\u0434\u0430\u0440\u0441\u0442\u0432\u043E?",
    answer: "\u0414\u043E 36 000\u202F\u20BD \u0432\xA0\u0433\u043E\u0434 \u0432\xA0\u0442\u0435\u0447\u0435\u043D\u0438\u0435 \u0434\u0435\u0441\u044F\u0442\u0438 \u043B\u0435\u0442, \u0435\u0441\u043B\u0438 \u0432\u043D\u043E\u0441\u0438\u0442\u044C \u043D\u0435\xA0\u043C\u0435\u043D\u044C\u0448\u0435 2 000\u202F\u20BD \u0432\xA0\u0433\u043E\u0434. \u0422\u043E\u0447\u043D\u0430\u044F \u0441\u0443\u043C\u043C\u0430 \u0437\u0430\u0432\u0438\u0441\u0438\u0442 \u043E\u0442\xA0\u0441\u0440\u0435\u0434\u043D\u0435\u043C\u0435\u0441\u044F\u0447\u043D\u043E\u0433\u043E \u0434\u043E\u0445\u043E\u0434\u0430: \u0434\u043E\xA080 000\u202F\u20BD \u0433\u043E\u0441\u0443\u0434\u0430\u0440\u0441\u0442\u0432\u043E \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u0435\u0442 \u0440\u0443\u0431\u043B\u044C \u043D\u0430\xA0\u043A\u0430\u0436\u0434\u044B\u0439 \u0440\u0443\u0431\u043B\u044C \u0432\u0437\u043D\u043E\u0441\u043E\u0432, \u043E\u0442\xA080 000 \u0434\u043E\xA0150 000\u202F\u20BD \u2014 \u043F\u043E\u043B\u043E\u0432\u0438\u043D\u0443, \u0432\u044B\u0448\u0435 150 000\u202F\u20BD \u2014 \u0447\u0435\u0442\u0432\u0435\u0440\u0442\u044C"
  },
  {
    question: "\u041A\u0430\u043A\u043E\u0439 \u0432\u044B\u0447\u0435\u0442 \u043C\u043E\u0436\u043D\u043E \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C?",
    answer: "\u0412\u044B\u0447\u0435\u0442 \u0441\u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u0441\xA0\u043B\u0438\u0447\u043D\u044B\u0445 \u0432\u0437\u043D\u043E\u0441\u043E\u0432 \u0432\xA0\u043F\u0440\u0435\u0434\u0435\u043B\u0430\u0445 400 000\u202F\u20BD \u0432\xA0\u0433\u043E\u0434 \u0438\xA0\u043D\u0435\xA0\u0431\u043E\u043B\u044C\u0448\u0435 \u0443\u043F\u043B\u0430\u0447\u0435\u043D\u043D\u043E\u0433\u043E \u041D\u0414\u0424\u041B. \u041B\u0438\u043C\u0438\u0442 \u043E\u0431\u0449\u0438\u0439 \u0434\u043B\u044F\xA0\u0418\u0418\u0421-3, \u041F\u0414\u0421 \u0438\xA0\u041D\u041F\u041E: \u0435\u0441\u043B\u0438 \u0447\u0430\u0441\u0442\u044C \u0443\u0448\u043B\u0430 \u043D\u0430\xA0\u0418\u0418\u0421-3, \u043D\u0430\xA0\u041F\u0414\u0421 \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u043C\u0435\u043D\u044C\u0448\u0435. \u0412\u043E\u0437\u0432\u0440\u0430\u0442\xA0\u2014 \u043F\u043E\xA0\u0432\u0430\u0448\u0435\u0439 \u0441\u0442\u0430\u0432\u043A\u0435 \u041D\u0414\u0424\u041B, \u043E\u0442\xA013 \u0434\u043E\xA022%"
  },
  {
    question: "\u041A\u043E\u0433\u0434\u0430 \u043C\u043E\u0436\u043D\u043E \u0437\u0430\u0431\u0440\u0430\u0442\u044C \u0434\u0435\u043D\u044C\u0433\u0438?",
    answer: "\u0427\u0435\u0440\u0435\u0437 15\u202F\u043B\u0435\u0442 \u0441\xA0\u0434\u0430\u0442\u044B \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430 \u0438\u043B\u0438\xA0\u043F\u0440\u0438\xA0\u0434\u043E\u0441\u0442\u0438\u0436\u0435\u043D\u0438\u0438 55\u202F\u043B\u0435\u0442 \u0436\u0435\u043D\u0449\u0438\u043D\u0430\u043C\u0438 \u0438\xA060\u202F\u043B\u0435\u0442 \u043C\u0443\u0436\u0447\u0438\u043D\u0430\u043C\u0438\xA0\u2014 \u0447\u0442\u043E\xA0\u043D\u0430\u0441\u0442\u0443\u043F\u0438\u0442 \u0440\u0430\u043D\u044C\u0448\u0435. \u041B\u0438\u0447\u043D\u044B\u0435 \u0432\u0437\u043D\u043E\u0441\u044B \u043C\u043E\u0436\u043D\u043E \u0437\u0430\u0431\u0440\u0430\u0442\u044C \u0438\xA0\u0440\u0430\u043D\u044C\u0448\u0435, \u043D\u043E\xA0\u0432\xA0\u0440\u0430\u0437\u043C\u0435\u0440\u0435, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u044F\u0435\u0442 \u0434\u043E\u0433\u043E\u0432\u043E\u0440 \u0441\xA0\u0444\u043E\u043D\u0434\u043E\u043C; \u0441\u043E\u0444\u0438\u043D\u0430\u043D\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0438\xA0\u0434\u043E\u0445\u043E\u0434 \u043E\u0442\xA0\u0438\u043D\u0432\u0435\u0441\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u043F\u0440\u0438\xA0\u0434\u043E\u0441\u0440\u043E\u0447\u043D\u043E\u043C \u0440\u0430\u0441\u0442\u043E\u0440\u0436\u0435\u043D\u0438\u0438 \u043E\u0441\u0442\u0430\u044E\u0442\u0441\u044F \u043D\u0430\xA0\u0441\u0447\u0451\u0442\u0435 \u0434\u043E\xA0\u0441\u0440\u043E\u043A\u0430 \u0432\u044B\u043F\u043B\u0430\u0442"
  },
  {
    question: "\u041E\u0431\u043B\u0430\u0433\u0430\u0435\u0442\u0441\u044F \u043B\u0438\xA0\u0434\u043E\u0445\u043E\u0434 \u043D\u0430\u043B\u043E\u0433\u043E\u043C?",
    answer: "\u041F\u0440\u0438 \u0432\u044B\u043F\u043B\u0430\u0442\u0430\u0445 \u043D\u0435\xA0\u0440\u0430\u043D\u044C\u0448\u0435 \u0447\u0435\u043C \u0447\u0435\u0440\u0435\u0437\xA010\u202F\u043B\u0435\u0442, \u043F\u043E\xA0\u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0443 \u0432\xA0\u0441\u0432\u043E\u044E \u043F\u043E\u043B\u044C\u0437\u0443 \u0438\u043B\u0438\xA0\u0432\xA0\u043F\u043E\u043B\u044C\u0437\u0443 \u0431\u043B\u0438\u0437\u043A\u043E\u0433\u043E \u0440\u043E\u0434\u0441\u0442\u0432\u0435\u043D\u043D\u0438\u043A\u0430 \u0438\xA0\u043D\u0435\xA0\u0431\u043E\u043B\u0435\u0435 \u0442\u0440\u0451\u0445 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u043E\u0432 \u041F\u0414\u0421 \u0434\u043E\u0445\u043E\u0434 \u043E\u0441\u0432\u043E\u0431\u043E\u0436\u0434\u0451\u043D \u043E\u0442\xA0\u041D\u0414\u0424\u041B \u0432\xA0\u043F\u0440\u0435\u0434\u0435\u043B\u0430\u0445 30\u202F\u043C\u043B\u043D \u20BD. \u041F\u0440\u0438 \u0434\u043E\u0441\u0440\u043E\u0447\u043D\u043E\u043C \u0440\u0430\u0441\u0442\u043E\u0440\u0436\u0435\u043D\u0438\u0438 \u0444\u043E\u043D\u0434 \u0443\u0434\u0435\u0440\u0436\u0438\u0442 \u041D\u0414\u0424\u041B \u0441\xA0\u0434\u043E\u0445\u043E\u0434\u0430 \u0438\xA0\u0441\xA0\u0432\u0437\u043D\u043E\u0441\u043E\u0432, \u043F\u043E\xA0\u043A\u043E\u0442\u043E\u0440\u044B\u043C \u0432\u044B\xA0\u043F\u043E\u043B\u0443\u0447\u0430\u043B\u0438 \u0432\u044B\u0447\u0435\u0442"
  },
  {
    question: "\u0427\u0442\u043E \u0435\u0441\u043B\u0438 \u043F\u043B\u0430\u0442\u0438\u0442\u044C \u043C\u0435\u043D\u044C\u0448\u0435 2 000\u202F\u20BD \u0432\xA0\u0433\u043E\u0434?",
    answer: "\u0421\u043E\u0444\u0438\u043D\u0430\u043D\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u043D\u0435\xA0\u0431\u0443\u0434\u0435\u0442 \u0441\u043E\u0432\u0441\u0435\u043C. \u041F\u0440\u0430\u0432\u043E \u043D\u0430\xA0\u0432\u044B\u0447\u0435\u0442 \u043F\u0440\u0438\xA0\u044D\u0442\u043E\u043C \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442\u0441\u044F: \u043E\u043D\xA0\u0441\u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u0441\xA0\u043B\u044E\u0431\u043E\u0439 \u0441\u0443\u043C\u043C\u044B \u043B\u0438\u0447\u043D\u044B\u0445 \u0432\u0437\u043D\u043E\u0441\u043E\u0432 \u0432\xA0\u043F\u0440\u0435\u0434\u0435\u043B\u0430\u0445 \u043E\u0431\u0449\u0435\u0433\u043E \u043B\u0438\u043C\u0438\u0442\u0430"
  },
  {
    question: "\u0427\u0442\u043E \u0442\u0430\u043A\u043E\u0435 \u041E\u041F\u0421 \u0438\xA0\u0437\u0430\u0447\u0435\u043C \u0435\u0433\u043E\xA0\u043F\u0435\u0440\u0435\u0432\u043E\u0434\u0438\u0442\u044C?",
    answer: "\u041E\u041F\u0421\xA0\u2014 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u043F\u0435\u043D\u0441\u0438\u043E\u043D\u043D\u043E\u0435 \u0441\u0442\u0440\u0430\u0445\u043E\u0432\u0430\u043D\u0438\u0435, \u0442\u0435 \u0441\u0430\u043C\u044B\u0435 \u043D\u0430\u043A\u043E\u043F\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u0432\u0437\u043D\u043E\u0441\u044B 2002\u20132013 \u0433\u043E\u0434\u043E\u0432, \u0437\u0430\u043C\u043E\u0440\u043E\u0436\u0435\u043D\u043D\u044B\u0435 \u0441\xA02014\u202F\u0433\u043E\u0434\u0430. \u0418\u0445 \u043C\u043E\u0436\u043D\u043E \u043F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438 \u043D\u0430\xA0\u0441\u0447\u0451\u0442 \u041F\u0414\u0421 \u0435\u0434\u0438\u043D\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u043C \u0432\u0437\u043D\u043E\u0441\u043E\u043C: \u0441\u0443\u043C\u043C\u0430 \u0441\u0440\u0430\u0437\u0443 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442, \u043D\u0435\xA0\u043E\u0431\u043B\u0430\u0433\u0430\u0435\u0442\u0441\u044F \u043D\u0430\u043B\u043E\u0433\u043E\u043C \u043F\u0440\u0438\xA0\u0432\u044B\u043F\u043B\u0430\u0442\u0430\u0445 \u0438\xA0\u0433\u0430\u0440\u0430\u043D\u0442\u0438\u0440\u0443\u0435\u0442\u0441\u044F \u0433\u043E\u0441\u0443\u0434\u0430\u0440\u0441\u0442\u0432\u043E\u043C \u0431\u0435\u0437\xA0\u043B\u0438\u043C\u0438\u0442\u0430 2,8\u202F\u043C\u043B\u043D \u20BD. \u041D\u043E \u043E\u043D\u0430 \u043D\u0435\xA0\u0434\u0430\u0451\u0442 \u0441\u043E\u0444\u0438\u043D\u0430\u043D\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u0438\xA0\u0432\u044B\u0447\u0435\u0442\u0430 \u0438\xA0\u043D\u0435\xA0\u0432\u044B\u0434\u0430\u0451\u0442\u0441\u044F \u0434\u043E\u0441\u0440\u043E\u0447\u043D\u043E\xA0\u2014 \u0442\u043E\u043B\u044C\u043A\u043E \u0432\u043C\u0435\u0441\u0442\u0435 \u0441\xA0\u0432\u044B\u043F\u043B\u0430\u0442\u0430\u043C\u0438"
  },
  {
    question: "\u041A\u0430\u043A\u0438\u0435 \u0431\u044B\u0432\u0430\u044E\u0442 \u0432\u044B\u043F\u043B\u0430\u0442\u044B \u0438\xA0\u043E\u0442\xA0\u0447\u0435\u0433\u043E \u0437\u0430\u0432\u0438\u0441\u0438\u0442 \u0440\u0430\u0437\u043C\u0435\u0440?",
    answer: "\u0421\u0440\u043E\u0447\u043D\u0430\u044F \u043D\u0430\xA0\u0441\u0440\u043E\u043A \u043E\u0442\xA010\u202F\u043B\u0435\u0442 (\u043A\u043E\u0440\u043E\u0447\u0435\xA0\u2014 \u0435\u0441\u043B\u0438 \u0444\u043E\u043D\u0434 \u0440\u0430\u0437\u0440\u0435\u0448\u0430\u0435\u0442), \u043F\u043E\u0436\u0438\u0437\u043D\u0435\u043D\u043D\u0430\u044F \u0438\u043B\u0438\xA0\u0435\u0434\u0438\u043D\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u0430\u044F. \u0420\u0430\u0437\u043C\u0435\u0440\xA0\u2014 \u043D\u0430\u043A\u043E\u043F\u043B\u0435\u043D\u043D\u0430\u044F \u0441\u0443\u043C\u043C\u0430, \u043F\u043E\u0434\u0435\u043B\u0451\u043D\u043D\u0430\u044F \u043D\u0430\xA0\u0441\u0440\u043E\u043A: \u0437\u0430\xA010\u202F\u043B\u0435\u0442 \u044D\u0442\u043E\xA0120 \u043C\u0435\u0441\u044F\u0446\u0435\u0432, \u043F\u043E\u0436\u0438\u0437\u043D\u0435\u043D\u043D\u0430\u044F \u0441\u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u043F\u043E\xA0\u043E\u0436\u0438\u0434\u0430\u0435\u043C\u043E\u043C\u0443 \u043F\u0435\u0440\u0438\u043E\u0434\u0443 \u0432\u044B\u043F\u043B\u0430\u0442\u044B (\u043E\u0440\u0438\u0435\u043D\u0442\u0438\u0440\xA0\u2014 22\u202F\u0433\u043E\u0434\u0430). \u0427\u0435\u043C \u0434\u043B\u0438\u043D\u043D\u0435\u0435 \u0441\u0440\u043E\u043A, \u0442\u0435\u043C \u043C\u0435\u043D\u044C\u0448\u0435 \u043F\u043B\u0430\u0442\u0451\u0436, \u043D\u043E\xA0\u0434\u043E\u043B\u044C\u0448\u0435 \u043F\u043B\u0430\u0442\u044F\u0442"
  },
  {
    question: "\u041F\u043E\u0447\u0435\u043C\u0443 \u0432\u0430\u0436\u043D\u044B \u0432\u043E\u0437\u0440\u0430\u0441\u0442 \u0438\xA0\u043F\u043E\u043B?",
    answer: "\u041F\u0440\u0430\u0432\u043E \u043D\u0430\xA0\u0432\u044B\u043F\u043B\u0430\u0442\u044B \u0434\u0430\u0451\u0442 \u0432\u043E\u0437\u0440\u0430\u0441\u0442\xA0\u2014 55\u202F\u043B\u0435\u0442 \u0436\u0435\u043D\u0449\u0438\u043D\u0430\u043C \u0438\xA060 \u043C\u0443\u0436\u0447\u0438\u043D\u0430\u043C\xA0\u2014 \u0438\u043B\u0438\xA015\u202F\u043B\u0435\u0442 \u0441\xA0\u0434\u0430\u0442\u044B \u043F\u0435\u0440\u0432\u043E\u0433\u043E \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430, \u0447\u0442\u043E\xA0\u043D\u0430\u0441\u0442\u0443\u043F\u0438\u0442 \u0440\u0430\u043D\u044C\u0448\u0435. \u041E\u0442 \u0432\u043E\u0437\u0440\u0430\u0441\u0442\u0430 \u0437\u0430\u0432\u0438\u0441\u0438\u0442, \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u043B\u0435\u0442 \u043A\u043E\u043F\u0438\u0442\u0441\u044F \u0441\u0443\u043C\u043C\u0430 \u0434\u043E\xA0\u0432\u044B\u043F\u043B\u0430\u0442 \u0438\xA0\u043A\u0430\u043A\u0438\u043C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u0441\u044F \u043F\u043B\u0430\u0442\u0451\u0436"
  },
  {
    question: "\u0427\u0435\u043C \u041F\u0414\u0421 \u043E\u0442\u043B\u0438\u0447\u0430\u0435\u0442\u0441\u044F \u043E\u0442\xA0\u0418\u0418\u0421-3?",
    answer: "\u0418\u0418\u0421-3 \u0434\u0430\u0451\u0442 \u0432\u044B\u0447\u0435\u0442 \u043D\u0430\xA0\u0432\u0437\u043D\u043E\u0441 \u0438\xA0\u043E\u0441\u0432\u043E\u0431\u043E\u0436\u0434\u0435\u043D\u0438\u0435 \u0434\u043E\u0445\u043E\u0434\u0430, \u043D\u043E\xA0\u043D\u0435\xA0\u0434\u0430\u0451\u0442 \u0441\u043E\u0444\u0438\u043D\u0430\u043D\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u0438\xA0\u043D\u0435\xA0\u043D\u0430\u0441\u043B\u0435\u0434\u0443\u0435\u0442\u0441\u044F. \u041F\u0414\u0421 \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u0435\u0442 \u0434\u043E\xA036 000\u202F\u20BD \u0432\xA0\u0433\u043E\u0434 \u043E\u0442\xA0\u0433\u043E\u0441\u0443\u0434\u0430\u0440\u0441\u0442\u0432\u0430, \u043D\u0430\u0441\u043B\u0435\u0434\u0443\u0435\u0442\u0441\u044F, \u043D\u043E\xA0\u0434\u0435\u043D\u044C\u0433\u0438 \u0437\u0430\u043F\u0435\u0440\u0442\u044B \u0434\u043E\xA015\u202F\u043B\u0435\u0442 \u0438\u043B\u0438\xA055/60\u202F\u043B\u0435\u0442, \u0430\xA0\u043B\u0438\u043C\u0438\u0442 \u0432\u044B\u0447\u0435\u0442\u0430 \u0443\xA0\u043E\u0431\u043E\u0438\u0445 \u043E\u0431\u0449\u0438\u0439\xA0\u2014 400 000\u202F\u20BD \u0432\xA0\u0433\u043E\u0434"
  }
];
var money2 = (value) => value > 0 ? value.toLocaleString("ru-RU") : "";
var parseMoney2 = (raw) => parseNumber(raw.replace(/[^\d\s\u202F]/g, ""));
function MoneyValue2({
  value,
  onChange,
  label,
  suffix
}) {
  const [draft, setDraft] = useState9(() => money2(value));
  const [focused, setFocused] = useState9(false);
  return /* @__PURE__ */ jsxs14("span", { className: "param__value", children: [
    /* @__PURE__ */ jsx15(
      "input",
      {
        className: "param__input ym-disable-keys",
        inputMode: "numeric",
        "aria-label": label,
        value: focused ? draft : money2(value),
        onChange: (event) => {
          const next = parseMoney2(event.target.value);
          setDraft(next > 0 ? next.toLocaleString("ru-RU") : "");
          onChange(next);
        },
        onFocus: () => {
          setFocused(true);
          setDraft(money2(value));
        },
        onBlur: () => {
          setFocused(false);
          setDraft(money2(value));
        }
      }
    ),
    suffix ? /* @__PURE__ */ jsx15("span", { className: "param__unit", children: suffix }) : null
  ] });
}
function Param2({
  label,
  hint,
  value,
  min,
  max,
  step,
  suffix,
  onChange
}) {
  return /* @__PURE__ */ jsxs14("div", { className: "param", children: [
    /* @__PURE__ */ jsx15("span", { className: "param__label", children: label }),
    /* @__PURE__ */ jsx15(MoneyValue2, { value, onChange, label, suffix }),
    suffix ? null : null,
    /* @__PURE__ */ jsx15(WakeSlider, { value, min, max, step, label, onChange }),
    hint ? /* @__PURE__ */ jsx15("span", { className: "param__hint", children: hint }) : null
  ] });
}
function Pds({ initialTab = "params" }) {
  const [scenario, setScenario] = useState9(PDS_DEFAULTS);
  const [tab, setTab] = useState9(initialTab);
  const [openFaq, setOpenFaq] = useState9(0);
  const tabsRef = useRef6(null);
  const thumb = useSlidingThumb(tabsRef, ".segmented__item.is-active", [tab]);
  const patch = (next) => setScenario((current) => ({ ...current, ...next }));
  const result = useMemo5(() => simulatePds(scenario), [scenario]);
  const updatedLabel = useMemo5(() => {
    const stamp = /* @__PURE__ */ new Date("2026-11-27T23:45:37.518Z");
    const date = new Intl.DateTimeFormat("ru-RU", {
      timeZone: "Europe/Moscow",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(stamp);
    const time = new Intl.DateTimeFormat("ru-RU", {
      timeZone: "Europe/Moscow",
      hour: "2-digit",
      minute: "2-digit"
    }).format(stamp);
    return `\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E ${date.replace(/\s*г\.$/, "")}, ${time}\xA0\u041C\u0421\u041A`;
  }, []);
  const iis = useMemo5(() => {
    const contributions = Array.from(
      { length: scenario.holdingYears },
      (_, index) => index < scenario.contributionYears ? scenario.annualContribution : 0
    );
    const base = {
      annualContribution: scenario.annualContribution,
      contributionMode: "custom",
      contributions,
      years: scenario.holdingYears,
      returnPct: scenario.returnPct,
      inflationPct: scenario.inflationPct,
      officialIncome: scenario.monthlyIncome * 12,
      reinvestRefunds: scenario.reinvestRefunds,
      openDate: "2026-01-01",
      periodsPerYear: 1,
      manualRate: null
    };
    return simulate("iis3", base);
  }, [scenario]);
  const rate = cofinancingRate(scenario.monthlyIncome);
  const warnings = [];
  if (scenario.annualContribution > 0 && scenario.annualContribution < PDS_RULES.cofinancingMinContribution) {
    warnings.push(
      "\u0412\u0437\u043D\u043E\u0441 \u043C\u0435\u043D\u044C\u0448\u0435 2 000\u202F\u20BD \u0432\xA0\u0433\u043E\u0434\xA0\u2014 \u0441\u043E\u0444\u0438\u043D\u0430\u043D\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u043D\u0435\xA0\u0431\u0443\u0434\u0435\u0442 \u0441\u043E\u0432\u0441\u0435\u043C, \u043E\u0441\u0442\u0430\u043D\u0435\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0432\u044B\u0447\u0435\u0442"
    );
  }
  if (rate < 1) {
    warnings.push(
      `\u041F\u0440\u0438 \u0434\u043E\u0445\u043E\u0434\u0435 ${rub(scenario.monthlyIncome)} \u0432\xA0\u043C\u0435\u0441\u044F\u0446 \u0433\u043E\u0441\u0443\u0434\u0430\u0440\u0441\u0442\u0432\u043E \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u0435\u0442 ${rate === 0.5 ? "\u043F\u043E\u043B\u043E\u0432\u0438\u043D\u0443" : "\u0447\u0435\u0442\u0432\u0435\u0440\u0442\u044C"} \u0432\u0437\u043D\u043E\u0441\u043E\u0432, \u043D\u043E\xA0\u043D\u0435\xA0\u0431\u043E\u043B\u044C\u0448\u0435 36 000\u202F\u20BD \u0432\xA0\u0433\u043E\u0434`
    );
  }
  if (scenario.iis3Contribution > 0) {
    warnings.push(
      `\u041B\u0438\u043C\u0438\u0442 \u0432\u044B\u0447\u0435\u0442\u0430 \u043E\u0431\u0449\u0438\u0439 \u0441\xA0\u0418\u0418\u0421-3: \u0438\u0437\xA0400 000\u202F\u20BD \u043D\u0430\xA0\u041F\u0414\u0421 \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F ${rub(result.deductionRoom)}`
    );
  }
  if (scenario.age >= result.payoutAge) {
    warnings.push(
      "\u0412\u043E\u0437\u0440\u0430\u0441\u0442 \u0432\u044B\u043F\u043B\u0430\u0442 \u0443\u0436\u0435 \u043D\u0430\u0441\u0442\u0443\u043F\u0438\u043B: \u0437\u0430\u0431\u0440\u0430\u0442\u044C \u0441\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u0438\u044F \u043C\u043E\u0436\u043D\u043E \u0432\xA0\u043B\u044E\u0431\u043E\u0439 \u043C\u043E\u043C\u0435\u043D\u0442, \u0432\u0437\u043D\u043E\u0441\u044B \u043F\u043E\u0441\u043B\u0435 \u044D\u0442\u043E\u0433\u043E \u0441\u043C\u044B\u0441\u043B\u0430 \u043D\u0435\xA0\u0438\u043C\u0435\u044E\u0442"
    );
  } else if (result.earliestYears === PDS_RULES.payoutYears && scenario.holdingYears === PDS_RULES.payoutYears) {
    warnings.push(
      `\u0412\u044B\u043F\u043B\u0430\u0442\u044B \u043D\u0430\u0447\u043D\u0443\u0442\u0441\u044F \u0447\u0435\u0440\u0435\u0437\xA015\u202F\u043B\u0435\u0442 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430: \u0434\u043E ${result.payoutAge} \u043B\u0435\u0442 \u0432\u044B\xA0\u0435\u0449\u0451 \u043D\u0435\xA0\u0434\u043E\u0439\u0434\u0451\u0442\u0435`
    );
  }
  const taxRate = ndfl(scenario.monthlyIncome * 12) / Math.max(1, scenario.monthlyIncome * 12);
  const payoutBigger = result.net >= iis.net;
  return /* @__PURE__ */ jsxs14("div", { className: "app pds", children: [
    /* @__PURE__ */ jsx15(Topbar, { children: /* @__PURE__ */ jsxs14("nav", { className: "topbar__nav", "aria-label": "\u0420\u0430\u0437\u0434\u0435\u043B\u044B", children: [
      /* @__PURE__ */ jsx15("a", { className: "topbar__link", href: "/", children: "\u0418\u0418\u0421-3" }),
      /* @__PURE__ */ jsx15("span", { className: "topbar__link is-current", children: "\u041F\u0414\u0421" })
    ] }) }),
    /* @__PURE__ */ jsxs14("main", { children: [
      /* @__PURE__ */ jsx15("h1", { className: "page-title", children: "\u041A\u0430\u043B\u044C\u043A\u0443\u043B\u044F\u0442\u043E\u0440 \u041F\u0414\u0421: \u0441\u043E\u0444\u0438\u043D\u0430\u043D\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435, \u0432\u044B\u0447\u0435\u0442 \u0438\xA0\u0432\u044B\u043F\u043B\u0430\u0442\u044B" }),
      /* @__PURE__ */ jsx15("p", { className: "page-lede", children: "\u041F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430 \u0434\u043E\u043B\u0433\u043E\u0441\u0440\u043E\u0447\u043D\u044B\u0445 \u0441\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u0438\u0439: \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0434\u043E\u0431\u0430\u0432\u0438\u0442 \u0433\u043E\u0441\u0443\u0434\u0430\u0440\u0441\u0442\u0432\u043E, \u0447\u0442\u043E\xA0\u0432\u0435\u0440\u043D\u0451\u0442 \u043D\u0430\u043B\u043E\u0433\u043E\u0432\u0430\u044F \u0438\xA0\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u043E\u0441\u0442\u0430\u043D\u0435\u0442\u0441\u044F \u043A\xA0\u0432\u044B\u043F\u043B\u0430\u0442\u0430\u043C. \u041F\u0440\u0430\u0432\u0438\u043B\u0430 2026\u202F\u0433\u043E\u0434\u0430" }),
      /* @__PURE__ */ jsxs14("div", { className: "layout pds__layout", children: [
        /* @__PURE__ */ jsxs14("div", { className: "layout__main", children: [
          /* @__PURE__ */ jsx15("div", { className: "tabs", ref: tabsRef, children: /* @__PURE__ */ jsx15("div", { className: "tabs__inner", children: /* @__PURE__ */ jsxs14("div", { className: "segmented", role: "tablist", "aria-label": "\u0420\u0430\u0437\u0434\u0435\u043B\u044B", children: [
            thumb ? /* @__PURE__ */ jsx15(
              "span",
              {
                className: "segmented__thumb",
                "aria-hidden": "true",
                style: {
                  transform: `translate(${thumb.left}px, ${thumb.top}px)`,
                  width: thumb.width,
                  height: thumb.height
                }
              }
            ) : null,
            [
              ["params", "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B"],
              ["compare", "\u0421\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435"],
              ["rules", "\u041F\u0440\u0430\u0432\u0438\u043B\u0430"]
            ].map(([value, label]) => /* @__PURE__ */ jsx15(
              "button",
              {
                type: "button",
                role: "tab",
                "aria-selected": tab === value,
                className: "segmented__item" + (tab === value ? " is-active" : ""),
                onClick: () => setTab(value),
                children: label
              },
              value
            ))
          ] }) }) }),
          /* @__PURE__ */ jsx15(AnimatedHeight, { children: /* @__PURE__ */ jsxs14("div", { className: "appear", children: [
            tab === "params" ? /* @__PURE__ */ jsxs14(
              Section,
              {
                title: "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B",
                aside: /* @__PURE__ */ jsx15(
                  "button",
                  {
                    type: "button",
                    className: "btn btn--ghost btn--sm",
                    onClick: () => setScenario(PDS_DEFAULTS),
                    children: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C"
                  }
                ),
                children: [
                  /* @__PURE__ */ jsxs14("div", { className: "param", children: [
                    /* @__PURE__ */ jsx15("span", { className: "param__label", children: "\u041F\u043E\u043B" }),
                    /* @__PURE__ */ jsx15(
                      Segmented,
                      {
                        label: "\u041F\u043E\u043B",
                        value: scenario.gender,
                        onChange: (value) => {
                          const payoutAge = value === "f" ? PDS_RULES.payoutAgeWomen : PDS_RULES.payoutAgeMen;
                          const earliest = Math.min(
                            PDS_RULES.payoutYears,
                            Math.max(0, payoutAge - scenario.age)
                          );
                          patch({
                            gender: value,
                            holdingYears: Math.max(scenario.holdingYears, earliest)
                          });
                        },
                        options: [
                          { value: "m", label: "\u041C\u0443\u0436\u0441\u043A\u043E\u0439" },
                          { value: "f", label: "\u0416\u0435\u043D\u0441\u043A\u0438\u0439" }
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsx15("span", { className: "param__hint", children: "\u043E\u0442\xA0\u043F\u043E\u043B\u0430 \u0437\u0430\u0432\u0438\u0441\u0438\u0442 \u0432\u043E\u0437\u0440\u0430\u0441\u0442 \u0432\u044B\u043F\u043B\u0430\u0442: 60\u202F\u043B\u0435\u0442 \u043C\u0443\u0436\u0447\u0438\u043D\u0430\u043C \u0438\xA055 \u0436\u0435\u043D\u0449\u0438\u043D\u0430\u043C" })
                  ] }),
                  /* @__PURE__ */ jsx15(
                    Param2,
                    {
                      label: "\u0412\u043E\u0437\u0440\u0430\u0441\u0442",
                      hint: "\u043F\u0440\u0430\u0432\u043E \u043D\u0430\xA0\u0432\u044B\u043F\u043B\u0430\u0442\u044B\xA0\u2014 55/60\u202F\u043B\u0435\u0442 \u0438\u043B\u0438\xA015\u202F\u043B\u0435\u0442 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430",
                      value: scenario.age,
                      min: 18,
                      max: 70,
                      step: 1,
                      suffix: "\u043B\u0435\u0442",
                      onChange: (value) => {
                        const payoutAge = scenario.gender === "f" ? PDS_RULES.payoutAgeWomen : PDS_RULES.payoutAgeMen;
                        const earliest = Math.min(
                          PDS_RULES.payoutYears,
                          Math.max(0, payoutAge - value)
                        );
                        patch({ age: value, holdingYears: Math.max(scenario.holdingYears, earliest) });
                      }
                    }
                  ),
                  /* @__PURE__ */ jsx15(
                    Param2,
                    {
                      label: "\u0414\u043E\u0445\u043E\u0434 \u0432\xA0\u043C\u0435\u0441\u044F\u0446",
                      hint: "\u0434\u043E\xA0\u0432\u044B\u0447\u0435\u0442\u0430 \u041D\u0414\u0424\u041B, \u043E\u0442\xA0\u043D\u0435\u0433\u043E \u0437\u0430\u0432\u0438\u0441\u044F\u0442 \u0433\u043E\u0441\u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430 \u0438\xA0\u0441\u0442\u0430\u0432\u043A\u0430",
                      value: scenario.monthlyIncome,
                      min: 2e4,
                      max: 5e5,
                      step: 1e4,
                      suffix: "\u20BD",
                      onChange: (value) => patch({ monthlyIncome: value })
                    }
                  ),
                  /* @__PURE__ */ jsx15(
                    Param2,
                    {
                      label: "\u0412\u0437\u043D\u043E\u0441 \u0432\xA0\u0433\u043E\u0434",
                      hint: "\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0432\u043D\u043E\u0441\u0438\u0442\u0435 \u043D\u0430\xA0\u0441\u0447\u0451\u0442; \u043E\u0442\xA02 000\u202F\u20BD \u0432\xA0\u0433\u043E\u0434 \u0434\u0430\u044E\u0442 \u0441\u043E\u0444\u0438\u043D\u0430\u043D\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435",
                      value: scenario.annualContribution,
                      min: 0,
                      max: 4e5,
                      step: 1e4,
                      suffix: "\u20BD",
                      onChange: (value) => patch({ annualContribution: value })
                    }
                  ),
                  /* @__PURE__ */ jsxs14("div", { className: "pds__row", children: [
                    /* @__PURE__ */ jsx15(
                      Param2,
                      {
                        label: "\u0421\u0440\u043E\u043A \u043F\u043E\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F",
                        hint: "\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u043B\u0435\u0442 \u0432\u043D\u043E\u0441\u0438\u0442\u0435 \u0432\u0437\u043D\u043E\u0441\u044B",
                        value: scenario.contributionYears,
                        min: 1,
                        max: 20,
                        step: 1,
                        suffix: "\u043B\u0435\u0442",
                        onChange: (value) => patch({
                          contributionYears: value,
                          holdingYears: Math.max(scenario.holdingYears, value)
                        })
                      }
                    ),
                    /* @__PURE__ */ jsx15(
                      Param2,
                      {
                        label: "\u0421\u0440\u043E\u043A \u0434\u043E\xA0\u0432\u044B\u043F\u043B\u0430\u0442",
                        hint: `\u043D\u0435\xA0\u0440\u0430\u043D\u044C\u0448\u0435 ${result.earliestYears} \u043B\u0435\u0442: \u0432\u043E\u0437\u0440\u0430\u0441\u0442 ${result.payoutAge} \u0438\u043B\u0438\xA015\u202F\u043B\u0435\u0442 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430`,
                        value: scenario.holdingYears,
                        min: Math.max(1, result.earliestYears),
                        max: 40,
                        step: 1,
                        suffix: "\u043B\u0435\u0442",
                        onChange: (value) => patch({
                          holdingYears: Math.max(value, result.earliestYears, scenario.contributionYears)
                        })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs14("div", { className: "pds__row", children: [
                    /* @__PURE__ */ jsx15(
                      Param2,
                      {
                        label: "\u0414\u043E\u0445\u043E\u0434\u043D\u043E\u0441\u0442\u044C",
                        hint: "\u0447\u0442\u043E\xA0\u0444\u043E\u043D\u0434 \u0437\u0430\u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0441\u0432\u0435\u0440\u0445 \u0438\u043D\u0444\u043B\u044F\u0446\u0438\u0438",
                        value: scenario.returnPct,
                        min: 0,
                        max: 25,
                        step: 1,
                        suffix: "%",
                        onChange: (value) => patch({ returnPct: value })
                      }
                    ),
                    /* @__PURE__ */ jsx15(
                      Param2,
                      {
                        label: "\u0418\u043D\u0444\u043B\u044F\u0446\u0438\u044F",
                        hint: "\u0434\u043B\u044F\xA0\u043F\u0435\u0440\u0435\u0441\u0447\u0451\u0442\u0430 \u0432\xA0\u0441\u0435\u0433\u043E\u0434\u043D\u044F\u0448\u043D\u0438\u0435 \u0446\u0435\u043D\u044B",
                        value: scenario.inflationPct,
                        min: 0,
                        max: 15,
                        step: 1,
                        suffix: "%",
                        onChange: (value) => patch({ inflationPct: value })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx15(
                    Param2,
                    {
                      label: "\u0412\u0437\u043D\u043E\u0441\u044B \u043D\u0430\xA0\u0418\u0418\u0421-3 \u0432\xA0\u0433\u043E\u0434",
                      hint: "\u043B\u0438\u043C\u0438\u0442 \u0432\u044B\u0447\u0435\u0442\u0430 400 000\u202F\u20BD \u043E\u0431\u0449\u0438\u0439 \u0441\xA0\u0418\u0418\u0421-3 \u0438\xA0\u041D\u041F\u041E",
                      value: scenario.iis3Contribution,
                      min: 0,
                      max: 4e5,
                      step: 1e4,
                      suffix: "\u20BD",
                      onChange: (value) => patch({ iis3Contribution: value })
                    }
                  ),
                  /* @__PURE__ */ jsxs14("div", { className: "param", children: [
                    /* @__PURE__ */ jsx15("span", { className: "param__label", children: "\u0412\u0430\u0440\u0438\u0430\u043D\u0442 \u0432\u044B\u043F\u043B\u0430\u0442\u044B" }),
                    /* @__PURE__ */ jsx15(
                      Segmented,
                      {
                        label: "\u0412\u0430\u0440\u0438\u0430\u043D\u0442 \u0432\u044B\u043F\u043B\u0430\u0442\u044B",
                        value: scenario.payoutType,
                        onChange: (value) => patch({ payoutType: value }),
                        options: [
                          { value: "term1", label: "1\u202F\u0433\u043E\u0434" },
                          { value: "term5", label: "5\u202F\u043B\u0435\u0442" },
                          { value: "term10", label: "10\u202F\u043B\u0435\u0442" },
                          { value: "lifetime", label: "\u041F\u043E\u0436\u0438\u0437\u043D\u0435\u043D\u043D\u043E" },
                          { value: "lump", label: "\u0420\u0430\u0437\u043E\u043C" }
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsx15("span", { className: "param__hint", children: "\u0441\u0440\u043E\u0447\u043D\u0430\u044F \u0432\u044B\u043F\u043B\u0430\u0442\u0430\xA0\u2014 \u043D\u0435\xA0\u043C\u0435\u043D\u044C\u0448\u0435 10\u202F\u043B\u0435\u0442 \u043F\u043E\xA0\u0437\u0430\u043A\u043E\u043D\u0443; \u043A\u043E\u0440\u043E\u0447\u0435 \u043C\u043E\u0436\u043D\u043E, \u0435\u0441\u043B\u0438 \u0444\u043E\u043D\u0434 \u0440\u0430\u0437\u0440\u0435\u0448\u0430\u0435\u0442" })
                  ] }),
                  /* @__PURE__ */ jsx15("div", { className: "param", children: /* @__PURE__ */ jsx15(
                    Toggle,
                    {
                      checked: scenario.useOps,
                      onChange: (value) => patch({ useOps: value }),
                      label: "\u0423\u0447\u0438\u0442\u044B\u0432\u0430\u0442\u044C \u043D\u0430\u043A\u043E\u043F\u043B\u0435\u043D\u0438\u044F \u041E\u041F\u0421",
                      hint: "\u043F\u0435\u0440\u0435\u0432\u0435\u0434\u0451\u043D\u043D\u0430\u044F \u043D\u0430\u043A\u043E\u043F\u0438\u0442\u0435\u043B\u044C\u043D\u0430\u044F \u0447\u0430\u0441\u0442\u044C \u0440\u0430\u0441\u0442\u0451\u0442 \u0432\u043C\u0435\u0441\u0442\u0435 \u0441\u043E\xA0\u0441\u0447\u0451\u0442\u043E\u043C, \u043D\u043E\xA0\u043D\u0435\xA0\u0434\u0430\u0451\u0442 \u0441\u043E\u0444\u0438\u043D\u0430\u043D\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u0438\xA0\u0432\u044B\u0447\u0435\u0442\u0430"
                    }
                  ) }),
                  scenario.useOps ? /* @__PURE__ */ jsx15(
                    Param2,
                    {
                      label: "\u041D\u0430\u043A\u043E\u043F\u043B\u0435\u043D\u0438\u044F \u041E\u041F\u0421",
                      hint: "\u0441\u0443\u043C\u043C\u0443 \u043C\u043E\u0436\u043D\u043E \u0443\u0437\u043D\u0430\u0442\u044C \u043D\u0430\xA0\u0413\u043E\u0441\u0443\u0441\u043B\u0443\u0433\u0430\u0445 \u0432\xA0\u0440\u0430\u0437\u0434\u0435\u043B\u0435 \u043F\u0435\u043D\u0441\u0438\u043E\u043D\u043D\u044B\u0445 \u043D\u0430\u043A\u043E\u043F\u043B\u0435\u043D\u0438\u0439",
                      value: scenario.opsAmount,
                      min: 0,
                      max: 3e6,
                      step: 5e4,
                      suffix: "\u20BD",
                      onChange: (value) => patch({ opsAmount: value })
                    }
                  ) : null,
                  /* @__PURE__ */ jsxs14("div", { className: "pds__toggles", children: [
                    /* @__PURE__ */ jsx15(
                      Toggle,
                      {
                        checked: scenario.reinvestRefunds,
                        onChange: (value) => patch({ reinvestRefunds: value }),
                        label: "\u0412\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0442\u044C \u0432\u044B\u0447\u0435\u0442 \u043D\u0430\xA0\u0441\u0447\u0451\u0442",
                        hint: "\u0432\u044B\u0447\u0435\u0442 \u043F\u0440\u0438\u0445\u043E\u0434\u0438\u0442 \u0434\u0435\u043D\u044C\u0433\u0430\u043C\u0438 \u0438\u043B\u0438\xA0\u0441\u0440\u0430\u0437\u0443 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043D\u0430\xA0\u0441\u0447\u0451\u0442\u0435"
                      }
                    ),
                    /* @__PURE__ */ jsx15(
                      Toggle,
                      {
                        checked: scenario.ownContract,
                        onChange: (value) => patch({ ownContract: value }),
                        label: "\u0414\u043E\u0433\u043E\u0432\u043E\u0440 \u0432\xA0\u0441\u0432\u043E\u044E \u043F\u043E\u043B\u044C\u0437\u0443 \u0438\u043B\u0438\xA0\u0431\u043B\u0438\u0437\u043A\u043E\u0433\u043E \u0440\u043E\u0434\u0441\u0442\u0432\u0435\u043D\u043D\u0438\u043A\u0430"
                      }
                    ),
                    /* @__PURE__ */ jsx15(
                      Toggle,
                      {
                        checked: scenario.fewContracts,
                        onChange: (value) => patch({ fewContracts: value }),
                        label: "\u0414\u043E\u0433\u043E\u0432\u043E\u0440\u043E\u0432 \u041F\u0414\u0421 \u043D\u0435\xA0\u0431\u043E\u043B\u044C\u0448\u0435 \u0442\u0440\u0451\u0445"
                      }
                    )
                  ] })
                ]
              }
            ) : null,
            tab === "params" ? /* @__PURE__ */ jsx15(Section, { title: "\u0420\u0430\u0441\u0447\u0451\u0442 \u043F\u043E\xA0\u0433\u043E\u0434\u0430\u043C", children: /* @__PURE__ */ jsx15("div", { className: "table__wrap", children: /* @__PURE__ */ jsxs14("table", { className: "table", children: [
              /* @__PURE__ */ jsx15("thead", { children: /* @__PURE__ */ jsxs14("tr", { children: [
                /* @__PURE__ */ jsx15("th", { scope: "col", children: "\u0413\u043E\u0434" }),
                /* @__PURE__ */ jsx15("th", { scope: "col", children: "\u0412\u0437\u043D\u043E\u0441" }),
                /* @__PURE__ */ jsx15("th", { scope: "col", children: "\u0413\u043E\u0441\u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430" }),
                /* @__PURE__ */ jsx15("th", { scope: "col", children: "\u0412\u044B\u0447\u0435\u0442" }),
                /* @__PURE__ */ jsx15("th", { scope: "col", className: "table__hide-sm", children: "\u0414\u043E\u0445\u043E\u0434 \u0437\u0430\xA0\u0433\u043E\u0434" }),
                /* @__PURE__ */ jsx15("th", { scope: "col", children: "\u041A\u0430\u043F\u0438\u0442\u0430\u043B" })
              ] }) }),
              /* @__PURE__ */ jsx15("tbody", { children: result.rows.map((row) => /* @__PURE__ */ jsxs14("tr", { children: [
                /* @__PURE__ */ jsx15("td", { children: row.year }),
                /* @__PURE__ */ jsx15("td", { children: rub(row.contribution) }),
                /* @__PURE__ */ jsx15("td", { className: "table__refund", children: row.cofinancing > 0 ? rub(row.cofinancing) : "\u2014" }),
                /* @__PURE__ */ jsx15("td", { children: row.refund > 0 ? rub(row.refund) : "\u2014" }),
                /* @__PURE__ */ jsx15("td", { className: "table__hide-sm", children: rub(row.growth) }),
                /* @__PURE__ */ jsx15("td", { className: "table__capital", children: rub(row.capital) })
              ] }, row.year)) }),
              /* @__PURE__ */ jsx15("tfoot", { children: /* @__PURE__ */ jsxs14("tr", { children: [
                /* @__PURE__ */ jsx15("td", { children: "\u0418\u0442\u043E\u0433\u043E" }),
                /* @__PURE__ */ jsx15("td", { children: rub(result.contributions) }),
                /* @__PURE__ */ jsx15("td", { className: "table__refund", children: rub(result.cofinancing) }),
                /* @__PURE__ */ jsx15("td", { children: rub(result.refunds) }),
                /* @__PURE__ */ jsx15("td", { className: "table__hide-sm", children: rub(result.profit - result.cofinancing) }),
                /* @__PURE__ */ jsx15("td", { className: "table__capital", children: rub(result.capital) })
              ] }) })
            ] }) }) }) : null,
            tab === "compare" ? /* @__PURE__ */ jsxs14("div", { className: "pds-compare", children: [
              /* @__PURE__ */ jsx15("p", { className: "compare__lead", children: "\u041E\u0434\u043D\u0438 \u0438\xA0\u0442\u0435 \u0436\u0435\xA0\u0432\u0437\u043D\u043E\u0441\u044B \u0438\xA0\u0441\u0440\u043E\u043A: \u0447\u0442\u043E\xA0\u0434\u0430\u0441\u0442 \u041F\u0414\u0421, \u0430\xA0\u0447\u0442\u043E\xA0\u0418\u0418\u0421-3" }),
              /* @__PURE__ */ jsxs14("div", { className: "pds-compare__cards", children: [
                /* @__PURE__ */ jsxs14("article", { className: "pds-compare__card" + (payoutBigger ? " is-best" : ""), children: [
                  /* @__PURE__ */ jsxs14("span", { className: "card__head", children: [
                    /* @__PURE__ */ jsx15("span", { className: "card__name", children: "\u041F\u0414\u0421" }),
                    payoutBigger ? /* @__PURE__ */ jsx15("span", { className: "chip chip--best", children: "\u0432\u044B\u0433\u043E\u0434\u043D\u0435\u0435" }) : null
                  ] }),
                  /* @__PURE__ */ jsx15("span", { className: "card__net", children: /* @__PURE__ */ jsx15(RollingNumber, { value: result.net, format: (n) => rub(n) }) }),
                  /* @__PURE__ */ jsxs14("span", { className: "card__note", children: [
                    "\u0433\u043E\u0441\u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430 ",
                    compactRub(result.cofinancing),
                    ", \u0432\u044B\u0447\u0435\u0442",
                    " ",
                    compactRub(result.refunds),
                    "; \u0434\u0435\u043D\u044C\u0433\u0438 \u0437\u0430\u043F\u0435\u0440\u0442\u044B \u0434\u043E ",
                    scenario.holdingYears,
                    " ",
                    "\u043B\u0435\u0442"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs14("article", { className: "pds-compare__card" + (!payoutBigger ? " is-best" : ""), children: [
                  /* @__PURE__ */ jsxs14("span", { className: "card__head", children: [
                    /* @__PURE__ */ jsx15("span", { className: "card__name", children: "\u0418\u0418\u0421-3" }),
                    !payoutBigger ? /* @__PURE__ */ jsx15("span", { className: "chip chip--best", children: "\u0432\u044B\u0433\u043E\u0434\u043D\u0435\u0435" }) : null
                  ] }),
                  /* @__PURE__ */ jsx15("span", { className: "card__net", children: /* @__PURE__ */ jsx15(RollingNumber, { value: iis.net, format: (n) => rub(n) }) }),
                  /* @__PURE__ */ jsxs14("span", { className: "card__note", children: [
                    "\u0432\u044B\u0447\u0435\u0442 ",
                    compactRub(iis.refunds),
                    "; \u0441\u0447\u0451\u0442 \u043C\u043E\u0436\u043D\u043E \u0437\u0430\u043A\u0440\u044B\u0442\u044C \u0447\u0435\u0440\u0435\u0437",
                    " ",
                    iis.minHolding,
                    " ",
                    yearsWord(iis.minHolding),
                    " \u0431\u0435\u0437 \u043F\u043E\u0442\u0435\u0440\u0438 \u043B\u044C\u0433\u043E\u0442"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx15("table", { className: "pds-compare__table", children: /* @__PURE__ */ jsxs14("tbody", { children: [
                /* @__PURE__ */ jsxs14("tr", { children: [
                  /* @__PURE__ */ jsx15("th", { scope: "row", children: "\u0413\u043E\u0441\u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430" }),
                  /* @__PURE__ */ jsx15("td", { className: "is-ok", children: rub(result.cofinancing) }),
                  /* @__PURE__ */ jsx15("td", { children: "\u043D\u0435\u0442" })
                ] }),
                /* @__PURE__ */ jsxs14("tr", { children: [
                  /* @__PURE__ */ jsx15("th", { scope: "row", children: "\u0412\u044B\u0447\u0435\u0442 \u041D\u0414\u0424\u041B" }),
                  /* @__PURE__ */ jsx15("td", { children: rub(result.refunds) }),
                  /* @__PURE__ */ jsx15("td", { children: rub(iis.refunds) })
                ] }),
                /* @__PURE__ */ jsxs14("tr", { children: [
                  /* @__PURE__ */ jsx15("th", { scope: "row", children: "\u041D\u0430\u043B\u043E\u0433 \u043F\u0440\u0438\xA0\u0432\u044B\u043F\u043B\u0430\u0442\u0430\u0445" }),
                  /* @__PURE__ */ jsx15("td", { children: result.exitTax > 0 ? rub(result.exitTax) : "0 \u20BD" }),
                  /* @__PURE__ */ jsx15("td", { children: iis.exitTax > 0 ? rub(iis.exitTax) : "0 \u20BD" })
                ] }),
                /* @__PURE__ */ jsxs14("tr", { children: [
                  /* @__PURE__ */ jsx15("th", { scope: "row", children: "\u041D\u0430 \u0440\u0443\u043A\u0438" }),
                  /* @__PURE__ */ jsx15("td", { children: rub(result.net) }),
                  /* @__PURE__ */ jsx15("td", { children: rub(iis.net) })
                ] }),
                /* @__PURE__ */ jsxs14("tr", { children: [
                  /* @__PURE__ */ jsx15("th", { scope: "row", children: "\u041A\u043E\u0433\u0434\u0430 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B \u0434\u0435\u043D\u044C\u0433\u0438" }),
                  /* @__PURE__ */ jsxs14("td", { children: [
                    "15 \u043B\u0435\u0442 \u0438\u043B\u0438 ",
                    result.payoutAge,
                    " \u043B\u0435\u0442"
                  ] }),
                  /* @__PURE__ */ jsxs14("td", { children: [
                    "\u0447\u0435\u0440\u0435\u0437 ",
                    iis.minHolding,
                    " ",
                    yearsWord(iis.minHolding)
                  ] })
                ] }),
                /* @__PURE__ */ jsxs14("tr", { children: [
                  /* @__PURE__ */ jsx15("th", { scope: "row", children: "\u041D\u0430\u0441\u043B\u0435\u0434\u043E\u0432\u0430\u043D\u0438\u0435" }),
                  /* @__PURE__ */ jsx15("td", { children: "\u0434\u0430, \u043A\u0440\u043E\u043C\u0435 \u043F\u043E\u0436\u0438\u0437\u043D\u0435\u043D\u043D\u044B\u0445 \u0432\u044B\u043F\u043B\u0430\u0442" }),
                  /* @__PURE__ */ jsx15("td", { children: "\u043D\u0435\u0442" })
                ] })
              ] }) }),
              /* @__PURE__ */ jsxs14("div", { className: "callout callout--" + (payoutBigger ? "info" : "warn"), children: [
                /* @__PURE__ */ jsx15("span", { className: "callout__title", children: payoutBigger ? `\u041F\u0414\u0421 \u0434\u0430\u0451\u0442 \u043D\u0430 ${rub(result.net - iis.net)} \u0431\u043E\u043B\u044C\u0448\u0435` : `\u0418\u0418\u0421-3 \u0434\u0430\u0451\u0442 \u043D\u0430 ${rub(iis.net - result.net)} \u0431\u043E\u043B\u044C\u0448\u0435` }),
                /* @__PURE__ */ jsx15("span", { className: "callout__text", children: payoutBigger ? "\u041D\u043E \u0434\u0435\u043D\u044C\u0433\u0438 \u0437\u0430\u043F\u0435\u0440\u0442\u044B \u0434\u043E\xA015\u202F\u043B\u0435\u0442 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430 \u0438\u043B\u0438\xA055/60\u202F\u043B\u0435\u0442, \u0430\xA0\u0418\u0418\u0421-3 \u043C\u043E\u0436\u043D\u043E \u0437\u0430\u043A\u0440\u044B\u0442\u044C \u0440\u0430\u043D\u044C\u0448\u0435 \u0431\u0435\u0437\xA0\u043F\u043E\u0442\u0435\u0440\u0438 \u043B\u044C\u0433\u043E\u0442" : "\u041F\u0414\u0421 \u043F\u0440\u043E\u0438\u0433\u0440\u044B\u0432\u0430\u0435\u0442 \u043D\u0430\xA0\u044D\u0442\u0438\u0445 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0430\u0445, \u043D\u043E\xA0\u0434\u0435\u043D\u044C\u0433\u0438 \u043C\u043E\u0436\u043D\u043E \u0437\u0430\u0431\u0440\u0430\u0442\u044C \u0440\u0430\u043D\u044C\u0448\u0435 \u0438\xA0\u0434\u043E\xA036 000\u202F\u20BD \u0432\xA0\u0433\u043E\u0434 \u0434\u0430\u0451\u0442 \u0433\u043E\u0441\u0443\u0434\u0430\u0440\u0441\u0442\u0432\u043E" })
              ] }),
              /* @__PURE__ */ jsxs14("a", { className: "pds-cta", href: "/", children: [
                /* @__PURE__ */ jsxs14("span", { className: "pds-cta__body", children: [
                  /* @__PURE__ */ jsx15("span", { className: "pds-cta__title", children: "\u041F\u043E\u0441\u0447\u0438\u0442\u0430\u0442\u044C \u0418\u0418\u0421-3" }),
                  /* @__PURE__ */ jsx15("span", { className: "pds-cta__text", children: "\u0422\u0440\u0438 \u0442\u0438\u043F\u0430 \u0441\u0447\u0451\u0442\u0430, \u0432\u044B\u0447\u0435\u0442\u044B, \u043D\u0430\u043B\u043E\u0433 \u043F\u0440\u0438\xA0\u0437\u0430\u043A\u0440\u044B\u0442\u0438\u0438 \u0438\xA0\u0434\u043E\u0445\u043E\u0434\u043D\u043E\u0441\u0442\u044C \u0441\xA0\u043F\u043E\u043F\u0440\u0430\u0432\u043A\u043E\u0439 \u043D\u0430\xA0\u0438\u043D\u0444\u043B\u044F\u0446\u0438\u044E" })
                ] }),
                /* @__PURE__ */ jsx15("span", { className: "pds-cta__arrow", "aria-hidden": "true", children: "\u2192" })
              ] })
            ] }) : null,
            tab === "rules" ? /* @__PURE__ */ jsxs14("article", { className: "rules", children: [
              /* @__PURE__ */ jsx15("p", { className: "rules__lead", children: "\u041F\u0440\u0430\u0432\u0438\u043B\u0430 \u041F\u0414\u0421 \u043D\u0430\xA02026\u202F\u0433\u043E\u0434: \u0447\u0442\u043E\xA0\u0434\u0430\u0451\u0442 \u0433\u043E\u0441\u0443\u0434\u0430\u0440\u0441\u0442\u0432\u043E, \u0447\u0442\u043E\xA0\u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u043D\u0430\u043B\u043E\u0433\u043E\u0432\u0430\u044F \u0438\xA0\u043A\u043E\u0433\u0434\u0430 \u043E\u0442\u0434\u0430\u044E\u0442 \u0434\u0435\u043D\u044C\u0433\u0438" }),
              /* @__PURE__ */ jsxs14("section", { className: "rules__block", children: [
                /* @__PURE__ */ jsx15("h3", { children: "\u0421\u043E\u0444\u0438\u043D\u0430\u043D\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435" }),
                /* @__PURE__ */ jsxs14("ul", { children: [
                  /* @__PURE__ */ jsxs14("li", { children: [
                    "\u0414\u043E ",
                    /* @__PURE__ */ jsx15("b", { children: "36 000\u202F\u20BD \u0432\xA0\u0433\u043E\u0434" }),
                    " \u0434\u0435\u0441\u044F\u0442\u044C \u043B\u0435\u0442 \u043F\u043E\u0434\u0440\u044F\u0434, \u0435\u0441\u043B\u0438 \u0432\u043D\u043E\u0441\u0438\u0442\u044C \u043D\u0435\xA0\u043C\u0435\u043D\u044C\u0448\u0435 2 000\u202F\u20BD \u0437\u0430\xA0\u0433\u043E\u0434"
                  ] }),
                  /* @__PURE__ */ jsx15("li", { children: "\u041A\u043E\u044D\u0444\u0444\u0438\u0446\u0438\u0435\u043D\u0442 \u0437\u0430\u0432\u0438\u0441\u0438\u0442 \u043E\u0442\xA0\u0441\u0440\u0435\u0434\u043D\u0435\u043C\u0435\u0441\u044F\u0447\u043D\u043E\u0433\u043E \u0434\u043E\u0445\u043E\u0434\u0430: \u0434\u043E\xA080 000\u202F\u20BD \u2014 1:1, \u043E\u0442\xA080 000 \u0434\u043E\xA0150 000\u202F\u20BD \u2014 1:2, \u0432\u044B\u0448\u0435\xA0\u2014 1:4" }),
                  /* @__PURE__ */ jsx15("li", { children: "\u041B\u0438\u043C\u0438\u0442 \u043E\u0431\u0449\u0438\u0439 \u043F\u043E\xA0\u0432\u0441\u0435\u043C \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430\u043C \u041F\u0414\u0421, \u0432\u043A\u043B\u044E\u0447\u0430\u044F \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u044B \u0432\xA0\u0434\u0440\u0443\u0433\u0438\u0445 \u0444\u043E\u043D\u0434\u0430\u0445" }),
                  /* @__PURE__ */ jsx15("li", { children: "\u0421\u043E\u0444\u0438\u043D\u0430\u043D\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u043F\u0440\u0435\u043A\u0440\u0430\u0449\u0430\u0435\u0442\u0441\u044F \u043F\u0440\u0438\xA0\u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0438 \u0432\u044B\u043F\u043B\u0430\u0442\u044B \u0438\u043B\u0438\xA0\u0432\u044B\u043A\u0443\u043F\u043D\u043E\u0439 \u0441\u0443\u043C\u043C\u044B, \u043A\u0440\u043E\u043C\u0435 \u043E\u0441\u043E\u0431\u044B\u0445 \u0436\u0438\u0437\u043D\u0435\u043D\u043D\u044B\u0445 \u0441\u0438\u0442\u0443\u0430\u0446\u0438\u0439" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs14("section", { className: "rules__block", children: [
                /* @__PURE__ */ jsx15("h3", { children: "\u041D\u0430\u043B\u043E\u0433\u043E\u0432\u044B\u0439 \u0432\u044B\u0447\u0435\u0442" }),
                /* @__PURE__ */ jsxs14("ul", { children: [
                  /* @__PURE__ */ jsxs14("li", { children: [
                    "\u0411\u0430\u0437\u0430\xA0\u2014 ",
                    /* @__PURE__ */ jsx15("b", { children: "400 000\u202F\u20BD \u0432\xA0\u0433\u043E\u0434" }),
                    " \u043B\u0438\u0447\u043D\u044B\u0445 \u0432\u0437\u043D\u043E\u0441\u043E\u0432, \u043E\u0431\u0449\u0430\u044F \u0441\xA0\u0418\u0418\u0421-3 \u0438\xA0\u041D\u041F\u041E"
                  ] }),
                  /* @__PURE__ */ jsx15("li", { children: "\u0412\u043E\u0437\u0432\u0440\u0430\u0442\xA0\u2014 52 000\u202F\u20BD \u043F\u0440\u0438\xA0\u0441\u0442\u0430\u0432\u043A\u0435 13%, \u0434\u043E\xA088 000\u202F\u20BD \u043F\u0440\u0438\xA022%, \u043D\u043E\xA0\u043D\u0435\xA0\u0431\u043E\u043B\u044C\u0448\u0435 \u0443\u043F\u043B\u0430\u0447\u0435\u043D\u043D\u043E\u0433\u043E \u041D\u0414\u0424\u041B" }),
                  /* @__PURE__ */ jsx15("li", { children: "\u0414\u043B\u044F \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u043E\u0432 2024\u20132026 \u0433\u043E\u0434\u043E\u0432 \u043D\u0443\u0436\u043D\u043E \u043F\u0440\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C 5\u202F\u043B\u0435\u0442, \u0434\u0430\u043B\u044C\u0448\u0435 \u0441\u0440\u043E\u043A \u0440\u0430\u0441\u0442\u0451\u0442 \u0434\u043E\xA010\u202F\u043B\u0435\u0442 \u043A\xA02031 \u0433\u043E\u0434\u0443" }),
                  /* @__PURE__ */ jsx15("li", { children: "\u041E\u0434\u043D\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u043D\u0435\xA0\u0431\u043E\u043B\u044C\u0448\u0435 \u0442\u0440\u0451\u0445 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u043E\u0432 \u041F\u0414\u0421, \u0438\u043D\u0430\u0447\u0435 \u0432\u044B\u0447\u0435\u0442 \u043D\u0435\xA0\u0434\u0430\u0434\u0443\u0442" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs14("section", { className: "rules__block", children: [
                /* @__PURE__ */ jsx15("h3", { children: "\u041A\u043E\u0433\u0434\u0430 \u043C\u043E\u0436\u043D\u043E \u0437\u0430\u0431\u0440\u0430\u0442\u044C" }),
                /* @__PURE__ */ jsxs14("ul", { children: [
                  /* @__PURE__ */ jsxs14("li", { children: [
                    /* @__PURE__ */ jsx15("b", { children: "55\u202F\u043B\u0435\u0442 \u0436\u0435\u043D\u0449\u0438\u043D\u0430\u043C \u0438\xA060 \u043C\u0443\u0436\u0447\u0438\u043D\u0430\u043C" }),
                    " \u0438\u043B\u0438\xA015\u202F\u043B\u0435\u0442 \u0441\xA0\u0434\u0430\u0442\u044B \u043F\u0435\u0440\u0432\u043E\u0433\u043E \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430\xA0\u2014 \u0447\u0442\u043E\xA0\u043D\u0430\u0441\u0442\u0443\u043F\u0438\u0442 \u0440\u0430\u043D\u044C\u0448\u0435"
                  ] }),
                  /* @__PURE__ */ jsx15("li", { children: "\u041B\u0438\u0447\u043D\u044B\u0435 \u0432\u0437\u043D\u043E\u0441\u044B \u043C\u043E\u0436\u043D\u043E \u0437\u0430\u0431\u0440\u0430\u0442\u044C \u0438\xA0\u0440\u0430\u043D\u044C\u0448\u0435, \u043D\u043E\xA0\u0432\xA0\u0440\u0430\u0437\u043C\u0435\u0440\u0435 \u043F\u043E\xA0\u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0443; \u0444\u043E\u043D\u0434 \u043C\u043E\u0436\u0435\u0442 \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u043E\u043D\u0438\u0436\u0430\u044E\u0449\u0438\u0435 \u043A\u043E\u044D\u0444\u0444\u0438\u0446\u0438\u0435\u043D\u0442\u044B" }),
                  /* @__PURE__ */ jsx15("li", { children: "\u0421\u043E\u0444\u0438\u043D\u0430\u043D\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435, \u043F\u0435\u0440\u0435\u0432\u0435\u0434\u0451\u043D\u043D\u044B\u0435 \u043D\u0430\u043A\u043E\u043F\u043B\u0435\u043D\u0438\u044F \u0438\xA0\u0434\u043E\u0445\u043E\u0434 \u043E\u0442\xA0\u043D\u0438\u0445 \u043E\u0441\u0442\u0430\u044E\u0442\u0441\u044F \u043D\u0430\xA0\u0441\u0447\u0451\u0442\u0435 \u0434\u043E\xA0\u0441\u0440\u043E\u043A\u0430 \u0432\u044B\u043F\u043B\u0430\u0442" }),
                  /* @__PURE__ */ jsx15("li", { children: "\u041E\u0441\u043E\u0431\u044B\u0435 \u0436\u0438\u0437\u043D\u0435\u043D\u043D\u044B\u0435 \u0441\u0438\u0442\u0443\u0430\u0446\u0438\u0438\xA0\u2014 \u0434\u043E\u0440\u043E\u0433\u043E\u0441\u0442\u043E\u044F\u0449\u0435\u0435 \u043B\u0435\u0447\u0435\u043D\u0438\u0435 \u0438\xA0\u043F\u043E\u0442\u0435\u0440\u044F \u043A\u043E\u0440\u043C\u0438\u043B\u044C\u0446\u0430: \u0434\u043E\xA0100% \u0431\u0435\u0437\xA0\u043F\u043E\u0442\u0435\u0440\u0438 \u043B\u044C\u0433\u043E\u0442" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs14("section", { className: "rules__block", children: [
                /* @__PURE__ */ jsx15("h3", { children: "\u0412\u044B\u043F\u043B\u0430\u0442\u044B \u0438\xA0\u043D\u0430\u043B\u043E\u0433 \u043D\u0430\xA0\u0434\u043E\u0445\u043E\u0434" }),
                /* @__PURE__ */ jsxs14("ul", { children: [
                  /* @__PURE__ */ jsx15("li", { children: "\u0421\u0440\u043E\u0447\u043D\u0430\u044F\xA0\u2014 \u043E\u0442\xA010\u202F\u043B\u0435\u0442, \u043F\u043E\u0436\u0438\u0437\u043D\u0435\u043D\u043D\u0430\u044F \u0438\u043B\u0438\xA0\u0435\u0434\u0438\u043D\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u0430\u044F" }),
                  /* @__PURE__ */ jsxs14("li", { children: [
                    "\u0414\u043E\u0445\u043E\u0434 \u043D\u0435\xA0\u043E\u0431\u043B\u0430\u0433\u0430\u0435\u0442\u0441\u044F \u041D\u0414\u0424\u041B \u0432\xA0\u043F\u0440\u0435\u0434\u0435\u043B\u0430\u0445 ",
                    /* @__PURE__ */ jsx15("b", { children: "30\u202F\u043C\u043B\u043D \u20BD" }),
                    " \u043D\u0430\xA0\u0434\u043E\u0433\u043E\u0432\u043E\u0440, \u0435\u0441\u043B\u0438 \u0432\u044B\u043F\u043B\u0430\u0442\u044B \u043D\u0435\xA0\u0440\u0430\u043D\u044C\u0448\u0435 10\u202F\u043B\u0435\u0442, \u0434\u043E\u0433\u043E\u0432\u043E\u0440 \u0432\xA0\u0441\u0432\u043E\u044E \u043F\u043E\u043B\u044C\u0437\u0443 \u0438\xA0\u0441\u0447\u0435\u0442\u043E\u0432 \u043D\u0435\xA0\u0431\u043E\u043B\u044C\u0448\u0435 \u0442\u0440\u0451\u0445"
                  ] }),
                  /* @__PURE__ */ jsx15("li", { children: "\u041F\u0440\u0438 \u0434\u043E\u0441\u0440\u043E\u0447\u043D\u043E\u043C \u0440\u0430\u0441\u0442\u043E\u0440\u0436\u0435\u043D\u0438\u0438 \u0444\u043E\u043D\u0434 \u0443\u0434\u0435\u0440\u0436\u0438\u0442 \u041D\u0414\u0424\u041B \u0441\xA0\u0434\u043E\u0445\u043E\u0434\u0430 \u0438\xA0\u0441\xA0\u0432\u0437\u043D\u043E\u0441\u043E\u0432, \u043F\u043E\xA0\u043A\u043E\u0442\u043E\u0440\u044B\u043C \u0432\u044B\xA0\u043F\u043E\u043B\u0443\u0447\u0430\u043B\u0438 \u0432\u044B\u0447\u0435\u0442" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs14("section", { className: "rules__block", children: [
                /* @__PURE__ */ jsx15("h3", { children: "\u041E\u041F\u0421: \u043D\u0430\u043A\u043E\u043F\u0438\u0442\u0435\u043B\u044C\u043D\u0430\u044F \u0447\u0430\u0441\u0442\u044C" }),
                /* @__PURE__ */ jsxs14("ul", { children: [
                  /* @__PURE__ */ jsx15("li", { children: "\u041D\u0430\u043A\u043E\u043F\u043B\u0435\u043D\u0438\u044F 2002\u20132013 \u0433\u043E\u0434\u043E\u0432 \u043C\u043E\u0436\u043D\u043E \u043F\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438 \u043D\u0430\xA0\u0441\u0447\u0451\u0442 \u041F\u0414\u0421 \u0435\u0434\u0438\u043D\u043E\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u043C \u0432\u0437\u043D\u043E\u0441\u043E\u043C" }),
                  /* @__PURE__ */ jsx15("li", { children: "\u041E\u043D\u0438 \u043D\u0435\xA0\u0434\u0430\u044E\u0442 \u0441\u043E\u0444\u0438\u043D\u0430\u043D\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u0438\xA0\u0432\u044B\u0447\u0435\u0442\u0430, \u0437\u0430\u0442\u043E \u0433\u0430\u0440\u0430\u043D\u0442\u0438\u0440\u0443\u044E\u0442\u0441\u044F \u0433\u043E\u0441\u0443\u0434\u0430\u0440\u0441\u0442\u0432\u043E\u043C \u0431\u0435\u0437\xA0\u043B\u0438\u043C\u0438\u0442\u0430 2,8\u202F\u043C\u043B\u043D \u20BD" }),
                  /* @__PURE__ */ jsx15("li", { children: "\u0414\u043E\u0441\u0440\u043E\u0447\u043D\u043E \u0438\u0445\xA0\u043D\u0435\xA0\u0432\u044B\u0434\u0430\u044E\u0442\xA0\u2014 \u0442\u043E\u043B\u044C\u043A\u043E \u0432\u043C\u0435\u0441\u0442\u0435 \u0441\xA0\u0432\u044B\u043F\u043B\u0430\u0442\u0430\u043C\u0438" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs14("section", { className: "rules__block", children: [
                /* @__PURE__ */ jsx15("h3", { children: "\u0413\u0430\u0440\u0430\u043D\u0442\u0438\u0438 \u0438\xA0\u043D\u0430\u0441\u043B\u0435\u0434\u0441\u0442\u0432\u043E" }),
                /* @__PURE__ */ jsxs14("ul", { children: [
                  /* @__PURE__ */ jsxs14("li", { children: [
                    "\u0412\u0437\u043D\u043E\u0441\u044B \u0438\xA0\u0434\u043E\u0445\u043E\u0434 \u0437\u0430\u0441\u0442\u0440\u0430\u0445\u043E\u0432\u0430\u043D\u044B \u0410\u0421\u0412 \u043D\u0430\xA0",
                    /* @__PURE__ */ jsx15("b", { children: "2,8\u202F\u043C\u043B\u043D \u20BD" }),
                    "; \u0441\u043E\u0444\u0438\u043D\u0430\u043D\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0438\xA0\u043D\u0430\u043A\u043E\u043F\u043B\u0435\u043D\u0438\u044F \u041E\u041F\u0421\xA0\u2014 \u0431\u0435\u0437\xA0\u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0438\u044F"
                  ] }),
                  /* @__PURE__ */ jsx15("li", { children: "\u0421\u0431\u0435\u0440\u0435\u0436\u0435\u043D\u0438\u044F \u043D\u0430\u0441\u043B\u0435\u0434\u0443\u044E\u0442\u0441\u044F, \u043A\u0440\u043E\u043C\u0435 \u0441\u043B\u0443\u0447\u0430\u044F \u043F\u043E\u0436\u0438\u0437\u043D\u0435\u043D\u043D\u044B\u0445 \u0432\u044B\u043F\u043B\u0430\u0442" }),
                  /* @__PURE__ */ jsx15("li", { children: "\u041F\u0440\u0430\u0432\u043E\u043F\u0440\u0435\u0435\u043C\u043D\u0438\u043A\u0430\u043C \u043D\u0443\u0436\u043D\u043E \u043E\u0431\u0440\u0430\u0442\u0438\u0442\u044C\u0441\u044F \u0432\xA0\u0444\u043E\u043D\u0434 \u0432\xA0\u0442\u0435\u0447\u0435\u043D\u0438\u0435 \u0448\u0435\u0441\u0442\u0438 \u043C\u0435\u0441\u044F\u0446\u0435\u0432" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs14("section", { className: "rules__block", children: [
                /* @__PURE__ */ jsx15("h3", { children: "\u0427\u0430\u0441\u0442\u044B\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B" }),
                /* @__PURE__ */ jsx15("div", { className: "faq", children: PDS_FAQ.map((item, index) => {
                  const open = openFaq === index;
                  return /* @__PURE__ */ jsxs14("div", { className: "faq__item" + (open ? " is-open" : ""), children: [
                    /* @__PURE__ */ jsx15("h3", { className: "faq__heading", children: /* @__PURE__ */ jsxs14(
                      "button",
                      {
                        type: "button",
                        className: "faq__toggle",
                        "aria-expanded": open,
                        "aria-controls": `pds-faq-panel-${index}`,
                        onClick: () => setOpenFaq(open ? null : index),
                        children: [
                          /* @__PURE__ */ jsx15("span", { className: "faq__question", children: item.question }),
                          /* @__PURE__ */ jsx15(
                            "svg",
                            {
                              className: "faq__chevron",
                              width: "18",
                              height: "18",
                              viewBox: "0 0 24 24",
                              "aria-hidden": "true",
                              children: /* @__PURE__ */ jsx15(
                                "path",
                                {
                                  d: "M6 9l6 6 6-6",
                                  fill: "none",
                                  stroke: "currentColor",
                                  strokeWidth: "2",
                                  strokeLinecap: "round",
                                  strokeLinejoin: "round"
                                }
                              )
                            }
                          )
                        ]
                      }
                    ) }),
                    /* @__PURE__ */ jsx15(Collapse, { open, children: /* @__PURE__ */ jsx15("p", { className: "faq__answer", id: `pds-faq-panel-${index}`, children: item.answer }) })
                  ] }, item.question);
                }) })
              ] }),
              /* @__PURE__ */ jsxs14("p", { className: "rules__sources", children: [
                "\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A\u0438:",
                " ",
                /* @__PURE__ */ jsx15(
                  "a",
                  {
                    href: "https://www.cbr.ru/faq/pens_k_inv/program/",
                    target: "_blank",
                    rel: "noopener noreferrer",
                    children: "\u0411\u0430\u043D\u043A \u0420\u043E\u0441\u0441\u0438\u0438 \u043E\xA0\u041F\u0414\u0421"
                  }
                ),
                " ",
                "\u0438",
                " ",
                /* @__PURE__ */ jsx15(
                  "a",
                  {
                    href: "https://www.nalog.gov.ru/rn38/news/activities_fts/16549792/",
                    target: "_blank",
                    rel: "noopener noreferrer",
                    children: "\u0424\u041D\u0421 \u043E\xA0\u0432\u044B\u0447\u0435\u0442\u0435"
                  }
                ),
                ". \u041F\u0440\u0430\u0432\u0438\u043B\u0430 \u0437\u0430\u0444\u0438\u043A\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u044B \u043D\u0430\xA02026\u202F\u0433\u043E\u0434, \u044D\u0442\u043E\xA0\u043D\u0435\xA0\u0438\u043D\u0432\u0435\u0441\u0442\u0438\u0446\u0438\u043E\u043D\u043D\u0430\u044F \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u044F"
              ] })
            ] }) : null
          ] }, tab) })
        ] }),
        /* @__PURE__ */ jsx15("aside", { className: "layout__aside", children: /* @__PURE__ */ jsxs14("div", { className: "summary", children: [
          /* @__PURE__ */ jsxs14("div", { className: "summary__hero", children: [
            /* @__PURE__ */ jsx15("span", { className: "summary__hero-label", children: "\u041D\u0430 \u0441\u0447\u0451\u0442\u0435 \u043A\xA0\u0432\u044B\u043F\u043B\u0430\u0442\u0430\u043C" }),
            /* @__PURE__ */ jsx15("span", { className: "summary__hero-value", children: /* @__PURE__ */ jsx15(RollingNumber, { value: Math.round(result.capital), format: (n) => rub(n) }) }),
            /* @__PURE__ */ jsxs14("span", { className: "summary__hero-sub", children: [
              "\u043D\u0430\xA0\u0440\u0443\u043A\u0438 \u0432\xA0\u0441\u0435\u0433\u043E\u0434\u043D\u044F\u0448\u043D\u0438\u0445 \u0446\u0435\u043D\u0430\u0445\xA0\u2014 ",
              /* @__PURE__ */ jsx15("b", { children: compactRub(result.netReal) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs14("dl", { className: "stats", children: [
            /* @__PURE__ */ jsxs14("div", { className: "stat", children: [
              /* @__PURE__ */ jsx15("dt", { children: "\u0413\u043E\u0441\u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430" }),
              /* @__PURE__ */ jsx15("dd", { className: "is-ok", children: /* @__PURE__ */ jsx15(RollingNumber, { value: Math.round(result.cofinancing), format: (n) => rub(n) }) }),
              /* @__PURE__ */ jsx15("span", { className: "stat__sub", children: rate === 1 ? "1:1 \u043F\u043E\xA0\u0432\u0437\u043D\u043E\u0441\u0430\u043C" : rate === 0.5 ? "1:2, \u043F\u043E\u043B\u043E\u0432\u0438\u043D\u0430 \u0432\u0437\u043D\u043E\u0441\u043E\u0432" : "1:4, \u0447\u0435\u0442\u0432\u0435\u0440\u0442\u044C \u0432\u0437\u043D\u043E\u0441\u043E\u0432" })
            ] }),
            /* @__PURE__ */ jsxs14("div", { className: "stat", children: [
              /* @__PURE__ */ jsx15("dt", { children: "\u0412\u044B\u0447\u0435\u0442 \u0437\u0430\xA0\u0441\u0440\u043E\u043A" }),
              /* @__PURE__ */ jsx15("dd", { children: /* @__PURE__ */ jsx15(RollingNumber, { value: Math.round(result.refunds), format: (n) => rub(n) }) }),
              /* @__PURE__ */ jsxs14("span", { className: "stat__sub", children: [
                "\u0441\u0442\u0430\u0432\u043A\u0430 \u041D\u0414\u0424\u041B \u2248 ",
                (taxRate * 100).toFixed(0),
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxs14("div", { className: "stat", children: [
              /* @__PURE__ */ jsx15("dt", { children: "\u041D\u0430\u043B\u043E\u0433 \u043F\u0440\u0438\xA0\u0432\u044B\u043F\u043B\u0430\u0442\u0430\u0445" }),
              /* @__PURE__ */ jsx15("dd", { className: result.exitTax > 0 ? "is-warn" : "is-ok", children: result.exitTax > 0 ? rub(result.exitTax) : "0 \u20BD" }),
              /* @__PURE__ */ jsx15("span", { className: "stat__sub", children: result.taxExempt ? "\u0434\u043E\u0445\u043E\u0434 \u043E\u0441\u0432\u043E\u0431\u043E\u0436\u0434\u0451\u043D \u0434\u043E\xA030\u202F\u043C\u043B\u043D" : "\u043B\u044C\u0433\u043E\u0442\u044B \u043D\u0435\u0442" })
            ] }),
            /* @__PURE__ */ jsxs14("div", { className: "stat", children: [
              /* @__PURE__ */ jsx15("dt", { children: "\u0412\u044B\u043F\u043B\u0430\u0442\u0430" }),
              /* @__PURE__ */ jsx15("dd", { className: "is-ok", children: scenario.payoutType === "lump" ? rub(result.payoutMonthly) : `${rub(Math.round(result.payoutMonthly))} / \u043C\u0435\u0441` }),
              /* @__PURE__ */ jsxs14("span", { className: "stat__sub", children: [
                PAYOUT_LABELS[scenario.payoutType],
                scenario.payoutType === "lifetime" ? " \xB7 \u043E\u0440\u0438\u0435\u043D\u0442\u0438\u0440 \u043D\u0430\xA022\u202F\u0433\u043E\u0434\u0430" : ""
              ] })
            ] })
          ] }),
          warnings.map((text2) => /* @__PURE__ */ jsx15("div", { className: "callout callout--info", children: /* @__PURE__ */ jsx15("span", { className: "callout__text", children: text2 }) }, text2)),
          /* @__PURE__ */ jsxs14("ul", { className: "pds__facts", children: [
            /* @__PURE__ */ jsx15("li", { children: "\u0413\u0430\u0440\u0430\u043D\u0442\u0438\u044F \u0410\u0421\u0412\xA0\u2014 2,8\u202F\u043C\u043B\u043D \u20BD, \u043F\u043B\u044E\u0441 \u0441\u043E\u0444\u0438\u043D\u0430\u043D\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0438\xA0\u043F\u0435\u0440\u0435\u0432\u0435\u0434\u0451\u043D\u043D\u044B\u0435 \u043D\u0430\u043A\u043E\u043F\u043B\u0435\u043D\u0438\u044F" }),
            /* @__PURE__ */ jsx15("li", { children: "\u041D\u0430\u0441\u043B\u0435\u0434\u0443\u0435\u0442\u0441\u044F \u043F\u0440\u0430\u0432\u043E\u043F\u0440\u0435\u0435\u043C\u043D\u0438\u043A\u0430\u043C, \u043A\u0440\u043E\u043C\u0435 \u0441\u043B\u0443\u0447\u0430\u044F \u043F\u043E\u0436\u0438\u0437\u043D\u0435\u043D\u043D\u044B\u0445 \u0432\u044B\u043F\u043B\u0430\u0442" }),
            /* @__PURE__ */ jsx15("li", { children: "\u041B\u0438\u0447\u043D\u044B\u0435 \u0432\u0437\u043D\u043E\u0441\u044B \u043C\u043E\u0436\u043D\u043E \u0437\u0430\u0431\u0440\u0430\u0442\u044C \u0440\u0430\u043D\u044C\u0448\u0435, \u043D\u043E\xA0\u0441\u043E\u0444\u0438\u043D\u0430\u043D\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u043E\u0441\u0442\u0430\u043D\u0435\u0442\u0441\u044F \u043D\u0430\xA0\u0441\u0447\u0451\u0442\u0435" })
          ] }),
          /* @__PURE__ */ jsxs14("div", { className: "callout callout--info pds__compare", children: [
            /* @__PURE__ */ jsxs14("span", { className: "callout__title", children: [
              "\u0422\u043E\u0442 \u0436\u0435 \u0432\u0437\u043D\u043E\u0441 \u0432 \u0418\u0418\u0421-3 \u2014 ",
              rub(iis.net)
            ] }),
            /* @__PURE__ */ jsxs14("span", { className: "callout__text", children: [
              payoutBigger ? `\u041F\u0414\u0421 \u0434\u0430\u0451\u0442 \u043D\u0430 ${rub(result.net - iis.net)} \u0431\u043E\u043B\u044C\u0448\u0435` : `\u041F\u0414\u0421 \u0434\u0430\u0451\u0442 \u043D\u0430 ${rub(iis.net - result.net)} \u043C\u0435\u043D\u044C\u0448\u0435`,
              " ",
              "\u2014 \u043D\u043E \u0434\u0435\u043D\u044C\u0433\u0438 \u0437\u0430\u043F\u0435\u0440\u0442\u044B \u0434\u043E ",
              PDS_RULES.payoutYears,
              " \u043B\u0435\u0442"
            ] })
          ] }),
          /* @__PURE__ */ jsxs14("div", { className: "summary__meta", children: [
            /* @__PURE__ */ jsxs14("span", { children: [
              "\u0412\u043E\u0437\u0440\u0430\u0441\u0442 \u0432\u044B\u043F\u043B\u0430\u0442 \u2014 ",
              result.payoutAge,
              " \u043B\u0435\u0442"
            ] }),
            /* @__PURE__ */ jsxs14("span", { children: [
              "\u0414\u043E \u0432\u044B\u043F\u043B\u0430\u0442 \u2014 ",
              scenario.holdingYears,
              " ",
              yearsWord(scenario.holdingYears)
            ] })
          ] })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs14("footer", { className: "footer", children: [
      /* @__PURE__ */ jsxs14("div", { className: "footer__top", children: [
        /* @__PURE__ */ jsx15(LikeButton, { hint: "\u0415\u0441\u043B\u0438 \u0431\u044B\u043B\u043E \u043F\u043E\u043B\u0435\u0437\u043D\u043E, \u043F\u043E\u0441\u0442\u0430\u0432\u044C \u043B\u0430\u0439\u043A" }),
        /* @__PURE__ */ jsx15("a", { className: "footer__link", href: "/", children: "\u041A\u0430\u043B\u044C\u043A\u0443\u043B\u044F\u0442\u043E\u0440 \u0418\u0418\u0421-3" }),
        /* @__PURE__ */ jsx15("a", { className: "footer__link", href: "/privacy", children: "\u041F\u043E\u043B\u0438\u0442\u0438\u043A\u0430 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438" })
      ] }),
      /* @__PURE__ */ jsx15("p", { className: "footer__note", children: "\u041F\u0440\u0430\u0432\u0438\u043B\u0430 2026\u202F\u0433\u043E\u0434\u0430. \u0420\u0430\u0441\u0447\u0451\u0442 \u043D\u0435\xA0\u0443\u0447\u0438\u0442\u044B\u0432\u0430\u0435\u0442 \u043A\u043E\u043C\u0438\u0441\u0441\u0438\u0438 \u0444\u043E\u043D\u0434\u0430, \u0441\u043C\u0435\u043D\u0443 \u043F\u0440\u0430\u0432\u0438\u043B \u0438\xA0\u0438\u043D\u0434\u0438\u0432\u0438\u0434\u0443\u0430\u043B\u044C\u043D\u044B\u0435 \u0443\u0441\u043B\u043E\u0432\u0438\u044F \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430. \u041D\u0435 \u0438\u043D\u0432\u0435\u0441\u0442\u0438\u0446\u0438\u043E\u043D\u043D\u0430\u044F \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u044F" }),
      /* @__PURE__ */ jsxs14("div", { className: "footer__bottom", children: [
        /* @__PURE__ */ jsx15("span", { className: "footer__updated", children: updatedLabel }),
        /* @__PURE__ */ jsxs14("span", { className: "footer__built", children: [
          "Built by",
          " ",
          /* @__PURE__ */ jsx15(
            "a",
            {
              className: "footer__author",
              href: "https://maletskiy-design.ru",
              target: "_blank",
              rel: "noopener noreferrer",
              children: "Maletskiy Design"
            }
          )
        ] })
      ] })
    ] })
  ] });
}

// scripts/prerender-entry.tsx
import { jsx as jsx16, jsxs as jsxs15 } from "react/jsx-runtime";
function renderHome() {
  return renderToString(
    /* @__PURE__ */ jsx16(StrictMode, { children: /* @__PURE__ */ jsx16(App, {}) })
  );
}
function renderPrivacyPage() {
  return renderToString(
    /* @__PURE__ */ jsx16(StrictMode, { children: /* @__PURE__ */ jsxs15("div", { className: "app", children: [
      /* @__PURE__ */ jsx16(Topbar, {}),
      /* @__PURE__ */ jsx16(Privacy, {})
    ] }) })
  );
}
function renderPdsPage() {
  return renderToString(
    /* @__PURE__ */ jsx16(StrictMode, { children: /* @__PURE__ */ jsx16(Pds, { initialTab: "rules" }) })
  );
}
function pdsFaqJsonLd() {
  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": "https://triis.ru/pds#faq",
      mainEntity: PDS_FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer }
      }))
    },
    null,
    2
  );
}
function faqJsonLd() {
  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": "https://triis.ru/#faq",
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer }
      }))
    },
    null,
    2
  );
}
export {
  faqJsonLd,
  pdsFaqJsonLd,
  renderHome,
  renderPdsPage,
  renderPrivacyPage
};
