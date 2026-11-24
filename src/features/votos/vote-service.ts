import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { roundOptions, rounds, votes } from "@/db/schema";

export async function registerVote(input: {
  roundId: string;
  songId: string;
  voterHash: string;
  networkHash?: string;
}) {
  return getDb().transaction(async (tx) => {
    const nowResult = await tx.execute<{ now: Date }>(sql`select now() as now`);
    const now = nowResult.rows[0].now;
    const [round] = await tx
      .select()
      .from(rounds)
      .where(and(eq(rounds.id, input.roundId), eq(rounds.status, "open")));
    if (!round || round.closesAt <= now) throw new Error("La ronda ya cerró");
    const [option] = await tx
      .select()
      .from(roundOptions)
      .where(and(eq(roundOptions.roundId, input.roundId), eq(roundOptions.songId, input.songId)));
    if (!option) throw new Error("La canción no pertenece a la ronda");
    if (input.networkHash) {
      const networkCount = await tx.execute<{ count: number }>(
        sql`select count(*)::int as count from votes where round_id = ${input.roundId} and network_hash = ${input.networkHash}`,
      );
      if ((networkCount.rows[0]?.count ?? 0) >= 20)
        throw new Error("Se alcanzó el límite de votos de esta red");
    }
    try {
      await tx.insert(votes).values(input);
    } catch (error) {
      if (isUniqueViolation(error)) throw new Error("Este dispositivo ya votó en la ronda");
      throw error;
    }
    return { accepted: true as const, databaseTime: now.toISOString() };
  });
}
function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
