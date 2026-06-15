import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import BotonCerrarSesion from "@/components/admin/BotonCerrarSesion";
import NavAdmin from "@/components/admin/NavAdmin";
import EditorDatosGenerales from "@/components/admin/EditorDatosGenerales";
import EditorMapa from "@/components/admin/EditorMapa";
import SubidorFotos from "@/components/admin/SubidorFotos";
import ConstructorCampos from "@/components/admin/ConstructorCampos";
import EditorRequisitos from "@/components/admin/EditorRequisitos";

export const metadata: Metadata = { title: "Editar rodada · Admin" };
export const dynamic = "force-dynamic";

const TABS = [
  { key: "datos", label: "Datos" },
  { key: "mapa", label: "Mapa y ruta" },
  { key: "fotos", label: "Fotos" },
  { key: "campos", label: "Formulario" },
  { key: "requisitos", label: "Requisitos" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function EditorRodadaPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab } = await searchParams;

  const evento = await prisma.evento.findUnique({ where: { id } });
  if (!evento) notFound();

  const tabActivo: TabKey = (TABS.find((t) => t.key === tab)?.key ?? "datos") as TabKey;

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

      <div className="mb-1 flex items-center gap-3">
        <Link href="/admin/rodadas" className="text-sm text-muted hover:text-fg">
          ← Rodadas
        </Link>
        <span className="text-line">/</span>
        <span className="text-sm font-medium text-fg">{evento.nombre}</span>
        <span
          className={`ml-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            evento.estado === "publicada"
              ? "bg-emerald-400/15 text-emerald-300"
              : evento.estado === "archivada"
                ? "bg-white/5 text-faint"
                : "bg-zinc-400/15 text-zinc-300"
          }`}
        >
          {evento.estado}
        </span>
      </div>

      {/* Sub-tabs */}
      <nav className="mt-6 mb-8 flex gap-1 overflow-x-auto border-b border-line pb-px">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/rodadas/${id}?tab=${t.key}`}
            className={`relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors ${
              tabActivo === t.key
                ? "text-fg after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[2px] after:rounded-full after:bg-accent"
                : "text-muted hover:text-fg"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tabActivo === "datos" && <EditorDatosGenerales evento={evento} />}
      {tabActivo === "mapa" && <EditorMapa eventoId={evento.id} puntos={evento.puntos} />}
      {tabActivo === "fotos" && <SubidorFotos eventoId={evento.id} puntos={evento.puntos} />}
      {tabActivo === "campos" && <ConstructorCampos eventoId={evento.id} campos={evento.campos} />}
      {tabActivo === "requisitos" && <EditorRequisitos eventoId={evento.id} requisitos={evento.requisitos} />}
    </main>
  );
}
