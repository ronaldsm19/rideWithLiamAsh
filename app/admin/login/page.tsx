import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verificarTokenSesion } from "@/lib/session";
import FormularioLogin from "@/components/admin/FormularioLogin";

export const metadata: Metadata = {
  title: "Iniciar sesión · Rodada en Moto",
};

export default async function AdminLoginPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const sesionValida = token ? await verificarTokenSesion(token) : false;

  if (sesionValida) {
    redirect("/admin");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="aurora" aria-hidden />
      <div className="glass relative w-full max-w-sm rounded-3xl p-8">
        <span className="eyebrow">Acceso · Organizador</span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Panel de administración</h1>
        <p className="mb-6 mt-2 text-sm text-muted">
          Ingresá la contraseña para gestionar las solicitudes.
        </p>
        <FormularioLogin />
      </div>
    </main>
  );
}
