import type { NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/security";
export function isAdminRequest(request: NextRequest): boolean {
  return verifyAdminSession(
    request.cookies.get(ADMIN_COOKIE)?.value,
    getServerEnv().SESSION_SECRET,
  );
}
