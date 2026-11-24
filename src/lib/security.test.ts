import { describe, expect, it } from "vitest";
import { assertSameOrigin, signAdminSession, verifyAdminSession } from "./security";

describe("seguridad HTTP", () => {
  it("firma y verifica una sesión", () => {
    const token = signAdminSession("x".repeat(32));
    expect(verifyAdminSession(token, "x".repeat(32))).toBe(true);
    expect(verifyAdminSession(`${token}x`, "x".repeat(32))).toBe(false);
  });
  it("rechaza escrituras de otro origen y sin origen", () => {
    expect(() =>
      assertSameOrigin(
        new Request("https://radio.test/api", {
          method: "POST",
          headers: { origin: "https://evil.test" },
        }),
      ),
    ).toThrow(/Origen/);
    expect(() =>
      assertSameOrigin(
        new Request("https://radio.test/api", {
          method: "POST",
          headers: { origin: "https://radio.test" },
        }),
      ),
    ).not.toThrow();
  });
});
