import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { registerVote } from "@/features/votos/vote-service";
import { getServerEnv } from "@/lib/env";
import { createRealtimePublisher } from "@/lib/realtime";
import { assertSameOrigin, hashIdentifier, VOTER_COOKIE } from "@/lib/security";

const schema = z.object({ roundId: z.uuid(), songId: z.uuid() });
export async function POST(request: NextRequest): Promise<Response> {
  try {
    assertSameOrigin(request);
    const body = schema.parse(await request.json());
    const env = getServerEnv();
    const voter = request.cookies.get(VOTER_COOKIE)?.value ?? randomUUID();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const result = await registerVote({
      ...body,
      voterHash: hashIdentifier(voter, env.SESSION_SECRET),
      networkHash: hashIdentifier(ip, env.SESSION_SECRET),
    });
    await createRealtimePublisher().publish("vote-registered", { roundId: body.roundId });
    const response = NextResponse.json(result, { status: 201 });
    if (!request.cookies.has(VOTER_COOKIE))
      response.cookies.set(VOTER_COOKIE, voter, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 31_536_000,
        path: "/",
      });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Voto inválido" },
      { status: 400 },
    );
  }
}
