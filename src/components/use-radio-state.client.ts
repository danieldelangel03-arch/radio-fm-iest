"use client";
import { useEffect, useRef, useState } from "react";
export type RadioStateDto = {
  version: number;
  status: string;
  currentSong: null | { id: string; title: string; artist: string; youtubeId: string };
  currentAnnouncement: null | {
    id: string;
    title: string;
    text: string;
    audioUrl: string | null;
  };
  round: null | {
    id: string;
    status: string;
    closesAt: string;
    winnerSongId: string | null;
    reason: string;
    options: Array<{
      id: string;
      title: string;
      artist: string;
      youtubeId: string;
      position: number;
      votes: number;
    }>;
  };
};
export type ConnectionState = "conectando" | "conectado" | "recuperado" | "error";
export function useRadioState() {
  const [data, setData] = useState<RadioStateDto | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("conectando");
  const etag = useRef<string | undefined>(undefined);
  const failed = useRef(false);
  useEffect(() => {
    let active = true;
    let realtime: { disconnect(): void } | undefined;
    const poll = async () => {
      try {
        const response = await fetch("/api/state", {
          cache: "no-store",
          headers: etag.current ? { "If-None-Match": etag.current } : {},
        });
        if (response.status === 304) {
          if (active) setConnection(failed.current ? "recuperado" : "conectado");
          failed.current = false;
          return;
        }
        if (!response.ok) throw new Error("Estado no disponible");
        etag.current = response.headers.get("etag") ?? undefined;
        const next = (await response.json()) as RadioStateDto;
        if (active) {
          setData(next);
          setConnection(failed.current ? "recuperado" : "conectado");
        }
        failed.current = false;
      } catch {
        failed.current = true;
        if (active) setConnection("error");
      }
    };
    void poll();
    const timer = window.setInterval(poll, 2_000);
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (key && cluster) {
      const pusherKey = key;
      const pusherCluster = cluster;
      void import("pusher-js").then(({ default: Pusher }) => {
        if (!active) return;
        const client = new Pusher(pusherKey, { cluster: pusherCluster });
        client.subscribe("radio-publica").bind("state-changed", poll);
        realtime = client;
      });
    }
    return () => {
      active = false;
      window.clearInterval(timer);
      realtime?.disconnect();
    };
  }, []);
  return { data, connection };
}
