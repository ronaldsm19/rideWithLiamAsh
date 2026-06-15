"use client";

import dynamic from "next/dynamic";
import type { PuntoRuta } from "@prisma/client";

const EditorMapaLeaflet = dynamic(() => import("./EditorMapaLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="shimmer flex h-[520px] w-full items-center justify-center rounded-2xl text-sm text-faint">
      Cargando editor de mapa…
    </div>
  ),
});

export default function EditorMapa({
  eventoId,
  puntos,
}: {
  eventoId: string;
  puntos: PuntoRuta[];
}) {
  return <EditorMapaLeaflet eventoId={eventoId} puntos={puntos} />;
}
