import nodemailer from "nodemailer";
import type { Evento, Solicitud } from "@prisma/client";

const formateadorFecha = new Intl.DateTimeFormat("es-CR", {
  timeZone: "America/Costa_Rica",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function obtenerTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

function construirMensaje(
  solicitud: Pick<Solicitud, "nombreCompleto" | "estado" | "motivoRechazo">,
  evento: Pick<Evento, "nombre" | "fecha" | "horaSalida" | "lugarSalidaNombre" | "lugarSalidaDireccion">
) {
  const fecha = formateadorFecha.format(evento.fecha);

  if (solicitud.estado === "aprobada") {
    return {
      asunto: `¡Tu lugar en "${evento.nombre}" está confirmado!`,
      texto: [
        `Hola ${solicitud.nombreCompleto},`,
        "",
        `¡Buenas noticias! Tu solicitud para "${evento.nombre}" fue aprobada.`,
        "",
        `Fecha: ${fecha}`,
        `Hora de salida: ${evento.horaSalida}`,
        `Punto de salida: ${evento.lugarSalidaNombre} (${evento.lugarSalidaDireccion})`,
        "",
        "Te esperamos. ¡Nos vemos en la ruta!",
      ].join("\n"),
    };
  }

  return {
    asunto: `Sobre tu solicitud para "${evento.nombre}"`,
    texto: [
      `Hola ${solicitud.nombreCompleto},`,
      "",
      `Gracias por tu interés en "${evento.nombre}". Por esta vez no podemos confirmar tu lugar.`,
      "",
      `Motivo: ${solicitud.motivoRechazo ?? "No especificado"}`,
      "",
      "¡Esperamos contar con vos en una próxima rodada!",
    ].join("\n"),
  };
}

export async function enviarNotificacionEstado(
  solicitud: Pick<Solicitud, "nombreCompleto" | "correo" | "estado" | "motivoRechazo">,
  evento: Pick<Evento, "nombre" | "fecha" | "horaSalida" | "lugarSalidaNombre" | "lugarSalidaDireccion">
) {
  if (process.env.EMAIL_ENABLED !== "true") return;

  const { asunto, texto } = construirMensaje(solicitud, evento);

  try {
    await obtenerTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to: solicitud.correo,
      subject: asunto,
      text: texto,
    });
  } catch (error) {
    console.error("No se pudo enviar el correo de notificación:", error);
  }
}
