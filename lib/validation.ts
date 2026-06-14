import { z } from "zod";

export const solicitudSchema = z.object({
  nombreCompleto: z
    .string()
    .trim()
    .min(1, "El nombre completo es obligatorio")
    .max(120, "El nombre es demasiado largo"),
  correo: z
    .string()
    .trim()
    .min(1, "El correo es obligatorio")
    .email("Ingresá un correo válido"),
  marcaMoto: z
    .string()
    .trim()
    .min(1, "La marca es obligatoria")
    .max(60, "La marca es demasiado larga"),
  modeloMoto: z
    .string()
    .trim()
    .min(1, "El modelo es obligatorio")
    .max(60, "El modelo es demasiado largo"),
  licenciaVigente: z.boolean(),
  cilindrada: z.coerce
    .number()
    .int("La cilindrada debe ser un número entero")
    .positive("La cilindrada debe ser mayor a 0"),
  aniosExperiencia: z.coerce
    .number()
    .int("Los años de experiencia deben ser un número entero")
    .min(0, "Los años de experiencia no pueden ser negativos"),
  equipoCasco: z.boolean(),
  equipoGuantes: z.boolean(),
  equipoChaqueta: z.boolean(),
});

export type SolicitudInput = z.infer<typeof solicitudSchema>;

export const ESTADOS_SOLICITUD = ["pendiente", "aprobada", "rechazada"] as const;

export const MOTIVOS_RECHAZO_PREDEFINIDOS = [
  "No cumple con los requisitos mínimos para esta rodada.",
  "Ya no hay cupos disponibles. ¡Gracias! Nos vemos en la siguiente rodada.",
] as const;

export const accionSolicitudSchema = z.discriminatedUnion("accion", [
  z.object({ accion: z.literal("aprobar"), confirmarSobrecupo: z.boolean().optional() }),
  z.object({
    accion: z.literal("rechazar"),
    motivoRechazo: z.string().trim().min(1, "El motivo de rechazo es obligatorio"),
  }),
  z.object({ accion: z.literal("revertir") }),
]);

export type AccionSolicitudInput = z.infer<typeof accionSolicitudSchema>;
