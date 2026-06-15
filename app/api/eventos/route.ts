import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { TipoCampo } from "@prisma/client";

const CAMPOS_BASE = [
  { etiqueta: "Nombre completo", clave: "nombreCompleto", tipo: "texto" as TipoCampo, opciones: [], requerido: true, ayuda: null, orden: 1, activo: true },
  { etiqueta: "Correo electrónico", clave: "correo", tipo: "email" as TipoCampo, opciones: [], requerido: true, ayuda: null, orden: 2, activo: true },
  { etiqueta: "Marca de la moto", clave: "marcaMoto", tipo: "texto" as TipoCampo, opciones: [], requerido: true, ayuda: null, orden: 3, activo: true },
  { etiqueta: "Modelo de la moto", clave: "modeloMoto", tipo: "texto" as TipoCampo, opciones: [], requerido: true, ayuda: null, orden: 4, activo: true },
];

export async function GET() {
  const eventos = await prisma.evento.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { solicitudes: true } } },
  });
  return NextResponse.json({ eventos });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.nombre) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  const evento = await prisma.evento.create({
    data: {
      nombre: body.nombre,
      descripcion: body.descripcion ?? "",
      fecha: body.fecha ? new Date(body.fecha) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      horaSalida: body.horaSalida ?? "07:00",
      cuposMax: body.cuposMax ?? 20,
      estado: "borrador",
      puntos: [],
      campos: CAMPOS_BASE,
      requisitos: [],
    },
  });

  return NextResponse.json({ evento }, { status: 201 });
}
