import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { InputHTMLAttributes, ReactNode, RefObject } from "react";

/* ------------------------------------------------------------------ */
/* Плавные числа: «не инстантом» — значение доезжает до нового за 420 мс */
/* ------------------------------------------------------------------ */

const reduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function useAnimatedNumber(target: number, duration = 420): number {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduceMotion()) {
      setValue(target);
      return;
    }
    const from = fromRef.current;
    if (from === target) return;
    startRef.current = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (target - from) * eased;
      setValue(next);
      fromRef.current = next;
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

export function AnimatedValue({
  value,
  format,
}: {
  value: number;
  format: (n: number) => string;
}) {
  const shown = useAnimatedNumber(value);
  return <>{format(shown)}</>;
}

/**
 * Число-«одометр»: каждая цифра едет по своей полосе 0–9, поэтому смена
 * значения выглядит как прокрутка, а не как подмена текста.
 */
function Digit({ digit }: { digit: number }) {
  return (
    <span className="roll__digit">
      <span className="roll__strip" style={{ transform: `translateY(-${digit}em)` }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((value) => (
          <span key={value} className="roll__slot">
            {value}
          </span>
        ))}
      </span>
    </span>
  );
}

export function RollingNumber({
  value,
  format,
}: {
  value: number;
  format: (n: number) => string;
}) {
  const text = format(Math.round(value));

  return (
    <span className="roll" aria-label={text}>
      {[...text].map((char, index) =>
        /\d/.test(char) ? (
          <Digit key={index} digit={Number(char)} />
        ) : (
          <span key={index} className="roll__static">
            {char}
          </span>
        ),
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Скользящая подложка сегментов                                     */
/* ------------------------------------------------------------------ */

export type ThumbBox = { left: number; top: number; width: number; height: number };

export function useSlidingThumb(
  ref: RefObject<HTMLElement | null>,
  activeSelector: string,
  deps: unknown[],
): ThumbBox | null {
  const [thumb, setThumb] = useState<ThumbBox | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const active = el.querySelector<HTMLElement>(activeSelector);
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
        height: item.height,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return thumb;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  stack,
  label,
}: {
  value: T;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
  stack?: boolean;
  label?: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumb = useSlidingThumb(trackRef, ".segmented__item.is-active", [
    value,
    options.length,
    stack,
  ]);

  return (
    <div
      ref={trackRef}
      className={"segmented" + (stack ? " segmented--stack" : "")}
      role="tablist"
      aria-label={label}
    >
      {thumb && (
        <span
          className="segmented__thumb"
          aria-hidden="true"
          style={{
            transform: `translate(${thumb.left}px, ${thumb.top}px)`,
            width: thumb.width,
            height: thumb.height,
          }}
        />
      )}
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          title={option.title}
          className={"segmented__item" + (option.value === value ? " is-active" : "")}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Тумблер со «сплющиванием»                                          */
/* ------------------------------------------------------------------ */

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  const fromSwitch = useRef(false);

  return (
    <div
      className="toggle"
      onPointerDown={(e) => {
        fromSwitch.current = !!(e.target as HTMLElement).closest(".toggle__switch");
      }}
      onPointerUp={() => {
        if (fromSwitch.current) {
          fromSwitch.current = false;
          return;
        }
        onChange(!checked);
      }}
    >
      <span className="toggle__switch">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          className={"squish" + (checked ? " is-on" : "")}
          onClick={() => onChange(!checked)}
        >
          <span className="squish__thumb" />
        </button>
      </span>
      <span className="toggle__text">
        <span className="toggle__label">{label}</span>
        {hint ? <span className="toggle__hint">{hint}</span> : null}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Сворачиваемые секции — плавно, через grid-template-rows             */
/* ------------------------------------------------------------------ */

export function Section({
  title,
  hint,
  children,
  aside,
  collapsible = false,
  defaultOpen,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  aside?: ReactNode;
  collapsible?: boolean;
  /** свёрнутая секция может стартовать раскрытой */
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? !collapsible);
  const [animating, setAnimating] = useState(false);

  const toggle = () => {
    setAnimating(true);
    setOpen((was) => !was);
    window.setTimeout(() => setAnimating(false), 380);
  };

  return (
    <section
      className={
        "section" +
        (collapsible ? " section--collapsible" : "") +
        (!open ? " is-collapsed" : "") +
        (animating ? " is-animating" : "")
      }
    >
      <header className="section__head">
        {collapsible ? (
          <button type="button" className="section__toggle" aria-expanded={open} onClick={toggle}>
            <h2 className="section__title">{title}</h2>
            <Chevron />
          </button>
        ) : (
          <h2 className="section__title">{title}</h2>
        )}
        {aside}
      </header>
      {hint ? <p className="section__hint">{hint}</p> : null}
      <div className="section__body-wrap">
        <div className="section__body-clip">
          <div className="section__body">
            {collapsible ? children : <AnimatedHeight>{children}</AnimatedHeight>}
          </div>
        </div>
      </div>
    </section>
  );
}

function Chevron() {
  return (
    <svg className="section__chevron" width="1.1em" height="1.1em" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 9l6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Сворачивание и разворачивание блока в обе стороны: высота едет через
 * grid-template-rows, содержимое остаётся в DOM — поэтому уход тоже плавный.
 */
export function Collapse({
  open,
  children,
}: {
  open: boolean;
  children: ReactNode;
}) {
  return (
    <div className={"collapse" + (open ? " is-open" : "")} aria-hidden={!open}>
      <div className="collapse__clip">
        <div className="collapse__inner">{children}</div>
      </div>
    </div>
  );
}

/**
 * Плавная смена высоты контейнера под содержимое: используется и для табов,
 * и для секций — чтобы кадр перерисовывался, а не прыгал.
 */
export function AnimatedHeight({ children }: { children: ReactNode }) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    let timer: number | undefined;
    let first = true;
    const sync = () => {
      const next = el.getBoundingClientRect().height;
      setHeight((prev) => {
        if (first) {
          first = false;
          return next;
        }
        if (prev !== undefined && Math.abs(prev - next) > 0.5) {
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

  return (
    <div
      className={"auto-height" + (animating ? " is-animating" : "")}
      style={height === undefined ? undefined : { height }}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Копирование с галочкой                                             */
/* ------------------------------------------------------------------ */

function CheckMark() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 6L9 17l-5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function useCopyState(timeout = 1600) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

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

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* падаем на запасной путь ниже */
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
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

export function CopyButton({
  text,
  label,
  copiedLabel,
  onResult,
  variant = "primary",
}: {
  text: string;
  label: string;
  copiedLabel: string;
  onResult?: (ok: boolean) => void;
  variant?: "primary" | "ghost";
}) {
  const { copied, flash } = useCopyState();

  return (
    <button
      type="button"
      className={
        "btn" + (variant === "primary" ? " btn--primary" : " btn--ghost") + (copied ? " is-done" : "")
      }
      onClick={async () => {
        const ok = await copyToClipboard(text);
        onResult?.(ok);
        if (ok) flash();
      }}
      aria-live="polite"
    >
      <span className="btn__icon" aria-hidden="true">
        {copied ? <CheckMark /> : <LinkIcon />}
      </span>
      {copied ? copiedLabel : label}
    </button>
  );
}

function LinkIcon() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1L10.6 5.3M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.4-1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Нижняя шторка                                                      */
/* ------------------------------------------------------------------ */

export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
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

  return (
    <div
      className={"sheet" + (closing ? " is-closing" : "")}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button type="button" className="sheet__backdrop" aria-label="Закрыть" onClick={onClose} />
      <div className="sheet__panel">
        <span className="sheet__handle" aria-hidden="true" />
        <div className="sheet__head">
          <h3 className="sheet__title">{title}</h3>
          <button type="button" className="sheet__close" aria-label="Закрыть" onClick={onClose}>
            <svg width="0.9em" height="0.9em" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="sheet__body">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Поле                                                               */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

/** Текстовое поле с крестиком очистки. */
export function ClearableInput({
  value,
  onChange,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  value: string;
  onChange: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <span className="input-wrap">
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
      />
      {focused && value.length > 0 && (
        <button
          type="button"
          className="input-wrap__clear"
          aria-label="Очистить"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange("")}
        >
          <svg width="0.6em" height="0.6em" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
}
