type QueueItem = {
  kind: "song" | "announcement";
  songId: string | null;
  announcementId: string | null;
};

export function nextPlaybackState(item: QueueItem, now: Date) {
  if (item.kind === "announcement")
    return {
      currentAnnouncementId: item.announcementId,
      currentSongId: null,
      expectedEndsAt: new Date(now.getTime() + 30_000),
    };
  return {
    currentAnnouncementId: null,
    currentSongId: item.songId,
    expectedEndsAt: new Date(now.getTime() + 240_000),
  };
}

export function startRoundPlayback(
  currentSongId: string | null,
  selectedSongId: string,
  now: Date,
  durationSeconds: number,
) {
  return {
    currentAnnouncementId: null,
    currentSongId: currentSongId ?? selectedSongId,
    expectedEndsAt: new Date(now.getTime() + durationSeconds * 1000),
    startedAt: now,
  };
}
