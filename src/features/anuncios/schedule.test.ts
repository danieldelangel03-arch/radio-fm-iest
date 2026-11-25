import { describe, expect, it } from "vitest";
import { isAnnouncementEligible } from "./schedule";

const now = new Date("2026-11-24T18:00:00.000Z");

describe("programación de anuncios", () => {
  it("acepta un anuncio aprobado que ya cumplió su intervalo", () => {
    expect(
      isAnnouncementEligible(
        { approved: true, lastPlayedAt: new Date("2026-11-24T16:30:00.000Z"), minIntervalMinutes: 60 },
        now,
      ),
    ).toBe(true);
  });

  it("omite anuncios no aprobados, fuera de vigencia o reproducidos hace poco", () => {
    expect(
      isAnnouncementEligible(
        { approved: false, lastPlayedAt: null, minIntervalMinutes: 60 },
        now,
      ),
    ).toBe(false);
    expect(
      isAnnouncementEligible(
        {
          approved: true,
          startsAt: new Date("2026-11-24T19:00:00.000Z"),
          lastPlayedAt: null,
          minIntervalMinutes: 60,
        },
        now,
      ),
    ).toBe(false);
    expect(
      isAnnouncementEligible(
        { approved: true, lastPlayedAt: new Date("2026-11-24T17:30:01.000Z"), minIntervalMinutes: 60 },
        now,
      ),
    ).toBe(false);
  });
});
