import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional(),
);
const optionalNumber = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : Number(value)),
  z.number().finite().optional(),
);
const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "Falta DATABASE_URL"),
  DATABASE_URL_UNPOOLED: optionalText,
  ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD debe tener al menos 8 caracteres"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET debe tener al menos 32 caracteres"),
  NEXT_PUBLIC_APP_URL: optionalText,
  CAMPUS_LATITUDE: optionalNumber,
  CAMPUS_LONGITUDE: optionalNumber,
  PUSHER_APP_ID: optionalText,
  PUSHER_KEY: optionalText,
  PUSHER_SECRET: optionalText,
  PUSHER_CLUSTER: optionalText,
  GEMINI_API_KEY: optionalText,
  GEMINI_TTS_MODEL: optionalText,
  BLOB_READ_WRITE_TOKEN: optionalText,
  CRON_SECRET: optionalText,
});
export type ServerEnv = z.infer<typeof serverSchema>;
let cached: ServerEnv | undefined;
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const result = serverSchema.safeParse(process.env);
  if (!result.success)
    throw new Error(
      `Configuración inválida: ${result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`,
    );
  cached = result.data;
  return cached;
}
export function getDatabaseUrl(): string {
  return z.string().min(1, "Falta DATABASE_URL").parse(process.env.DATABASE_URL);
}
export function getMigrationDatabaseUrl(): string {
  return z
    .string()
    .min(1, "Falta DATABASE_URL_UNPOOLED o DATABASE_URL")
    .parse(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL);
}
export function resetEnvForTests(): void {
  cached = undefined;
}
