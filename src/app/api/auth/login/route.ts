import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminPassword } from "@/features/admin/login-service";
import { getServerEnv } from "@/lib/env";
import { ADMIN_COOKIE, assertSameOrigin, signAdminSession } from "@/lib/security";

const schema = z.object({ password: z.string().max(200) });
export async function POST(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);
    const { password } = schema.parse(await request.json());
    const env = getServerEnv();
    const remoteIdentity = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const login = await verifyAdminPassword(password, remoteIdentity);
    if (!login.ok)
      return NextResponse.json(
        {
          error: login.blocked
            ? "Demasiados intentos; espera 15 minutos"
            : "Credenciales inválidas",
        },
        { status: login.blocked ? 429 : 401 },
      );
    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(ADMIN_COOKIE, signAdminSession(env.SESSION_SECRET), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 28_800,
      path: "/",
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Solicitud inválida" },
      { status: 400 },
    );
  }
}
