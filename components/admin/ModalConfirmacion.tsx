"use client";

type ModalConfirmacionProps = {
  titulo: string;
  mensaje: string;
  enviando: boolean;
  textoConfirmar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
};

export default function ModalConfirmacion({
  titulo,
  mensaje,
  enviando,
  textoConfirmar = "Confirmar",
  onConfirmar,
  onCancelar,
}: ModalConfirmacionProps) {
  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass modal-card w-full max-w-md rounded-2xl p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-fg">{titulo}</h2>
        <p className="mt-2 text-sm text-muted">{mensaje}</p>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancelar} disabled={enviando} className="btn-secondary">
            Cancelar
          </button>
          <button type="button" onClick={onConfirmar} disabled={enviando} className="btn-primary">
            {enviando ? "Procesando…" : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
