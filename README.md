# 🏍️ Rodada en Moto

Sitio para organizar una rodada en moto de cupo limitado:

- **Página pública (`/`)**: invitación con info del evento, ruta en mapa (calculada por calles vía OSRM), galería de fotos, indicador de cupos y formulario de inscripción.
- **Panel de administración (`/admin`)**: protegido por contraseña, permite revisar las solicitudes, aprobarlas o rechazarlas (con motivo), revertir decisiones y ver contadores en tiempo real.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) + TypeScript + Tailwind CSS v4
- [Prisma](https://www.prisma.io/) + MongoDB
- [react-leaflet](https://react-leaflet.js.org/) + [OSRM](https://project-osrm.org/) para la ruta sobre calles reales
- [Zod](https://zod.dev/) para validación de formularios
- [jose](https://github.com/panva/jose) para la sesión de admin (JWT en cookie firmada)
- [Nodemailer](https://nodemailer.com/) para las notificaciones por correo (opcional)

## Requisitos previos

- Node.js 20+
- Una base de datos MongoDB (local con Docker o un cluster de [MongoDB Atlas](https://www.mongodb.com/atlas))

## 1. Variables de entorno

Copiá `.env.example` a `.env` y completá los valores:

```bash
cp .env.example .env
```

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Connection string de MongoDB (ver sección 2) |
| `ADMIN_PASSWORD` | Contraseña única para entrar a `/admin`. **Cambiala antes de desplegar.** |
| `SESSION_SECRET` | Secreto para firmar la cookie de sesión del admin. Generá uno con `openssl rand -base64 32` |
| `NEXT_PUBLIC_OSRM_URL` | Servidor OSRM público (no requiere API key). Dejá el valor por defecto salvo que tengas tu propio servidor |
| `EMAIL_ENABLED` | `"true"` para enviar un correo al solicitante cuando se aprueba/rechaza su solicitud. Por defecto `"false"` (la app funciona igual sin esto) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Credenciales SMTP. Solo se usan si `EMAIL_ENABLED="true"` |

> ⚠️ `.env` nunca se commitea (está en `.gitignore`). Todos los valores sensibles van ahí, no en el código.

## 2. Base de datos

Prisma con MongoDB requiere que el servidor corra como **replica set** (aunque sea de un solo nodo).

### Opción A: MongoDB local con Docker (recomendado para desarrollo)

```bash
docker run -d --name ridemoto-mongo -p 27017:27017 mongo:7 --replSet rs0
docker exec -it ridemoto-mongo mongosh --eval "rs.initiate()"
```

Y en `.env`:

```
DATABASE_URL="mongodb://localhost:27017/rodada?replicaSet=rs0"
```

### Opción B: MongoDB Atlas (producción / sin Docker)

1. Creá una cuenta y un cluster gratuito (M0) en [MongoDB Atlas](https://www.mongodb.com/atlas).
2. En **Database Access**, creá un usuario con contraseña.
3. En **Network Access**, agregá tu IP (o `0.0.0.0/0` para permitir acceso desde cualquier lado, p. ej. Vercel).
4. En **Database → Connect**, copiá el connection string `mongodb+srv://...` y pegalo en `DATABASE_URL` (incluyendo el nombre de la base, p. ej. `/rodada`).

## 3. Instalación y desarrollo

```bash
npm install
npm run db:push    # crea las colecciones según prisma/schema.prisma
npm run db:seed    # carga el evento de ejemplo (Rodada Valle de Orosi)
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) para la página pública.

El seed crea **un evento** (nombre, ruta, paradas, fotos, cupos). Para tu rodada, editá los datos en [prisma/seed.ts](prisma/seed.ts) — incluyendo coordenadas, fotos y paradas — y volvé a correr `npm run db:seed` (esto reemplaza el evento existente).

## 4. Panel de administración

1. Entrá a `/admin` — te va a redirigir a `/admin/login`.
2. Ingresá la contraseña definida en `ADMIN_PASSWORD`.
3. Desde ahí podés:
   - Ver contadores (total, pendientes, aprobadas, rechazadas, cupos restantes).
   - Filtrar solicitudes por estado.
   - **Aprobar** una solicitud (si ya no hay cupos, te avisa y pedís confirmación para aprobar igual).
   - **Rechazar** una solicitud con un motivo obligatorio (hay botones con motivos predefinidos, pero el texto es libre).
   - **Revertir a pendiente** una solicitud ya aprobada o rechazada.

La sesión dura 12 horas y se valida en el servidor (`middleware.ts`), no solo se oculta en el cliente.

## 5. Fotos

Las fotos (del evento y de las paradas) son URLs simples (`fotosSalida`, `paradas[].fotos` en el seed). Podés usar imágenes alojadas en [Supabase Storage](https://supabase.com/storage) (o cualquier hosting público) — solo pegá la URL pública en el seed.

## 6. Notificaciones por correo (opcional)

Si configurás `EMAIL_ENABLED="true"` y los datos `SMTP_*`, al aprobar o rechazar una solicitud se le envía un correo al solicitante (con el motivo, si fue rechazada). Si `EMAIL_ENABLED` no está en `"true"`, este paso simplemente no ocurre — el resto de la app funciona igual.

## 7. Deploy en Vercel

1. Subí el repo a GitHub/GitLab/Bitbucket e importalo en [Vercel](https://vercel.com/new).
2. Configurá las **Environment Variables** del proyecto en Vercel con los mismos valores de tu `.env` (usando un cluster de **MongoDB Atlas** como `DATABASE_URL`, no el de Docker local).
3. Vercel corre `npm run build` automáticamente. Si es la primera vez, corré `npm run db:push` y `npm run db:seed` apuntando a Atlas (desde tu máquina, con `DATABASE_URL` de Atlas en `.env`) antes de desplegar.
4. Deploy.

## Notas

- Hay un solo evento configurable (no soporta múltiples rodadas simultáneas).
- Una solicitud se considera duplicada si coincide correo + marca + modelo de moto y ya existe una con estado `pendiente` o `aprobada`.
