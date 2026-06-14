import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "rodada_admin_session";
const SESSION_DURATION = "12h";
const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

function obtenerClaveSecreta() {
  const secreto = process.env.SESSION_SECRET;
  if (!secreto) {
    throw new Error("SESSION_SECRET no está configurado en las variables de entorno");
  }
  return new TextEncoder().encode(secreto);
}

export async function crearTokenSesion(): Promise<string> {
  return new SignJWT({ rol: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(obtenerClaveSecreta());
}

export async function verificarTokenSesion(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, obtenerClaveSecreta());
    return true;
  } catch {
    return false;
  }
}

export function cookieOpciones() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
