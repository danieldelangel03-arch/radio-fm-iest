import nextEnv from "@next/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { getMigrationDatabaseUrl } from "../src/lib/env";

nextEnv.loadEnvConfig(process.cwd());

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: getMigrationDatabaseUrl(), max: 1 });
  try {
    await migrate(drizzle({ client: pool }), { migrationsFolder: "drizzle" });
    console.info("Migraciones aplicadas correctamente.");
  } finally {
    await pool.end();
  }
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Falló la migración.");
  process.exitCode = 1;
});
