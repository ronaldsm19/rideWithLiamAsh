import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, STORAGE_BUCKET, STORAGE_PREFIX } from "@/lib/supabase";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "FormData inválido" }, { status: 400 });

  const file = form.get("file") as File | null;
  const carpeta = (form.get("carpeta") as string | null) ?? "fotos";

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No se encontró el archivo" }, { status: 400 });
  }
  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    return NextResponse.json({ error: "Solo se permiten imágenes JPG, PNG, WEBP o GIF." }, { status: 422 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "El archivo supera el límite de 5 MB." }, { status: 422 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const nombre = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `${STORAGE_PREFIX}/${carpeta}/${nombre}`;

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { url } = body as { url?: string };
  if (!url) return NextResponse.json({ error: "URL requerida" }, { status: 400 });

  const marker = `/object/public/${STORAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return NextResponse.json({ error: "URL no pertenece a este bucket" }, { status: 400 });

  const path = url.slice(idx + marker.length);
  const { error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
