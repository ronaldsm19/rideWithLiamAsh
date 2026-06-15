"use client";

import { useState, type FormEvent } from "react";
import type { CampoFormulario, TipoCampo } from "@prisma/client";

type Props = {
  eventoId: string;
  campos: CampoFormulario[];
};

type EnvioEstado = "idle" | "enviando" | "ok" | "duplicado" | "error";

function valorInicial(tipo: TipoCampo): string | boolean {
  return tipo === "checkbox" ? false : "";
}

export default function FormularioInscripcion({ eventoId, campos }: Props) {
  const camposActivos = [...campos].filter((c) => c.activo).sort((a, b) => a.orden - b.orden);

  const [valores, setValores] = useState<Record<string, string | boolean>>(() =>
    Object.fromEntries(camposActivos.map((c) => [c.clave, valorInicial(c.tipo)]))
  );
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [estado, setEstado] = useState<EnvioEstado>("idle");
  const [mensaje, setMensaje] = useState<string | null>(null);

  function set(clave: string, valor: string | boolean) {
    setValores((prev) => ({ ...prev, [clave]: valor }));
  }

  function validar(): boolean {
    const nuevosErrores: Record<string, string> = {};
    for (const campo of camposActivos) {
      const val = valores[campo.clave];
      if (campo.requerido && (val === "" || val === false || val === undefined)) {
        nuevosErrores[campo.clave] = `${campo.etiqueta} es obligatorio`;
      }
      if (campo.tipo === "email" && typeof val === "string" && val && !/^[^@]+@[^@]+\.[^@]+$/.test(val)) {
        nuevosErrores[campo.clave] = "Ingresá un correo válido";
      }
      if (campo.tipo === "numero" && typeof val === "string" && val && Number.isNaN(Number(val))) {
        nuevosErrores[campo.clave] = "Ingresá un número válido";
      }
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    if (!validar()) return;

    const correo = camposActivos.find((c) => c.tipo === "email" || c.clave === "correo");
    const correoVal = correo ? String(valores[correo.clave] ?? "") : "";

    const respuestas: Record<string, unknown> = {};
    for (const campo of camposActivos) {
      const val = valores[campo.clave];
      respuestas[campo.clave] = campo.tipo === "numero" && typeof val === "string" ? Number(val) : val;
    }

    setEstado("enviando");
    setMensaje(null);

    try {
      const res = await fetch("/api/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventoId, correo: correoVal, respuestas }),
      });

      if (res.status === 201) {
        setEstado("ok");
        setMensaje("Tu solicitud fue enviada, te avisaremos pronto.");
        setValores(Object.fromEntries(camposActivos.map((c) => [c.clave, valorInicial(c.tipo)])));
        return;
      }

      const data = await res.json().catch(() => null);
      if (res.status === 409) {
        setEstado("duplicado");
        setMensaje(data?.message ?? "Ya existe una solicitud activa con ese correo.");
        return;
      }
      setEstado("error");
      setMensaje(data?.message ?? "Ocurrió un error. Intentá de nuevo.");
    } catch {
      setEstado("error");
      setMensaje("No se pudo conectar con el servidor.");
    }
  }

  if (estado === "ok") {
    return (
      <div className="flex flex-col items-center py-8 text-center" style={{ opacity: 1 }}>
        <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-400/15 ring-1 ring-emerald-400/30">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <h3 className="mt-5 text-2xl font-semibold">¡Listo!</h3>
        <p className="mt-2 max-w-sm text-muted">{mensaje}</p>
        <button type="button" onClick={() => { setEstado("idle"); setMensaje(null); }} className="btn btn-secondary mt-6">
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={manejarEnvio} className="space-y-6" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        {camposActivos.map((campo) => (
          <CampoInput
            key={campo.clave}
            campo={campo}
            valor={valores[campo.clave] ?? valorInicial(campo.tipo)}
            error={errores[campo.clave]}
            onChange={(v) => set(campo.clave, v)}
          />
        ))}
      </div>

      {mensaje && (estado === "duplicado" || estado === "error") && (
        <p className={`flex items-start gap-2.5 rounded-xl border p-4 text-sm ${
          estado === "duplicado"
            ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
            : "border-red-400/30 bg-red-400/10 text-red-200"
        }`}>
          <span aria-hidden className="mt-px">{estado === "duplicado" ? "⚠️" : "✕"}</span>
          {mensaje}
        </p>
      )}

      <button type="submit" disabled={estado === "enviando"} className="btn btn-primary w-full sm:w-auto">
        {estado === "enviando" ? (
          <><Spinner />Enviando…</>
        ) : (
          "Enviar solicitud"
        )}
      </button>
    </form>
  );
}

function CampoInput({
  campo,
  valor,
  error,
  onChange,
}: {
  campo: CampoFormulario;
  valor: string | boolean;
  error?: string;
  onChange: (v: string | boolean) => void;
}) {
  if (campo.tipo === "checkbox") {
    return (
      <label className={`group flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-white/[0.03] px-4 py-3 transition-colors hover:border-white/15 has-[:checked]:border-accent/50 has-[:checked]:bg-accent/[0.08] ${error ? "border-red-400/50" : ""}`}>
        <input type="checkbox" checked={!!valor} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-line bg-white/5 transition-colors group-has-[:checked]:border-accent group-has-[:checked]:bg-accent">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1a0a02" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 transition-opacity group-has-[:checked]:opacity-100">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <div>
          <span className="text-sm text-muted transition-colors group-has-[:checked]:text-fg">
            {campo.etiqueta}
            {campo.requerido && <span className="ml-1 text-accent">*</span>}
          </span>
          {campo.ayuda && <p className="text-xs text-faint">{campo.ayuda}</p>}
        </div>
        {error && <span className="ml-auto text-xs text-red-300">{error}</span>}
      </label>
    );
  }

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-muted">
        {campo.etiqueta}
        {campo.requerido && <span className="ml-1 text-accent">*</span>}
      </span>
      {campo.ayuda && <p className="mb-1 text-xs text-faint">{campo.ayuda}</p>}
      {campo.tipo === "select" ? (
        <select
          value={String(valor)}
          onChange={(e) => onChange(e.target.value)}
          className={`field ${error ? "border-red-400/50" : ""}`}
        >
          <option value="">— Seleccioná —</option>
          {campo.opciones.map((op) => <option key={op} value={op}>{op}</option>)}
        </select>
      ) : (
        <input
          type={campo.tipo === "email" ? "email" : campo.tipo === "numero" ? "number" : campo.tipo === "telefono" ? "tel" : "text"}
          value={String(valor)}
          onChange={(e) => onChange(e.target.value)}
          className={`field ${error ? "border-red-400/50" : ""}`}
        />
      )}
      {error && <span className="mt-1.5 block text-sm text-red-300">{error}</span>}
    </label>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
