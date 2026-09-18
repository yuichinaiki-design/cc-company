"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { aggregate } from "@/lib/aggregate";
import {
  AGG_MAX_SAMPLES,
  AGG_RERUN_INTERVAL_MS,
  BACKFILL_WINDOW_MINUTES,
} from "@/lib/constants";
import type { Position, Sighting } from "@/lib/types";

export type Positions = Record<number, Position>;

export function useSightings(raceId: string | null): Positions {
  const [positions, setPositions] = useState<Positions>({});
  const bufferRef = useRef<Map<number, Sighting[]>>(new Map());
  const tick = useRef(0);

  useEffect(() => {
    if (!raceId) return;
    const supabase = getSupabaseBrowserClient();
    bufferRef.current = new Map();
    setPositions({});

    let cancelled = false;

    const backfillFrom = new Date(
      Date.now() - BACKFILL_WINDOW_MINUTES * 60_000,
    ).toISOString();

    supabase
      .from("sightings")
      .select("*")
      .eq("race_id", raceId)
      .gte("observed_at", backfillFrom)
      .order("observed_at", { ascending: false })
      .limit(500)
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        for (const row of data as Sighting[]) {
          pushSighting(bufferRef.current, row);
        }
        recompute();
      });

    const channel = supabase
      .channel(`sightings:${raceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sightings",
          filter: `race_id=eq.${raceId}`,
        },
        (payload) => {
          pushSighting(bufferRef.current, payload.new as Sighting);
          recompute();
        },
      )
      .subscribe();

    const interval = setInterval(recompute, AGG_RERUN_INTERVAL_MS);

    function recompute() {
      const next: Positions = {};
      for (const [bib, list] of bufferRef.current.entries()) {
        const p = aggregate(list);
        if (p) next[bib] = p;
      }
      tick.current++;
      setPositions(next);
    }

    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [raceId]);

  return useMemo(() => positions, [positions]);
}

function pushSighting(buf: Map<number, Sighting[]>, s: Sighting) {
  const arr = buf.get(s.bib) ?? [];
  arr.push(s);
  arr.sort(
    (a, b) => Date.parse(b.observed_at) - Date.parse(a.observed_at),
  );
  buf.set(s.bib, arr.slice(0, AGG_MAX_SAMPLES * 3));
}
