import { describe, expect, it } from "vitest";
import { normalizeDatabaseTimestamp } from "./timestamp";

describe("timestamp de Postgres", () => {
  it("normaliza el texto devuelto por consultas SQL crudas", () => {
    expect(normalizeDatabaseTimestamp("2026-11-24T15:00:00.000Z").toISOString()).toBe(
      "2026-11-24T15:00:00.000Z",
    );
  });

  it("conserva una fecha ya decodificada", () => {
    const date = new Date("2026-11-24T15:00:00.000Z");
    expect(normalizeDatabaseTimestamp(date)).toBe(date);
  });

  it("rechaza valores ausentes o inválidos", () => {
    expect(() => normalizeDatabaseTimestamp(undefined)).toThrow(/fecha inválida/);
    expect(() => normalizeDatabaseTimestamp("no-es-fecha")).toThrow(/fecha inválida/);
  });
});
