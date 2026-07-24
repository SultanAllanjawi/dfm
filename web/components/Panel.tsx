"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
  hover = false,
  tilt = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  tilt?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ rx: 0, ry: 0, mx: 50, my: 50, active: false });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!tilt) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    setT({ rx: (0.5 - y) * 6, ry: (x - 0.5) * 8, mx: x * 100, my: y * 100, active: true });
  }

  function onMouseLeave() {
    if (!tilt) return;
    setT({ rx: 0, ry: 0, mx: 50, my: 50, active: false });
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={cn(
        "relative rounded-xl border border-border bg-gradient-to-b from-[var(--surface-2)] to-[var(--surface)] p-5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)]",
        hover && !tilt && "hover-lift",
        tilt && "transition-transform duration-200 ease-out will-change-transform",
        className
      )}
      style={
        tilt
          ? {
              transform: `perspective(1000px) rotateX(${t.rx}deg) rotateY(${t.ry}deg)`,
              transformStyle: "preserve-3d",
              boxShadow: t.active
                ? "0 20px 40px -20px rgba(45, 212, 191, 0.25)"
                : undefined,
            }
          : undefined
      }
    >
      {tilt && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-200"
          style={{
            background: `radial-gradient(420px circle at ${t.mx}% ${t.my}%, rgba(45, 212, 191, 0.1), transparent 45%)`,
            opacity: t.active ? 1 : 0,
          }}
        />
      )}
      <div style={tilt ? { transform: "translateZ(18px)" } : undefined}>{children}</div>
    </div>
  );
}

export function PanelLabel({ children, dotColor }: { children: React.ReactNode; dotColor?: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-primary">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor ?? "var(--primary)" }} />
      {children}
    </div>
  );
}
