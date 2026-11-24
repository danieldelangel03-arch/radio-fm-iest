import { getServerEnv } from "@/lib/env";

export async function getCampusTemperature(): Promise<number | undefined> {
  const env = getServerEnv();
  if (env.CAMPUS_LATITUDE === undefined || env.CAMPUS_LONGITUDE === undefined) return undefined;
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(env.CAMPUS_LATITUDE));
  url.searchParams.set("longitude", String(env.CAMPUS_LONGITUDE));
  url.searchParams.set("current", "temperature_2m");
  url.searchParams.set("timezone", "auto");
  const response = await fetch(url, { next: { revalidate: 900 } });
  if (!response.ok) return undefined;
  const body = (await response.json()) as { current?: { temperature_2m?: number } };
  return body.current?.temperature_2m;
}
