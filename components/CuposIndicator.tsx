"use client";

import { useEffect, useState } from "react";

type CuposIndicatorProps = {
  cuposMax: number;
  cuposAprobados: number;
};

export default function CuposIndicator({ cuposMax, cuposAprobados }: CuposIndicatorProps) {
  const disponibles = Math.max(cuposMax - cuposAprobados, 0);
  const llenos = disponibles === 0;
  const pct = cuposMax > 0 ? Math.min(100, Math.round((cuposAprobados / cuposMax) * 100)) : 0;

  // Animate the bar from 0 → pct after mount.
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setAncho(pct), 150);
    return () => window.clearTimeout(t);
  }, [pct]);

  return (
    <div className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-faint">Cupos confirmados</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
            <span className="text-gradient">{cuposAprobados}</span>
            <span className="text-faint"> / {cuposMax}</span>
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ${
            llenos
              ? "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/25"
              : "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/25"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${llenos ? "bg-amber-400" : "bg-emerald-400"}`}>
            <span
              className={`block h-2 w-2 animate-ping rounded-full ${
                llenos ? "bg-amber-400" : "bg-emerald-400"
              }`}
            />
          </span>
          {llenos
            ? "Cupos llenos"
            : `${disponibles} ${disponibles === 1 ? "disponible" : "disponibles"}`}
        </span>
      </div>

      {/* Progress track */}
      <div className="mt-6 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-inset ring-white/5">
        <div
          className="relative h-full rounded-full"
          style={{
            width: `${ancho}%`,
            background: llenos
              ? "linear-gradient(90deg, #f59e0b, #f97316)"
              : "linear-gradient(90deg, var(--color-accent-soft), var(--color-accent), var(--color-accent-2))",
            transition: "width 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "0 0 18px rgba(255,122,61,0.55)",
          }}
        />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        {llenos ? (
          <>
            Los cupos están llenos, pero podés enviar tu solicitud igual: queda en{" "}
            <span className="text-fg">lista de espera</span> y el organizador decide.
          </>
        ) : (
          <>
            Quedan <span className="font-semibold text-fg">{disponibles}</span> lugares. Asegurá el
            tuyo antes de que se llenen.
          </>
        )}
      </p>
    </div>
  );
}
