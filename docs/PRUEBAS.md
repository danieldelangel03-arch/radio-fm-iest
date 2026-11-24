# Pruebas y evidencia

Fecha: 24 de noviembre de 2026. Windows, Node 24.19.0, npm 11.17.0; Docker ausente.

- `npm test`: 6 archivos, 21 pruebas aprobadas (contexto, prioridades, respaldo, repeticiones, motor, timestamps de PostgreSQL, entorno y seguridad).
- `npm run build`: aprobado con Next.js 16.4.6; 18 rutas en fase 10.
- `npm run test:e2e`: 8/8 Chromium (4 recorridos × escritorio/móvil), incluido autoplay silenciado.
- `npm run verify`: Biome, TypeScript, Vitest, Dependency Cruiser y Knip aprobados.
- Dependency Cruiser: válido pasó; violación temporal componente→DB falló; restaurado pasó.
- `npm audit --omit=dev`: 0 vulnerabilidades de producción en fase 1; Drizzle Kit mantiene avisos moderados de desarrollo.
- Producción Vercel: login administrativo HTTP 200, sesión HTTP 200, voto temporal HTTP 201 y estado persistente leído desde Neon.
- Producción Vercel: reproductor visible en viewport móvil con `autoplay=1`, `mute=1` y control para activar sonido.
- Open-Meteo: temperatura disponible desde `/api/state` con las coordenadas configuradas en producción.
- YouTube oEmbed: 30/30 IDs respondieron 200; no demuestra licencia ni disponibilidad futura.
- `npm run start`: `/` respondió HTTP 200 en fase 1.
- `npm run start`: `/`, `/pantalla`, `/votar` y `/admin` respondieron HTTP 200 en fase 12.
- Gitleaks 8.30.1: historial sin filtraciones; allowlist exacta para un placeholder histórico de `.env.example`.
- Semgrep 1.185.0: 3 reglas locales, 72 archivos, 0 hallazgos.
- Trivy 0.76.1: 0 vulnerabilidades de producción y 0 configuraciones erróneas detectadas.

No verificado: concurrencia PostgreSQL bajo carga, ronda completa con varios celulares, audio real de YouTube en el dispositivo físico del campus, claves Pusher/Gemini/Blob y licencias institucionales.
