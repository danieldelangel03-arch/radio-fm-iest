import { describe, expect, it } from "vitest";
import { normalizeDatabaseNow } from "./postgres-engine";

describe("fecha de Postgres", () => {
  it("normaliza timestamps serializados por el driver", () => {
    expect(normalizeDatabaseNow("2026-11-24T15:00:00.000Z").toISOString()).toBe(
      "2026-11-24T15:00:00.000Z",
    );
  });

  it("rechaza valores ausentes", () => {
    expect(() => normalizeDatabaseNow(undefined)).toThrow(/fecha inválida/);
  });
});
