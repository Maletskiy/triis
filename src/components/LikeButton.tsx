import { useEffect, useState } from "react";
import { RollingNumber } from "./ui";

const STORAGE_KEY = "triis-like";

/** Углы разлёта конфетти: восемь пар, как в референсе. */
const PARTICLES = Array.from({ length: 8 }, (_, index) => {
  const angle = (index / 8) * Math.PI * 2 - Math.PI / 2;
  return { dx: Math.cos(angle) * 26, dy: Math.sin(angle) * 26 };
});

export default function LikeButton({ hint }: { hint: string }) {
  const [liked, setLiked] = useState(false);
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    setLiked(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const toggle = () => {
    const next = !liked;
    setLiked(next);
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    if (next) setBurst((value) => value + 1);
  };

  return (
    <div className="like">
      <button
        type="button"
        className={"like__btn" + (liked ? " is-liked" : "")}
        aria-pressed={liked}
        aria-label={liked ? "Убрать лайк" : "Поставить лайк"}
        onClick={toggle}
      >
        <span
          key={`ring-${burst}`}
          className={"like__ring" + (burst > 0 ? " is-burst" : "")}
          aria-hidden="true"
        />
        {PARTICLES.map((particle, index) => (
          <span
            key={`p-${burst}-${index}`}
            className={"like__particle" + (burst > 0 ? " is-burst" : "")}
            style={{
              ["--dx" as string]: `${particle.dx}px`,
              ["--dy" as string]: `${particle.dy}px`,
              animationDelay: `${index * 12}ms`,
            }}
            aria-hidden="true"
          />
        ))}
        <svg className="like__heart" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 20.5S3.5 15.2 3.5 9.4A4.9 4.9 0 0 1 12 6.2a4.9 4.9 0 0 1 8.5 3.2c0 5.8-8.5 11.1-8.5 11.1Z"
            fill={liked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <span className="like__count">
        <RollingNumber value={liked ? 1 : 0} format={(n) => String(n)} />
      </span>
      <span className="like__hint">{hint}</span>
    </div>
  );
}
