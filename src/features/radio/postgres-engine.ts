import { and, asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { playbackQueue, radioState, roundOptions, rounds, votes } from "@/db/schema";
import { resolveRoundWinner } from "./engine";

export async function advanceRadio(): Promise<{ version: number; changed: boolean }> {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select id from radio_state where id = 1 for update`);
    const [state] = await tx.select().from(radioState).where(eq(radioState.id, 1));
    if (!state) throw new Error("radio_state no está inicializado; ejecuta npm run db:seed");
    if (state.status === "paused" || !state.currentRoundId)
      return { version: state.version, changed: false };

    const nowResult = await tx.execute<{ now: Date }>(sql`select now() as now`);
    const [{ now }] = nowResult.rows;
    const [round] = await tx
      .select()
      .from(rounds)
      .where(and(eq(rounds.id, state.currentRoundId), eq(rounds.status, "open")));
    if (!round || round.closesAt > now) return { version: state.version, changed: false };

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
