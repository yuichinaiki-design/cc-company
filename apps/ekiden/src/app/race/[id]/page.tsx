"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import BibGrid from "@/components/BibGrid";
import RaceMap from "@/components/RaceMap";
import { useSightings } from "@/hooks/useSightings";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Race, Runner } from "@/lib/types";

export default function RacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [race, setRace] = useState<Race | null>(null);
  const [runners, setRunners] = useState<Runner[]>([]);
  const [error, setError] = useState<string | null>(null);
  const positions = useSightings(id);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase
      .from("races")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setRace(data as Race);
      });
    supabase
      .from("runners")
      .select("*")
      .eq("race_id", id)
      .order("bib", { ascending: true })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setRunners((data as Runner[]) ?? []);
      });
  }, [id]);

  if (error) return <main className="container"><p className="error">{error}</p></main>;

  return (
    <div className="race-layout">
      <header className="race-header">
        <Link href="/">←</Link>
        <h1>{race?.name ?? "読み込み中…"}</h1>
        <Link href={`/race/${id}/admin`} className="muted small">管理</Link>
      </header>
      <section className="race-map">
        <RaceMap positions={positions} />
      </section>
      <section className="race-bibs">
        {runners.length === 0 ? (
          <p className="muted">
            ランナーが未登録です。<Link href={`/race/${id}/admin`}>管理画面</Link>から追加してください。
          </p>
        ) : (
          <BibGrid raceId={id} runners={runners} />
        )}
      </section>
    </div>
  );
}
