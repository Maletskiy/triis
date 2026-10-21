import { useCallback, useEffect, useRef } from "react";

const BARS = 36;
/** насколько быстро затухает «след» после протаскивания */
const DECAY = 6.5;

type Props = {
  value: number;
  min: number;
  max: number;
  step?: number;
  label: string;
  onChange: (value: number) => void;
};

/**
 * Слайдер без бегунка: дорожка из тонких столбиков. Столбики до значения
 * залиты, а при быстром протаскивании пройденные столбики «вскипают» и потом
 * затухают — след от руки.
 */
export default function WakeSlider({ value, min, max, step = 1, label, onChange }: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const energyRef = useRef<Float32Array>(new Float32Array(BARS));
  const rafRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const lastRef = useRef({ x: 0, t: 0 });
  const lastIndexRef = useRef<number>(-1);

  const span = max > min ? max - min : 1;
  const clamped = Math.min(Math.max(value, min), max);
  const indexOf = (v: number) =>
    Math.round(((v - min) / span) * (BARS - 1));

  const applyEnergy = useCallback(() => {
    const energy = energyRef.current;
    barsRef.current.forEach((bar, index) => {
      if (!bar) return;
      bar.style.transform = `scaleY(${1 + energy[index] * 1.6})`;
    });
  }, []);

  const startDecay = useCallback(() => {
    if (rafRef.current !== null) return;
    let previous = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - previous) / 1000);
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

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  const valueFromClientX = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return clamped;
    const rect = track.getBoundingClientRect();
    const ratio = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
    const raw = min + Math.min(1, Math.max(0, ratio)) * span;
    const stepped = Math.round((raw - min) / step) * step + min;
    return Math.min(max, Math.max(min, Number(stepped.toFixed(4))));
  };

  const wake = (from: number, to: number, speed: number) => {
    const strength = 1 - Math.exp(-speed / 9);
    const energy = energyRef.current;
    const start = Math.min(from, to);
    const end = Math.max(from, to);
    for (let i = start; i <= end; i += 1) {
      energy[i] = Math.max(energy[i], strength);
    }
    startDecay();
  };

  const handlePointer = (event: React.PointerEvent<HTMLDivElement>, down: boolean) => {
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

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const big = step * 10;
    const map: Record<string, number> = {
      ArrowRight: step,
      ArrowUp: step,
      ArrowLeft: -step,
      ArrowDown: -step,
      PageUp: big,
      PageDown: -big,
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
    if (delta === undefined) return;
    event.preventDefault();
    const next = Math.min(max, Math.max(min, clamped + delta));
    onChange(Number(next.toFixed(4)));
    const from = indexOf(clamped);
    const to = indexOf(next);
    wake(from, to, 2.4);
    lastIndexRef.current = to;
  };

  const filled = indexOf(clamped);
  const percent = ((clamped - min) / span) * 100;

  return (
    <div
      ref={trackRef}
      className="wks"
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(clamped)}
      aria-valuetext={clamped.toLocaleString("ru-RU")}
      data-dragging={draggingRef.current || undefined}
      onPointerDown={(event) => {
        draggingRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        lastIndexRef.current = -1;
        handlePointer(event, true);
        lastIndexRef.current = indexOf(valueFromClientX(event.clientX));
      }}
      onPointerMove={(event) => {
        if (!draggingRef.current) return;
        handlePointer(event, false);
      }}
      onPointerUp={(event) => {
        draggingRef.current = false;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
      }}
      onKeyDown={onKeyDown}
    >
      {Array.from({ length: BARS }, (_, index) => (
        <span
          key={index}
          ref={(node) => {
            barsRef.current[index] = node;
          }}
          className={"wks__bar" + (index <= filled ? " is-on" : "")}
          aria-hidden="true"
        />
      ))}
      <span className="wks__value" aria-hidden="true">
        {Math.round(percent)}%
      </span>
    </div>
  );
}
