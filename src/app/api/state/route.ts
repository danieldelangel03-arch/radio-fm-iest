import { getPublicState } from "@/features/radio/state-service";
export const runtime = "nodejs";
export async function GET(request: Request): Promise<Response> {
  try {
    const state = await getPublicState();
    const etag = `"${state.version}"`;
    if (request.headers.get("if-none-match") === etag)
      return new Response(null, { status: 304, headers: { ETag: etag } });
    return Response.json(state, { headers: { "Cache-Control": "no-store", ETag: etag } });
  } catch {
    return Response.json(
      { error: "La radio no está disponible; verifica la base de datos." },
      { status: 503 },
    );
  }
}
