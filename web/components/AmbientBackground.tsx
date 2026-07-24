const PARTICLES = Array.from({ length: 28 }).map((_, i) => ({
  left: (i * 137.5) % 100,
  top: (i * 53.7) % 100,
  duration: 8 + ((i * 7) % 12),
  delay: (i % 10) * -1.3,
  size: 2 + (i % 4),
  color: i % 3 === 0 ? "#2DD4BF" : "#A78BFA",
}));

export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="grid-drift absolute left-1/2 top-[55%] h-[160vh] w-[220vw] -translate-x-1/2 opacity-[0.1]"
        style={{
          transform: "translate(-50%, 0) perspective(700px) rotateX(62deg)",
          backgroundImage:
            "linear-gradient(rgba(45,212,191,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="float-y absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            opacity: 0.35,
            boxShadow: `0 0 8px ${p.color}`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
