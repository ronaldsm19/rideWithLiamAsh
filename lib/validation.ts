import { z } from "zod";

export const ESTADOS_SOLICITUD = ["pendiente", "aprobada", "rechazada"] as const;

export const MOTIVOS_RECHAZO_PREDEFINIDOS = [
  "No cumple con los requisitos mínimos para esta rodada.",
  "Ya no hay cupos disponibles. ¡Gracias! Nos vemos en la siguiente rodada.",
] as const;

export const solicitudSchema = z.object({
  eventoId: z.string().min(1, "eventoId requerido"),
  correo: z.string().email("Correo inválido"),
  respuestas: z.record(z.string(), z.unknown()),
});

export type SolicitudInput = z.infer<typeof solicitudSchema>;

export const accionSolicitudSchema = z.discriminatedUnion("accion", [
  z.object({ accion: z.literal("aprobar"), confirmarSobrecupo: z.boolean().optional() }),
  z.object({
    accion: z.literal("rechazar"),
    motivoRechazo: z.string().trim().min(1, "El motivo de rechazo es obligatorio"),
  }),
  z.object({ accion: z.literal("revertir") }),
]);

export type AccionSolicitudInput = z.infer<typeof accionSolicitudSchema>;
