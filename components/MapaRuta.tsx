"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L, { type LatLngBoundsExpression, type LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";

export type PuntoRuta = {
  lat: number;
  lng: number;
  nombre: string;
};

type MapaRutaProps = {
  salida: PuntoRuta;
  destino: PuntoRuta;
  paradas: PuntoRuta[];
};

function crearIcono(color: string, label: string) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};color:#fff;border-radius:9999px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;border:2px solid rgba(255,255,255,0.95);box-shadow:0 0 0 4px ${color}33, 0 6px 16px rgba(0,0,0,0.5);font-family:sans-serif;">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });
}

const ICONO_SALIDA = crearIcono("#34d399", "S");
const ICONO_DESTINO = crearIcono("#ff3d6e", "D");

type OsrmResponse = {
  code: string;
  routes?: { geometry: { coordinates: [number, number][] } }[];
};

export default function MapaRuta({ salida, destino, paradas }: MapaRutaProps) {
  const waypoints: PuntoRuta[] = [salida, ...paradas, destino];
  const lineaRecta: LatLngTuple[] = waypoints.map((p) => [p.lat, p.lng]);
  const bounds: LatLngBoundsExpression = lineaRecta;

  const [ruta, setRuta] = useState<LatLngTuple[]>(lineaRecta);
  const [usandoRutaReal, setUsandoRutaReal] = useState(false);

  useEffect(() => {
    const osrmUrl = process.env.NEXT_PUBLIC_OSRM_URL || "https://router.project-osrm.org";
    const coords = waypoints.map((p) => `${p.lng},${p.lat}`).join(";");
    const url = `${osrmUrl}/route/v1/driving/${coords}?overview=full&geometries=geojson`;

    let cancelado = false;

    fetch(url)
      .then((res) => (res.ok ? (res.json() as Promise<OsrmResponse>) : null))
      .then((data) => {
        if (cancelado || !data || data.code !== "Ok" || !data.routes?.[0]) return;
        const geo = data.routes[0].geometry.coordinates.map(
          ([lng, lat]) => [lat, lng] as LatLngTuple
        );
        setRuta(geo);
        setUsandoRutaReal(true);
      })
      .catch(() => {
        // Si OSRM no responde, se mantiene la línea recta entre puntos.
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(waypoints)]);

  return (
    <div className="h-[420px] w-full sm:h-[480px]">
      <MapContainer bounds={bounds} boundsOptions={{ padding: [40, 40] }} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {/* Soft glow underlay for the route */}
        <Polyline positions={ruta} color="#ff7a3d" weight={11} opacity={0.18} />
        <Polyline positions={ruta} color="#ff9d4d" weight={4} opacity={0.95} />
        <Marker position={[salida.lat, salida.lng]} icon={ICONO_SALIDA}>
          <Popup>
            <strong>Salida:</strong> {salida.nombre}
          </Popup>
        </Marker>
        {paradas.map((parada, i) => (
          <Marker
            key={`${parada.nombre}-${i}`}
            position={[parada.lat, parada.lng]}
            icon={crearIcono("#ff7a3d", String(i + 1))}
          >
            <Popup>
              <strong>Parada {i + 1}:</strong> {parada.nombre}
            </Popup>
          </Marker>
        ))}
        <Marker position={[destino.lat, destino.lng]} icon={ICONO_DESTINO}>
          <Popup>
            <strong>Destino:</strong> {destino.nombre}
          </Popup>
        </Marker>
      </MapContainer>
      {!usandoRutaReal && (
        <p className="sr-only">Mostrando línea directa entre puntos mientras se calcula la ruta por calles.</p>
      )}
    </div>
  );
}
