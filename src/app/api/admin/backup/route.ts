import type { NextRequest } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { announcements, campusEvents, contextRules, playlists, settings, songs } from "@/db/schema";
import { isAdminRequest } from "@/features/admin/authorize";
import { assertSameOrigin } from "@/lib/security";

const backupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  data: z.object({
    songs: z.array(z.record(z.string(), z.unknown())),
    playlists: z.array(z.record(z.string(), z.unknown())),
    rules: z.array(z.record(z.string(), z.unknown())),
    events: z.array(z.record(z.string(), z.unknown())),
    announcements: z.array(z.record(z.string(), z.unknown())),
    settings: z.array(z.record(z.string(), z.unknown())),
  }),
});
export async function GET(request: NextRequest): Promise<Response> {
  if (!isAdminRequest(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  const db = getDb();
  const [songRows, playlistRows, rules, events, notices, config] = await Promise.all([
    db.select().from(songs),
    db.select().from(playlists),
    db.select().from(contextRules),
    db.select().from(campusEvents),
    db.select().from(announcements),
    db.select().from(settings),
  ]);
  return Response.json(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        songs: songRows,
        playlists: playlistRows,
        rules,
        events,
        announcements: notices,
        settings: config,
      },
    },
    {
      headers: {
        "Content-Disposition": `attachment; filename="radio-campus-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    },
  );
}
export async function POST(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);
    if (!isAdminRequest(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
    const backup = backupSchema.parse(await request.json());
    return Response.json({
      accepted: true,
      mode: "validado-sin-sobrescritura",
      records: Object.values(backup.data).reduce((sum, rows) => sum + rows.length, 0),
      message:
        "Respaldo válido. La restauración destructiva requiere usar pg_restore según el manual.",
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Respaldo inválido" },
      { status: 400 },
    );
  }
}
