# Arquitectura

```mermaid
flowchart LR
  V[Celulares /votar] -->|HTTPS| API[Route Handlers Next.js]
  P[Pantalla /pantalla] -->|poll 2 s + ETag| API
  A[Panel /admin] -->|cookie HMAC + origen| API
  API -->|transacción + FOR UPDATE| PG[(PostgreSQL)]
  API -. evento opcional .-> PU[Pusher Channels]
  P --> YT[YouTube IFrame visible]
  API --> OM[Open-Meteo · caché 15 min]
  API --> GT[Gemini TTS opcional]
  GT --> BL[Vercel Blob opcional]
```

PostgreSQL es la única autoridad. `radio_state` es singleton; cada cierre bloquea la fila, usa `now()` de la BD, resuelve votos, encola la ganadora e incrementa versión/ETag. No hay timers persistentes, servidor WebSocket propio, estado global fiable ni escritura runtime a disco.

Sin Pusher se mantiene polling; sin Gemini/Blob se muestra texto y usa `speechSynthesis`; sin BD las páginas renderizan y muestran error, y APIs responden 503.

Pendiente: reportar eventos reales del IFrame; CRUD completo de catálogo/reglas/eventos; restauración web; prueba concurrente PostgreSQL.
