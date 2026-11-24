import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { auditLog, radioState, rounds } from "@/db/schema";
import { isAdminRequest } from "@/features/admin/authorize";
import { assertSameOrigin } from "@/lib/security";

const schema = z.object({ action: z.enum(["pause", "resume", "close-round", "skip"]) });
export async function POST(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);
    if (!isAdminRequest(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
    const { action } = schema.parse(await request.json());
    const db = getDb();
    await db.transaction(async (tx) => {
      const [state] = await tx.select().from(radioState).where(eq(radioState.id, 1));
      if (!state) throw new Error("Radio sin inicializar");
      if (action === "pause" || action === "resume")
        await tx
          .update(radioState)
          .set({
            status: action === "pause" ? "paused" : "idle",
            version: state.version + 1,
            updatedAt: new Date(),
          })
          .where(eq(radioState.id, 1));
      if (action === "close-round" && state.currentRoundId)
        await tx
          .update(rounds)
          .set({ closesAt: new Date() })
          .where(eq(rounds.id, state.currentRoundId));
      if (action === "skip")
        await tx
          .update(radioState)
          .set({ expectedEndsAt: new Date(), version: state.version + 1 })
          .where(eq(radioState.id, 1));
      await tx
        .insert(auditLog)
        .values({ actor: "admin", action, entityType: "radio_state", entityId: "1" });
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Acción inválida" },
      { status: 400 },
    );
  }
}
