"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CampoFormulario, TipoCampo } from "@prisma/client";

const TIPOS: { valor: TipoCampo; label: string }[] = [
  { valor: "texto", label: "Texto" },
  { valor: "numero", label: "Número" },
  { valor: "email", label: "Correo" },
  { valor: "telefono", label: "Teléfono" },
  { valor: "select", label: "Selección (opciones)" },
  { valor: "checkbox", label: "Checkbox (sí/no)" },
];

const CAMPO_NUEVO: Omit<CampoFormulario, "orden"> & { orden: number } = {
  etiqueta: "",
  clave: "",
  tipo: "texto",
  opciones: [],
  requerido: true,
  ayuda: null,
  orden: 0,
  activo: true,
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export default function ConstructorCampos({
  eventoId,
  campos: inicial,
}: {
  eventoId: string;
  campos: CampoFormulario[];
}) {
  const router = useRouter();
  const [lista, setLista] = useState<CampoFormulario[]>(
    [...inicial].sort((a, b) => a.orden - b.orden)
  );
  const [editandoIdx, setEditandoIdx] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  function mover(idx: number, dir: -1 | 1) {
    const next = idx + dir;
    if (next < 0 || next >= lista.length) return;
    const copia = [...lista];
    [copia[idx], copia[next]] = [copia[next], copia[idx]];
    setLista(copia.map((c, i) => ({ ...c, orden: i + 1 })));
  }

  function toggleActivo(idx: number) {
    setLista((prev) => prev.map((c, i) => (i === idx ? { ...c, activo: !c.activo } : c)));
  }

  function agregar() {
    const nuevo = { ...CAMPO_NUEVO, orden: lista.length + 1 };
    setLista((prev) => [...prev, nuevo]);
    setEditandoIdx(lista.length);
  }

  function actualizarCampo(idx: number, patch: Partial<CampoFormulario>) {
    setLista((prev) =>
      prev.map((c, i) => {
        if (i !== idx) return c;
        const updated = { ...c, ...patch };
        if (patch.etiqueta !== undefined && !c.clave) {
          updated.clave = slugify(patch.etiqueta);
        }
        return updated;
      })
    );
  }

  function eliminar(idx: number) {
    setLista((prev) =>
      prev.filter((_, i) => i !== idx).map((c, i) => ({ ...c, orden: i + 1 }))
    );
    if (editandoIdx === idx) setEditandoIdx(null);
  }

  async function guardar() {
    setGuardando(true);
    setMensaje(null);
    const res = await fetch(`/api/eventos/${eventoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campos: lista }),
    });
    setGuardando(false);
    if (res.ok) {
      setMensaje({ tipo: "ok", texto: "Campos guardados." });
      setEditandoIdx(null);
      router.refresh();
    } else {
      setMensaje({ tipo: "error", texto: "No se pudieron guardar los campos." });
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-muted">
        Definí qué datos se le piden a cada solicitante. Los campos marcados como inactivos no
        aparecen en el formulario público.
      </p>

      <div className="space-y-2">
        {lista.map((campo, idx) => (
          <div key={idx} className={`rounded-xl border p-3 ${campo.activo ? "border-line bg-white/[0.02]" : "border-white/5 bg-white/[0.01] opacity-50"}`}>
            <div className="flex items-start gap-2">
              <div className="flex flex-col gap-0.5 pt-0.5">
                <button type="button" onClick={() => mover(idx, -1)} disabled={idx === 0} className="rounded px-1 text-xs text-faint hover:text-fg disabled:opacity-30">▲</button>
                <button type="button" onClick={() => mover(idx, 1)} disabled={idx === lista.length - 1} className="rounded px-1 text-xs text-faint hover:text-fg disabled:opacity-30">▼</button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-fg">{campo.etiqueta || "(sin nombre)"}</span>
                  <span className="text-xs text-faint">{TIPOS.find((t) => t.valor === campo.tipo)?.label}</span>
                  {campo.requerido && <span className="text-xs text-accent">*requerido</span>}
                </div>
                {campo.clave && <span className="text-xs text-faint">clave: {campo.clave}</span>}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => toggleActivo(idx)} className="rounded-lg px-2 py-1 text-xs text-faint hover:text-fg transition-colors">
                  {campo.activo ? "Desactivar" : "Activar"}
                </button>
                <button type="button" onClick={() => setEditandoIdx(editandoIdx === idx ? null : idx)} className="btn-secondary btn-sm">
                  {editandoIdx === idx ? "Cerrar" : "Editar"}
                </button>
                <button type="button" onClick={() => eliminar(idx)} className="rounded-lg px-2 py-2 text-faint hover:bg-red-400/10 hover:text-red-300 transition-colors">✕</button>
              </div>
            </div>

            {editandoIdx === idx && (
              <div className="mt-3 grid gap-3 border-t border-line pt-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs text-faint">Etiqueta</span>
                  <input type="text" value={campo.etiqueta} onChange={(e) => actualizarCampo(idx, { etiqueta: e.target.value })} className="field text-sm" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-faint">Clave interna (slug)</span>
                  <input type="text" value={campo.clave} onChange={(e) => actualizarCampo(idx, { clave: e.target.value })} className="field text-sm" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-faint">Tipo</span>
                  <select value={campo.tipo} onChange={(e) => actualizarCampo(idx, { tipo: e.target.value as TipoCampo })} className="field text-sm">
                    {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.label}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={campo.requerido} onChange={(e) => actualizarCampo(idx, { requerido: e.target.checked })} className="h-4 w-4 accent-accent" />
                  <span className="text-sm text-muted">Campo requerido</span>
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-xs text-faint">Texto de ayuda (opcional)</span>
                  <input type="text" value={campo.ayuda ?? ""} onChange={(e) => actualizarCampo(idx, { ayuda: e.target.value || null })} className="field text-sm" placeholder="Ej: Ingresá el modelo exacto" />
                </label>
                {campo.tipo === "select" && (
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs text-faint">Opciones (una por línea)</span>
                    <textarea
                      value={campo.opciones.join("\n")}
                      onChange={(e) => actualizarCampo(idx, { opciones: e.target.value.split("\n").filter(Boolean) })}
                      rows={3}
                      className="field resize-none text-sm"
                    />
                  </label>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <button type="button" onClick={agregar} className="btn-secondary btn-sm">
        + Agregar campo
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
        {guardando ? "Guardando…" : "Guardar campos"}
      </button>
    </div>
  );
}
