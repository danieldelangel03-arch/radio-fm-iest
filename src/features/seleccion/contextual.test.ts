import { describe, expect, it } from "vitest";
import { type ContextSong, deriveDesired, seasonFor, selectContextualOptions } from "./contextual";

const song = (
  id: string,
  artist: string,
  energy: number,
  themes = ["general"],
  fallback = false,
): ContextSong => ({
  id,
  title: id,
  artist,
  energy,
  moods: themes.includes("verano") ? ["verano"] : [],
  themes,
  authorized: true,
  active: true,
  fallback,
});
const catalog = [
  song("calma-1", "A", 1, ["exámenes"], true),
  song("calma-2", "B", 2, ["exámenes"], true),
  song("navidad-1", "C", 2, ["navidad"]),
  song("navidad-2", "D", 2, ["navidad"]),
  song("media", "E", 3),
  song("alta-1", "F", 5),
  song("alta-2", "G", 4),
  song("verano", "H", 5, ["verano"]),
];
const context = (hour: number) => ({
  now: new Date(2026, 5, 1, hour),
  events: [],
  recentSongIds: new Set<string>(),
});

describe("selección contextual", () => {
  it("prioriza exámenes sobre Navidad", () => {
    const result = selectContextualOptions(catalog, {
      ...context(13),
      events: [{ kind: "holiday" as const, theme: "navidad" }, { kind: "exam" as const }],
    });
    expect(result.options.every((item) => item.themes.includes("exámenes"))).toBe(true);
  });
  it("distingue mañana moderada de mediodía dinámico", () => {
    expect(
      selectContextualOptions(catalog, context(9)).options.every((item) =>
        [2, 3].includes(item.energy),
      ),
    ).toBe(true);
    expect(
      selectContextualOptions(catalog, context(13)).options.every((item) =>
        [4, 5].includes(item.energy),
      ),
    ).toBe(true);
  });
  it("funciona sin clima y recurre al respaldo si faltan elegibles", () => {
    const result = selectContextualOptions(catalog.slice(0, 3), context(13));
    expect(result.usedFallback).toBe(true);
    expect(result.options).toHaveLength(2);
  });
  it("excluye repeticiones recientes", () => {
    const result = selectContextualOptions(catalog, {
      ...context(13),
      recentSongIds: new Set(["alta-1"]),
    });
    expect(result.options.map((item) => item.id)).not.toContain("alta-1");
  });
  it("no ofrece dos canciones del mismo artista", () => {
    const result = selectContextualOptions([...catalog, song("alta-3", "F", 5)], context(13));
    expect(result.options[0].artist).not.toBe(result.options[1].artist);
  });
  it("calcula temporadas y explica el motivo", () => {
    expect(seasonFor(new Date(2026, 11, 20))).toBe("invierno");
    expect(deriveDesired(context(9)).reason).toContain("verano");
  });
});
