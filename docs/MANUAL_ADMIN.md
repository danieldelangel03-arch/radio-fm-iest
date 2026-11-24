# Manual administrativo

1. Abre `/admin` con `ADMIN_PASSWORD`.
2. En vivo: pausa, reanuda, salta o cierra ronda; se audita.
3. Cambia duración en Configuración; persiste en `settings`.
4. Catálogo/reglas/eventos se listan; edición CRUD completa sigue pendiente.
5. Anuncios: escribe, escucha `speechSynthesis`, aprueba y guarda. Gemini/Blob solo se invocan con ambas credenciales.
6. Descarga `GET /api/admin/backup`; restaura con `pg_restore`.

Tras tres fallas la radio entra en `error`. Corrige red/video y reanuda. No publiques contraseñas, tokens ni dumps.
