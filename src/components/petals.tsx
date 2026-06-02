import { useMemo } from "react";

export function Petals({ count = 14 }: { count?: number }) {
  const petals = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 12,
        duration: 14 + Math.random() * 14,
        size: 8 + Math.random() * 14,
        opacity: 0.35 + Math.random() * 0.45,
        key: i,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {petals.map((p) => (
        <span
          key={p.key}
          className="animate-float-petal absolute -top-12 block rounded-[60%_40%_60%_40%/40%_60%_40%_60%] bg-gradient-to-br from-[color:var(--blossom-soft)] to-[color:var(--blossom)]"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.8,
            opacity: p.opacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
