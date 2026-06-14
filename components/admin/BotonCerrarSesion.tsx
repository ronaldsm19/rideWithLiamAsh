"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BotonCerrarSesion() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  async function cerrarSesion() {
    setEnviando(true);
    await fetch("/api/auth", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button onClick={cerrarSesion} disabled={enviando} className="btn-secondary btn-sm">
      {enviando ? "Saliendo…" : "Cerrar sesión"}
    </button>
  );
}
