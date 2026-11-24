import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getDatabaseUrl } from "@/lib/env";
import * as schema from "./schema";

type Database = NodePgDatabase<typeof schema>;
const globalDatabase = globalThis as typeof globalThis & { radioPool?: Pool; radioDb?: Database };
export function getPool(): Pool {
  if (!globalDatabase.radioPool)
    globalDatabase.radioPool = new Pool({
      connectionString: getDatabaseUrl(),
      max: process.env.NODE_ENV === "production" ? 5 : 10,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
    });
  return globalDatabase.radioPool;
}
export function getDb(): Database {
  if (!globalDatabase.radioDb) globalDatabase.radioDb = drizzle({ client: getPool(), schema });
  return globalDatabase.radioDb;
}
