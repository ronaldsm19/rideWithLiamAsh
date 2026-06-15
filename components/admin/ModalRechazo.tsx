"use client";

import { useState } from "react";
import { MOTIVOS_RECHAZO_PREDEFINIDOS } from "@/lib/validation";

type Props = {
  nombreSolicitante: string;
  motivosPredefinidos?: string[];
  enviando: boolean;
  onConfirmar: (motivo: string) => void;
  onCancelar: () => void;
};

export default function ModalRechazo({
  nombreSolicitante,
  motivosPredefinidos,
  enviando,
  onConfirmar,
  onCancelar,
}: Props) {
  const [motivo, setMotivo] = useState("");
  const predefinidos = motivosPredefinidos ?? [...MOTIVOS_RECHAZO_PREDEFINIDOS];

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass modal-card w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-fg">Rechazar solicitud</h2>
        <p className="mt-1 text-sm text-muted">
          Solicitante: <span className="font-medium text-fg">{nombreSolicitante}</span>
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {predefinidos.map((predefinido) => (
            <button
              key={predefinido}
              type="button"
              onClick={() => setMotivo(predefinido)}
              className="rounded-full border border-line bg-white/[0.04] px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-white/20 hover:text-fg"
            >
              {predefinido}
            </button>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-medium text-muted">Motivo del rechazo</span>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={4}
            className="field resize-none"
            placeholder="Explicá el motivo del rechazo…"
          />
        </label>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancelar} disabled={enviando} className="btn-secondary">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirmar(motivo)}
            disabled={enviando || motivo.trim().length === 0}
            className="btn-danger"
          >
            {enviando ? "Rechazando…" : "Confirmar rechazo"}
          </button>
        </div>
      </div>
    </div>
  );
}
