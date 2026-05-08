"use client";

// Deterministic seeded star field — fully covers the welcome wrapper.
// Uses CSS `twinkle` animation. Includes a few "shooting stars".
//
// All values pre-generated so SSR & CSR markup match (no hydration mismatch).

const STARS: Array<{ top: number; left: number; size: number; delay: number; duration: number; opacity: number }> = (() => {
  // Deterministic pseudo-random — seeded LCG so output is stable.
  let seed = 1337;
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const arr: typeof STARS = [];
  // 220 small stars across full wrapper height
  for (let i = 0; i < 220; i++) {
    arr.push({
      top: rng() * 100,
      left: rng() * 100,
      size: 1 + Math.floor(rng() * 2.6),       // 1–3 px
      delay: rng() * 6,
      duration: 2 + rng() * 4,                 // 2–6 s
      opacity: 0.4 + rng() * 0.5,              // 0.4–0.9
    });
  }
  return arr;
})();

const BIG_STARS: Array<{ top: number; left: number; delay: number; color: string }> = [
  { top: 5,   left: 12, delay: 0,   color: "rgba(255, 240, 200, 0.85)" },
  { top: 18,  left: 78, delay: 1.2, color: "rgba(200, 220, 255, 0.85)" },
  { top: 32,  left: 22, delay: 0.6, color: "rgba(245, 200, 255, 0.85)" },
  { top: 45,  left: 85, delay: 2.1, color: "rgba(255, 230, 220, 0.85)" },
  { top: 60,  left: 8,  delay: 1.8, color: "rgba(220, 230, 255, 0.85)" },
  { top: 72,  left: 65, delay: 0.3, color: "rgba(255, 250, 220, 0.85)" },
  { top: 85,  left: 30, delay: 1.5, color: "rgba(220, 200, 255, 0.85)" },
  { top: 92,  left: 88, delay: 2.4, color: "rgba(255, 230, 250, 0.85)" },
];

const SHOOTING_STARS = [
  { top: 15, left: 60, delay: 3,  duration: 2.5 },
  { top: 38, left: 30, delay: 9,  duration: 2.2 },
  { top: 62, left: 70, delay: 15, duration: 2.6 },
  { top: 80, left: 20, delay: 22, duration: 2.4 },
];

export function StarrySky() {
  return (
    <div
      className="absolute inset-0 -z-10 pointer-events-none overflow-hidden"
      aria-hidden
      style={{
        background:
          "radial-gradient(ellipse at top, #0d0a1f 0%, #050410 50%, #000 100%)",
        transform: "translateZ(0)",
        willChange: "transform",
      }}
    >
      {/* Tiny twinkling stars */}
      {STARS.map((s, i) => (
        <span
          key={`s-${i}`}
          className="absolute rounded-full bg-white star-twinkle"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}

      {/* Larger "big" stars with cross-glow */}
      {BIG_STARS.map((s, i) => (
        <span
          key={`b-${i}`}
          className="absolute star-big"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            animationDelay: `${s.delay}s`,
            ["--star-color" as string]: s.color,
          }}
        />
      ))}

      {/* Shooting stars */}
      {SHOOTING_STARS.map((s, i) => (
        <span
          key={`sh-${i}`}
          className="absolute shooting-star"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}

      {/* Galaxy nebula tints */}
      <div className="absolute inset-0" style={{
        background:
          "radial-gradient(ellipse at 25% 30%, rgba(120, 60, 180, 0.10), transparent 55%), radial-gradient(ellipse at 75% 65%, rgba(60, 90, 200, 0.10), transparent 50%), radial-gradient(ellipse at 50% 90%, rgba(180, 60, 120, 0.08), transparent 60%)",
      }} />
    </div>
  );
}
