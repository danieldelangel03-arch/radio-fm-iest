import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "radio_admin";
export const VOTER_COOKIE = "radio_voter";

type SessionPayload = { role: "admin"; exp: number };
export function signAdminSession(secret: string, expiresInSeconds = 8 * 60 * 60): string {
  const payload: SessionPayload = {
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded, secret)}`;
}
export function verifyAdminSession(token: string | undefined, secret: string): boolean {
  if (!token) return false;
  const [payload, provided] = token.split(".");
  if (!payload || !provided || !safeEqual(provided, signature(payload, secret))) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionPayload;
    return parsed.role === "admin" && parsed.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
export function hashIdentifier(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}
export function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
function signature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function assertSameOrigin(request: Request): void {
  const expected = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (!origin || origin !== expected) throw new Error("Origen no permitido");
}
