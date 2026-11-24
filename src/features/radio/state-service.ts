import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { announcements, radioState, roundOptions, rounds, songs, votes } from "@/db/schema";
import { advanceRadio } from "./postgres-engine";

export async function getPublicState() {
  await advanceRadio();
  const db = getDb();
  const [state] = await db.select().from(radioState).where(eq(radioState.id, 1));
  if (!state) throw new Error("Radio sin inicializar");
  const [currentSong] = state.currentSongId
    ? await db
        .select({
          id: songs.id,
          title: songs.title,
          artist: songs.artist,
          youtubeId: songs.youtubeId,
        })
        .from(songs)
        .where(eq(songs.id, state.currentSongId))
    : [];
  const [currentAnnouncement] = state.currentAnnouncementId
    ? await db
        .select({
          id: announcements.id,
          title: announcements.title,
          text: announcements.text,
          audioUrl: announcements.audioUrl,
        })
        .from(announcements)
        .where(eq(announcements.id, state.currentAnnouncementId))
    : [];
  const [round] = state.currentRoundId
    ? await db.select().from(rounds).where(eq(rounds.id, state.currentRoundId))
    : [];
  const options = round
    ? await db
        .select({
          id: songs.id,
          title: songs.title,
          artist: songs.artist,
          youtubeId: songs.youtubeId,
          position: roundOptions.position,
        })
        .from(roundOptions)
        .innerJoin(songs, eq(roundOptions.songId, songs.id))
        .where(eq(roundOptions.roundId, round.id))
    : [];
  const voteRows = round
    ? await db.select({ songId: votes.songId }).from(votes).where(eq(votes.roundId, round.id))
    : [];
  const counts: Record<string, number> = {};
  for (const vote of voteRows) counts[vote.songId] = (counts[vote.songId] ?? 0) + 1;
  return {
    version: state.version,
    status: state.status,
    currentSong: currentSong ?? null,
    currentAnnouncement: currentAnnouncement ?? null,
    round: round
      ? {
          id: round.id,
          status: round.status,
          closesAt: round.closesAt.toISOString(),
          winnerSongId: round.winnerSongId,
          reason: round.selectionReason,
          options: options.map((option) => ({ ...option, votes: counts[option.id] ?? 0 })),
        }
      : null,
  };
}
