# Base de datos

El esquema está en `src/db/schema.ts` y SQL versionado en `drizzle/`. Incluye catálogo/listas, reglas/eventos, anuncios, rondas/opciones/votos, singleton, cola/historial, configuración, límites y auditoría.

```bash
docker compose up -d
npm run db:migrate
npm run db:seed
```

Las migraciones nunca corren en `next build`. Para mover proveedor, cambia `DATABASE_URL` y usa:

```bash
pg_dump --format=custom --no-owner "$DATABASE_URL_ORIGEN" > radio-campus.dump
pg_restore --clean --if-exists --no-owner --dbname "$DATABASE_URL_DESTINO" radio-campus.dump
```

Prueba primero en BD vacía. `/api/admin/backup` exporta JSON; el POST solo valida actualmente. En serverless usa URL pooled. `radio_state.id=1`, el voto por ronda/dispositivo y posiciones de opción tienen unicidad en BD.
