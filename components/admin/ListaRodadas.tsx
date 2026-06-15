"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { EstadoEvento } from "@prisma/client";

type EventoFila = {
  id: string;
  nombre: string;
  fecha: Date;
  estado: EstadoEvento;
  cuposMax: number;
  _count: { solicitudes: number };
};

const ESTILOS_ESTADO: Record<EstadoEvento, string> = {
  borrador: "bg-zinc-400/15 text-zinc-300 ring-1 ring-zinc-400/25",
  publicada: "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/25",
  archivada: "bg-white/5 text-faint ring-1 ring-white/10",
};

const ETIQUETAS_ESTADO: Record<EstadoEvento, string> = {
  borrador: "Borrador",
  publicada: "Publicada",
  archivada: "Archivada",
};

const formateadorFecha = new Intl.DateTimeFormat("es-CR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Costa_Rica",
});

export function BotonNueva() {
  const router = useRouter();
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function crear() {
    if (!nombre.trim()) { setError("El nombre es requerido"); return; }
    setCreando(true);
    setError(null);
    const res = await fetch("/api/eventos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombre.trim() }),
    });
    if (!res.ok) { setError("No se pudo crear la rodada"); setCreando(false); return; }
    const { evento } = await res.json();
    router.push(`/admin/rodadas/${evento.id}`);
  }

  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="btn-primary btn-sm">
        + Nueva rodada
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && crear()}
        placeholder="Nombre de la rodada"
        className="field !py-2 text-sm"
        autoFocus
      />
      <button type="button" onClick={crear} disabled={creando} className="btn-primary btn-sm shrink-0">
        {creando ? "Creando…" : "Crear"}
      </button>
      <button type="button" onClick={() => { setAbierto(false); setError(null); }} className="btn-secondary btn-sm shrink-0">
        Cancelar
      </button>
      {error && <span className="text-xs text-red-300">{error}</span>}
    </div>
  );
}

export default function ListaRodadas({ eventos }: { eventos: EventoFila[] }) {
  const router = useRouter();
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cambiarEstado(id: string, estado: EstadoEvento) {
    await fetch(`/api/eventos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    router.refresh();
  }

  async function eliminar(id: string) {
    setError(null);
    setEliminandoId(id);
    const res = await fetch(`/api/eventos/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo eliminar");
    }
    setEliminandoId(null);
    router.refresh();
  }

  if (eventos.length === 0) {
    return (
      <p className="rounded-2xl border border-line bg-white/[0.02] px-5 py-12 text-center text-muted">
        Todavía no hay rodadas. Creá la primera.
      </p>
    );
  }

  return (
    <>
      {error && (
        <p className="mb-3 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>
      )}
      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-line bg-white/[0.02] text-left text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-4 py-3.5 font-medium">Nombre</th>
              <th className="px-4 py-3.5 font-medium">Fecha</th>
              <th className="px-4 py-3.5 font-medium">Estado</th>
              <th className="px-4 py-3.5 font-medium">Solicitudes</th>
              <th className="px-4 py-3.5 font-medium">Cupos</th>
              <th className="px-4 py-3.5 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {eventos.map((e) => (
              <tr key={e.id} className="transition-colors hover:bg-white/[0.025]">
                <td className="px-4 py-3 font-medium text-fg">{e.nombre}</td>
                <td className="px-4 py-3 text-muted" suppressHydrationWarning>
                  {formateadorFecha.format(e.fecha)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${ESTILOS_ESTADO[e.estado]}`}>
                    {ETIQUETAS_ESTADO[e.estado]}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{e._count.solicitudes}</td>
                <td className="px-4 py-3 text-muted">{e.cuposMax}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Link href={`/admin/rodadas/${e.id}`} className="btn-secondary btn-sm">
                      Editar
                    </Link>
                    {e.estado === "borrador" && (
                      <button type="button" onClick={() => cambiarEstado(e.id, "publicada")} className="btn-primary btn-sm">
                        Publicar
                      </button>
                    )}
                    {e.estado === "publicada" && (
                      <button type="button" onClick={() => cambiarEstado(e.id, "archivada")} className="btn-secondary btn-sm">
                        Archivar
                      </button>
                    )}
                    {e.estado === "archivada" && (
                      <button type="button" onClick={() => cambiarEstado(e.id, "borrador")} className="btn-secondary btn-sm">
                        Reactivar
                      </button>
                    )}
                    {e._count.solicitudes === 0 && (
                      <button
                        type="button"
                        onClick={() => eliminar(e.id)}
                        disabled={eliminandoId === e.id}
                        className="btn-danger btn-sm"
                      >
                        {eliminandoId === e.id ? "…" : "Eliminar"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

