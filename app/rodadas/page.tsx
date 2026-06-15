import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Rodadas · Ride with Liam" };
export const dynamic = "force-dynamic";

export default async function RodadasPublicasPage() {
  const eventos = await prisma.evento.findMany({
    where: { estado: "publicada" },
    orderBy: { fecha: "asc" },
  });

  const conCupos = await Promise.all(
    eventos.map(async (e) => {
      const aprobadas = await prisma.solicitud.count({
        where: { eventoId: e.id, estado: "aprobada" },
      });
      return { ...e, aprobadas };
    })
  );

  const fechaFmt = (d: Date) =>
    new Intl.DateTimeFormat("es-CR", {
      weekday: "short", day: "numeric", month: "long", year: "numeric",
    }).format(d);

  return (
    <>
      <header className="sticky top-0 z-50">
        <nav className="glass mx-auto flex h-[var(--nav-h)] max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-accent-soft to-accent-2 text-[15px] shadow-[0_0_12px_rgba(232,137,43,0.4)]">
              🏍
            </span>
            <span className="text-sm font-bold">Ride with Liam</span>
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="mb-12">
          <span className="eyebrow">Próximas salidas</span>
          <h1 className="section-title mt-4">Todas las rodadas</h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Elegí la rodada que más te llama y reservá tu lugar.
          </p>
        </div>

        {conCupos.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white/[0.02] px-6 py-16 text-center">
            <p className="text-muted">No hay rodadas publicadas por el momento.</p>
            <Link href="/" className="btn btn-secondary mt-6 inline-flex">← Volver al inicio</Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {conCupos.map((e, i) => {
              const salida = [...e.puntos].sort((a, b) => a.orden - b.orden).find((p) => p.tipo === "salida");
              const destino = [...e.puntos].sort((a, b) => a.orden - b.orden).find((p) => p.tipo === "destino");
              const heroImg = e.puntos.flatMap((p) => p.fotos)[0];
              const disponibles = Math.max(e.cuposMax - e.aprobadas, 0);
              const lleno = disponibles === 0;

              return (
                <Link
                  key={e.id}
                  href={`/rodadas/${e.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-bg-soft transition-all duration-500 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_32px_80px_-24px_rgba(0,0,0,0.8)]"
                >
                  {/* Imagen */}
                  <div className="relative h-52 overflow-hidden bg-bg-soft">
                    {heroImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={heroImg}
                        alt={e.nombre}
                        className="h-full w-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl opacity-20">🏍</div>
                    )}
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, var(--color-bg-soft) 0%, transparent 60%)" }}
                    />
                    {i === 0 && (
                      <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-bold text-black shadow-lg">
                        Próxima
                      </span>
                    )}
                    <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${lleno ? "bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/30" : "bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-400/30"}`}>
                      {lleno ? "Lista de espera" : `${disponibles} cupos`}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <h2 className="text-lg font-bold leading-tight text-fg">{e.nombre}</h2>

                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
                      <span className="flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/></svg>
                        <span className="capitalize">{fechaFmt(e.fecha)}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></svg>
                        {e.horaSalida} hrs
                      </span>
                      {e.dificultad && (
                        <span className="flex items-center gap-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 21V4M5 4h11l-1.5 3.5L16 11H5"/></svg>
                          {e.dificultad}
                        </span>
                      )}
                      {e.distanciaKm && (
                        <span className="flex items-center gap-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 12h18M3 6h18M3 18h18"/></svg>
                          {e.distanciaKm} km
                        </span>
                      )}
                    </div>

                    {salida && destino && (
                      <div className="mt-auto flex items-center gap-2 text-xs text-faint">
                        <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-emerald-300">{salida.nombre}</span>
                        <span>→</span>
                        <span className="rounded-full bg-rose-400/15 px-2 py-0.5 text-rose-300">{destino.nombre}</span>
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                      <span className="text-xs text-faint">{e.cuposMax} cupos totales</span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-accent">
                        Ver rodada
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-8 text-sm text-faint sm:px-8">
          <span className="flex items-center gap-2 font-semibold text-fg"><span>🏍</span> Ride with Liam</span>
          <Link href="/" className="hover:text-fg">← Volver al inicio</Link>
        </div>
      </footer>
    </>
  );
}
