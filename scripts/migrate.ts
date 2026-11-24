import { migrate } from "drizzle-orm/node-postgres/migrator";
import { getDb, getPool } from "../src/db/client";

async function main(): Promise<void> {
  await migrate(getDb(), { migrationsFolder: "drizzle" });
  console.info("Migraciones aplicadas correctamente.");
  await getPool().end();
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Falló la migración.");
  process.exitCode = 1;
});
