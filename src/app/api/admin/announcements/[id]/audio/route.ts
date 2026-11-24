import type { NextRequest } from "next/server";
import { isAdminRequest } from "@/features/admin/authorize";
import { ensureAnnouncementAudio } from "@/features/anuncios/tts";
import { assertSameOrigin } from "@/lib/security";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    assertSameOrigin(request);
    if (!isAdminRequest(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
    const { id } = await params;
    return Response.json(await ensureAnnouncementAudio(id));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo generar audio" },
      { status: 400 },
    );
  }
}
