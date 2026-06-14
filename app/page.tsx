import type { CSSProperties, ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import CuposIndicator from "@/components/CuposIndicator";
import MapaRutaCliente from "@/components/MapaRutaCliente";
import GaleriaFotos from "@/components/GaleriaFotos";
import FormularioInscripcion from "@/components/FormularioInscripcion";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

/** Inline CSS custom property for the staggered hero entrance. */
const rise = (delay: number): CSSProperties =>
  ({ "--rise-delay": `${delay}ms` }) as CSSProperties;

export default async function Home() {
  const evento = await prisma.evento.findFirst({ orderBy: { createdAt: "asc" } });

  if (!evento) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="aurora" aria-hidden />
        <div className="relative max-w-lg">
          <span className="eyebrow justify-center">Rodada en moto</span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            Todavía no hay una rodada configurada
          </h1>
          <p className="mt-4 text-muted">
            El organizador aún no cargó los datos del evento. Volvé a intentarlo más tarde.
          </p>
        </div>
      </main>
    );
  }

  const cuposAprobados = await prisma.solicitud.count({ where: { estado: "aprobada" } });
  const disponibles = Math.max(evento.cuposMax - cuposAprobados, 0);

  const paradas = [...evento.paradas].sort((a, b) => a.orden - b.orden);
  const heroImg = evento.fotosSalida[0];

  const fechaFormateada = new Intl.DateTimeFormat("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(evento.fecha);

  const fechaCorta = new Intl.DateTimeFormat("es-CR", {
    day: "numeric",
    month: "long",
  }).format(evento.fecha);

  return (
    <>
      {/* ---------- Sticky glass nav ---------- */}
      <header className="sticky top-0 z-50">
        <nav className="glass mx-auto flex h-[var(--nav-h)] max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <a href="#top" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-accent-soft to-accent-2 text-[15px]">
              🏍️
            </span>
            <span className="hidden truncate sm:block">{evento.nombre}</span>
            <span className="sm:hidden">Rodada</span>
          </a>
          <a href="#inscripcion" className="btn btn-primary !px-5 !py-2 text-xs">
            Inscribirme
          </a>
        </nav>
      </header>

      <main id="top" className="flex flex-col">
        {/* ---------- Cinematic hero ---------- */}
        <section className="relative -mt-[var(--nav-h)] flex min-h-[92svh] items-end overflow-hidden">
          {/* Background image */}
          {heroImg && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImg}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full scale-105 object-cover opacity-40"
            />
          )}
          <div className="aurora" aria-hidden />
          <div className="grain" aria-hidden />
          {/* Legibility scrims */}
          <div
            className="absolute inset-0 z-[2]"
            aria-hidden
            style={{
              background:
                "linear-gradient(to top, var(--color-bg) 4%, rgba(8,8,11,0.35) 45%, rgba(8,8,11,0.55) 100%)",
            }}
          />

          <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20 pt-32 sm:px-8 sm:pb-28">
            <span className="rise eyebrow" style={rise(80)}>
              {fechaCorta} · {evento.lugarSalidaNombre}
            </span>

            <h1
              className="rise mt-5 max-w-4xl text-balance text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl md:text-8xl"
              style={rise(180)}
            >
              <span className="text-gradient">{evento.nombre}</span>
            </h1>

            <p
              className="rise mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl"
              style={rise(300)}
            >
              {evento.descripcion}
            </p>

            {/* Fact chips */}
            <div className="rise mt-8 flex flex-wrap gap-2.5" style={rise(420)}>
              <Chip icon={<IconCalendar />} text={<span className="capitalize">{fechaCorta}</span>} />
              <Chip icon={<IconClock />} text={`${evento.horaSalida} hrs`} />
              <Chip icon={<IconPin />} text={evento.lugarSalidaNombre} />
              <Chip
                icon={<IconUsers />}
                text={
                  disponibles > 0
                    ? `${disponibles} ${disponibles === 1 ? "cupo" : "cupos"} disponibles`
                    : "Lista de espera"
                }
                highlight
              />
            </div>

            {/* CTAs */}
            <div className="rise mt-10 flex flex-wrap items-center gap-3" style={rise(540)}>
              <a href="#inscripcion" className="btn btn-primary">
                Quiero inscribirme
                <IconArrowRight />
              </a>
              <a href="#ruta" className="btn btn-secondary">
                Ver la ruta
              </a>
            </div>
          </div>

          {/* Scroll cue */}
          <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2" aria-hidden>
            <div className="scroll-cue flex flex-col items-center gap-1 text-faint">
              <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Deslizá</span>
              <IconChevronDown />
            </div>
          </div>
        </section>

        {/* ---------- Detalles ---------- */}
        <Section id="detalles" eyebrow="La salida" title="Todo lo que necesitás saber">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Reveal delay={0}>
              <InfoCard icon={<IconCalendar />} label="Fecha">
                <span className="capitalize">{fechaFormateada}</span>
              </InfoCard>
            </Reveal>
            <Reveal delay={80}>
              <InfoCard icon={<IconClock />} label="Hora de salida">
                {evento.horaSalida} hrs
              </InfoCard>
            </Reveal>
            <Reveal delay={160}>
              <InfoCard icon={<IconPin />} label="Punto de salida" sub={evento.lugarSalidaDireccion}>
                {evento.lugarSalidaNombre}
              </InfoCard>
            </Reveal>
            <Reveal delay={240}>
              <InfoCard icon={<IconFlag />} label="Destino" sub={evento.destinoDireccion}>
                {evento.destinoNombre}
              </InfoCard>
            </Reveal>
          </div>

          <Reveal delay={120} className="mt-4">
            <CuposIndicator cuposMax={evento.cuposMax} cuposAprobados={cuposAprobados} />
          </Reveal>
        </Section>

        {/* ---------- Ruta ---------- */}
        <Section id="ruta" eyebrow="El recorrido" title="La ruta, parada por parada">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-line bg-bg-soft p-1.5 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]">
              <div className="overflow-hidden rounded-[1.35rem]">
                <MapaRutaCliente
                  salida={{
                    lat: evento.salidaLat,
                    lng: evento.salidaLng,
                    nombre: evento.lugarSalidaNombre,
                  }}
                  destino={{
                    lat: evento.destinoLat,
                    lng: evento.destinoLng,
                    nombre: evento.destinoNombre,
                  }}
                  paradas={paradas.map((p) => ({ lat: p.lat, lng: p.lng, nombre: p.nombre }))}
                />
              </div>
            </div>
          </Reveal>

          {/* Route timeline */}
          <Reveal delay={120} className="mt-6">
            <ol className="flex flex-col gap-0 sm:flex-row sm:items-stretch sm:gap-0">
              <RouteStep badge="S" title={evento.lugarSalidaNombre} sub="Salida" tone="start" />
              {paradas.map((p, i) => (
                <RouteStep
                  key={`${p.nombre}-${i}`}
                  badge={String(i + 1)}
                  title={p.nombre}
                  sub={p.descripcion ?? "Parada"}
                />
              ))}
              <RouteStep
                badge="D"
                title={evento.destinoNombre}
                sub="Destino"
                tone="end"
                last
              />
            </ol>
          </Reveal>
        </Section>

        {/* ---------- Galería ---------- */}
        {(evento.fotosSalida.length > 0 || paradas.some((p) => p.fotos.length > 0)) && (
          <Section id="galeria" eyebrow="En imágenes" title="Una probadita del paisaje">
            <Reveal>
              <GaleriaFotos
                fotosSalida={evento.fotosSalida}
                lugarSalidaNombre={evento.lugarSalidaNombre}
                paradas={paradas.map((p) => ({
                  nombre: p.nombre,
                  descripcion: p.descripcion,
                  fotos: p.fotos,
                }))}
              />
            </Reveal>
          </Section>
        )}

        {/* ---------- Inscripción ---------- */}
        <Section
          id="inscripcion"
          eyebrow="Sumate"
          title="Reservá tu lugar en la rodada"
          description="Completá tus datos y los de tu moto. Revisamos cada solicitud y te avisamos por correo."
        >
          <Reveal>
            <div className="glass rounded-3xl p-6 sm:p-8 md:p-10">
              <FormularioInscripcion />
            </div>
          </Reveal>
        </Section>

        {/* ---------- Footer ---------- */}
        <footer className="mt-10 border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-10 text-sm text-faint sm:flex-row sm:px-8">
            <p className="flex items-center gap-2">
              <span>🏍️</span>
              {evento.nombre}
            </p>
            <p>Nos vemos en la carretera.</p>
          </div>
        </footer>
      </main>
    </>
  );
}

