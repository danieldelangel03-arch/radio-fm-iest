import type { NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { announcements, auditLog } from "@/db/schema";
import { isAdminRequest } from "@/features/admin/authorize";
import { assertSameOrigin } from "@/lib/security";

const schema = z.object({
  title: z.string().min(2).max(120),
  text: z.string().min(5).max(1000),
  approved: z.boolean().default(false),
  startsAt: z.iso.datetime().optional(),
  endsAt: z.iso.datetime().optional(),
  minIntervalMinutes: z.number().int().min(1).max(10080).default(60),
});
export async function POST(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);
    if (!isAdminRequest(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
    const input = schema.parse(await request.json());
    const db = getDb();
    const [created] = await db
      .insert(announcements)
      .values({
        ...input,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
      })
      .returning();
    await db.insert(auditLog).values({
      actor: "admin",
      action: "create",
      entityType: "announcement",
      entityId: created.id,
    });
    return Response.json(created, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Anuncio inválido" },
      { status: 400 },
    );
  }
}
