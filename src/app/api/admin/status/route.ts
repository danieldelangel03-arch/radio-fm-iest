import type { NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/security";
export async function GET(request: NextRequest): Promise<Response> {
  const authorized = verifyAdminSession(
    request.cookies.get(ADMIN_COOKIE)?.value,
    getServerEnv().SESSION_SECRET,
  );
  return Response.json({ authenticated: authorized }, { status: authorized ? 200 : 401 });
}
