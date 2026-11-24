import { createHash } from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { announcements } from "@/db/schema";
import { getServerEnv } from "@/lib/env";
export async function ensureAnnouncementAudio(
  id: string,
): Promise<{ audioUrl: string | null; fallbackText: string }> {
  const db = getDb();
  const [notice] = await db.select().from(announcements).where(eq(announcements.id, id));
  if (!notice?.approved) throw new Error("El anuncio no existe o no está aprobado");
  const hash = createHash("sha256").update(notice.text).digest("hex");
  if (notice.audioUrl && notice.audioTextHash === hash)
    return { audioUrl: notice.audioUrl, fallbackText: notice.text };
  const env = getServerEnv();
  if (!env.GEMINI_API_KEY || !env.BLOB_READ_WRITE_TOKEN)
    return { audioUrl: null, fallbackText: notice.text };
  const client = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
    httpOptions: { apiVersion: "v1beta" },
  });
  const interaction = await client.interactions.create({
    model: env.GEMINI_TTS_MODEL ?? "gemini-3.8-flash-lite-tts",
    input: notice.text,
    response_format: { type: "audio" },
    generation_config: { speech_config: [{ voice: "Kore" }] },
  });
  const encoded = interaction.output_audio?.data;
  if (!encoded) throw new Error("Gemini no devolvió audio");
  const blob = await put(`anuncios/${id}-${hash}.wav`, Buffer.from(encoded, "base64"), {
    access: "public",
    contentType: "audio/wav",
    addRandomSuffix: false,
    token: env.BLOB_READ_WRITE_TOKEN,
  });
  await db
    .update(announcements)
    .set({ audioUrl: blob.url, audioTextHash: hash, updatedAt: new Date() })
    .where(eq(announcements.id, id));
  return { audioUrl: blob.url, fallbackText: notice.text };
}
