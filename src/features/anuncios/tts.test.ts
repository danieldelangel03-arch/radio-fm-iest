import { describe, expect, it } from "vitest";
import { inlineWavDataUri } from "./audio-url";

describe("audio de anuncios", () => {
  it("convierte la respuesta de Gemini en una URL reproducible sin Blob", () => {
    expect(inlineWavDataUri("AQID")).toBe("data:audio/wav;base64,AQID");
  });
});
