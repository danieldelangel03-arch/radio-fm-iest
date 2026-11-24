import nextEnv from "@next/env";
import { defineConfig } from "drizzle-kit";

nextEnv.loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url:
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.DATABASE_URL ??
      "postgresql://radio:radio_local@localhost:5432/radio_campus",
  },
  strict: true,
  verbose: true,
});
