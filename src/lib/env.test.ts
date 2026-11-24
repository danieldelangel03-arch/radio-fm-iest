import { afterEach, describe, expect, it } from "vitest";
import { getMigrationDatabaseUrl, getServerEnv, resetEnvForTests } from "./env";

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
  it("prefiere la conexión directa para migraciones", () => {
    process.env.DATABASE_URL = "postgresql://pooler/radio";
    process.env.DATABASE_URL_UNPOOLED = "postgresql://direct/radio";
    expect(getMigrationDatabaseUrl()).toBe("postgresql://direct/radio");
  });
  it("mantiene compatibilidad local cuando solo existe DATABASE_URL", () => {
    process.env.DATABASE_URL = "postgresql://localhost/radio";
    delete process.env.DATABASE_URL_UNPOOLED;
    expect(getMigrationDatabaseUrl()).toBe("postgresql://localhost/radio");
  });
});
