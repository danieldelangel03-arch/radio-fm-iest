export function inlineWavDataUri(encodedAudio: string): string {
  return `data:audio/wav;base64,${encodedAudio}`;
}
