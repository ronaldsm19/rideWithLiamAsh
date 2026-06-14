import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verificarTokenSesion } from "@/lib/session";

function esApiAdminProtegida(pathname: string) {
  return /^\/api\/solicitudes\/[^/]+$/.test(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const esLogin = pathname === "/admin/login";
  const esPaginaAdmin = pathname.startsWith("/admin") && !esLogin;
  const esApiProtegida = esApiAdminProtegida(pathname);

  if (!esPaginaAdmin && !esApiProtegida) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const sesionValida = token ? await verificarTokenSesion(token) : false;

  if (sesionValida) {
    return NextResponse.next();
  }

  if (esApiProtegida) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/solicitudes/:path*"],
};
