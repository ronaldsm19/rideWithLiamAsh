import nodemailer from "nodemailer";

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
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

type SolicitudEmail = {
  correo: string;
  estado: string;
  motivoRechazo?: string | null;
  respuestas: unknown;
};

type EventoEmail = {
  nombre: string;
  fecha: Date;
  horaSalida: string;
  puntos: { tipo: string; nombre: string }[];
};

export async function enviarNotificacionEstado(
  solicitud: SolicitudEmail,
  evento: EventoEmail
) {
  if (process.env.EMAIL_ENABLED !== "true") return;

  const respuestas = (solicitud.respuestas ?? {}) as Record<string, unknown>;
  const nombre = (respuestas.nombreCompleto as string) ?? "Motociclista";
  const salidaPunto = evento.puntos.find((p) => p.tipo === "salida");
  const fecha = formateadorFecha.format(evento.fecha);

  const asunto =
    solicitud.estado === "aprobada"
      ? `¡Tu lugar en "${evento.nombre}" está confirmado!`
      : `Sobre tu solicitud para "${evento.nombre}"`;

  const lineas =
    solicitud.estado === "aprobada"
      ? [
          `Hola ${nombre},`,
          "",
          `¡Buenas noticias! Tu solicitud para "${evento.nombre}" fue aprobada.`,
          "",
          `Fecha: ${fecha}`,
          `Hora de salida: ${evento.horaSalida}`,
          salidaPunto ? `Punto de salida: ${salidaPunto.nombre}` : "",
          "",
          "Te esperamos. ¡Nos vemos en la ruta!",
        ]
      : [
          `Hola ${nombre},`,
          "",
          `Gracias por tu interés en "${evento.nombre}". Por esta vez no podemos confirmar tu lugar.`,
          "",
          `Motivo: ${solicitud.motivoRechazo ?? "No especificado"}`,
          "",
          "¡Esperamos contar con vos en una próxima rodada!",
        ];

  try {
    await obtenerTransporter().sendMail({
      from: process.env.SMTP_FROM,
      to: solicitud.correo,
      subject: asunto,
      text: lineas.filter(Boolean).join("\n"),
    });
  } catch (error) {
    console.error("No se pudo enviar el correo de notificación:", error);
  }
}
