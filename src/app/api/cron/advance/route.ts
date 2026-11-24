import { advanceRadio } from "@/features/radio/postgres-engine";
import { getServerEnv } from "@/lib/env";
export async function GET(request: Request): Promise<Response> {
  const secret = getServerEnv().CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (secret && authorization !== `Bearer ${secret}`)
    return Response.json({ error: "No autorizado" }, { status: 401 });
  try {
    return Response.json(await advanceRadio());
  } catch {
    return Response.json({ error: "No se pudo avanzar" }, { status: 503 });
  }
}
