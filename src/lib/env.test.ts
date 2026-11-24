import { afterEach, describe, expect, it } from "vitest";
import { getServerEnv, resetEnvForTests } from "./env";

const original = { ...process.env };
afterEach(() => {
  process.env = { ...original };
  resetEnvForTests();
});
describe("entorno", () => {
  it("nombra todas las variables obligatorias ausentes", () => {
    delete process.env.DATABASE_URL;
    delete process.env.ADMIN_PASSWORD;
    delete process.env.SESSION_SECRET;
    expect(() => getServerEnv()).toThrow(/DATABASE_URL.*ADMIN_PASSWORD.*SESSION_SECRET/);
  });
  it("acepta integraciones opcionales vacías", () => {
    Object.assign(process.env, {
      DATABASE_URL: "postgresql://localhost/radio",
      ADMIN_PASSWORD: "segura123",
      SESSION_SECRET: "x".repeat(32),
      PUSHER_KEY: "",
    });
    expect(getServerEnv().PUSHER_KEY).toBeUndefined();
  });
});
