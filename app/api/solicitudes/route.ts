import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { solicitudSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = solicitudSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "datos_invalidos", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const existente = await prisma.solicitud.findFirst({
    where: {
      correo: data.correo,
      marcaMoto: data.marcaMoto,
      modeloMoto: data.modeloMoto,
      estado: { in: ["pendiente", "aprobada"] },
    },
  });

  if (existente) {
    return NextResponse.json(
      {
        error: "duplicado",
        message:
          "Ya existe una solicitud activa con ese correo y esa moto. Si creés que es un error, contactá al organizador.",
      },
      { status: 409 }
    );
  }

  const solicitud = await prisma.solicitud.create({ data });

  return NextResponse.json({ solicitud }, { status: 201 });
}
