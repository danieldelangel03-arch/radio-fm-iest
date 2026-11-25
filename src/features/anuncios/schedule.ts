type AnnouncementWindow = {
  approved: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  lastPlayedAt: Date | null;
  minIntervalMinutes: number;
};

export function isAnnouncementEligible(announcement: AnnouncementWindow, now: Date): boolean {
  if (!announcement.approved) return false;
  if (announcement.startsAt && announcement.startsAt > now) return false;
  if (announcement.endsAt && announcement.endsAt < now) return false;
  if (!announcement.lastPlayedAt) return true;
  return now.getTime() - announcement.lastPlayedAt.getTime() >= announcement.minIntervalMinutes * 60_000;
}
