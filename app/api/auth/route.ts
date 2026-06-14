import { NextRequest, NextResponse } from "next/server";
import { cookieOpciones, crearTokenSesion, SESSION_COOKIE } from "@/lib/session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const password = body?.password;

  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "Ingresá la contraseña" }, { status: 400 });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const token = await crearTokenSesion();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, cookieOpciones());
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
