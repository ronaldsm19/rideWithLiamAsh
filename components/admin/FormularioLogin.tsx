"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function FormularioLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "No se pudo iniciar sesión");
        setEnviando(false);
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Intentá de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarEnvio} className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-muted">Contraseña</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field"
          autoComplete="current-password"
          autoFocus
        />
      </label>

      {error && (
        <p className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <button type="submit" disabled={enviando} className="btn-primary w-full">
        {enviando ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
