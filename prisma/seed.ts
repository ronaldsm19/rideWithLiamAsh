import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.solicitud.deleteMany({});
  await prisma.evento.deleteMany({});

  const evento = await prisma.evento.create({
    data: {
      nombre: "Rodada Valle de Orosi",
      descripcion:
        "Rodada panorámica por el Valle de Orosi: cafetales, miradores y la represa de Cachí. Ritmo relajado, apta para todo tipo de motos de carretera.",
      fecha: new Date("2026-07-18T00:00:00.000Z"),
      horaSalida: "07:00",
      cuposMax: 20,
      estado: "publicada",
      dificultad: "Fácil",
      distanciaKm: 85,
      puntos: [
        {
          tipo: "salida",
          nombre: "Parque La Sabana",
          descripcion: "Estacionamento noreste del parque, costado KFC.",
          lat: 9.9355,
          lng: -84.1413,
          orden: 0,
          fotos: [
            "https://picsum.photos/seed/sabana1/800/600",
            "https://picsum.photos/seed/sabana2/800/600",
          ],
        },
        {
          tipo: "parada",
          nombre: "Mirador Valle de Orosi",
          descripcion: "Vista panorámica del valle y la Basílica de Ujarrás.",
          lat: 9.827,
          lng: -83.868,
          orden: 1,
          fotos: [
            "https://picsum.photos/seed/orosi1/800/600",
            "https://picsum.photos/seed/orosi2/800/600",
          ],
        },
        {
          tipo: "parada",
          nombre: "Represa de Cachí",
          descripcion: "Parada técnica junto a la represa hidroeléctrica.",
          lat: 9.8186,
          lng: -83.8094,
          orden: 2,
          fotos: ["https://picsum.photos/seed/cachi1/800/600"],
        },
        {
          tipo: "destino",
          nombre: "Restaurante Mirador Orosi",
          descripcion: "Almuerzo con vista al Valle de Orosi.",
          lat: 9.8398,
          lng: -83.8663,
          orden: 3,
          fotos: [
            "https://picsum.photos/seed/destino1/800/600",
          ],
        },
      ],
      campos: [
        {
          etiqueta: "Nombre completo",
          clave: "nombreCompleto",
          tipo: "texto",
          opciones: [],
          requerido: true,
          ayuda: "",
          orden: 0,
          activo: true,
        },
        {
          etiqueta: "Correo electrónico",
          clave: "correo",
          tipo: "email",
          opciones: [],
          requerido: true,
          ayuda: "Recibirás la confirmación aquí.",
          orden: 1,
          activo: true,
        },
        {
          etiqueta: "Marca de moto",
          clave: "marcaMoto",
          tipo: "texto",
          opciones: [],
          requerido: true,
          ayuda: "",
          orden: 2,
          activo: true,
        },
        {
          etiqueta: "Modelo de moto",
          clave: "modeloMoto",
          tipo: "texto",
          opciones: [],
          requerido: true,
          ayuda: "Ej: CB500F, Ninja 400, MT-07",
          orden: 3,
          activo: true,
        },
        {
          etiqueta: "Año de la moto",
          clave: "anioMoto",
          tipo: "numero",
          opciones: [],
          requerido: false,
          ayuda: "",
          orden: 4,
          activo: true,
        },
        {
          etiqueta: "Teléfono de contacto",
          clave: "telefono",
          tipo: "telefono",
          opciones: [],
          requerido: false,
          ayuda: "Solo en caso de emergencia.",
          orden: 5,
          activo: true,
        },
        {
          etiqueta: "Acepto el reglamento de la rodada",
          clave: "aceptaReglamento",
          tipo: "checkbox",
          opciones: [],
          requerido: true,
          ayuda: "",
          orden: 6,
          activo: true,
        },
      ],
      requisitos: [
        { texto: "Licencia de conducir vigente (A2 o superior)", orden: 0 },
        { texto: "Moto en buen estado mecánico", orden: 1 },
        { texto: "Casco homologado (ECE 22.05 o superior)", orden: 2 },
        { texto: "Experiencia mínima de 1 año en ruta", orden: 3 },
        { texto: "SOAT al día", orden: 4 },
      ],
    },
  });

  console.log(`Evento creado: ${evento.nombre} (${evento.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
