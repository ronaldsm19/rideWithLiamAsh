import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { accionSolicitudSchema } from "@/lib/validation";
import { enviarNotificacionEstado } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  const parsed = accionSolicitudSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "datos_invalidos", issues: parsed.error.issues }, { status: 400 });
  }

  const solicitud = await prisma.solicitud.findUnique({ where: { id } });
  if (!solicitud) return NextResponse.json({ error: "no_encontrada" }, { status: 404 });

  const evento = await prisma.evento.findUnique({ where: { id: solicitud.eventoId } });
  const accion = parsed.data;

  if (accion.accion === "aprobar") {
    if (!accion.confirmarSobrecupo && evento) {
      const cuposAprobados = await prisma.solicitud.count({
        where: { eventoId: solicitud.eventoId, estado: "aprobada" },
      });
      if (cuposAprobados >= evento.cuposMax) {
        return NextResponse.json(
          { error: "cupos_excedidos", message: "Ya se alcanzó el cupo máximo.", cuposAprobados, cuposMax: evento.cuposMax },
          { status: 409 }
        );
      }
    }
    const actualizada = await prisma.solicitud.update({
      where: { id },
      data: { estado: "aprobada", motivoRechazo: null },
    });
    if (evento) await enviarNotificacionEstado(actualizada, evento);
    return NextResponse.json({ solicitud: actualizada });
  }

  if (accion.accion === "rechazar") {
    const actualizada = await prisma.solicitud.update({
      where: { id },
      data: { estado: "rechazada", motivoRechazo: accion.motivoRechazo },
    });
    if (evento) await enviarNotificacionEstado(actualizada, evento);
    return NextResponse.json({ solicitud: actualizada });
  }

  const actualizada = await prisma.solicitud.update({
    where: { id },
    data: { estado: "pendiente", motivoRechazo: null },
  });
  return NextResponse.json({ solicitud: actualizada });
}
