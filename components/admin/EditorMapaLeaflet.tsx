"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PuntoRuta, TipoPunto } from "@prisma/client";

/* ---- Iconos ---- */
function crearIcono(color: string, label: string, activo = false) {
  const ring = activo ? `0 0 0 3px #fff, 0 0 0 5px ${color}` : `0 0 0 3px ${color}44, 0 6px 20px rgba(0,0,0,0.6)`;
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};color:#fff;border-radius:9999px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;box-shadow:${ring};font-family:sans-serif;transition:box-shadow .2s;">${label}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });
}

const COLOR_SALIDA = "#34d399";
const COLOR_DESTINO = "#f43f5e";
const COLOR_PARADA = "#ff7a3d";

const CENTRO_CR: [number, number] = [9.75, -83.75];

/* ---- Auto-fit bounds ---- */
function BoundsAjustador({ waypoints }: { waypoints: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (waypoints.length >= 2) {
      map.fitBounds(L.latLngBounds(waypoints), { padding: [60, 60], maxZoom: 13 });
    } else if (waypoints.length === 1) {
      map.setView(waypoints[0], 12);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function ClickHandler({ onClic }: { onClic: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) { onClic(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

/* ---- Tipos ---- */
const PUNTO_VACIO: Omit<PuntoRuta, "tipo" | "orden"> = {
  nombre: "", descripcion: null, lat: 0, lng: 0, fotos: [],
};

function normalizar(lista: PuntoRuta[]): PuntoRuta[] {
  const salida = lista.filter((p) => p.tipo === "salida");
  const paradas = lista.filter((p) => p.tipo === "parada");
  const destino = lista.filter((p) => p.tipo === "destino");
  return [
    ...salida.map((p, i) => ({ ...p, orden: i })),
    ...paradas.map((p, i) => ({ ...p, orden: i + 1 })),
    ...destino.map((p) => ({ ...p, orden: 999 })),
  ];
}

/* ---- Chip de tipo ---- */
function ChipTipo({ tipo, n }: { tipo: TipoPunto; n?: number }) {
  const cfg =
    tipo === "salida"
      ? { label: "S", color: COLOR_SALIDA, text: "Salida" }
      : tipo === "destino"
        ? { label: "D", color: COLOR_DESTINO, text: "Destino" }
        : { label: String(n ?? "·"), color: COLOR_PARADA, text: "Parada" };
  return (
    <div className="flex items-center gap-2">
      <span
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
        style={{ background: cfg.color }}
      >
        {cfg.label}
      </span>
      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: cfg.color }}>
        {cfg.text}
      </span>
    </div>
  );
}

/* ---- Componente principal ---- */
export default function EditorMapaLeaflet({
  eventoId,
  puntos: inicial,
}: {
  eventoId: string;
  puntos: PuntoRuta[];
}) {
  const router = useRouter();

  const [puntos, setPuntos] = useState<PuntoRuta[]>(() => {
    const sorted = [...inicial].sort((a, b) => a.orden - b.orden);
    const tieneSalida = sorted.some((p) => p.tipo === "salida");
    const tieneDestino = sorted.some((p) => p.tipo === "destino");
    const base: PuntoRuta[] = [];
    if (!tieneSalida) base.push({ ...PUNTO_VACIO, tipo: "salida", orden: 0 });
    base.push(...sorted);
    if (!tieneDestino) base.push({ ...PUNTO_VACIO, tipo: "destino", orden: 999 });
    return normalizar(base);
  });

  const [selIdx, setSelIdx] = useState<number>(0);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  function actualizar(idx: number, patch: Partial<PuntoRuta>) {
    setPuntos((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }

  const handleClic = useCallback(
    (lat: number, lng: number) => {
      actualizar(selIdx, { lat: +lat.toFixed(6), lng: +lng.toFixed(6) });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selIdx],
  );

  function agregarParada() {
    const nueva: PuntoRuta = { ...PUNTO_VACIO, tipo: "parada", orden: 0 };
    const destIdx = puntos.findIndex((p) => p.tipo === "destino");
    const copia = [...puntos];
    if (destIdx >= 0) copia.splice(destIdx, 0, nueva);
    else copia.push(nueva);
    const normalized = normalizar(copia);
    setPuntos(normalized);
    const idx = normalized.findIndex((p) => p.tipo === "parada" && p.nombre === "");
    setSelIdx(idx >= 0 ? idx : 0);
  }

  function eliminarParada(idx: number) {
    setPuntos((prev) => normalizar(prev.filter((_, i) => i !== idx)));
    setSelIdx(0);
  }

  function moverParada(idx: number, dir: -1 | 1) {
    const paradas = puntos.filter((p) => p.tipo === "parada");
    const paradaActual = puntos[idx];
    const paIdx = paradas.indexOf(paradaActual);
    if (paIdx < 0) return;
    const nextPaIdx = paIdx + dir;
    if (nextPaIdx < 0 || nextPaIdx >= paradas.length) return;
    const copia = [...paradas];
    [copia[paIdx], copia[nextPaIdx]] = [copia[nextPaIdx], copia[paIdx]];
    setPuntos(normalizar([
      ...puntos.filter((p) => p.tipo === "salida"),
      ...copia,
      ...puntos.filter((p) => p.tipo === "destino"),
    ]));
  }

  async function guardar() {
    setGuardando(true);
    setMensaje(null);
    const res = await fetch(`/api/eventos/${eventoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puntos }),
    });
    setGuardando(false);
    if (res.ok) {
      setMensaje({ tipo: "ok", texto: "Ruta guardada correctamente." });
      router.refresh();
      setTimeout(() => setMensaje(null), 3000);
    } else {
      setMensaje({ tipo: "error", texto: "No se pudo guardar la ruta." });
    }
  }

  const waypoints = puntos.filter((p) => p.lat !== 0 || p.lng !== 0);
  const linea = waypoints.map((p) => [p.lat, p.lng] as [number, number]);
  const initialCenter = waypoints.length > 0 ? ([waypoints[0].lat, waypoints[0].lng] as [number, number]) : CENTRO_CR;
  const initialZoom = waypoints.length > 0 ? 10 : 7;

  let paradaContador = 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-line"
      style={{ height: "calc(100svh - 240px)", minHeight: 640 }}
    >
      {/* ── Mapa full-bleed ── */}
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        className="absolute inset-0 h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <BoundsAjustador waypoints={linea} />
        <ClickHandler onClic={handleClic} />

        {/* Ruta */}
        {linea.length >= 2 && (
          <>
            <Polyline positions={linea} color={COLOR_PARADA} weight={14} opacity={0.15} />
            <Polyline positions={linea} color={COLOR_PARADA} weight={4.5} opacity={1} dashArray="0" />
          </>
        )}

        {/* Marcadores */}
        {puntos.map((p, idx) => {
          if (p.lat === 0 && p.lng === 0) return null;
          let icono: L.DivIcon;
          if (p.tipo === "salida") icono = crearIcono(COLOR_SALIDA, "S", selIdx === idx);
          else if (p.tipo === "destino") icono = crearIcono(COLOR_DESTINO, "D", selIdx === idx);
          else { paradaContador++; icono = crearIcono(COLOR_PARADA, String(paradaContador), selIdx === idx); }
          return (
            <Marker
              key={idx}
              position={[p.lat, p.lng]}
              icon={icono}
              draggable
              eventHandlers={{
                dragend(e) {
                  const { lat, lng } = e.target.getLatLng();
                  actualizar(idx, { lat: +lat.toFixed(6), lng: +lng.toFixed(6) });
                },
                click() { setSelIdx(idx); },
              }}
            >
              <Popup className="map-popup">
                <span className="font-semibold">{p.nombre || `(${p.tipo})`}</span>
                {p.descripcion && <><br /><span className="text-xs opacity-70">{p.descripcion}</span></>}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* ── Hint: clic en mapa ── */}
      <div
        className="pointer-events-none absolute bottom-4 left-1/2 z-[900] -translate-x-1/2"
        style={{ marginLeft: 148 }} /* offset para el panel */
      >
        <span className="rounded-full bg-black/60 px-4 py-2 text-xs text-white/70 backdrop-blur-md ring-1 ring-white/10">
          Hacé clic en el mapa para ubicar el punto seleccionado · Arrastrá los marcadores para ajustar
        </span>
      </div>

      {/* ── Panel flotante ── */}
      <div
        className="absolute left-3 top-3 bottom-3 z-[1000] flex w-[296px] flex-col overflow-hidden rounded-xl border border-white/10 shadow-2xl"
        style={{ background: "rgba(10,10,14,0.88)", backdropFilter: "blur(20px) saturate(160%)" }}
      >
        {/* Header del panel */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
          <div>
            <p className="text-[13px] font-semibold text-fg">Editor de ruta</p>
            <p className="mt-0.5 text-[11px] text-faint">
              {waypoints.length} {waypoints.length === 1 ? "punto ubicado" : "puntos ubicados"}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399aa]" />
            <span className="h-2 w-2 rounded-full bg-[#ff7a3d] shadow-[0_0_6px_#ff7a3daa]" />
            <span className="h-2 w-2 rounded-full bg-[#f43f5e] shadow-[0_0_6px_#f43f5eaa]" />
          </div>
        </div>

        {/* Lista scrollable */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {(() => {
            let pCount = 0;
            return puntos.map((p, idx) => {
              if (p.tipo === "parada") pCount++;
              const n = p.tipo === "parada" ? pCount : undefined;
              const isSelected = selIdx === idx;
              const color = p.tipo === "salida" ? COLOR_SALIDA : p.tipo === "destino" ? COLOR_DESTINO : COLOR_PARADA;
              const tieneCoords = p.lat !== 0 || p.lng !== 0;

              return (
                <div
                  key={idx}
                  onClick={() => setSelIdx(idx)}
                  className="cursor-pointer rounded-xl p-3 transition-all"
                  style={{
                    background: isSelected ? `${color}14` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isSelected ? `${color}55` : "rgba(255,255,255,0.07)"}`,
                    boxShadow: isSelected ? `0 0 0 1px ${color}22` : "none",
                  }}
                >
                  <div className="mb-2.5 flex items-center justify-between">
                    <ChipTipo tipo={p.tipo} n={n} />
                    {p.tipo === "parada" && (
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); moverParada(idx, -1); }}
                          className="grid h-5 w-5 place-items-center rounded text-faint transition-colors hover:bg-white/10 hover:text-fg"
                          title="Subir"
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 2 9 8H1z"/></svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); moverParada(idx, 1); }}
                          className="grid h-5 w-5 place-items-center rounded text-faint transition-colors hover:bg-white/10 hover:text-fg"
                          title="Bajar"
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 8 1 2h8z"/></svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); eliminarParada(idx); }}
                          className="ml-0.5 grid h-5 w-5 place-items-center rounded text-faint transition-colors hover:bg-red-400/20 hover:text-red-300"
                          title="Eliminar"
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l6 6M8 2l-6 6"/></svg>
                        </button>
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    value={p.nombre}
                    onChange={(e) => { e.stopPropagation(); actualizar(idx, { nombre: e.target.value }); }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Nombre del lugar"
                    className="field mb-1.5 text-[13px]"
                  />
                  <input
                    type="text"
                    value={p.descripcion ?? ""}
                    onChange={(e) => { e.stopPropagation(); actualizar(idx, { descripcion: e.target.value || null }); }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Descripción (opcional)"
                    className="field text-xs"
                  />

                  {tieneCoords ? (
                    <div className="mt-2 flex items-center gap-1.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ color }}>
                        <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>
                      </svg>
                      <span className="font-mono text-[10px]" style={{ color: `${color}bb` }}>
                        {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[10px] text-faint">
                        {isSelected ? "↖ Hacé clic en el mapa" : "Sin ubicación"}
                      </span>
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>

        {/* Footer del panel */}
        <div className="border-t border-white/10 px-3 py-3 space-y-2">
          <button
            type="button"
            onClick={agregarParada}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] py-2.5 text-sm font-medium text-muted transition-colors hover:border-white/20 hover:bg-white/[0.07] hover:text-fg"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Agregar parada
          </button>

          {mensaje && (
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs ${
              mensaje.tipo === "ok"
                ? "border border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                : "border border-red-400/25 bg-red-400/10 text-red-300"
            }`}>
              {mensaje.tipo === "ok" ? "✓" : "✕"} {mensaje.texto}
            </div>
          )}

          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="btn btn-primary w-full"
          >
            {guardando ? (
              <><Spinner />Guardando…</>
            ) : (
              <><IconSave />Guardar ruta</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

function IconSave() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/>
      <path d="M17 21v-8H7v8M7 3v5h8"/>
    </svg>
  );
}
