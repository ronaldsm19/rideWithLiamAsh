import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import BotonCerrarSesion from "@/components/admin/BotonCerrarSesion";
import NavAdmin from "@/components/admin/NavAdmin";
import ListaRodadas, { BotonNueva } from "@/components/admin/ListaRodadas";

export const metadata: Metadata = { title: "Rodadas · Admin" };
export const dynamic = "force-dynamic";

export default async function RodadasPage() {
  const eventos = await prisma.evento.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { solicitudes: true } } },
  });

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

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-fg">Rodadas</h2>
        <BotonNueva />
      </div>

      <ListaRodadas eventos={eventos} />
    </main>
  );
}
