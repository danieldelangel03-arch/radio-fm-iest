import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { auditLog, radioState } from "@/db/schema";
import { normalizeDatabaseTimestamp } from "@/db/timestamp";
import { assertSameOrigin } from "@/lib/security";

const schema = z.object({
  screenId: z.string().min(8).max(100),
  event: z.enum(["started", "ended", "failed", "heartbeat"]),
  durationSeconds: z.number().int().min(1).max(7200).optional(),
  detail: z.string().max(500).optional(),
});
export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const input = schema.parse(await request.json());
    const result = await getDb().transaction(async (tx) => {
      await tx.execute(sql`select id from radio_state where id = 1 for update`);
      const nowResult = await tx.execute<{ now: Date | string }>(sql`select now() as now`);
      const now = normalizeDatabaseTimestamp(nowResult.rows[0]?.now);
      const [state] = await tx.select().from(radioState).where(eq(radioState.id, 1));
      if (!state) throw new Error("Radio sin inicializar");
      const ownedByOther =
        state.audioScreenId &&
        state.audioScreenId !== input.screenId &&
        state.audioLeaseExpiresAt &&
        state.audioLeaseExpiresAt > now;
      if (ownedByOther) throw new Error("Otra pantalla posee el audio");
      const lease = new Date(now.getTime() + 15_000);
      const update: Partial<typeof radioState.$inferInsert> = {
        audioScreenId: input.screenId,
        audioLeaseExpiresAt: lease,
        updatedAt: now,
      };
      if (input.event === "started") {
        update.status = "playing";
        update.startedAt = now;
        update.expectedEndsAt = new Date(now.getTime() + (input.durationSeconds ?? 240) * 1000);
        update.consecutiveFailures = 0;
      }
      if (input.event === "ended") update.expectedEndsAt = now;
      if (input.event === "failed") {
        update.consecutiveFailures = state.consecutiveFailures + 1;
        if (update.consecutiveFailures >= 3) update.status = "error";
      }
      update.version = state.version + 1;
      await tx.update(radioState).set(update).where(eq(radioState.id, 1));
      if (input.event === "failed")
        await tx.insert(auditLog).values({
          actor: `screen:${input.screenId}`,
          action: "playback-failed",
          entityType: "radio_state",
          entityId: "1",
          details: { detail: input.detail ?? "sin detalle" },
        });
      return {
        owner: true,
        leaseExpiresAt: lease.toISOString(),
        pausedForFailures: update.status === "error",
      };
    });
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Evento inválido" },
      { status: 409 },
    );
  }
}
