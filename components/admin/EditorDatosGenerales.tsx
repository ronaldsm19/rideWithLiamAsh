"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Evento, EstadoEvento } from "@prisma/client";

const ESTADOS: { valor: EstadoEvento; label: string }[] = [
  { valor: "borrador", label: "Borrador" },
  { valor: "publicada", label: "Publicada (visible en la página pública)" },
  { valor: "archivada", label: "Archivada" },
];

export default function EditorDatosGenerales({ evento }: { evento: Evento }) {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: evento.nombre,
    descripcion: evento.descripcion,
    fecha: evento.fecha.toISOString().slice(0, 10),
    horaSalida: evento.horaSalida,
    cuposMax: evento.cuposMax.toString(),
    estado: evento.estado,
    dificultad: evento.dificultad ?? "",
    distanciaKm: evento.distanciaKm?.toString() ?? "",
  });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  function campo<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function guardar() {
    setGuardando(true);
    setMensaje(null);
    const res = await fetch(`/api/eventos/${evento.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: form.nombre,
        descripcion: form.descripcion,
        fecha: form.fecha,
        horaSalida: form.horaSalida,
        cuposMax: Number(form.cuposMax),
        estado: form.estado,
        dificultad: form.dificultad || null,
        distanciaKm: form.distanciaKm ? Number(form.distanciaKm) : null,
      }),
    });
    setGuardando(false);
    if (res.ok) {
      setMensaje({ tipo: "ok", texto: "Cambios guardados." });
      router.refresh();
    } else {
      setMensaje({ tipo: "error", texto: "No se pudieron guardar los cambios." });
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Campo label="Nombre de la rodada">
        <input type="text" value={form.nombre} onChange={(e) => campo("nombre", e.target.value)} className="field" />
      </Campo>

      <Campo label="Descripción / bienvenida">
        <textarea
          value={form.descripcion}
          onChange={(e) => campo("descripcion", e.target.value)}
          rows={4}
          className="field resize-none"
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Fecha de la rodada">
          <input type="date" value={form.fecha} onChange={(e) => campo("fecha", e.target.value)} className="field" />
        </Campo>
        <Campo label="Hora de salida">
          <input type="time" value={form.horaSalida} onChange={(e) => campo("horaSalida", e.target.value)} className="field" />
        </Campo>
        <Campo label="Cupos máximos">
          <input type="number" min={1} value={form.cuposMax} onChange={(e) => campo("cuposMax", e.target.value)} className="field" />
        </Campo>
        <Campo label="Dificultad (opcional)">
          <input type="text" value={form.dificultad} onChange={(e) => campo("dificultad", e.target.value)} className="field" placeholder="Ej: Media" />
        </Campo>
        <Campo label="Distancia aprox. (km, opcional)">
          <input type="number" min={0} value={form.distanciaKm} onChange={(e) => campo("distanciaKm", e.target.value)} className="field" />
        </Campo>
      </div>

      <Campo label="Estado">
        <select
          value={form.estado}
          onChange={(e) => campo("estado", e.target.value as EstadoEvento)}
          className="field"
        >
          {ESTADOS.map((e) => (
            <option key={e.valor} value={e.valor}>{e.label}</option>
          ))}
        </select>
      </Campo>

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
        {guardando ? "Guardando…" : "Guardar cambios"}
      </button>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
