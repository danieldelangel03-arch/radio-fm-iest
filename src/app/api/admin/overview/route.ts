import { count, desc } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { getDb } from "@/db/client";
import {
  announcements,
  auditLog,
  campusEvents,
  contextRules,
  playbackHistory,
  playbackQueue,
  radioState,
  rounds,
  settings,
  songs,
  votes,
} from "@/db/schema";
import { isAdminRequest } from "@/features/admin/authorize";
export async function GET(request: NextRequest): Promise<Response> {
  if (!isAdminRequest(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  const db = getDb();
  const [
    [songCount],
    [roundCount],
    [voteCount],
    state,
    catalog,
    rules,
    events,
    notices,
    config,
    queue,
    history,
    audit,
  ] = await Promise.all([
    db.select({ value: count() }).from(songs),
    db.select({ value: count() }).from(rounds),
    db.select({ value: count() }).from(votes),
    db.select().from(radioState).limit(1),
    db.select().from(songs).orderBy(songs.title).limit(100),
    db.select().from(contextRules).orderBy(desc(contextRules.priority)),
    db.select().from(campusEvents).orderBy(desc(campusEvents.startsAt)).limit(30),
    db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(30),
    db.select().from(settings),
    db.select().from(playbackQueue).orderBy(playbackQueue.position).limit(30),
    db.select().from(playbackHistory).orderBy(desc(playbackHistory.startedAt)).limit(30),
    db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(30),
  ]);
  return Response.json({
    metrics: { songs: songCount.value, rounds: roundCount.value, votes: voteCount.value },
    state: state[0] ?? null,
    catalog,
    rules,
    events,
    announcements: notices,
    settings: config,
    queue,
    history,
    audit,
  });
}