/* ============================================================
   Local building blocks
   ============================================================ */
function Section({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mx-auto w-full max-w-6xl scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <Reveal>
        <div className="mb-10 max-w-2xl">
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="section-title mt-4">{title}</h2>
          {description && <p className="mt-4 text-lg text-muted">{description}</p>}
        </div>
      </Reveal>
      {children}
    </section>
  );
}

function Chip({
  icon,
  text,
  highlight = false,
}: {
  icon: ReactNode;
  text: ReactNode;
  highlight?: boolean;
}) {
  return (
    <span
      className={`glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm ${
        highlight ? "text-accent-soft" : "text-muted"
      }`}
    >
      <span className={highlight ? "text-accent" : "text-faint"}>{icon}</span>
      {text}
    </span>
  );
}

function InfoCard({
  icon,
  label,
  sub,
  children,
}: {
  icon: ReactNode;
  label: string;
  sub?: string;
  children: ReactNode;
}) {
  return (
    <div className="card h-full">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-accent ring-1 ring-line">
        {icon}
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-faint">{label}</p>
      <p className="mt-1 text-lg font-semibold text-fg">{children}</p>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </div>
  );
}

function RouteStep({
  badge,
  title,
  sub,
  tone = "stop",
  last = false,
}: {
  badge: string;
  title: string;
  sub: string;
  tone?: "start" | "stop" | "end";
  last?: boolean;
}) {
  const badgeClass =
    tone === "start"
      ? "bg-emerald-500/90 text-white"
      : tone === "end"
        ? "bg-gradient-to-br from-accent to-accent-2 text-white"
        : "bg-white/10 text-fg ring-1 ring-line";

  return (
    <li className="relative flex flex-1 items-start gap-3 pb-6 sm:flex-col sm:pb-0">
      <div className="flex items-center sm:w-full">
        <span
          className={`z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold shadow-lg ${badgeClass}`}
        >
          {badge}
        </span>
        {!last && (
          <span
            className="ml-2 hidden h-px flex-1 bg-gradient-to-r from-accent/60 to-line sm:block"
            aria-hidden
          />
        )}
      </div>
      <div className="sm:mt-3">
        <p className="text-[15px] font-semibold leading-tight text-fg">{title}</p>
        <p className="mt-0.5 text-sm text-muted">{sub}</p>
      </div>
      {/* vertical connector on mobile */}
      {!last && (
        <span
          className="absolute left-[17px] top-9 h-full w-px bg-gradient-to-b from-accent/50 to-line sm:hidden"
          aria-hidden
        />
      )}
    </li>
  );
}

/* ============================================================
   Inline icons (stroke = currentColor)
   ============================================================ */
function svg(children: ReactNode) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const IconCalendar = () =>
  svg(
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </>
  );

const IconClock = () =>
  svg(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </>
  );

const IconPin = () =>
  svg(
    <>
      <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  );

const IconFlag = () =>
  svg(
    <>
      <path d="M5 21V4M5 4h11l-1.5 3.5L16 11H5" />
    </>
  );

const IconUsers = () =>
  svg(
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.2a3 3 0 0 1 0 5.6M21 20a5.2 5.2 0 0 0-3.5-4.9" />
    </>
  );

const IconArrowRight = () =>
  svg(
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>
  );

const IconChevronDown = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
