import { describe, expect, it } from "vitest";
import { nextPlaybackState, startRoundPlayback } from "./playback";

const now = new Date("2026-11-24T18:00:00.000Z");

describe("reproducción en cola", () => {
  it("activa un anuncio y reserva treinta segundos para locución", () => {
    expect(
      nextPlaybackState({ kind: "announcement", announcementId: "notice-1", songId: null }, now),
    ).toEqual({
      currentAnnouncementId: "notice-1",
      currentSongId: null,
      expectedEndsAt: new Date("2026-11-24T18:00:30.000Z"),
    });
  });

  it("activa una canción sin conservar un anuncio anterior", () => {
    expect(
      nextPlaybackState({ kind: "song", announcementId: null, songId: "song-1" }, now),
    ).toEqual({
      currentAnnouncementId: null,
      currentSongId: "song-1",
      expectedEndsAt: new Date("2026-11-24T18:04:00.000Z"),
    });
  });

  it("limpia el anuncio anterior cuando inicia una nueva ronda musical", () => {
    expect(startRoundPlayback(null, "song-1", now, 240)).toEqual({
      currentAnnouncementId: null,
      currentSongId: "song-1",
      expectedEndsAt: new Date("2026-11-24T18:04:00.000Z"),
      startedAt: now,
    });
  });
});
