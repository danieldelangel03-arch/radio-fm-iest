import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { announcements, auditLog } from "@/db/schema";
import { isAdminRequest } from "@/features/admin/authorize";
import { assertSameOrigin } from "@/lib/security";

const updateSchema = z
  .object({
    title: z.string().min(2).max(120).optional(),
    text: z.string().min(5).max(1000).optional(),
    approved: z.boolean().optional(),
    minIntervalMinutes: z.number().int().min(1).max(10080).optional(),
  })
  .refine((input) => Object.keys(input).length > 0, "No hay cambios para guardar");

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    assertSameOrigin(request);
    if (!isAdminRequest(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
    const { id } = await params;
    const input = updateSchema.parse(await request.json());
    const db = getDb();
    const [updated] = await db
      .update(announcements)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(announcements.id, id))
      .returning();
    if (!updated) return Response.json({ error: "Anuncio no encontrado" }, { status: 404 });
    await db
      .insert(auditLog)
      .values({ actor: "admin", action: "update", entityType: "announcement", entityId: id });
    return Response.json(updated);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo actualizar el anuncio" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    assertSameOrigin(request);
    if (!isAdminRequest(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
    const { id } = await params;
    const db = getDb();
    const [deleted] = await db.delete(announcements).where(eq(announcements.id, id)).returning();
    if (!deleted) return Response.json({ error: "Anuncio no encontrado" }, { status: 404 });
    await db
      .insert(auditLog)
      .values({ actor: "admin", action: "delete", entityType: "announcement", entityId: id });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo eliminar el anuncio" },
      { status: 400 },
    );
  }
}
