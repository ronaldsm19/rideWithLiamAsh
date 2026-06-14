"use client";

import { useState, type FormEvent } from "react";
import { solicitudSchema } from "@/lib/validation";

type FormState = {
  nombreCompleto: string;
  correo: string;
  marcaMoto: string;
  modeloMoto: string;
  licenciaVigente: boolean;
  cilindrada: string;
  aniosExperiencia: string;
  equipoCasco: boolean;
  equipoGuantes: boolean;
  equipoChaqueta: boolean;
};

const ESTADO_INICIAL: FormState = {
  nombreCompleto: "",
  correo: "",
  marcaMoto: "",
  modeloMoto: "",
  licenciaVigente: false,
  cilindrada: "",
  aniosExperiencia: "",
  equipoCasco: false,
  equipoGuantes: false,
  equipoChaqueta: false,
};

type EnvioEstado = "idle" | "enviando" | "ok" | "duplicado" | "error";

export default function FormularioInscripcion() {
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL);
  const [errores, setErrores] = useState<Partial<Record<keyof FormState, string>>>({});
  const [estado, setEstado] = useState<EnvioEstado>("idle");
  const [mensaje, setMensaje] = useState<string | null>(null);

  function actualizar<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function manejarEnvio(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const payload = {
      nombreCompleto: form.nombreCompleto,
      correo: form.correo,
      marcaMoto: form.marcaMoto,
      modeloMoto: form.modeloMoto,
      licenciaVigente: form.licenciaVigente,
      cilindrada: form.cilindrada === "" ? Number.NaN : Number(form.cilindrada),
      aniosExperiencia: form.aniosExperiencia === "" ? Number.NaN : Number(form.aniosExperiencia),
      equipoCasco: form.equipoCasco,
      equipoGuantes: form.equipoGuantes,
      equipoChaqueta: form.equipoChaqueta,
    };

    const parsed = solicitudSchema.safeParse(payload);
    if (!parsed.success) {
      const nuevosErrores: Partial<Record<keyof FormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const campo = issue.path[0] as keyof FormState;
        if (!nuevosErrores[campo]) nuevosErrores[campo] = issue.message;
      }
      setErrores(nuevosErrores);
      setEstado("idle");
      setMensaje(null);
      return;
    }

    setErrores({});
    setEstado("enviando");
    setMensaje(null);

    try {
      const res = await fetch("/api/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (res.status === 201) {
        setEstado("ok");
        setMensaje("Tu solicitud fue enviada, te avisaremos pronto.");
        setForm(ESTADO_INICIAL);
        return;
      }

      const data = await res.json().catch(() => null);

      if (res.status === 409) {
        setEstado("duplicado");
        setMensaje(
          data?.message ?? "Ya existe una solicitud activa con ese correo y esa moto."
        );
        return;
      }

      setEstado("error");
      setMensaje(data?.message ?? "Ocurrió un error al enviar tu solicitud. Intentá de nuevo.");
    } catch {
      setEstado("error");
      setMensaje("No se pudo conectar con el servidor. Intentá de nuevo.");
    }
  }

  if (estado === "ok") {
    return (
      <div className="rise flex flex-col items-center py-8 text-center" style={{ opacity: 1 }}>
        <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-400/15 ring-1 ring-emerald-400/30">
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#34d399"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <h3 className="mt-5 text-2xl font-semibold">¡Listo! 🏍️</h3>
        <p className="mt-2 max-w-sm text-muted">{mensaje}</p>
        <button
          type="button"
          onClick={() => {
            setEstado("idle");
            setMensaje(null);
          }}
          className="btn btn-secondary mt-6"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={manejarEnvio} className="space-y-8" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo label="Nombre completo" error={errores.nombreCompleto}>
          <input
            type="text"
            value={form.nombreCompleto}
            onChange={(e) => actualizar("nombreCompleto", e.target.value)}
            className="field"
            autoComplete="name"
            placeholder="Tu nombre"
          />
        </Campo>
        <Campo label="Correo electrónico" error={errores.correo}>
          <input
            type="email"
            value={form.correo}
            onChange={(e) => actualizar("correo", e.target.value)}
            className="field"
            autoComplete="email"
            placeholder="vos@correo.com"
          />
        </Campo>
        <Campo label="Marca de la moto" error={errores.marcaMoto}>
          <input
            type="text"
            value={form.marcaMoto}
            onChange={(e) => actualizar("marcaMoto", e.target.value)}
            className="field"
            placeholder="Ej: Honda"
          />
        </Campo>
        <Campo label="Modelo de la moto" error={errores.modeloMoto}>
          <input
            type="text"
            value={form.modeloMoto}
            onChange={(e) => actualizar("modeloMoto", e.target.value)}
            className="field"
            placeholder="Ej: CB 500X"
          />
        </Campo>
        <Campo label="Cilindrada (cc)" error={errores.cilindrada}>
          <input
            type="number"
            min={0}
            value={form.cilindrada}
            onChange={(e) => actualizar("cilindrada", e.target.value)}
            className="field"
            placeholder="Ej: 500"
          />
        </Campo>
        <Campo label="Años de experiencia" error={errores.aniosExperiencia}>
          <input
            type="number"
            min={0}
            value={form.aniosExperiencia}
            onChange={(e) => actualizar("aniosExperiencia", e.target.value)}
            className="field"
            placeholder="Ej: 3"
          />
        </Campo>
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-medium text-fg">Requisitos mínimos</legend>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Checkbox
            label="Licencia tipo A vigente"
            checked={form.licenciaVigente}
            onChange={(v) => actualizar("licenciaVigente", v)}
          />
          <Checkbox
            label="Casco certificado"
            checked={form.equipoCasco}
            onChange={(v) => actualizar("equipoCasco", v)}
          />
          <Checkbox
            label="Guantes de protección"
            checked={form.equipoGuantes}
            onChange={(v) => actualizar("equipoGuantes", v)}
          />
          <Checkbox
            label="Chaqueta o equipo de protección"
            checked={form.equipoChaqueta}
            onChange={(v) => actualizar("equipoChaqueta", v)}
          />
        </div>
      </fieldset>

      {mensaje && (estado === "duplicado" || estado === "error") && (
        <p
          className={`flex items-start gap-2.5 rounded-xl border p-4 text-sm ${
            estado === "duplicado"
              ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
              : "border-red-400/30 bg-red-400/10 text-red-200"
          }`}
        >
          <span aria-hidden className="mt-px">
            {estado === "duplicado" ? "⚠️" : "✕"}
          </span>
          {mensaje}
        </p>
      )}

      <button
        type="submit"
        disabled={estado === "enviando"}
        className="btn btn-primary w-full sm:w-auto"
      >
        {estado === "enviando" ? (
          <>
            <Spinner />
            Enviando…
          </>
        ) : (
          "Enviar solicitud"
        )}
      </button>
    </form>
  );
}

function Campo({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-muted">{label}</span>
      {children}
      {error && (
        <span className="mt-1.5 block text-sm text-red-300">{error}</span>
      )}
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-white/[0.03] px-4 py-3 transition-colors hover:border-white/15 has-[:checked]:border-accent/50 has-[:checked]:bg-accent/[0.08] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-line bg-white/5 transition-colors group-has-[:checked]:border-accent group-has-[:checked]:bg-accent">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1a0a02"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-0 transition-opacity group-has-[:checked]:opacity-100"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <span className="text-sm text-muted transition-colors group-has-[:checked]:text-fg">
        {label}
      </span>
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
