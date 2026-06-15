import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { solicitudSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  const parsed = solicitudSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "datos_invalidos", issues: parsed.error.issues }, { status: 400 });
  }

  const { eventoId, correo, respuestas } = parsed.data;

  const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
  if (!evento) return NextResponse.json({ error: "evento_no_encontrado" }, { status: 404 });

  const existente = await prisma.solicitud.findFirst({
    where: { eventoId, correo, estado: { in: ["pendiente", "aprobada"] } },
  });
  if (existente) {
    return NextResponse.json(
      { error: "duplicado", message: "Ya existe una solicitud activa con ese correo para esta rodada." },
      { status: 409 }
    );
  }

  const erroresCampos: string[] = [];
  for (const campo of evento.campos.filter((c) => c.activo && c.requerido)) {
    const val = (respuestas as Record<string, unknown>)[campo.clave];
    if (val === undefined || val === null || val === "" || val === false) {
      erroresCampos.push(`${campo.etiqueta} es obligatorio`);
    }
  }
  if (erroresCampos.length > 0) {
    return NextResponse.json({ error: "campos_requeridos", messages: erroresCampos }, { status: 400 });
  }

  const solicitud = await prisma.solicitud.create({
    data: {
      eventoId,
      correo,
      respuestas: respuestas as Prisma.InputJsonValue,
      estado: "pendiente",
    },
  });

  return NextResponse.json({ solicitud }, { status: 201 });
}
