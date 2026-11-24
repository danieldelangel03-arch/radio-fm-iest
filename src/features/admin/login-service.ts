import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { loginAttempts } from "@/db/schema";
import { normalizeDatabaseTimestamp } from "@/db/timestamp";
import { getServerEnv } from "@/lib/env";
import { hashIdentifier, safeEqual } from "@/lib/security";

export async function verifyAdminPassword(
  password: string,
  remoteIdentity: string,
): Promise<{ ok: boolean; blocked: boolean }> {
  const env = getServerEnv();
  const identityHash = hashIdentifier(remoteIdentity, env.SESSION_SECRET);
  return getDb().transaction(async (tx) => {
    await tx.execute(
      sql`select identity_hash from login_attempts where identity_hash = ${identityHash} for update`,
    );
    const nowResult = await tx.execute<{ now: Date | string }>(sql`select now() as now`);
    const now = normalizeDatabaseTimestamp(nowResult.rows[0]?.now);
    const [attempt] = await tx
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.identityHash, identityHash));
    if (attempt?.blockedUntil && attempt.blockedUntil > now) return { ok: false, blocked: true };
    if (safeEqual(password, env.ADMIN_PASSWORD)) {
      await tx.delete(loginAttempts).where(eq(loginAttempts.identityHash, identityHash));
      return { ok: true, blocked: false };
    }
    const failures = (attempt?.attempts ?? 0) + 1;
    const blockedUntil = failures >= 5 ? new Date(now.getTime() + 15 * 60_000) : null;
    await tx
      .insert(loginAttempts)
      .values({ identityHash, attempts: failures, blockedUntil, updatedAt: now })
      .onConflictDoUpdate({
        target: loginAttempts.identityHash,
        set: { attempts: failures, blockedUntil, updatedAt: now },
      });
    return { ok: false, blocked: blockedUntil !== null };
  });
}
