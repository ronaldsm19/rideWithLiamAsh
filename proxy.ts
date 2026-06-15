import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verificarTokenSesion } from "@/lib/session";

function esApiAdminProtegida(pathname: string) {
  return (
    /^\/api\/solicitudes\/[^/]+$/.test(pathname) ||
    pathname.startsWith("/api/eventos") ||
    pathname === "/api/upload"
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const esLogin = pathname === "/admin/login";
  const esPaginaAdmin = pathname.startsWith("/admin") && !esLogin;
  const esApiProtegida = esApiAdminProtegida(pathname);

  if (!esPaginaAdmin && !esApiProtegida) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const sesionValida = token ? await verificarTokenSesion(token) : false;

  if (sesionValida) return NextResponse.next();

  if (esApiProtegida) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/solicitudes/:path+",
    "/api/eventos",
    "/api/eventos/:path+",
    "/api/upload",
  ],
};
