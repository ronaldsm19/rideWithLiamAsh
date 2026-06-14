"use client";

import { useState } from "react";

type GrupoFotos = {
  titulo: string;
  descripcion?: string | null;
  fotos: string[];
};

type GaleriaFotosProps = {
  fotosSalida: string[];
  lugarSalidaNombre: string;
  paradas: { nombre: string; descripcion?: string | null; fotos: string[] }[];
};

export default function GaleriaFotos({ fotosSalida, lugarSalidaNombre, paradas }: GaleriaFotosProps) {
  const grupos: GrupoFotos[] = [
    { titulo: lugarSalidaNombre, descripcion: "Punto de salida", fotos: fotosSalida },
    ...paradas.map((p) => ({ titulo: p.nombre, descripcion: p.descripcion, fotos: p.fotos })),
  ].filter((g) => g.fotos.length > 0);

  if (grupos.length === 0) return null;

  return (
    <div className="space-y-12">
      {grupos.map((grupo) => (
        <div key={grupo.titulo}>
          <div className="mb-4 flex items-baseline gap-3">
            <h3 className="text-lg font-semibold text-fg">{grupo.titulo}</h3>
            {grupo.descripcion && (
              <span className="text-sm text-faint">— {grupo.descripcion}</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {grupo.fotos.map((url, i) => (
              <Foto key={`${url}-${i}`} url={url} alt={grupo.titulo} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Foto({ url, alt }: { url: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <figure className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-bg-soft">
      {!loaded && <div className="shimmer absolute inset-0" aria-hidden />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-all duration-700 ease-out will-change-transform group-hover:scale-110 ${
          loaded ? "opacity-100 blur-0" : "opacity-0 blur-md"
        }`}
      />
      {/* Hover overlay */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden
      />
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-3 text-sm font-medium text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
        {alt}
      </figcaption>
    </figure>
  );
}
