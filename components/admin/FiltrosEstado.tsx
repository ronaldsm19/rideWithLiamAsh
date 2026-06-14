import Link from "next/link";
import { ESTADOS_SOLICITUD } from "@/lib/validation";

type FiltrosEstadoProps = {
  estadoActivo?: string;
  contadores: { total: number; pendiente: number; aprobada: number; rechazada: number };
};

const ETIQUETAS: Record<string, string> = {
  pendiente: "Pendientes",
  aprobada: "Aprobadas",
  rechazada: "Rechazadas",
};

export default function FiltrosEstado({ estadoActivo, contadores }: FiltrosEstadoProps) {
  const opciones = [
    { valor: undefined, etiqueta: "Todas", cantidad: contadores.total },
    ...ESTADOS_SOLICITUD.map((estado) => ({
      valor: estado,
      etiqueta: ETIQUETAS[estado],
      cantidad: contadores[estado],
    })),
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {opciones.map((opcion) => {
        const activo = estadoActivo === opcion.valor;
        const href = opcion.valor ? `/admin?estado=${opcion.valor}` : "/admin";
        return (
          <Link
            key={opcion.etiqueta}
            href={href}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              activo
                ? "bg-gradient-to-r from-accent to-accent-2 text-[#1a0a02] shadow-[0_8px_24px_-10px_rgba(255,122,61,0.7)]"
                : "border border-line bg-white/[0.04] text-muted hover:border-white/20 hover:text-fg"
            }`}
          >
            {opcion.etiqueta} ({opcion.cantidad})
          </Link>
        );
      })}
    </div>
  );
}
