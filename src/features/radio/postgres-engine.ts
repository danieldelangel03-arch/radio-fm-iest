import { and, asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  announcements,
  playbackQueue,
  radioState,
  roundOptions,
  rounds,
  settings,
  songs,
  votes,
} from "@/db/schema";
import { normalizeDatabaseTimestamp } from "@/db/timestamp";
import { isAnnouncementEligible } from "@/features/anuncios/schedule";
import { selectContextualOptions } from "@/features/seleccion/contextual";
import { resolveRoundWinner } from "./engine";
import { nextPlaybackState } from "./playback";

export async function advanceRadio(
  context: { temperatureC?: number } = {},
): Promise<{ version: number; changed: boolean }> {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select id from radio_state where id = 1 for update`);
    const [state] = await tx.select().from(radioState).where(eq(radioState.id, 1));
    if (!state) throw new Error("radio_state no está inicializado; ejecuta npm run db:seed");
    if (state.status === "paused") return { version: state.version, changed: false };
    const nowResult = await tx.execute<{ now: Date | string }>(sql`select now() as now`);
    const now = normalizeDatabaseTimestamp(nowResult.rows[0]?.now);

    if (!state.currentRoundId) {
      const candidates = await tx
        .select()
        .from(songs)
        .where(and(eq(songs.active, true), eq(songs.authorized, true)));
      const selection = selectContextualOptions(
        candidates.map((song) => ({
          id: song.id,
          title: song.title,
          artist: song.artist,
          energy: song.energy,
          moods: song.moods,
          themes: song.themes,
          authorized: song.authorized,
          active: song.active,
          fallback: song.fallback,
        })),
        { now, temperatureC: context.temperatureC, events: [], recentSongIds: new Set() },
      );
      const [durationSetting] = await tx
        .select()
        .from(settings)
        .where(eq(settings.key, "roundDurationSeconds"));
      const duration = typeof durationSetting?.value === "number" ? durationSetting.value : 45;
      const [created] = await tx
        .insert(rounds)
        .values({
          closesAt: new Date(now.getTime() + duration * 1000),
          selectionReason: selection.reason,
          contextSnapshot: { time: now.toISOString(), temperatureC: context.temperatureC },
        })
        .returning();
      await tx.insert(roundOptions).values(
        selection.options.map((song, index) => ({
          roundId: created.id,
          songId: song.id,
          position: index + 1,
        })),
      );
      const initialSong = candidates.find((song) => song.id === selection.options[0].id);
      const [updated] = await tx
        .update(radioState)
        .set({
          currentRoundId: created.id,
          currentSongId: state.currentSongId ?? selection.options[0].id,
          status: "playing",
          startedAt: state.startedAt ?? now,
          expectedEndsAt:
            state.expectedEndsAt ??
            new Date(now.getTime() + (initialSong?.durationSeconds ?? 240) * 1000),
          version: state.version + 1,
          updatedAt: now,
        })
        .where(eq(radioState.id, 1))
        .returning({ version: radioState.version });
      return { version: updated.version, changed: true };
    }

    const [round] = await tx.select().from(rounds).where(eq(rounds.id, state.currentRoundId));
    if (!round) throw new Error("La ronda activa no existe");
    if (round.status === "closed") {
      if (state.expectedEndsAt && state.expectedEndsAt > now)
        return { version: state.version, changed: false };
      const [next] = await tx
        .select()
        .from(playbackQueue)
        .where(eq(playbackQueue.status, "pending"))
        .orderBy(asc(playbackQueue.position))
        .limit(1);
      if (next)
        await tx
          .update(playbackQueue)
          .set({ status: "playing", updatedAt: now })
          .where(eq(playbackQueue.id, next.id));
      const playback = next ? nextPlaybackState(next, now) : undefined;
      const [updated] = await tx
        .update(radioState)
        .set({
          currentRoundId: null,
          currentSongId: playback?.currentSongId ?? null,
          currentAnnouncementId: playback?.currentAnnouncementId ?? null,
          status: next ? "playing" : "idle",
          startedAt: next ? now : null,
          expectedEndsAt: playback?.expectedEndsAt ?? null,
          version: state.version + 1,
          updatedAt: now,
        })
        .where(eq(radioState.id, 1))
        .returning({ version: radioState.version });
      return { version: updated.version, changed: true };
    }
    if (round.status !== "open" || round.closesAt > now)
      return { version: state.version, changed: false };

    const optionRows = await tx
      .select({ songId: roundOptions.songId, position: roundOptions.position })
      .from(roundOptions)
      .where(eq(roundOptions.roundId, round.id))
      .orderBy(asc(roundOptions.position));
    const counts = await tx
      .select({ songId: votes.songId, score: sql<number>`count(*)::int` })
      .from(votes)
      .where(eq(votes.roundId, round.id))
      .groupBy(votes.songId);
    const scores = new Map(counts.map((item) => [item.songId, item.score]));
    const winnerSongId = resolveRoundWinner(
      optionRows.map((item) => ({ ...item, score: scores.get(item.songId) ?? 0 })),
      "first",
    );
    await tx
      .update(rounds)
      .set({ status: "closed", closedAt: now, winnerSongId, updatedAt: now })
      .where(and(eq(rounds.id, round.id), eq(rounds.status, "open")));
    const eligibleAnnouncements = (await tx
      .select()
      .from(announcements)
      .where(eq(announcements.approved, true)))
      .filter((announcement) => isAnnouncementEligible(announcement, now));
    const announcement = eligibleAnnouncements[0];
    if (announcement) {
      await tx.insert(playbackQueue).values({
        kind: "announcement",
        announcementId: announcement.id,
        position: sql`coalesce((select max(position) from playback_queue), 0) + 1`,
        source: "automatic-announcement",
      });
      await tx
        .update(announcements)
        .set({ lastPlayedAt: now, updatedAt: now })
        .where(eq(announcements.id, announcement.id));
    }
    await tx.insert(playbackQueue).values({
      kind: "song",
      songId: winnerSongId,
      position: sql`coalesce((select max(position) from playback_queue), 0) + 1`,
      source: `round:${round.id}`,
    });
    const [updated] = await tx
      .update(radioState)
      .set({ version: state.version + 1, updatedAt: now })
      .where(eq(radioState.id, 1))
      .returning({ version: radioState.version });
    return { version: updated.version, changed: true };
  });
}
