"use client";

import dynamic from "next/dynamic";
import type { PuntoRuta } from "./MapaRuta";

const MapaRuta = dynamic(() => import("./MapaRuta"), {
  ssr: false,
  loading: () => (
    <div className="shimmer flex h-[420px] w-full items-center justify-center text-sm text-faint sm:h-[480px]">
      Cargando mapa…
    </div>
  ),
});

type MapaRutaClienteProps = {
  salida: PuntoRuta;
  destino: PuntoRuta;
  paradas: PuntoRuta[];
};

export default function MapaRutaCliente(props: MapaRutaClienteProps) {
  return <MapaRuta {...props} />;
}
