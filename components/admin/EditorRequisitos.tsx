"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RequisitoMinimo } from "@prisma/client";

type Requisito = Omit<RequisitoMinimo, "orden"> & { orden: number };

export default function EditorRequisitos({
  eventoId,
  requisitos: inicial,
}: {
  eventoId: string;
  requisitos: Requisito[];
}) {
  const router = useRouter();
  const [lista, setLista] = useState<Requisito[]>(
    [...inicial].sort((a, b) => a.orden - b.orden)
  );
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  function agregar() {
    setLista((prev) => [
      ...prev,
      { texto: "", orden: prev.length + 1 },
    ]);
  }

  function actualizar(idx: number, texto: string) {
    setLista((prev) => prev.map((r, i) => (i === idx ? { ...r, texto } : r)));
  }

  function eliminar(idx: number) {
    setLista((prev) =>
      prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, orden: i + 1 }))
    );
  }

  function mover(idx: number, dir: -1 | 1) {
    const next = idx + dir;
    if (next < 0 || next >= lista.length) return;
    const copia = [...lista];
    [copia[idx], copia[next]] = [copia[next], copia[idx]];
    setLista(copia.map((r, i) => ({ ...r, orden: i + 1 })));
  }

  async function guardar() {
    setGuardando(true);
    setMensaje(null);
    const res = await fetch(`/api/eventos/${eventoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requisitos: lista.filter((r) => r.texto.trim()) }),
    });
    setGuardando(false);
    if (res.ok) {
      setMensaje({ tipo: "ok", texto: "Requisitos guardados." });
      router.refresh();
    } else {
      setMensaje({ tipo: "error", texto: "No se pudieron guardar los requisitos." });
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-muted">
        Estos requisitos se muestran en la página pública y se sugieren como motivos de rechazo.
      </p>

      <div className="space-y-2">
        {lista.map((r, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => mover(idx, -1)}
                disabled={idx === 0}
                className="rounded px-1 py-0.5 text-xs text-faint hover:text-fg disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => mover(idx, 1)}
                disabled={idx === lista.length - 1}
                className="rounded px-1 py-0.5 text-xs text-faint hover:text-fg disabled:opacity-30"
              >
                ▼
              </button>
            </div>
            <input
              type="text"
              value={r.texto}
              onChange={(e) => actualizar(idx, e.target.value)}
              placeholder="Ej: Licencia tipo A vigente"
              className="field flex-1"
            />
            <button
              type="button"
              onClick={() => eliminar(idx)}
              className="shrink-0 rounded-lg px-2 py-2 text-faint transition-colors hover:bg-red-400/10 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={agregar} className="btn-secondary btn-sm">
        + Agregar requisito
      </button>

      {mensaje && (
        <p className={`rounded-xl border p-3 text-sm ${
          mensaje.tipo === "ok"
            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
            : "border-red-400/30 bg-red-400/10 text-red-200"
        }`}>
          {mensaje.texto}
        </p>
      )}

      <button type="button" onClick={guardar} disabled={guardando} className="btn-primary">
        {guardando ? "Guardando…" : "Guardar requisitos"}
      </button>
    </div>
  );
}
