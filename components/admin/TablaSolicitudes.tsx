"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalRechazo from "./ModalRechazo";
import ModalConfirmacion from "./ModalConfirmacion";

export type SolicitudFila = {
  id: string;
  correo: string;
  estado: "pendiente" | "aprobada" | "rechazada";
  motivoRechazo: string | null;
  respuestas: unknown;
  createdAt: Date;
};

const ESTILOS_ESTADO: Record<SolicitudFila["estado"], string> = {
  pendiente: "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/25",
  aprobada: "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/25",
  rechazada: "bg-red-400/15 text-red-300 ring-1 ring-red-400/25",
};

const formateadorFecha = new Intl.DateTimeFormat("es-CR", {
  timeZone: "America/Costa_Rica",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function extraer(respuestas: unknown, clave: string): string {
  if (!respuestas || typeof respuestas !== "object") return "";
  return String((respuestas as Record<string, unknown>)[clave] ?? "");
}

export default function TablaSolicitudes({
  solicitudes,
  motivosPredefinidos,
}: {
  solicitudes: SolicitudFila[];
  motivosPredefinidos?: string[];
}) {
  const router = useRouter();
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalRechazo, setModalRechazo] = useState<SolicitudFila | null>(null);
  const [modalSobrecupo, setModalSobrecupo] = useState<SolicitudFila | null>(null);

  async function patch(id: string, body: unknown) {
    return fetch(`/api/solicitudes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async function aprobar(solicitud: SolicitudFila, confirmarSobrecupo = false) {
    setError(null);
    setProcesandoId(solicitud.id);
    const res = await patch(solicitud.id, { accion: "aprobar", confirmarSobrecupo });
    if (res.status === 409) { setProcesandoId(null); setModalSobrecupo(solicitud); return; }
    if (!res.ok) { setProcesandoId(null); setError("No se pudo aprobar la solicitud."); return; }
    setModalSobrecupo(null);
    setProcesandoId(null);
    router.refresh();
  }

  async function rechazar(motivo: string) {
    if (!modalRechazo) return;
    setError(null);
    setProcesandoId(modalRechazo.id);
    const res = await patch(modalRechazo.id, { accion: "rechazar", motivoRechazo: motivo });
    if (!res.ok) { setProcesandoId(null); setError("No se pudo rechazar la solicitud."); return; }
    setModalRechazo(null);
    setProcesandoId(null);
    router.refresh();
  }

  async function revertir(solicitud: SolicitudFila) {
    setError(null);
    setProcesandoId(solicitud.id);
    const res = await patch(solicitud.id, { accion: "revertir" });
    if (!res.ok) { setProcesandoId(null); setError("No se pudo revertir la solicitud."); return; }
    setProcesandoId(null);
    router.refresh();
  }

  if (solicitudes.length === 0) {
    return (
      <p className="rounded-2xl border border-line bg-white/[0.02] px-5 py-10 text-center text-muted">
        No hay solicitudes en esta categoría.
      </p>
    );
  }

  return (
    <>
      {error && (
        <p className="mb-3 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>
      )}

      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="border-b border-line bg-white/[0.02] text-left text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-4 py-3.5 font-medium">Solicitante</th>
              <th className="px-4 py-3.5 font-medium">Moto</th>
              <th className="px-4 py-3.5 font-medium">Estado</th>
              <th className="px-4 py-3.5 font-medium">Fecha</th>
              <th className="px-4 py-3.5 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {solicitudes.map((s) => {
              const nombre = extraer(s.respuestas, "nombreCompleto") || s.correo;
              const marca = extraer(s.respuestas, "marcaMoto");
              const modelo = extraer(s.respuestas, "modeloMoto");
              return (
                <tr key={s.id} className="transition-colors hover:bg-white/[0.025]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-fg">{nombre}</p>
                    <p className="text-faint">{s.correo}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {marca || modelo ? `${marca} ${modelo}`.trim() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${ESTILOS_ESTADO[s.estado]}`}>
                      {s.estado.charAt(0).toUpperCase() + s.estado.slice(1)}
                    </span>
                    {s.estado === "rechazada" && s.motivoRechazo && (
                      <p className="mt-1 max-w-xs text-xs text-faint">{s.motivoRechazo}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-faint" suppressHydrationWarning>
                    {formateadorFecha.format(s.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {s.estado === "pendiente" && (
                        <>
                          <button type="button" onClick={() => aprobar(s)} disabled={procesandoId === s.id} className="btn-primary btn-sm">
                            Aprobar
                          </button>
                          <button type="button" onClick={() => setModalRechazo(s)} disabled={procesandoId === s.id} className="btn-danger btn-sm">
                            Rechazar
                          </button>
                        </>
                      )}
                      {(s.estado === "aprobada" || s.estado === "rechazada") && (
                        <button type="button" onClick={() => revertir(s)} disabled={procesandoId === s.id} className="btn-secondary btn-sm">
                          Revertir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalRechazo && (
        <ModalRechazo
          nombreSolicitante={extraer(modalRechazo.respuestas, "nombreCompleto") || modalRechazo.correo}
          motivosPredefinidos={motivosPredefinidos}
          enviando={procesandoId === modalRechazo.id}
          onConfirmar={rechazar}
          onCancelar={() => setModalRechazo(null)}
        />
      )}

      {modalSobrecupo && (
        <ModalConfirmacion
          titulo="Cupos excedidos"
          mensaje={`Ya se alcanzó el cupo máximo. ¿Querés aprobar a ${extraer(modalSobrecupo.respuestas, "nombreCompleto") || modalSobrecupo.correo} de todas formas?`}
          textoConfirmar="Aprobar igual"
          enviando={procesandoId === modalSobrecupo.id}
          onConfirmar={() => aprobar(modalSobrecupo, true)}
          onCancelar={() => setModalSobrecupo(null)}
        />
      )}
    </>
  );
}
