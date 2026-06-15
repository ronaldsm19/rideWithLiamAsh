"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { PuntoRuta, TipoPunto } from "@prisma/client";

const ETIQUETA_TIPO: Record<TipoPunto, string> = {
  salida: "Salida",
  parada: "Parada",
  destino: "Destino",
};

export default function SubidorFotos({
  eventoId,
  puntos: inicial,
}: {
  eventoId: string;
  puntos: PuntoRuta[];
}) {
  const router = useRouter();
  const [puntos, setPuntos] = useState<PuntoRuta[]>(
    [...inicial].sort((a, b) => a.orden - b.orden)
  );
  const [puntoSelIdx, setPuntoSelIdx] = useState(0);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const puntoActual = puntos[puntoSelIdx];

  if (puntos.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white/[0.02] p-8 text-center text-muted">
        <p>Primero configurá los puntos de la ruta en la pestaña <strong>Mapa y ruta</strong>.</p>
      </div>
    );
  }

  async function subirFoto(file: File) {
    setError(null);
    setSubiendo(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("carpeta", `evento-${eventoId}`);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Error al subir la foto.");
      setSubiendo(false);
      return;
    }
    const { url } = await res.json();
    const nuevosPuntos = puntos.map((p, i) =>
      i === puntoSelIdx ? { ...p, fotos: [...p.fotos, url] } : p
    );
    await guardarPuntos(nuevosPuntos);
    setSubiendo(false);
  }

  async function eliminarFoto(fotoUrl: string) {
    setError(null);
    await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: fotoUrl }),
    }).catch(() => {});
    const nuevosPuntos = puntos.map((p, i) =>
      i === puntoSelIdx ? { ...p, fotos: p.fotos.filter((f) => f !== fotoUrl) } : p
    );
    await guardarPuntos(nuevosPuntos);
  }

  async function guardarPuntos(nuevosPuntos: PuntoRuta[]) {
    const res = await fetch(`/api/eventos/${eventoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puntos: nuevosPuntos }),
    });
    if (res.ok) {
      setPuntos(nuevosPuntos);
      router.refresh();
    } else {
      setError("No se pudo guardar.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Selector de punto */}
      <div className="flex flex-wrap gap-2">
        {puntos.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setPuntoSelIdx(i)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              i === puntoSelIdx
                ? "bg-accent text-[#1a0a02]"
                : "bg-white/5 text-muted hover:text-fg border border-line"
            }`}
          >
            {ETIQUETA_TIPO[p.tipo]}{p.tipo === "parada" ? ` ${p.orden}` : ""}: {p.nombre || "(sin nombre)"}
          </button>
        ))}
      </div>

      {/* Zona de subida */}
      <div>
        <div
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line bg-white/[0.02] py-10 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
          onClick={() => inputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) subirFoto(file);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          {subiendo ? (
            <Spinner />
          ) : (
            <>
              <span className="text-3xl">🖼️</span>
              <p className="text-sm text-muted">Hacé clic o arrastrá una imagen aquí</p>
              <p className="text-xs text-faint">JPG, PNG, WEBP · máx. 5 MB</p>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) subirFoto(file);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>
      )}

      {/* Grid de fotos actuales */}
      {puntoActual && puntoActual.fotos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {puntoActual.fotos.map((url, i) => (
            <div key={`${url}-${i}`} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => eliminarFoto(url)}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {puntoActual && puntoActual.fotos.length === 0 && (
        <p className="text-sm text-faint">No hay fotos para este punto todavía.</p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-8 w-8 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
