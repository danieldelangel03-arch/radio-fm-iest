import type { NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { auditLog, settings } from "@/db/schema";
import { isAdminRequest } from "@/features/admin/authorize";
import { assertSameOrigin } from "@/lib/security";

const schema = z.object({
  key: z.enum([
    "roundDurationSeconds",
    "tieStrategy",
    "recentSongCount",
    "maxPlaybackFailures",
    "networkVoteLimit",
  ]),
  value: z.union([z.string(), z.number(), z.boolean()]),
});
export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);
    if (!isAdminRequest(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
    const input = schema.parse(await request.json());
    const db = getDb();
    await db.transaction(async (tx) => {
      await tx
        .insert(settings)
        .values(input)
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: input.value, updatedAt: new Date() },
        });
      await tx.insert(auditLog).values({
        actor: "admin",
        action: "update",
        entityType: "setting",
        entityId: input.key,
        details: { value: input.value },
      });
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Configuración inválida" },
      { status: 400 },
    );
  }
}
