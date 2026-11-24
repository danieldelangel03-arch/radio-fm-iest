import { NextResponse } from "next/server";
import { ADMIN_COOKIE, assertSameOrigin } from "@/lib/security";
export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const response = NextResponse.json({ authenticated: false });
    response.cookies.delete(ADMIN_COOKIE);
    return response;
  } catch {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }
}
