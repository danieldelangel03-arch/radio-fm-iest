# Radio Campus

Radio inteligente e interactiva para un campus universitario. Monolito modular en Next.js 16, TypeScript y PostgreSQL, preparado para importarse en Vercel. Ofrece `/pantalla`, `/votar` y `/admin`.

## Estado honesto

Están implementados persistencia, seguridad, algoritmo contextual, clima Open-Meteo, ciclo perezoso de rondas, UI, polling/Pusher opcional, YouTube, TTS y respaldos. Neon y el despliegue de producción en Vercel están verificados, incluidos login administrativo, voto real y reproducción automática silenciada. Siguen pendientes la demostración con varios celulares, el CRUD completo de catálogo/reglas/eventos, la programación automática de anuncios y las claves externas opcionales de Pusher, Gemini y Blob. La importación JSON valida pero no sobrescribe la BD: la restauración completa se realiza con `pg_restore`.

## Instalación local

Requiere Node.js 22.13+, PostgreSQL 17 (Docker o Neon) y npm 11+.

```bash
npm install
copy .env.example .env
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

Abre `http://localhost:3000/pantalla`, `/votar` y `/admin`.

| Comando | Función |
| --- | --- |
| `npm run dev` | Desarrollo Next.js. |
| `npm run dev:neon` | Desarrollo con variables de la rama Neon vinculada. |
| `npm test` | Pruebas Vitest. |
| `npm run test:e2e` | Playwright escritorio/móvil. |
| `npm run build` / `npm run start` | Build estándar y servidor local. |
| `npm run db:migrate` / `npm run db:seed` | Migración explícita y semilla idempotente. |
| `npm run verify` | Biome, TypeScript, Vitest, arquitectura y Knip. |

## Entorno y Vercel

Obligatorias en ejecución: `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET` (32+ caracteres). Neon entrega `DATABASE_URL` pooled para la aplicación y `DATABASE_URL_UNPOOLED` directa para migraciones; los scripts cargan `.env.local`/`.env` con la misma precedencia de Next.js. `NEXT_PUBLIC_APP_URL` es pública y opcional; sin ella el QR usa el host de la petición. Pusher, Gemini y Blob degradan a polling, `speechSynthesis` y sin caché. Consulta `.env.example`. Nunca expongas secretos con `NEXT_PUBLIC_`.

1. Sube este historial a GitHub e importa el repo en Vercel.
2. Conserva preset Next.js, build `next build` y salida automática.
3. Vincula Neon y ejecuta `neon deploy`; usa `DATABASE_URL` pooled para la app y `DATABASE_URL_UNPOOLED` para migraciones.
4. Configura variables. Desde tu computadora carga la URL de producción y ejecuta una vez `npm run db:migrate` y `npm run db:seed`.
5. Despliega y prueba las tres rutas. No ejecutes migraciones en cada build.

`vercel.json` existe únicamente para `/api/cron/advance` diario como red de seguridad Hobby; `avanzar()` en lecturas sigue siendo el mecanismo principal. Define `CRON_SECRET`.

## Seguridad y licencias

Sesión HMAC HttpOnly/SameSite/Secure, intentos persistentes, Zod, SQL parametrizado, origen estricto, autorización por endpoint y voto único por dispositivo. El campus debe tramitar licencias de ejecución/comunicación pública aplicables en México, incluida revisión con [SACM](https://www.sacm.org.mx/Licencias/QuienesDebenPagar/1). Un video insertable no otorga licencia. El reproductor visible debe respetar las [políticas de YouTube](https://developers.google.com/youtube/terms/developer-policies).

## Documentación

[Arquitectura](docs/ARQUITECTURA.md) · [Base de datos](docs/BASE_DE_DATOS.md) · [Manual admin](docs/MANUAL_ADMIN.md) · [Servicios y costos](docs/SERVICIOS_Y_COSTOS.md) · [Pruebas](docs/PRUEBAS.md) · [Plan](docs/PLAN.md)
