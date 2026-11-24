import { eq } from "drizzle-orm";
import { getDb, getPool } from "../src/db/client";
import {
  announcements,
  campusEvents,
  contextRules,
  playlistSongs,
  playlists,
  radioState,
  settings,
  songs,
} from "../src/db/schema";
import { seedSongs } from "../src/db/seed-data";

async function main(): Promise<void> {
  const db = getDb();
  await db.transaction(async (tx) => {
    for (const song of seedSongs) {
      await tx
        .insert(songs)
        .values(song)
        .onConflictDoUpdate({ target: songs.youtubeId, set: { ...song, updatedAt: new Date() } });
    }
    const [fallback] = await tx
      .insert(playlists)
      .values({
        name: "Respaldo autorizado",
        description: "Selección segura cuando el contexto no produce dos opciones.",
        isFallback: true,
      })
      .onConflictDoUpdate({ target: playlists.name, set: { isFallback: true } })
      .returning();
    if (fallback) {
      const fallbacks = await tx
        .select({ id: songs.id })
        .from(songs)
        .where(eq(songs.fallback, true));
      await tx.delete(playlistSongs).where(eq(playlistSongs.playlistId, fallback.id));
      if (fallbacks.length)
        await tx.insert(playlistSongs).values(
          fallbacks.map((song, position) => ({
            playlistId: fallback.id,
            songId: song.id,
            position,
          })),
        );
    }
    const rules = [
      {
        name: "Exámenes primero",
        priority: 100,
        conditions: { eventKind: "exam" },
        effects: { maxEnergy: 2, themes: ["exámenes"] },
      },
      {
        name: "Navidad",
        priority: 80,
        conditions: { eventTheme: "navidad" },
        effects: { themes: ["navidad"] },
      },
      {
        name: "Mañana moderada",
        priority: 40,
        conditions: { hourFrom: 6, hourTo: 12 },
        effects: { energy: [2, 3] },
      },
      {
        name: "Mediodía dinámico",
        priority: 40,
        conditions: { hourFrom: 12, hourTo: 16 },
        effects: { energy: [4, 5] },
      },
    ];
    for (const rule of rules)
      await tx
        .insert(contextRules)
        .values(rule)
        .onConflictDoUpdate({ target: contextRules.name, set: rule });
    await tx
      .insert(campusEvents)
      .values({
        name: "Navidad 2026",
        kind: "holiday",
        startsAt: new Date("2026-12-16T06:00:00-06:00"),
        endsAt: new Date("2027-01-07T23:59:00-06:00"),
        theme: "navidad",
      })
      .onConflictDoNothing();
    await tx
      .insert(announcements)
      .values({
        title: "Participa en la radio",
        text: "Escanea el código en pantalla y elige la siguiente canción.",
        approved: true,
        minIntervalMinutes: 60,
      })
      .onConflictDoNothing();
    const defaultSettings = {
      roundDurationSeconds: 45,
      recentSongCount: 8,
      recentSongHours: 4,
      tieStrategy: "context",
      maxPlaybackFailures: 3,
      networkVoteLimit: 20,
    };
    for (const [key, value] of Object.entries(defaultSettings))
      await tx
        .insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
    await tx.insert(radioState).values({ id: 1 }).onConflictDoNothing();
  });
  console.info(`Semilla aplicada: ${seedSongs.length} canciones y configuración inicial.`);
  await getPool().end();
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Falló la semilla.");
  process.exitCode = 1;
});
