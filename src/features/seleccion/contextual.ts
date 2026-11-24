export type ContextSong = {
  id: string;
  title: string;
  artist: string;
  energy: number;
  moods: string[];
  themes: string[];
  authorized: boolean;
  active: boolean;
  fallback: boolean;
};

type CampusEvent = { kind: "exam" | "holiday" | "institutional"; theme?: string };
export type SelectionContext = {
  now: Date;
  temperatureC?: number;
  events: CampusEvent[];
  recentSongIds: Set<string>;
};
export type SelectionResult = {
  options: [ContextSong, ContextSong];
  reason: string;
  usedFallback: boolean;
};

type Desired = {
  energies?: number[];
  maxEnergy?: number;
  theme?: string;
  mood?: string;
  reason: string;
};

export function deriveDesired(context: SelectionContext): Desired {
  const exam = context.events.find((event) => event.kind === "exam");
  if (exam)
    return {
      maxEnergy: 2,
      theme: "exámenes",
      reason: "Periodo de exámenes: prioridad máxima y baja intensidad",
    };
  const holiday = context.events.find((event) => event.kind === "holiday" && event.theme);
  if (holiday) return { theme: holiday.theme, reason: `Festividad activa: ${holiday.theme}` };

  const hour = context.now.getHours();
  const season = seasonFor(context.now);
  if (hour >= 12 && hour < 16)
    return {
      energies: [4, 5],
      mood: context.temperatureC !== undefined && context.temperatureC >= 30 ? "verano" : undefined,
      reason: `Mediodía dinámico · temporada ${season}`,
    };
  if (hour >= 6 && hour < 12)
    return { energies: [2, 3], reason: `Mañana de energía moderada · temporada ${season}` };
  return { energies: [1, 2, 3], reason: `Horario tranquilo · temporada ${season}` };
}

export function seasonFor(date: Date): "invierno" | "primavera" | "verano" | "otoño" {
  const month = date.getMonth() + 1;
  if (month === 12 || month <= 2) return "invierno";
  if (month <= 5) return "primavera";
  if (month <= 8) return "verano";
  return "otoño";
}

export function selectContextualOptions(
  songs: ContextSong[],
  context: SelectionContext,
): SelectionResult {
  const desired = deriveDesired(context);
  const allowed = songs.filter(
    (song) => song.active && song.authorized && !context.recentSongIds.has(song.id),
  );
  const ranked = allowed
    .map((song) => ({ song, score: scoreSong(song, desired) }))
    .sort((a, b) => b.score - a.score || a.song.title.localeCompare(b.song.title, "es"));

  const selected = pickDifferentArtists(
    ranked.filter((item) => item.score > 0).map((item) => item.song),
  );
  if (selected.length === 2)
    return {
      options: selected as [ContextSong, ContextSong],
      reason: desired.reason,
      usedFallback: false,
    };

  const fallbackPool = [...allowed.filter((song) => song.fallback), ...allowed];
  const fallback = pickDifferentArtists([...selected, ...fallbackPool]);
  if (fallback.length < 2)
    throw new Error("El catálogo no contiene dos canciones autorizadas de artistas distintos");
  return {
    options: fallback.slice(0, 2) as [ContextSong, ContextSong],
    reason: `${desired.reason}. Se completó con la lista de respaldo`,
    usedFallback: true,
  };
}

function scoreSong(song: ContextSong, desired: Desired): number {
  if (desired.theme) return song.themes.includes(desired.theme) ? 100 : 0;
  if (desired.maxEnergy !== undefined && song.energy > desired.maxEnergy) return 0;
  let score = desired.energies?.includes(song.energy) ? 20 : 0;
  if (desired.mood && song.moods.includes(desired.mood)) score += 10;
  return score;
}

function pickDifferentArtists(candidates: ContextSong[]): ContextSong[] {
  const selected: ContextSong[] = [];
  const seenIds = new Set<string>();
  for (const song of candidates) {
    if (seenIds.has(song.id) || selected.some((item) => item.artist === song.artist)) continue;
    selected.push(song);
    seenIds.add(song.id);
    if (selected.length === 2) break;
  }
  return selected;
}
