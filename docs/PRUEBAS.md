# Pruebas y evidencia

Fecha: 24 de noviembre de 2026. Windows, Node 24.19.0, npm 11.17.0; Docker ausente.

- `npm test`: 5 archivos, 16 pruebas aprobadas (contexto, prioridades, respaldo, repeticiones, motor, 100 llamadas, entorno y seguridad).
- `npm run build`: aprobado con Next.js 16.4.6; 18 rutas en fase 10.
- `npm run test:e2e`: 2/2 Chromium escritorio/móvil en fase 1.
- `npm run verify`: Biome, TypeScript, Vitest, Dependency Cruiser y Knip aprobados.
- Dependency Cruiser: válido pasó; violación temporal componente→DB falló; restaurado pasó.
- `npm audit --omit=dev`: 0 vulnerabilidades de producción en fase 1; Drizzle Kit mantiene avisos moderados de desarrollo.
- YouTube oEmbed: 30/30 IDs respondieron 200; no demuestra licencia ni disponibilidad futura.
- `npm run start`: `/` respondió HTTP 200 en fase 1.

No verificado: BD/migración/semilla, concurrencia PostgreSQL, ronda E2E, reproducción YouTube, claves Pusher/Gemini/Blob, Open-Meteo, varios celulares, Vercel y licencias.
