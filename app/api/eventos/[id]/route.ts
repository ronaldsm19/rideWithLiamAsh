import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const evento = await prisma.evento.findUnique({ where: { id } });
  if (!evento) return NextResponse.json({ error: "no_encontrado" }, { status: 404 });
  return NextResponse.json({ evento });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.nombre !== undefined) data.nombre = body.nombre;
  if (body.descripcion !== undefined) data.descripcion = body.descripcion;
  if (body.fecha !== undefined) data.fecha = new Date(body.fecha);
  if (body.horaSalida !== undefined) data.horaSalida = body.horaSalida;
  if (body.cuposMax !== undefined) data.cuposMax = Number(body.cuposMax);
  if (body.estado !== undefined) data.estado = body.estado;
  if (body.dificultad !== undefined) data.dificultad = body.dificultad || null;
  if (body.distanciaKm !== undefined) data.distanciaKm = body.distanciaKm ? Number(body.distanciaKm) : null;
  if (body.puntos !== undefined) data.puntos = body.puntos;
  if (body.campos !== undefined) data.campos = body.campos;
  if (body.requisitos !== undefined) data.requisitos = body.requisitos;

  const evento = await prisma.evento.update({ where: { id }, data });
  return NextResponse.json({ evento });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const count = await prisma.solicitud.count({ where: { eventoId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar una rodada que tiene solicitudes." },
      { status: 409 }
    );
  }

  await prisma.evento.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
