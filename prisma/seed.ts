import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.evento.deleteMany({});

  const evento = await prisma.evento.create({
    data: {
      nombre: "Rodada Valle de Orosi",
      descripcion:
        "Rodada panorámica por el Valle de Orosi: cafetales, miradores y la represa de Cachí. Ritmo relajado, apta para todo tipo de motos de carretera.",
      fecha: new Date("2026-07-18T00:00:00.000Z"),
      horaSalida: "07:00",
      lugarSalidaNombre: "Parque La Sabana",
      lugarSalidaDireccion: "Sabana Norte, San José, Costa Rica",
      salidaLat: 9.9355,
      salidaLng: -84.1413,
      destinoNombre: "Restaurante Mirador Orosi",
      destinoDireccion: "Orosi, Cartago, Costa Rica",
      destinoLat: 9.8398,
      destinoLng: -83.8663,
      cuposMax: 20,
      fotosSalida: [
        "https://picsum.photos/seed/sabana1/800/600",
        "https://picsum.photos/seed/sabana2/800/600",
      ],
      paradas: [
        {
          nombre: "Mirador Valle de Orosi",
          descripcion: "Vista panorámica del valle y la Basílica de Ujarrás.",
          lat: 9.827,
          lng: -83.868,
          fotos: [
            "https://picsum.photos/seed/orosi1/800/600",
            "https://picsum.photos/seed/orosi2/800/600",
          ],
          orden: 1,
        },
        {
          nombre: "Represa de Cachí",
          descripcion: "Parada técnica junto a la represa hidroeléctrica.",
          lat: 9.8186,
          lng: -83.8094,
          fotos: ["https://picsum.photos/seed/cachi1/800/600"],
          orden: 2,
        },
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
