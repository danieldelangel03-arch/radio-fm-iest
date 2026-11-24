import { describe, expect, it } from "vitest";
import { decideAdvance, resolveRoundWinner, SerialAdvanceCoordinator } from "./engine";

describe("motor central", () => {
  it("elige la mayoría", () => {
    expect(
      resolveRoundWinner(
        [
          { songId: "a", position: 1, score: 2 },
          { songId: "b", position: 2, score: 8 },
        ],
        "first",
      ),
    ).toBe("b");
  });
  it("resuelve empate y ronda sin votos de forma estable", () => {
    expect(
      resolveRoundWinner(
        [
          { songId: "a", position: 1, score: 0 },
          { songId: "b", position: 2, score: 0 },
        ],
        "first",
      ),
    ).toBe("a");
  });
  it("usa exclusivamente el reloj recibido", () => {
    const result = decideAdvance(
      { version: 7, paused: false, roundOpen: true, closesAt: new Date("2026-01-01T10:00:00Z") },
      new Date("2026-01-01T10:00:01Z"),
    );
    expect(result).toEqual({ shouldCloseRound: true, nextVersion: 8 });
  });
  it("no avanza si está pausada", () => {
    expect(
      decideAdvance(
        { version: 3, paused: true, roundOpen: true, closesAt: new Date(0) },
        new Date(),
      ),
    ).toEqual({ shouldCloseRound: false, nextVersion: 3 });
  });
  it("serializa cien llamadas sin duplicar la transición", async () => {
    const coordinator = new SerialAdvanceCoordinator();
    const versions = await Promise.all(Array.from({ length: 100 }, () => coordinator.advance()));
    expect(new Set(versions)).toEqual(new Set([1]));
  });
});
