# Radio Campus — plan de construcción

Fecha de decisión: 24 de noviembre de 2026.

## Alcance y criterio de entrega

Radio Campus será un monolito modular en Next.js (App Router) y TypeScript. Tendrá tres superficies (`/pantalla`, `/votar` y `/admin`) y Route Handlers en `/api`. PostgreSQL será la única fuente de verdad. La aplicación deberá compilar sin conectarse a la base; las migraciones y la semilla se ejecutarán de forma explícita.

La entrega local no incluye despliegue, creación de cuentas, licencias musicales ni pruebas físicas con varios teléfonos. Esas verificaciones requieren intervención del responsable del campus.

## Decisiones de arquitectura

- **Next.js estándar:** sin adaptadores ni configuración específica de proveedor. Vercel detectará el proyecto y ejecutará `next build`.
- **PostgreSQL transferible:** Drizzle ORM con `pg` y `DATABASE_URL`; no se usarán extensiones ni funciones exclusivas de Neon. Para Vercel se recomienda una cadena pooled.
- **Autoridad central:** `radio_state` tendrá una sola fila. Cada transición se realizará en una transacción que bloquea esa fila con `SELECT ... FOR UPDATE` y usa `now()` de PostgreSQL.
- **Avance perezoso:** las lecturas, votos y eventos del reproductor llaman a `avanzar()`. Un cron diario será únicamente una red de seguridad compatible con Hobby.
- **Tiempo real:** Pusher Channels se eligió por su SDK estable para navegador/Node y su Sandbox gratuito documentado (100 conexiones simultáneas y 200 000 mensajes diarios). Una interfaz `RealtimePublisher` aislará el proveedor. Sin credenciales, no publica y los clientes continúan con polling cada 2 s y ETag.
- **Audio musical:** YouTube IFrame Player API, con reproductor visible. No se descargará ni almacenará música.
- **Locución:** Gemini TTS será opcional. El modelo será configurable y el servidor guardará únicamente anuncios en Vercel Blob. Sin Gemini o Blob, el navegador usará `speechSynthesis`.
- **Seguridad:** sesión de administración firmada con HMAC en cookie HttpOnly, Secure en producción y SameSite=Lax; protección de origen para escrituras; Zod en todos los límites; limitación persistente de intentos y votos.
- **Interfaz:** CSS propio con tokens, alto contraste y controles nativos accesibles. No se añadirá un framework visual.

## Estructura prevista

```text
src/
  app/                 páginas y Route Handlers ligeros
  components/          componentes de interfaz por superficie
  db/                  esquema, conexión, migración y repositorios
  features/
    admin/              autenticación y casos de uso administrativos
    anuncios/           programación y TTS
    radio/              motor transaccional, estado y cola
    seleccion/          algoritmo contextual puro
    votos/              validación y registro de votos
  lib/                  entorno, HTTP, CSRF, tiempo real y utilidades
scripts/                migración, semilla y comprobaciones
drizzle/                SQL versionado y metadatos
tests/                  pruebas integrales y de arquitectura
docs/                   operación, arquitectura, BD, servicios y pruebas
```

## Esquema de datos

| Tabla | Responsabilidad principal |
| --- | --- |
| `songs` | Catálogo autorizado, YouTube, artista y etiquetas contextuales. |
| `playlists`, `playlist_songs` | Listas autorizadas y orden de respaldo. |
| `context_rules` | Condiciones editables, prioridades y efectos de selección. |
| `campus_events` | Festividades, exámenes y eventos con vigencia. |
| `announcements` | Texto, aprobación, vigencia, frecuencia y caché TTS. |
| `rounds`, `round_options` | Rondas, motivo de selección, opciones, cierre y ganadora. |
| `votes` | Un voto por ronda/dispositivo y metadatos de red minimizados. |
| `radio_state` | Fila única: reproducción, ronda, estado, pantalla activa y versión. |
| `playback_queue`, `playback_history` | Cola y bitácora de canciones/anuncios/fallas. |
| `settings` | Parámetros editables y reglas de desempate. |
| `login_attempts`, `network_vote_limits` | Límites persistentes de seguridad. |
| `audit_log` | Cambios administrativos y eventos relevantes. |

Todas las fechas se guardarán como `timestamptz`. Las decisiones temporales se evaluarán con `now()` dentro de PostgreSQL.

## Invariantes del motor

1. Solo existe `radio_state.id = 1`.
2. Una ronda abierta tiene exactamente dos opciones distintas y `closes_at > opened_at`.
3. `votes` impone `UNIQUE(round_id, voter_hash)`.
4. Una transición incrementa `radio_state.version` una sola vez.
5. Una ganadora solo puede ser una opción de su ronda.
6. Un anuncio solo entra a cola si está aprobado, vigente y cumple su frecuencia.
7. Solo la pantalla que posee el arrendamiento vigente puede reportar reproducción con audio.

## Fases y evidencia

0. Este plan, esquema y decisiones.
1. Andamiaje y controles locales.
2. Esquema, migración, repositorios, semilla y validación.
3. Selección contextual pura y pruebas.
4. Motor transaccional, votos, cola y concurrencia.
5. API, sesión, CSRF, Pusher/polling y pruebas.
6. Pantalla pública y YouTube.
7. Votación móvil.
8. Administración.
9. Anuncios, Gemini y Blob.
10. Fallas, respaldo y estados de conexión.
11. Documentación operativa.
12. Verificación integral y registro de evidencias.

Cada fase tendrá un commit propio. No se declarará verificado lo que dependa de credenciales o hardware ausentes.

## Riesgos controlados

- La disponibilidad y permiso de inserción de videos puede cambiar; la semilla será demostrativa y se documentará su revalidación antes de producción.
- El plan Hobby de Vercel es para uso personal/no comercial; el campus debe confirmar el plan aplicable.
- La reproducción pública requiere gestionar licencias musicales y condiciones de YouTube.
- Las cuotas y modelos externos cambian; los valores se documentarán con fecha y enlaces primarios.
