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
