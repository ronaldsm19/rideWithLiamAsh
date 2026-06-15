import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ESTADOS_SOLICITUD } from "@/lib/validation";
import BotonCerrarSesion from "@/components/admin/BotonCerrarSesion";
import NavAdmin from "@/components/admin/NavAdmin";
import ContadoresAdmin from "@/components/admin/ContadoresAdmin";
import FiltrosEstado from "@/components/admin/FiltrosEstado";
import TablaSolicitudes from "@/components/admin/TablaSolicitudes";

export const metadata: Metadata = { title: "Solicitudes · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;

  const evento = await prisma.evento.findFirst({
    where: { estado: "publicada" },
    orderBy: { fecha: "asc" },
  });

  const solicitudes = evento
    ? await prisma.solicitud.findMany({
        where: { eventoId: evento.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const contadores = {
    total: solicitudes.length,
    pendiente: solicitudes.filter((s) => s.estado === "pendiente").length,
    aprobada: solicitudes.filter((s) => s.estado === "aprobada").length,
    rechazada: solicitudes.filter((s) => s.estado === "rechazada").length,
  };

  const estadoFiltro = ESTADOS_SOLICITUD.find((e) => e === estado);
  const solicitudesFiltradas = estadoFiltro
    ? solicitudes.filter((s) => s.estado === estadoFiltro)
    : solicitudes;

  const motivosPredefinidos = evento
    ? [
        ...evento.requisitos
          .sort((a, b) => a.orden - b.orden)
          .map((r) => `No cumple: ${r.texto}`),
        "Ya no hay cupos disponibles. ¡Gracias! Nos vemos en la siguiente rodada.",
      ]
    : undefined;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Organizador</span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Panel de administración</h1>
        </div>
        <BotonCerrarSesion />
      </header>

      <NavAdmin />

      {!evento ? (
        <div className="rounded-2xl border border-line bg-white/[0.02] p-10 text-center">
          <p className="text-muted">No hay ninguna rodada publicada.</p>
          <Link href="/admin/rodadas" className="btn-primary btn-sm mt-4 inline-flex">
            Ir a Rodadas
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-6 text-sm text-muted">
            Rodada activa:{" "}
            <Link href={`/admin/rodadas/${evento.id}`} className="font-medium text-fg hover:text-accent">
              {evento.nombre}
            </Link>
          </p>

          <section className="mb-6">
            <ContadoresAdmin
              total={contadores.total}
              pendientes={contadores.pendiente}
              aprobadas={contadores.aprobada}
              rechazadas={contadores.rechazada}
              cuposMax={evento.cuposMax}
            />
          </section>

          <section className="mb-4">
            <FiltrosEstado estadoActivo={estadoFiltro} contadores={contadores} />
          </section>

          <section>
            <TablaSolicitudes
              solicitudes={solicitudesFiltradas}
              motivosPredefinidos={motivosPredefinidos}
            />
          </section>
        </>
      )}
    </main>
  );
}
